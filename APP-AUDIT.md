# APP-AUDIT.md — TaxDoctor Financial Control System (cfo.taxdoctorcapture.org)

Documentation-only technical audit. Reflects codebase state as of the audit date.

---

## 1. PURPOSE

A **single-page marketing/landing site** for the TaxDoctor Financial Control System™ — a subscription financial-operations service targeted at Nigerian SMEs with active payroll.

- **Primary audience:** Nigerian SME founders / operators evaluating a monthly-priced "financial control" service (bookkeeping, reconciliation, payroll review, compliance).
- **Core workflow:** Visitor lands on `/` → scrolls through pricing → clicks a plan CTA → is prompted (`window.prompt`) for an email → the app calls the `initialize-payment` edge function → the browser is redirected to a Paystack-hosted checkout page → Paystack returns the buyer to `/payment-verification?reference=…` → the app calls `verify-payment` to display the outcome.
- The application itself is **not a product tool** — there is no customer-facing account area, no dashboards, no document delivery, no client portal, no login. It is a static marketing funnel plus a payments backend.

---

## 2. ROUTES & PAGES

React Router (`src/App.tsx`). All routes are **public / unauthenticated** — the app has no auth surface.

| Route | Component | Purpose | Auth |
|---|---|---|---|
| `/` | `src/pages/Index.tsx` | Marketing landing page. Renders `StickyHeader`, `HeroSection`, `ProblemSection`, `SystemSection`, `MonthlySection`, `WhoIsForSection`, `PricingSection` (with Paystack CTA), `ComparisonSection`, `FinalCTA`, footer. | Public |
| `/payment-verification` | `src/pages/PaymentVerification.tsx` | Post-Paystack landing page. Reads `?reference=` and calls the `verify-payment` edge function; renders success/failure state (tier, plan, amount, reference, email). | Public |
| `*` | `src/pages/NotFound.tsx` | Catch-all 404. | Public |

No admin, dashboard, portal, onboarding, or authenticated routes exist.

---

## 3. SUPABASE / LOVABLE CLOUD

### 3.1 Tables

Only one public-schema table exists.

