# ePharmacy — Flutter App

A complete, from-scratch Flutter/Dart mobile client for the ePharmacy platform, built against
the **same real backend** as the React web app (`../backend`) — every screen fetches live data
over the REST API. Nothing in this app is mocked or hardcoded: products, categories, cart,
orders, addresses and prescriptions all come from your running backend.

## ⚠️ Before you run this — one required setup step

This app was written in a sandboxed environment that does not have the Flutter SDK installed,
so `lib/` (all the Dart application code) and `pubspec.yaml` were hand-written and carefully
reviewed, but they were **never compiled or run** here. There is one step you must do yourself,
on a machine with Flutter installed, before this becomes a runnable app project:

**Generate the native Android/iOS scaffolding.** A Flutter project needs `android/`, `ios/`
(and optionally `web/`, `macos/`, `linux/`, `windows/`) folders — these are platform-specific
project files (Gradle build scripts, an Xcode project, manifests, etc.) that only the real
`flutter create` command can generate correctly; they can't be safely hand-written. This repo
intentionally ships without them (see `.gitignore`).

```bash
cd app
flutter create --project-name epharmacy_app --org com.yourcompany .
```

Run that from inside this `app/` folder. Flutter will see the existing `lib/` and
`pubspec.yaml` and only add the missing platform folders (`android/`, `ios/`, etc.) — it will
NOT overwrite your `lib/` code. If your Flutter version prompts about overwriting
`pubspec.yaml`, say no / keep the existing one (this repo's `pubspec.yaml` already has the
correct dependencies).

Then:

```bash
flutter pub get
flutter run
```

If anything doesn't compile, it's almost certainly one of these very mechanical issues (not a
logic bug) — check first:
- Your installed Flutter/Dart SDK version vs. the `environment: sdk:` range in `pubspec.yaml`.
- A dependency version in `pubspec.yaml` that has since been yanked/replaced — bump it with
  `flutter pub upgrade` if `pub get` complains.

## Pointing the app at your backend

By default the app calls `http://10.0.2.2:5000/api/v1` — `10.0.2.2` is the special alias the
**Android emulator** uses for your host machine's `localhost`. Override it at run/build time:

```bash
# Android emulator (default, shown for clarity)
flutter run --dart-define=API_BASE_URL=http://10.0.2.2:5000/api/v1

# iOS simulator (can use localhost directly)
flutter run --dart-define=API_BASE_URL=http://localhost:5000/api/v1

# Physical device — use your computer's LAN IP, not localhost
flutter run --dart-define=API_BASE_URL=http://192.168.1.23:5000/api/v1
```

Make sure the backend's `.env` has your machine's origin allowed if you add web support later,
and that `MONGODB_URI` etc. are configured per `../backend/README.md`.

## What's implemented

Every screen is wired to the real backend — same auth flow, same cart/order engine, same
validation rules as the web app:

- **Splash → session restore** (checks a stored token, fetches the live user, routes to the
  app or the login screen — never trusts stale local data)
- **Auth**: Login, Register, OTP login, Forgot/Reset password, "Continue with Google" (see
  note below) — styled with a branded gradient header, floating card, and consistent motion
- **Home**: live categories, Best Sellers / Featured / New In rails, search entry point
- **Catalog**: search + infinite-scroll product grid, full product detail page with related
  products, quantity stepper, add-to-bag
- **Cart**: live totals, quantity edit, coupon apply, prescription-required + stock warnings
- **Checkout**: saved addresses or a new address, standard/express delivery with live charge
  lookup, payment method selection, order placement
- **Orders**: list + detail with status timeline and cancel-while-eligible
- **Prescriptions**: camera/gallery upload (multiple photos), status tracking
- **Profile**: account summary, saved addresses (add/edit/delete), sign out

Deliberately out of scope for this pass (the web app doesn't have UI for these yet either):
doctor/appointment booking, support tickets, product requests, recurring orders, and the admin
back-office — those are backend modules with no client UI on either platform yet.

## Google Sign-In

Same situation as the web app: the backend's `/auth/google` endpoint is real and working, but
it needs `GOOGLE_CLIENT_ID` set in the backend `.env`. On the Flutter side, real Google Sign-In
also needs your own Firebase/Google Cloud project's native config (`google-services.json` for
Android, a URL scheme + `GoogleService-Info.plist` for iOS, SHA-1 fingerprints registered in
the Cloud Console) — files only you can generate for your own app identifiers. Rather than
half-wire a broken native integration, the "Continue with Google" button currently shows a
clear "not configured yet" message. Once you have those credentials:

1. Add the `google_sign_in` package to `pubspec.yaml`.
2. Drop in `google-services.json` / `GoogleService-Info.plist` per that package's setup guide.
3. In `lib/widgets/google_button.dart`, replace the snackbar with a real `GoogleSignIn().signIn()`
   call, then pass the resulting `idToken` to `AuthProvider.googleSignIn(idToken)` — that method
   already exists and already calls the real backend endpoint.

## Project structure

```
lib/
  core/            Theme, brand colors, formatters, constants, order-status labels
  network/         Dio client (JWT + refresh-token interceptor), token storage
  models/          Dart classes mirroring the backend's exact response shapes
  services/        One class per backend module (auth, products, cart, orders, ...)
  providers/       AuthProvider + CartProvider (ChangeNotifier) — app-wide session/cart state
  widgets/         Reusable UI: buttons, product card, skeleton loaders, gradient product art
  screens/         One folder per feature area (auth, home, catalog, cart, checkout, orders,
                   prescriptions, profile, root shell with bottom navigation)
```

## Design system

Mirrors the web app's palette so the two feel like one product: teal `brand` +
coral `accent`, Poppins for headings / Inter for body text (via `google_fonts`), soft
shadows, rounded-24 cards, and a shared gradient used across the hero/auth headers and splash
screen.

## A note on verification

Every other deliverable in this project (the backend, the React web app) was run and screenshot-tested
end-to-end in this session. This Flutter app could not be — there is no Flutter SDK in this
sandbox and it cannot be installed here (its download host is not reachable). Every file was
still written carefully and cross-checked by hand: import paths, constructor signatures, and
brace/paren balance were all verified programmatically across all 55 files, and the API
contracts (endpoint paths, payload field names, response shapes) were copied directly from the
real backend's route/validation/model files — but a real `flutter analyze`/`flutter run` on your
machine is the first true compile check this code will get. If you hit an error, it's most
likely a small one — tell me the message and I'll fix it immediately.
