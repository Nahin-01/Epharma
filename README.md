# ePharmacy — Project Notes

This file tracks real, concrete issues found while working across the three
parts of this project (`backend`, `frontend`, `app`) — what was wrong, why it
mattered to a real user or developer, and what was done about it. It's meant
to be read alongside the code, not as a substitute for it.

## How to run everything

You need **four** processes running at once (there's no root-level script
that starts them all):

```bash
# Terminal 1 — API
cd backend && npm run dev              # http://localhost:5000/api/v1

# Terminal 2 — background worker (REQUIRED — this is what actually processes
# prescription OCR; without it, uploads sit at status UPLOADED forever)
cd backend && npm run worker:dev

# Terminal 3 — web frontend
cd frontend && npm run dev             # http://localhost:5173

# Terminal 4 — mobile app (physical device over Wi-Fi, replace with your PC's LAN IP)
cd app && flutter run --dart-define=API_BASE_URL=http://<your-lan-ip>:5000/api/v1
```

Prerequisites: MongoDB reachable at `MONGODB_URI` (this project is already
configured to use a MongoDB Atlas cluster, not a local Mongo — no local
install needed) and Redis reachable at `REDIS_URL` (a local Redis-compatible
server, e.g. Memurai on Windows, must be running — the worker won't start
without it). Run `cd backend && npm run seed` once to create an admin user
and a starter product catalog (safe to re-run).

---

## The core problem: "it reads the prescription but can't tell which medicine it is"

This was the headline bug. Diagnosis and fix, in order of actual impact:

### 1. The Flutter app never showed OCR results at all — this was the main cause
The backend was already extracting text and matching medicines correctly
(via `OCR_PROVIDER=ocrspace`, a real OCR API — not a mock). But
`app/lib/models/prescription.dart` had no field to parse `ocrResult` out of
the API response, and there was no screen to display it. So no matter how
good the OCR or matching was, the *customer never saw it* — from their point
of view, it genuinely looked like "the app can't tell what medicine this is."