**`public.orders`** (from `supabase/migrations/…_orders.sql`)

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` PK | default `gen_random_uuid()` |
| `reference` | `text` NOT NULL UNIQUE | Paystack transaction reference |
| `email` | `text` NOT NULL | buyer email |
| `tier` | `text` NOT NULL | e.g. `Starter Control` / `Growth Control` / `Premium Control` |
| `plan_period` | `text` NOT NULL | `monthly` / `annual` (as sent by the client) |
| `amount_kobo` | `bigint` NOT NULL | amount in kobo |
| `status` | `text` NOT NULL default `'pending'` | CHECK `IN ('pending','paid','failed')` |
| `source` | `text` NULL | Origin/Referer header captured at initialize time |
| `created_at` | `timestamptz` NOT NULL default `now()` | |
| `paid_at` | `timestamptz` NULL | set on `charge.success` |
| `updated_at` | `timestamptz` NOT NULL default `now()` | maintained by trigger |

Indexes: `orders_email_idx(email)`, `orders_status_idx(status)`. Trigger `update_orders_updated_at` → `public.update_updated_at_column()`.

**No foreign keys.** No relationship to `auth.users` (no auth exists).

### 3.2 RLS policies

- `ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY` is set.
- **Zero policies defined.** No `anon` or `authenticated` GRANTs.
- Grants: `GRANT ALL ON public.orders TO service_role` only.
- Net effect: the table is reachable **only via edge functions using the service role key**. The browser cannot read or write orders directly. This is intentional given the design.

### 3.3 Edge functions

All four have `verify_jwt = false` in `supabase/config.toml`.

| Function | Purpose | External APIs |
|---|---|---|
| `initialize-payment` | Validates `{email, amount, plan, tier, callback_url}`. Whitelists `callback_url` origin (allowlist: `training.taxdoctor.com.ng`, `cfo.taxdoctorcapture.org`, `taxdoctor-flow-control.lovable.app`, the Lovable id-preview host). Calls Paystack `POST /transaction/initialize` (converts naira→kobo, forwards `metadata.{plan,tier,source}`). Best-effort inserts a `pending` row into `orders` with the request Origin as `source`. Returns `{authorization_url, reference}`. | Paystack `api.paystack.co` |
| `verify-payment` | GET `?reference=…`. Calls Paystack `GET /transaction/verify/{reference}`. Returns a flattened view: `status, amount (naira), reference, plan, tier, paid_at, customer_email`. **Does not update the `orders` table.** | Paystack |
| `paystack-webhook` | Verifies `x-paystack-signature` (HMAC-SHA512 with `PAYSTACK_SECRET_KEY`). Looks up `orders.reference`; if not found, returns `{ignored:true}` (harmless for shared-account traffic). On `charge.success`: idempotent update to `status='paid'` + `paid_at` (guard `.eq('status','pending')`), sends buyer receipt email + optional team notification via Resend. On `charge.failed`: sets `status='failed'` (unless already `paid`). Other events → `{ignored:true, event}`. | Paystack (inbound signature), Resend `api.resend.com` |
| `analytics-daily` | Internal Command Center endpoint. `Authorization: Bearer <FCS_ANALYTICS_TOKEN>` required (401 without). Default view: daily rollup from `orders` on Africa/Lagos day boundaries — `{date, summary{visitors:null, leads, registrations:null, activated:null, subscribers, revenue_today, mrr:0}, funnel[], events{}, opportunities[]}`. `?view=clients` returns a roster derived by grouping `orders` by email, deriving a company name from the email domain (public-domain emails → `"(individual account)"`), with `{name, identifier, segment, status, joined_at, plan{name,mrr,comped:false}}`. Abandoned-checkout opportunity (id `opp:abandoned-checkout:v1`) surfaces pending orders older than 2h with an email. | Supabase service role only |

### 3.4 Secret NAMES (values not shown)

Configured project secrets: `PAYSTACK_SECRET_KEY`, `RESEND_API_KEY`, `TEAM_NOTIFICATION_EMAIL`, `FCS_ANALYTICS_TOKEN`, plus Supabase-managed `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_PUBLISHABLE_KEY(S)`, `SUPABASE_SECRET_KEYS`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_DB_URL`, `SUPABASE_JWKS`, `LOVABLE_API_KEY`.

### 3.5 Auth providers

**None enabled / used.** No sign-in UI, no `supabase.auth.*` calls anywhere in `src/`. The `supabase` client is imported by convention but not used by any page today.

### 3.6 Storage buckets

**None.** No storage usage anywhere in the codebase.

---

## 4. TENANCY

