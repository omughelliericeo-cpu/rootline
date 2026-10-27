# Rootline architecture diagrams

A visual map of Rootline for developers. Read it alongside [ARCHITECTURE.md](ARCHITECTURE.md) (the written guide) and [DECISIONS.md](DECISIONS.md) (why things are the way they are). GitHub draws every diagram below. Under each one, a table links each box to the code behind it.

**Contents**
1. [System context](#1-system-context): Rootline and the services around it
2. [Code layers](#2-code-layers): how a request travels through the folders
3. [Feature dependencies](#3-feature-dependencies): which feature uses which
4. [Data model](#4-data-model): tables and their relationships
5. [Security layers](#5-security-layers): who can see what, enforced where
6. [Flow: a shopper scans a QR code](#6-flow-a-shopper-scans-a-qr-code)
7. [Flow: a producer saves a form](#7-flow-a-producer-saves-a-form-server-action)
8. [Flow: creating and publishing a batch](#8-flow-creating-and-publishing-a-batch)
9. [Flow: subscribing to a plan (Stripe)](#9-flow-subscribing-to-a-plan-stripe)
10. [Flow: recalls](#10-flow-recalls) and [shopper photos](#11-flow-shopper-photos)
12. [Deployment and environments](#12-deployment-and-environments)
13. [Where to start reading](#13-where-to-start-reading)

---

## 1. System context

```mermaid
flowchart LR
    shopper(["Shopper<br/>(phone camera, no account)"])
    producer(["Producer<br/>(brewery, bakery, farm...)"])

    subgraph vercel["Vercel"]
        app["Rootline<br/>Next.js 16 app<br/>(pages, server actions, API routes)"]
    end

    subgraph supabase["Supabase"]
        pg[("Postgres<br/>row-level security")]
        auth["Auth<br/>(email + password)"]
        storage["Storage<br/>brand-media (public)<br/>certificates (private)<br/>shopper-photos (private)"]
    end

    stripe["Stripe<br/>Checkout, billing portal,<br/>webhooks"]
    resend["Resend<br/>recall emails"]
    osm["OpenStreetMap<br/>map tiles + Nominatim lookup"]
    sentry["Sentry<br/>error reports"]

    shopper -- "scans QR: /b/{code}" --> app
    producer -- "logs in, manages batches" --> app
    app -- "Prisma via pooler (rootline_app role)" --> pg
    app -- "sessions" --> auth
    app -- "uploads, signed links" --> storage
    app -- "Checkout / portal sessions" --> stripe
    stripe -- "POST /api/stripe/webhook" --> app
    app -- "send recall" --> resend
    app -- "address lookup (server)" --> osm
    shopper -. "map tiles (browser)" .-> osm
    app -- "errors" --> sentry
```

| Box | Code |
|---|---|
| Rootline app | [`src/app`](../src/app), [`next.config.ts`](../next.config.ts) |
| Postgres + RLS | [`prisma/schema.prisma`](../prisma/schema.prisma), [`prisma/migrations`](../prisma/migrations), [`src/lib/db.ts`](../src/lib/db.ts) |
| Auth | [`src/lib/auth.ts`](../src/lib/auth.ts), [`src/lib/supabase.ts`](../src/lib/supabase.ts), [`src/lib/supabase-proxy.ts`](../src/lib/supabase-proxy.ts), [`src/features/auth`](../src/features/auth) |
| Storage | [`src/lib/storage.ts`](../src/lib/storage.ts), [`src/lib/storage-rules.ts`](../src/lib/storage-rules.ts), [`scripts/setup-storage.ts`](../scripts/setup-storage.ts) |
| Stripe | [`src/features/billing/server`](../src/features/billing/server), [`src/app/api/stripe/webhook/route.ts`](../src/app/api/stripe/webhook/route.ts), [`scripts/stripe-setup.ts`](../scripts/stripe-setup.ts) |
| Resend | [`src/lib/email.ts`](../src/lib/email.ts) |
| OpenStreetMap | [`src/lib/geocode.ts`](../src/lib/geocode.ts), [`src/app/api/geocode/route.ts`](../src/app/api/geocode/route.ts), [`src/features/story-page/components/RouteMap.tsx`](../src/features/story-page/components/RouteMap.tsx) |
| Sentry | [`src/lib/sentry.ts`](../src/lib/sentry.ts), [`src/instrumentation.ts`](../src/instrumentation.ts) |

---

## 2. Code layers

Routes stay thin. They call **features**, which own their rules and database access. Features use shared **lib** plumbing and **ui** components. Only feature `server/` folders (and `src/lib`) may touch the database; ESLint enforces this.

```mermaid
flowchart TB
    proxy["src/proxy.ts<br/>request id + session refresh"]
    subgraph app["src/app (routes only)"]
        public["(public)<br/>/b/[code] story page<br/>/s/[code] shelf redirect<br/>/recall/unsubscribe"]
        authr["(auth)<br/>/signup /login /setup"]
        prod["(producer)<br/>/dashboard /batches /products<br/>/suppliers /certificates /shelf-codes<br/>/shopper-photos /brand /billing"]
        api["api/<br/>health, geocode, stripe/webhook,<br/>recall/unsubscribe"]
        mkt["/ (home), /pricing"]
    end
    subgraph features["src/features/* (one folder per feature)"]
        fidx["index.ts<br/>(the only entry point)"]
        fcomp["components/"]
        fserver["server/<br/>(actions + queries:<br/>the only DB access)"]
        fservice["service.ts + schema.ts<br/>(pure rules + Zod)"]
    end
    subgraph lib["src/lib (shared plumbing)"]
        action["action.ts<br/>defineAction / defineOwnerAction"]
        db["db.ts<br/>withTenant / withPublic"]
        authl["auth.ts<br/>getOwner / requireOwner"]
        other["errors, result, logger,<br/>config, storage, email,<br/>dates, image-metadata, rate-limit"]
    end
    ui["src/ui<br/>design-system components"]
    prisma[("src/generated/prisma<br/>Prisma client")]
    pgdb[("Postgres")]

    proxy --> app
    app --> fidx
    app --> ui
    fidx --> fcomp & fserver & fservice
    fcomp --> ui
    fserver --> action & db & authl & other
    db --> prisma --> pgdb
```

| Box | Code |
|---|---|
| Proxy (middleware) | [`src/proxy.ts`](../src/proxy.ts), [`src/lib/request-id.ts`](../src/lib/request-id.ts) |
| Route groups | [`(public)`](../src/app/%28public%29), [`(auth)`](../src/app/%28auth%29), [`(producer)`](../src/app/%28producer%29), [`api`](../src/app/api) |
| Server action wrapper | [`src/lib/action.ts`](../src/lib/action.ts) |
| Tenant / public database access | [`src/lib/db.ts`](../src/lib/db.ts) |
| Typed results and errors | [`src/lib/result.ts`](../src/lib/result.ts), [`src/lib/errors.ts`](../src/lib/errors.ts) |
| Import rules | [`eslint.config.mjs`](../eslint.config.mjs) |
| UI components | [`src/ui/index.ts`](../src/ui/index.ts) |

---

## 3. Feature dependencies

An arrow means "imports from that feature's `index.ts`". Arrows only point downwards: `industries` and `billing` sit at the bottom and depend on no other feature.

```mermaid
flowchart BT
    industries["industries<br/>templates per industry"]
    billing["billing<br/>plans, limits, Stripe"]
    analytics["analytics<br/>scan counts"]

    brand["brand"] --> industries & billing
    auth["auth"] --> brand & industries
    suppliers["suppliers"] --> industries
    products["products"] --> industries
    certificates["certificates"] --> industries & billing
    qr["qr<br/>QR, sticker sheets, shelf codes"] --> billing
    batches["batches"] --> industries & billing
    recalls["recalls"] --> batches & industries & billing
    shopper["shopper-photos"] --> batches & industries & billing
    compliance["compliance<br/>PDF/CSV export"] --> batches & brand & industries & products & suppliers
    dashboard["dashboard"] --> analytics & batches & certificates & industries & recalls
    story["story-page<br/>public page"] --> billing & certificates & industries & recalls & shopper
```

| Feature | Folder | What it owns |
|---|---|---|
| industries | [`src/features/industries`](../src/features/industries) | Templates: words, fields, dates, badges, stops; the "What do you make?" cards |
| billing | [`src/features/billing`](../src/features/billing) | Plans, limits, pricing page, Plan & billing, Stripe |
| brand | [`src/features/brand`](../src/features/brand) | Brand profile, people, photos |
| auth | [`src/features/auth`](../src/features/auth) | Sign-up, login, finish setting up, producer navigation |
| suppliers | [`src/features/suppliers`](../src/features/suppliers) | Farms and suppliers with map positions |
| products | [`src/features/products`](../src/features/products) | Products, ingredients, allergens |
| certificates | [`src/features/certificates`](../src/features/certificates) | Certificate files and "is this badge valid?" |
| batches | [`src/features/batches`](../src/features/batches) | Batches, lots, journey stops, statuses |
| qr | [`src/features/qr`](../src/features/qr) | QR images, sticker sheets, shelf codes |
| story-page | [`src/features/story-page`](../src/features/story-page) | The public page shoppers see |
| recalls | [`src/features/recalls`](../src/features/recalls) | Recall sign-ups, sending, unsubscribe |
| shopper-photos | [`src/features/shopper-photos`](../src/features/shopper-photos) | Shared photos and approval |
| analytics | [`src/features/analytics`](../src/features/analytics) | Scan recording and counts |
| dashboard | [`src/features/dashboard`](../src/features/dashboard) | Producer home |
| compliance | [`src/features/compliance`](../src/features/compliance) | Batch record as PDF and CSV |

Every feature folder has the same shape: `README.md`, `index.ts`, `schema.ts`, `service.ts`, `components/`, `server/`, `tests/`.

---

## 4. Data model

Every table belongs to a **brand**, directly or through a batch. Dates are stored as UTC in "timestamp without time zone" columns.

```mermaid
erDiagram
    Brand ||--o{ BrandPerson : "people"
    Brand ||--o{ Supplier : "buys from"
    Brand ||--o{ Product : "makes"
    Brand ||--o{ Certificate : "holds"
    Brand ||--o{ Batch : "produces"
    Brand ||--o{ ShelfCode : "prints"
    Brand ||--o{ ShopperPhoto : "receives"
    Product ||--o{ Batch : "is made in"
    Product |o--o{ Certificate : "may be covered by"
    Supplier |o--o{ Certificate : "may be covered by"
    Batch ||--o{ BatchLot : "used lots"
    Supplier ||--o{ BatchLot : "supplied"
    Batch ||--o{ RouteStop : "travelled via"
    Batch ||--o{ ScanEvent : "was scanned"
    Batch ||--o{ RecallSubscriber : "alerts to"
    Batch ||--o{ RecallMessage : "recalled by"
    Batch ||--o{ ShopperPhoto : "photographed in"
    Batch |o--o{ ShelfCode : "currently shown by"

    Brand {
        uuid id PK
        uuid owner_user_id UK "Supabase user"
        string industry "template id"
        string name
        Plan plan "STARTER GROWTH ENTERPRISE"
        datetime trial_ends_at
        string stripe_customer_id UK
        string subscription_status
    }
    Batch {
        uuid id PK
        string code UK "8 chars, in the QR"
        int number
        BatchStatus status "DRAFT LIVE SOLD_OUT"
        datetime made_at
        datetime packaged_at
        json extra "industry fields"
    }
    Certificate {
        uuid id PK
        string claim "badge id"
        date expires_on
        CertificateStatus status "VALID REVOKED"
        string file_path "private bucket"
    }
    ShopperPhoto {
        uuid id PK
        ShopperPhotoStatus status "PENDING APPROVED"
        string photo_path
        string note
        string first_name
    }
    StripeEvent {
        string id PK "Stripe event id"
        string type
    }
```

| Item | Code |
|---|---|
| Schema | [`prisma/schema.prisma`](../prisma/schema.prisma) |
| Migrations (incl. hand-written RLS SQL) | [`prisma/migrations`](../prisma/migrations) |
| Demo data | [`prisma/seed.mts`](../prisma/seed.mts), [`prisma/seed`](../prisma/seed) |

---

## 5. Security layers

Two independent walls: the app scopes every query by brand, and **Postgres row-level security** blocks any row that doesn't belong to the caller, even if the app has a bug.

```mermaid
flowchart TB
    subgraph callers["Who is asking"]
        owner["Logged-in producer"]
        anon["Shopper (no login)"]
        stripeWh["Stripe webhook"]
        admin["Migrations, seed, scripts"]
    end

    subgraph appside["App side"]
        reqOwner["requireOwner()<br/>Supabase session → brand"]
        tenant["withTenant(user, brand)<br/>set_config app.user_id / app.brand_id"]
        pub["withPublic()<br/>set_config app.public = on"]
        sig["Stripe signature check<br/>STRIPE_WEBHOOK_SECRET"]
    end

    subgraph dbside["Database side (Postgres)"]
        appRole["role rootline_app<br/>NO BYPASSRLS<br/>no UPDATE on billing columns"]
        rls["RLS policies on every table"]
        fns["SECURITY DEFINER functions<br/>apply_subscription()<br/>stripe_event_claim()<br/>recall_unsubscribe()<br/>shopper_photo_pending_count()"]
        ownerRole["owner role<br/>(bypasses RLS)"]
    end

    owner --> reqOwner --> tenant --> appRole
    anon --> pub --> appRole
    stripeWh --> sig --> fns
    appRole --> rls
    admin --> ownerRole
```

| What the public (story pages) can do | Policy |
|---|---|
| Read LIVE / SOLD_OUT batches and what their story shows | `story_page_public_access` migration |
| Add a scan, a recall sign-up, or a PENDING shopper photo | Insert-only policies; the app inserts with `createMany` (no read-back) |
| Never: read drafts, emails, waiting photos, scans, billing | No policy allows it |

| Item | Code |
|---|---|
| Owner lookup and redirects | [`src/lib/auth.ts`](../src/lib/auth.ts) |
| `withTenant`, `withPublic` | [`src/lib/db.ts`](../src/lib/db.ts) |
| Role and policies | [`20261024225451_brand_and_people`](../prisma/migrations/20261024225451_brand_and_people/migration.sql), [`20261025010901_story_page_public_access`](../prisma/migrations/20261025010901_story_page_public_access/migration.sql), [`20261027011112_billing_plans`](../prisma/migrations/20261027011112_billing_plans/migration.sql) |
| Tests that prove it | [`src/lib/tests/rls.db.test.ts`](../src/lib/tests/rls.db.test.ts), [`src/lib/tests/public-read.db.test.ts`](../src/lib/tests/public-read.db.test.ts), [`src/features/billing/tests/billing.db.test.ts`](../src/features/billing/tests/billing.db.test.ts), [`src/features/shopper-photos/tests/shopper-photos.db.test.ts`](../src/features/shopper-photos/tests/shopper-photos.db.test.ts) |

---

## 6. Flow: a shopper scans a QR code

```mermaid
sequenceDiagram
    autonumber
    actor S as Shopper's phone
    participant P as proxy.ts
    participant R as /b/[code]/page.tsx
    participant Q as story-page loadStory()
    participant DB as Postgres (public mode)
    participant B as story-page buildStory()
    participant A as analytics recordScan()

    S->>P: GET /b/cedarpm2 (from QR)
    P->>P: add x-request-id, refresh session cookie
    P->>R: render
    R->>Q: loadStory(code)
    Q->>DB: withPublic: batch + product + brand + lots + stops + certificates + approved photos
    DB-->>Q: only LIVE / SOLD_OUT rows (RLS)
    Q-->>R: raw story (or null → 404)
    R->>B: buildStory(raw, now): template words, freshness, verified badges, plan features
    B-->>R: StoryView
    R-->>S: server-rendered HTML (works without JavaScript)
    R--)A: after(): record scan (city-level only, no IP)
    Note over S: Leaflet map loads in the browser (RouteMap.tsx)
```

Code: [`src/app/(public)/b/[code]/page.tsx`](../src/app/%28public%29/b/%5Bcode%5D/page.tsx) · [`story-page/server/queries.ts`](../src/features/story-page/server/queries.ts) · [`story-page/service.ts`](../src/features/story-page/service.ts) · [`story-page/components`](../src/features/story-page/components) · [`analytics/server`](../src/features/analytics/server) · shelf codes: [`src/app/(public)/s/[code]/route.ts`](../src/app/%28public%29/s/%5Bcode%5D/route.ts)

---

## 7. Flow: a producer saves a form (server action)

Every producer form follows this path. Swap in any action, e.g. `createSupplier`, `uploadCertificate`, `sendRecall`.

```mermaid
sequenceDiagram
    autonumber
    actor U as Producer
    participant F as Form + useFormAction
    participant W as defineOwnerAction (lib/action.ts)
    participant O as requireOwnerForAction
    participant G as billing guards
    participant T as withTenant (lib/db.ts)
    participant DB as Postgres (RLS)

    U->>F: submit (works before JS loads)
    F->>W: FormData
    W->>W: requestId, log "action started"
    W->>W: Zod schema.safeParse
    alt invalid
        W-->>F: { ok:false, VALIDATION_FAILED, fieldErrors }
    end
    W->>O: session → Owner (brand, industry, plan facts)
    W->>G: requireFeature / requireUnderLimit (where the plan matters)
    W->>T: work inside one transaction
    T->>DB: set_config(app.user_id, app.brand_id), then queries
    DB-->>T: rows for this brand only
    T-->>W: result
    W-->>F: { ok:true, data } or { ok:false, code, message, requestId }
    W->>W: log success or failure with duration, Sentry for crashes
```

Code: [`src/ui/useFormAction.ts`](../src/ui/useFormAction.ts) · [`src/lib/action.ts`](../src/lib/action.ts) · [`src/lib/auth.ts`](../src/lib/auth.ts) · [`src/features/billing/guards.ts`](../src/features/billing/guards.ts) · [`src/lib/db.ts`](../src/lib/db.ts) · [`src/lib/logger.ts`](../src/lib/logger.ts)

---

## 8. Flow: creating and publishing a batch

```mermaid
stateDiagram-v2
    [*] --> DRAFT: New batch, step 1<br/>(product + dates)
    DRAFT --> DRAFT: step 2 lots, step 3 print<br/>journey stops pre-filled
    DRAFT --> LIVE: Publish<br/>publishProblems() empty<br/>AND under plan's live limit
    LIVE --> SOLD_OUT: Mark sold out
    SOLD_OUT --> LIVE: Back on sale<br/>(limit checked again)
    LIVE --> DRAFT: Take offline
    DRAFT --> [*]: Delete (drafts only)
    note right of LIVE
        Public story page at /b/{code}
        Scans recorded, recalls possible
    end note
```

Code: [`batches/service.ts`](../src/features/batches/service.ts) (`publishProblems`, `canChangeStatus`) · [`batches/server/status-actions.ts`](../src/features/batches/server/status-actions.ts) · [`batches/server`](../src/features/batches/server) · [`src/app/(producer)/batches`](../src/app/%28producer%29/batches) · QR and sticker sheet: [`qr/server`](../src/features/qr/server)

---

## 9. Flow: subscribing to a plan (Stripe)

```mermaid
sequenceDiagram
    autonumber
    actor U as Producer
    participant B as /billing (BillingPanel)
    participant A as startCheckout action
    participant S as Stripe
    participant W as /api/stripe/webhook
    participant H as handleStripeEvent
    participant DB as Postgres

    U->>B: Choose Growth (monthly / yearly)
    B->>A: plan + interval
    A->>S: find price by lookup key, create Checkout session (client_reference_id = brandId)
    A-->>U: redirect to checkout.stripe.com
    U->>S: pays (card details never touch Rootline)
    S-->>U: redirect to /billing?checkout=success
    S->>W: POST event (signed)
    W->>W: verify signature (STRIPE_WEBHOOK_SECRET)
    W->>H: event
    H->>S: retrieve subscription (latest state, safe if events arrive out of order)
    H->>DB: SELECT apply_subscription(brand, plan, status, period end)
    H->>DB: SELECT stripe_event_claim(event id)
    Note over DB: effectivePlan() now returns GROWTH for this brand
```

Code: [`billing/plans.ts`](../src/features/billing/plans.ts) · [`billing/service.ts`](../src/features/billing/service.ts) (`effectivePlan`) · [`billing/server/actions.ts`](../src/features/billing/server/actions.ts) · [`billing/server/webhook.ts`](../src/features/billing/server/webhook.ts) · [`api/stripe/webhook/route.ts`](../src/app/api/stripe/webhook/route.ts) · [`billing_plans` migration](../prisma/migrations/20261027011112_billing_plans/migration.sql)

---

## 10. Flow: recalls

```mermaid
sequenceDiagram
    autonumber
    actor Sh as Shopper
    actor Pr as Producer
    participant SP as Story page
    participant R as recalls feature
    participant DB as Postgres
    participant E as Resend (or log mode)

    Sh->>SP: "Alert me if this batch is recalled" + consent (Growth plans)
    SP->>R: subscribeToRecalls (public, insert-only)
    R->>DB: recall_subscriber (email, consent text, unsubscribe token)
    Pr->>R: Send recall (subject, message, confirm)
    R->>DB: recall_message saved
    alt plan includes recall emails
        R->>E: one email per subscriber, idempotency key, unsubscribe link
    end
    SP-->>Sh: warning at the top of the story page (every plan)
    Sh->>R: unsubscribe link → recall_unsubscribe(token)
```

Code: [`src/features/recalls`](../src/features/recalls) · [`src/lib/email.ts`](../src/lib/email.ts) · [`src/app/(public)/recall/unsubscribe`](../src/app/%28public%29/recall/unsubscribe) · [`src/app/api/recall/unsubscribe`](../src/app/api/recall/unsubscribe)

## 11. Flow: shopper photos

```mermaid
flowchart LR
    A["Shopper picks photo<br/>(story page form)"] --> B["Browser shrinks to ≤2000px JPEG<br/>src/ui/shrinkImage.ts"]
    B --> C["sharePhoto action<br/>bot trap · rate limit · plan check"]
    C --> D["Strip EXIF/GPS/XMP<br/>src/lib/image-metadata"]
    D --> E["Private bucket<br/>shopper-photos"]
    E --> F[("shopper_photo<br/>status PENDING")]
    F --> G{"Producer reviews<br/>/shopper-photos"}
    G -- Approve --> H["Copy to public brand-media<br/>status APPROVED"]
    G -- Reject --> I["Delete row + file"]
    H --> J["Shown on story page<br/>(first name only)"]
```

Code: [`src/features/shopper-photos`](../src/features/shopper-photos) · [`src/lib/image-metadata`](../src/lib/image-metadata) · [`src/lib/rate-limit.ts`](../src/lib/rate-limit.ts) · [`src/ui/shrinkImage.ts`](../src/ui/shrinkImage.ts)

---

## 12. Deployment and environments

```mermaid
flowchart LR
    subgraph dev["Developer machine"]
        code["Code + .env<br/>(never committed)"]
        localpg[("Local Postgres<br/>rootline + rootline_test")]
        tests["npm run check<br/>npm run test:db<br/>npx playwright test"]
    end
    gh["GitHub<br/>(private repo)"]
    subgraph prodenv["Production"]
        vercelp["Vercel<br/>rootline-taupe.vercel.app"]
        supa[("Supabase project<br/>Postgres · Auth · Storage")]
        stripep["Stripe<br/>(test mode for now)"]
    end

    code -- "git push" --> gh
    code -- "vercel deploy --prod" --> vercelp
    code -- "prisma migrate deploy<br/>(PROD_DIRECT_URL, owner)" --> supa
    vercelp -- "DATABASE_URL: pooler :6543<br/>role rootline_app" --> supa
    vercelp <--> stripep
    tests --> localpg
```

**Releasing a change:** run the checks, apply any new migration to production, then `vercel deploy --prod`. Details are in the [README](../README.md#deploying). Environment variables are listed in [`.env.example`](../.env.example).

---

## 13. Where to start reading

| If you want to… | Start here |
|---|---|
| Understand one request end to end | [`src/app/(public)/b/[code]/page.tsx`](../src/app/%28public%29/b/%5Bcode%5D/page.tsx), then [`story-page`](../src/features/story-page) |
| Add a form or action | Copy the pattern in [`suppliers/server`](../src/features/suppliers/server) and [`src/lib/action.ts`](../src/lib/action.ts) |
| Add an industry | [`industries/README.md`](../src/features/industries/README.md) |
| Change a plan or price | [`billing/plans.ts`](../src/features/billing/plans.ts), then `npm run stripe:setup` |
| Change who can see what | The RLS SQL in [`prisma/migrations`](../prisma/migrations) and its `*.db.test.ts` tests |
| Find why something was built a certain way | [`DECISIONS.md`](DECISIONS.md) |
| Fix a problem | [`TROUBLESHOOTING.md`](TROUBLESHOOTING.md) |