**Fixed**: added `OcrResult`/`MatchedMedicine` to the Prescription model,
built a new prescription detail screen
(`app/lib/screens/prescriptions/prescription_detail_screen.dart`) that shows
each detected line with either an "Add to bag" button (when it resolved to a
real product) or a "Not in database" pill (when it didn't), polls briefly
while OCR is still processing, and lets the customer respond to a
pharmacist's clarification request — this mirrors the web app's existing
`Prescriptions.jsx`, which already did this correctly. Tapping a prescription
in the list, or finishing an upload, now goes straight to this screen instead
of a bare status badge.

### 2. The medicine-matching algorithm was too brittle
`backend/src/modules/prescriptions/prescription.service.js` matched OCR text
against the product catalog with a plain case-insensitive substring check —
no tolerance for OCR spacing noise ("500 mg" vs "500mg"), typos, or the fact
that real prescriptions almost always abbreviate the dosage form ("Tab."
never "Tablet", "Cap." never "Capsule"). That last one was a real trap: a
first attempt at fixing this by requiring every word of a product's name to
appear in the line broke *worse* than the original, because "Tablet" never
appears verbatim as "Tab." on an actual prescription.

**Fixed**: rewrote matching to normalize dosage units, tolerate small OCR
typos (Levenshtein distance, scaled to word length), and — critically —
exclude dosage-form words (tablet/cap/inj/syrup/…) from the set of words a
match is required to contain. It also now picks the *best*-scoring match
across the whole catalog per line instead of stopping at the first
substring hit. Verified end-to-end with a synthetic three-line prescription
image run through the real OCR provider: all three medicines matched
correctly with no false positives on the doctor's name or patient info
lines.

### 3. The seed catalog only had 2 products
Even a perfect matcher can't match a medicine that isn't in the database.
`backend/src/utils/seed.js` seeded exactly two products (Napa, an insulin).

**Fixed**: added Amoxicillin 250mg Capsule and Cetirizine 10mg Tablet — two
of the most common line items on a real Bangladeshi prescription — each with
a full product profile (generic name + linked `Generic` doc, manufacturer,
dosage form, strength, description, price, stock, an image, tags). Also
linked existing products to proper `Generic` documents and added
descriptions/images they were missing. **Cetirizine 10mg Tablet is the
"mock medicine" used to validate the fix** — see below.

### 4. Checkout had no way to attach a prescription in the app (found while testing #1 end-to-end)
The backend already correctly blocks checkout when the cart contains a
prescription-required item and no prescription is attached
(`order.service.js`). But `app/lib/screens/checkout/checkout_screen.dart` had
no UI for this at all — a customer could fill out the entire checkout form
and only get rejected with a generic error message at the very last step,
with no way to fix it without leaving checkout. The web app already had this
right (`Checkout.jsx`).

**Fixed**: added a "Prescription" section to the Flutter checkout screen
(shown only when the cart requires one) that lists the customer's
pharmacist-accepted prescriptions as selectable radio options, or prompts
them to upload one if they have none — same pattern as the web app.

### 5. Two related backend gaps found while fixing #4
- `prescription.repository.js`'s `listForCustomer` silently ignored the
  `status` query filter, so "show me my **accepted** prescriptions" (what
  both the web and app checkout pickers ask for) actually returned
  prescriptions in *any* status, including ones a pharmacist hasn't reviewed
  yet. Fixed to actually filter by status.
- `order.service.js` only checked that an attached prescription belonged to
  the customer — not that it had been through pharmacist review at all. A
  customer could pass the ID of a prescription still sitting at `UPLOADED`
  and the order would be created immediately, only getting stuck silently
  later at the `PROCESSING` transition. Fixed to require `status ===
  ACCEPTED` at checkout time, with a clear error message instead of a silent
  later failure.

### 6. Seed data had no inventory batches — every checkout failed regardless of the above
While testing the full loop end-to-end, checkout kept failing with
"Insufficient stock available" even for a product seeded with
`stockQuantity: 300`. Turns out `Product.stockQuantity` is display-only —
`inventory.service.js`'s `reserveStock()` actually reserves against
`InventoryBatch` documents (a separate collection, FEFO allocation), and
`seed.js` never created any. This meant **no order for any seeded product
could ever complete**, for every product, not just the new ones — a
pre-existing gap, not something introduced by the changes above, but one
that blocked verifying the fixes end-to-end.

**Fixed**: seed script now also creates a warehouse and one active inventory
batch per sample product. Verified the complete loop actually works: upload
prescription → OCR extracts + matches medicines → pharmacist accepts it →
add matched medicine to cart → checkout with that prescription attached →
order placed successfully with a real inventory allocation and a COD
payment record.

---

## The mock medicine used to test all of this

**Cetirizine 10mg Tablet** (`SKU-CETI10`, slug `cetirizine-10mg-tablet`) —
seeded with a full profile: generic name + linked `Generic` doc
(Cetirizine, antihistamine), manufacturer (ACI Limited), dosage form/strength,
a description, a price with an active discount, stock, tags, and a product
image. It's OTC (not prescription-required) so it's also usable to exercise
plain search → product detail → add to cart → checkout without any
prescription friction, in addition to being one of the three medicines in
the OCR test fixture below.

**End-to-end test performed**: generated a synthetic prescription image
(`Tab. Napa 500mg`, `Cap. Amoxicillin 250mg`, `Tab. Cetirizine 10mg`,
around a doctor's name/patient info to check for false positives), uploaded
it through the real API as a test customer, and confirmed via the worker's
real OCR + matching pipeline that all three medicines resolved correctly to
their catalog products (confidence ~0.76 each) while the non-medicine lines
correctly resolved to nothing.

---

## Other developer-side fixes

- **Kotlin/Gradle build was completely broken** (`flutter run` failed with a
  `java.lang.AssertionError` / "Storage for [...] is already registered"
  every time). Two distinct causes, both in `android/gradle.properties`:
  1. Gradle 9's Kotlin Build Tools API runs multiple modules'
     `compileDebugKotlin` tasks concurrently as in-process workers sharing
     one JVM, and they raced to register the same incremental-cache file
     paths in a shared singleton. Fixed by forcing `org.gradle.workers.max=1`
     to serialize them.
  2. Separately, the project lives on `D:\` while the Flutter/Dart package
     cache lives on `C:\Users\...\Pub\Cache` — Kotlin's incremental compiler
     tries to build a drive-relative path between the two, which is
     impossible on Windows and always throws. Fixed by disabling
     `kotlin.incremental` entirely (full rebuilds are slower, but reliable).
- **Mock SMS OTP wasn't testable end-to-end from either UI.** With
  `SMS_PROVIDER=mock` (the working default for local dev), the OTP code was
  only ever written to the backend's server log — neither the web OTP
  login/forgot-password pages nor the Flutter equivalents had any way to
  retrieve it, so the whole flow was untestable without log access. Fixed by
  having the backend echo the code back as `devCode` in the API response,
  **only** when `NODE_ENV !== production` **and** `SMS_PROVIDER === mock`
  (never for a real provider, never in production), and surfacing it as a
  small amber hint in both UIs.

---

## Known gaps not fixed here (documented, not solved)

Left as-is to keep this change set focused — worth a follow-up:

- **Flutter has no Change Password screen.** `AuthService.changePassword`
  exists and works, but no screen in `app/lib/screens` calls it and there's
  no menu entry for it — a real user has no in-app way to change their
  password, despite the web app (`Account.jsx`) supporting it fully.
- **Flutter's profile screen is much thinner than the web's Account page.**
  The web page has inline address CRUD, full profile editing, and password
  change all on one page; the app's `profile_screen.dart` is just three
  navigation tiles (Orders/Prescriptions/Addresses) and sign-out.
- **Admin/pharmacist review UI doesn't show OCR results either.** The staff
  review screen (`frontend/src/pages/admin/Prescriptions.jsx`) only shows
  the raw uploaded photos for a human to eyeball — it doesn't surface the
  extracted text or matched medicines that are now visible to the customer.
  Showing this to reviewers too would make review faster and let them catch
  matcher mistakes.
- **This project's wireless ADB/Flutter dev workflow is fragile on Windows.**
  The phone's wireless-debugging TCP session dropped repeatedly during
  testing — pairing, `flutter run`'s build phase, and even plain `adb
  install` of an already-built APK all intermittently failed with a
  connection reset (`error: closed`), reconnecting fine each time only to
  drop again minutes later. This is device/network-level (Wi-Fi power saving
  killing the wireless-debugging daemon when idle, most likely), not
  something fixable from the app or backend code — after the Gradle fix
  above, `flutter run`'s **build** succeeded reliably and produced a working
  APK, but the final **install-to-device** step over Wi-Fi kept failing on
  this connection specifically. Measured throughput on this connection was
  ~0.8 MB/s with drops before a 90MB transfer could finish (confirmed by
  checking the partial file size on-device: 19MB of 90MB arrived, yet `adb`
  reported success) — six separate install attempts (`flutter run`, `adb
  install -r`, `adb install --no-streaming`, and a manual push +
  `pm install`) all failed the same way. If this keeps happening: keep the
  phone's screen on and unplugged-charging during development, or — much
  more reliable for a large debug APK — connect via USB cable instead of
  wireless debugging.
- **Windows desktop build needs Developer Mode enabled.** `flutter run -d
  windows` (the fallback used to verify the UI changes without depending on
  the flaky phone connection) fails with "Building with plugins requires
  symlink support" until Developer Mode is turned on in Windows Settings →
  Privacy & security → For developers (or run `start
  ms-settings:developers`). Not enabled here since it's a system-wide
  setting change outside this project's scope to flip unasked.