- **No multi-tenant model.** No `accounts`, `organizations`, `tenants`, `clients`, `memberships`, or `profiles` tables.
- A "client" is implicitly represented only as a row in `orders` keyed by `email`. There is no per-client namespace, no client ID beyond the order UUID, and no linkage across multiple orders from the same buyer other than matching email string (case-insensitively dedup'd inside `analytics-daily?view=clients`).
- **No client portal exists.** No login, no dashboard, no "my account" page, no document area — post-payment the buyer sees only the `/payment-verification` receipt screen and is told (via the Resend email) that TaxDoctor will contact them within 1 business day for onboarding. Onboarding then happens outside this application.

---

## 5. BILLING

### 5.1 Checkout flow in the app

Yes — a **hosted-redirect** checkout flow exists on `/` via `PricingSection`:

1. User clicks a tier's monthly/annual CTA.
2. `window.prompt("Please enter your email address for payment:")` collects the buyer email (no form component, no validation beyond truthiness).
3. Browser POSTs to `initialize-payment` with `{email, amount (naira), plan: "monthly"|"annual", tier: "Starter Control"|"Growth Control"|"Premium Control", callback_url: `${window.location.origin}/payment-verification`}`.
4. Function inserts a pending `orders` row and responds with Paystack's `authorization_url` + `reference`.
5. Browser sets `window.location.href = authorization_url` → Paystack-hosted checkout page.
6. Paystack redirects back to `/payment-verification?reference=…` → app calls `verify-payment`.

Tier catalog is hard-coded in `src/components/PricingSection.tsx`: Starter ₦75,000/mo or ₦750,000/yr; Growth ₦100,000/mo or ₦1,000,000/yr; Premium ₦150,000/mo or ₦1,500,000/yr. Amount is sent in **naira** by the client and multiplied by 100 inside the edge function.

### 5.2 What `paystack-webhook` does, per event

- **Signature check** (all events): HMAC-SHA512 of the raw body with `PAYSTACK_SECRET_KEY` compared to `x-paystack-signature`. 401 on mismatch.
- **Ownership check** (all events): looks up `orders` by `data.reference`. If not present → `200 {ignored:true}`. This is what allows the same Paystack account to be shared with other products (GHL, etc.) without cross-firing.
- **`charge.success`:**
  - If order already `paid` → `200 {ok:true, duplicate:true}` (idempotent).
  - Otherwise `UPDATE orders SET status='paid', paid_at=data.paid_at WHERE reference=? AND status='pending'`.
  - Sends buyer email via Resend from `TaxDoctor <noreply@mail.taxdoctor.com.ng>`, subject `Payment received — welcome to the Financial Control System`, containing tier, plan_period, formatted naira amount, reference, and the line "We'll contact you within 1 business day to begin onboarding."
  - If `TEAM_NOTIFICATION_EMAIL` is set, sends an internal notification with email/tier/plan/amount/reference/source. Both sends logged (status + ok, error body on failure).
- **`charge.failed`:** `UPDATE orders SET status='failed' WHERE reference=? AND status<>'paid'`. No email.
- **Any other event** (e.g. `subscription.*`, `invoice.*`, `transfer.*`, `refund.*`): `200 {ignored:true, event}`.

### 5.3 What it provisions

**Nothing beyond the `orders` row and two emails.** No user account is created, no subscription record, no entitlement, no access grant, no external system call, no CRM push. Provisioning of the actual service is a manual human follow-up promised in the receipt email.

### 5.4 How the payer is identified

- **Primary key:** `data.reference` → `orders.reference` (unique). This is the sole identity linking a Paystack event to a specific buyer inside this app.
- **Metadata:** `initialize-payment` writes `metadata.plan`, `metadata.tier`, and `metadata.source` (request Origin) into the Paystack transaction. `verify-payment` reads them back. `paystack-webhook` does **not** rely on metadata — it uses only `reference` and reads tier/plan from the local `orders` row.
- **Email:** stored on `orders.email` from the initialize call; used only for the receipt send and as the dedup key inside `analytics-daily`.
- **Plan code:** none — Paystack "Plans"/subscriptions are not used. Every purchase is a one-shot `transaction/initialize`.

---

## 6. DOCUMENTS

**Not implemented.** The application does not store, generate, upload, render, deliver, or link to any client documents:

- No P&L, reconciliation, management-account, tax-filing, or report artifacts anywhere.
- No storage buckets, no PDF generation, no report renderer, no email attachments.
- The only documents produced by the codebase are the two transactional HTML emails sent by `paystack-webhook` (buyer receipt and team notification).

Document deliverables named in the marketing copy ("Monthly P&L + summary insight", "Bank reconciliation", "Audited financial statement", "Tax filing", "CAC annual returns", etc.) are service promises fulfilled off-platform.

---

## 7. CROSS-APP REFERENCES

- **GHL (GoHighLevel):** No code reference. Referenced only in prior operational instructions describing that a separate GHL landing page also calls this project's `initialize-payment` function. The `initialize-payment` callback allowlist accommodates that by including `training.taxdoctor.com.ng`, and the webhook ignores references not present in this app's `orders` table so shared-Paystack-account traffic from GHL passes through harmlessly.
- **Capture:** Only appears in the deployed custom domain `cfo.taxdoctorcapture.org`. No code integration.
- **Comploy:** No reference in code.
- **TaxDoctor Books:** No reference in code.
- **FirmOS:** No reference in code.
- **Outbound webhooks:** None (aside from outbound REST calls to Paystack and Resend from edge functions).
- **Inbound webhooks:** One — `paystack-webhook`. Analytics endpoint `analytics-daily` is a pull API for an internal Command Center.

---

## 8. FEATURES — status

**Working**

- Marketing landing page (all sections render, scroll animations, sticky header).
- Pricing CTAs → Paystack checkout redirect via `initialize-payment`.
- Pending order row insert at initialize time (best-effort, wrapped in try/catch).
- Callback URL origin allowlisting.
- `/payment-verification` receipt screen via `verify-payment`.
- Paystack webhook signature verification (HMAC-SHA512, length-checked compare).
- Idempotent `charge.success` handling with pending-guard.
- `charge.failed` → status update.
- Cross-tenant safety: unknown reference → ignored.
- Resend buyer receipt email from `noreply@mail.taxdoctor.com.ng`.
- Resend team notification email (conditional on `TEAM_NOTIFICATION_EMAIL`).
- `analytics-daily` bearer-auth daily rollup (Africa/Lagos boundaries) and `?view=clients` roster.
- Abandoned-checkout opportunity surfacing (pending, >2h old, has email).

**Partial**

- Email capture UX uses `window.prompt` — no validation, no form component, no consent copy, no retry-friendly UI.
- `verify-payment` returns Paystack's live view but does **not** reconcile the `orders` table (webhook is the sole writer of `paid`/`failed`). If the webhook is delayed the receipt page can show "success" while the DB row is still `pending`.
- `analytics-daily.summary.mrr` is hard-coded to `0` (no recurring model yet).
- `plan.comped` in the clients view is always `false` (no comp mechanism).
- `analytics-daily.summary.visitors / registrations / activated` are `null` — no traffic/registration signal source exists in this app.

**Stubbed / Not implemented**

- Authentication of any kind.
- Client portal, dashboard, or account page.
- Recurring subscription (uses one-off `transaction/initialize`, not Paystack Plans).
- Document generation, storage, or delivery.
- Onboarding workflow inside the app.
- Refund / cancellation / dunning flows.
- Any CRM or downstream integration (GHL, Books, FirmOS, Comploy, Capture).
- Admin UI over `orders` (query only via edge functions and the analytics endpoint).

---

## 9. KNOWN ISSUES

1. **Client-side email capture via `window.prompt`** is hostile UX and provides no validation; typos land directly on the Paystack transaction and the `orders` row.
2. **`verify-payment` is unauthenticated and not idempotent w.r.t. local DB** — it always calls Paystack live; it never writes back to `orders`. Receipt display can diverge briefly from webhook-driven state.
3. **`initialize-payment`'s pending-row insert is best-effort** — a DB failure is swallowed (logged only) and the buyer is still redirected to Paystack. If insertion fails, the eventual webhook will treat the reference as "not ours" and ignore it, so the payment will not be marked paid inside this app and no receipt email is sent.
4. **`plan_period` is a free-text string** (values `"monthly"`/`"annual"` from the client). The MRR heuristic in `analytics-daily` does substring matching (`includes('month')`, `includes('year'|'annual')`, `includes('quarter')`) — a client sending a novel value silently yields `mrr=0`.
5. **`status` CHECK constraint** on `orders` restricts to `pending|paid|failed` — no `refunded`, `chargeback`, or `cancelled` states, and none of the corresponding Paystack events are handled.
6. **No RLS policies** on `orders` (only `service_role` GRANT). Correct for the current threat model, but any future direct client access will silently fail until policies are added.
7. **`analytics-daily?view=clients` derives "company name" from the email domain.** Real customer identity is never captured — the roster is heuristic.
8. **Auth provider is disabled but the `@supabase/supabase-js` client is instantiated** with `persistSession: true` in `src/integrations/supabase/client.ts` — inert today, but implies future auth work will need explicit configuration.
9. **Landing page copy names deliverables** (P&L, audited statements, CAC returns, tax filing) that have no implementation surface in this app — this is expected because the service is fulfilled off-platform, but it is a mismatch worth flagging to a first-time reader of the code.
10. **`payment-verification` shows fields from Paystack's response verbatim.** If Paystack's `metadata` is missing (e.g. legacy/test transactions), `tier` and `plan` render as `undefined` in the receipt card.
11. **Shared Paystack account** design relies on webhook ignoring unknown references. If two products ever mint the same Paystack `reference` string, ordering of the two apps' webhook handlers determines who "wins" — Paystack references are unique per transaction so this is theoretical, but worth noting.
