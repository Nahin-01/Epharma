# ePharmacy — Frontend

A React + Vite storefront for the ePharmacy backend, styled in the spirit of
epharma.com.bd (blue/green pharmacy branding, category mega-menu, prescription
upload flow, mock mobile-wallet checkout) and wired end-to-end to the real
backend API — no static or mocked product/catalogue data anywhere in the UI.

## Stack

- React 18 + Vite
- React Router v6
- Axios (with automatic JWT refresh-on-401)
- Tailwind CSS

## Scope covered in this pass

Home, category/search product listing, product detail, cart, checkout
(address, delivery type, payment method, coupon), login/register/OTP login,
forgot password, account (profile + saved addresses + change password),
order history + order detail, prescription upload + prescription list.

Doctor directory / appointment booking is **not** included in this pass (the
backend already supports it) — the relevant nav links show a "coming soon"
toast. Say the word if you'd like that added next.

## Getting started

```bash
cd frontend
npm install
cp .env.example .env      # point VITE_API_BASE_URL at your running backend
npm run dev                # http://localhost:5173
```

The backend must be running separately (see the backend's own README) —
the frontend is a pure API consumer, it never talks to a database directly.

## How data flows (why nothing here is static)

Every screen fetches from the real backend REST API (`/api/v1/...`) through
the modules in `src/api/`. There is no hardcoded product list, price,
category tree, or order history anywhere in the source — if the backend
database is empty, the pages render real empty states ("No products found",
"No orders yet", etc.) instead of placeholder content. Cart totals, delivery
charges, coupon discounts and stock/availability are all computed
server-side and simply rendered as returned.

Auth uses short-lived access tokens + refresh tokens (localStorage), with a
single-flight interceptor in `src/lib/apiClient.js` that transparently
retries a request once after refreshing an expired access token, and forces
a logout if the refresh itself fails.

## Design notes

I did not have real browser/screenshot access to epharma.com.bd in this
session, so the layout was originally built from the site's publicly
fetchable page structure and copy (header layout, category names, hero
CTAs, action-card labels, product card layout, prescription-upload fields)
rather than from visual screenshots, then given a full visual redesign pass
on top of that structure. The color palette (a teal brand color paired with
a warm coral accent), logo mark, and all decorative art are original —
not copied from the real site — per copyright policy.

The redesign covers:

- **Palette & type** — a refined teal/coral color system (see
  `tailwind.config.js`) in place of a flat blue/green, plus Poppins for
  headings paired with Inter for body text.
- **Logo** — a custom two-tone capsule mark (`src/components/common/LogoMark.jsx`,
  mirrored in `public/favicon.svg`) instead of a plain "+" square.
- **Motion** — gradient hero with floating decorative shapes, staggered
  entrance animations on cards/grids, a soft page-fade on every route
  change, shimmering skeleton loaders instead of a bare spinner, and
  hover-lift/scale micro-interactions on cards, buttons, and nav — all
  hand-written CSS keyframes (`src/index.css`), no extra runtime
  dependency.
- **Product art** — since there's no real product photography to work
  with, items without a photo get a deterministic colorful gradient tile
  with a pill icon (`ProductImagePlaceholder.jsx`) instead of a plain gray
  box with a letter, consistently across the grid, product detail, and
  cart pages.

If you'd like the visual language pushed closer to the real epharma.com.bd
look (exact colors, real hero photography, etc.), share reference
screenshots and I can match it more tightly.

## How this was verified (read this before assuming "just trust me")

`npm install` is not available in the sandbox this was built in, so instead
of shipping unverified code, I built a throwaway, non-shipped verification
harness and ran the real bundled frontend against a real backend in a real
browser:

- The real backend source was booted with in-memory stand-ins for MongoDB,
  Redis/BullMQ, JWT, bcrypt, and multipart parsing (all cryptographically
  real where it matters — real HMAC-signed JWTs, real scrypt password
  hashing) — not with the actual services, but exercising the actual
  application code paths (routes → controllers → services → repositories)
  unmodified.
- The real frontend source was bundled with esbuild against real React,
  React Router, and Axios, and served as static files.
- Playwright (real Chromium) drove the bundled frontend against the booted
  backend through a full walkthrough: home → product listing → product
  detail → login → add to cart → cart → checkout → place order → order
  detail → account → prescription upload — capturing full-page screenshots
  and all console/page errors at each step.
- Final run: **zero console errors, zero page errors**, across every page,
  including a genuine end-to-end order placement (real order ID returned,
  visible on the order detail page).

One real bug was caught and fixed this way: a fresh/direct navigation to
`/checkout` could bounce a user with items in their cart back to `/cart`,
because the cart's "is it empty?" check ran before the cart had actually
finished loading (a React effect-ordering race, compounded by the auth
session-restore check also being asynchronous). Fixed in `CartContext.jsx`
by tracking an explicit `initialized` flag that only becomes true once both
the auth check and the first real cart fetch have resolved, and gating the
checkout page's redirect and loading states on it.

Everything above ran against my own disposable stand-ins, not your actual
MongoDB/Redis — so treat this as "the application code is exercised and
behaves correctly," not as a substitute for you running it against your
real infrastructure before going live.
