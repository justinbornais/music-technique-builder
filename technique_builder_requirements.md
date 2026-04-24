# Music Technique Builder SaaS Requirements Document

## Document Purpose

This document defines the product, technical, operational, and deployment requirements for evolving the current **music-technique-builder** codebase into a scalable premium SaaS product for piano teachers, students, and self-taught musicians.

The target product vision is:

> **Create polished, customized technique packets for each student in minutes instead of editing documents by hand.**

It extends that core promise with:
- saved templates and reusable packet workflows
- student and studio management
- assignment and worksheet generation
- progress tracking and summaries
- premium account features and billing
- a technical architecture designed to start cheaply and scale cleanly

---

## 1. Executive Summary

The current repository is already a strong **generation engine**. It uses a modern client-side stack and Typst-based rendering to generate technique collections quickly. Its current strengths are speed, flexibility in generation, and high-quality musical document output.

However, it is **not yet a SaaS product**. It currently lacks:
- persistent user accounts
- student/studio data models
- saved resources and assignment history
- progress tracking and summaries
- billing and entitlements
- protected premium export logic
- infrastructure designed for growth

The recommended approach is **not** to bolt these features directly into the current public GitHub Pages-style architecture. Instead, the generation engine should be preserved and extracted into a reusable core, while a new private commercial application is built around it using:

- **Next.js** for the full-stack web app
- **Supabase** for database, auth, storage, and edge/serverless support
- **Paddle** for payments, subscriptions, tax, and compliance
- **Cloudflare** for DNS/CDN/caching and optionally selected edge capabilities later

---

## 2. Current Codebase Assessment

### 2.1 Current Repository
Repository: `justinbornais/music-technique-builder`

### 2.2 Current Strengths
The current application already appears to support or strongly imply:
- technique collection generation
- multiple presets / progression modes
- configurable technique types
- notation and layout options
- key filtering / ordering
- document rendering with Typst
- a fast client-side interactive workflow
- a reusable Scorify-based rendering foundation

### 2.3 Current Architectural Identity
The project is currently best described as:

> **A client-side music technique packet generator with high-quality Typst-based rendering**

This is valuable, but it is not yet:
- a teacher workflow platform
- a student progress system
- a paid SaaS with protected premium functionality

### 2.4 What Must Change
The product must evolve from:
- **single-session generation**

into:
- **account-backed packet generation**
- **saved student/studio workflows**
- **practice tracking and summaries**
- **paid, entitlement-aware export and management features**

---

## 3. Product Vision

### 3.1 Core Value Proposition
The commercial product should be positioned as:

> **A teacher productivity platform and customizable technique packet builder for piano instruction and self-study.**

### 3.2 Primary User Segments
1. **Private piano teachers**
   - need to create student-specific materials quickly
   - need repeatable templates
   - need assignment history and progress summaries

2. **Music studios / multi-student teachers**
   - need organization across many students
   - need reporting and reusable workflows
   - need branded outputs

3. **Self-taught musicians / adult learners**
   - need guided packet creation
   - need progress tracking
   - need printable and repeatable structured practice materials

4. **Advanced students / parents**
   - need structured weekly materials
   - want progress overviews and printable resources

### 3.3 Product Principles
The product must be:
- extremely simple to use
- very fast in UI responsiveness
- visually polished in output
- flexible but not cluttered
- affordable to run at low scale
- easy to scale without major rewrites
- protective of premium logic and subscription value

---

## 4. Product Goals

### 4.1 Primary Goals
- Allow teachers and self-learners to generate polished technique packets in under 2 minutes.
- Reduce manual worksheet editing significantly.
- Make packet reuse and regeneration trivial.
- Make the app sticky through saved data, history, and progress workflows.
- Create a monetizable product with strong subscription retention.

### 4.2 Secondary Goals
- Support curriculum-style presets.
- Make progress summaries useful enough to justify subscription renewal.
- Build a foundation that can later support mobile apps and additional instruments.

---

## 5. Feature Comparison: Current vs Future SaaS

## 5.1 Existing / Likely Current Features
- music technique packet generation
- Typst/Scorify rendering
- preset/levels concepts
- technique selection and ordering
- customization around keys and notation
- fast local preview flow

## 5.2 Missing Features Required for SaaS
- user registration and login
- account roles (teacher, self-learner, studio)
- saved packet templates
- student profiles
- worksheet metadata and assignment history
- progress logs
- teacher notes
- analytics and summaries
- billing and plan enforcement
- protected premium PDF export and entitlement checks
- usage metering
- admin operations and support tooling

---

## 6. Functional Requirements

## 6.1 Authentication and Accounts
The system must support:
- email/password sign-in
- password reset
- Google login
- optional magic link later
- account types:
  - teacher
  - self_learner
  - admin
- user profile editing
- plan and subscription status display

### Acceptance Criteria
- A user can sign up and log in securely.
- A user can access only their own data.
- A user’s plan status can be used to unlock or restrict premium features.

---

## 6.2 Packet Builder
The system must allow users to:
- create technique packets from configurable generator settings
- preview output quickly
- save configurations as templates
- duplicate prior packets
- apply presets based on teaching goals or curriculum levels
- attach worksheet metadata:
  - student name
  - title
  - week/date
  - teacher notes
  - goals
- export polished PDFs

### Acceptance Criteria
- A user can create a packet in under 2 minutes.
- A user can save and reload configurations.
- Paid users can export production-grade PDFs.

---

## 6.3 Student Management
The system must allow teachers to:
- create student records
- assign templates or packets to a student
- store notes per student
- classify students by level / tags
- view packet and assignment history per student

### Acceptance Criteria
- A teacher can open a student profile and see relevant worksheets and progress.
- A teacher can reuse a prior assignment for a student.

---

## 6.4 Worksheet and Assignment Workflows
The system must allow teachers to:
- generate printable worksheets for a student
- assign worksheets with dates/goals
- clone prior assignments
- store assignment status
- track completion/review/mastery status

### Assignment statuses
- draft
- assigned
- in_progress
- reviewed
- mastered
- archived

---

## 6.5 Progress Tracking
The system must allow users to:
- log practice sessions
- log minutes practiced
- track completion percentage or confidence
- add practice notes
- store teacher review notes
- view progress trends over time

### Acceptance Criteria
- A self-learner can track their own practice.
- A teacher can track progress per student.
- Progress data can feed summaries and dashboards.

---

## 6.6 Summaries and Reporting
The system must provide:
- weekly progress summaries
- monthly progress summaries
- technique coverage summaries
- completion trends
- missing-area / low-coverage indicators
- printable summary reports later

### Acceptance Criteria
- A teacher can view recent progress summaries for a student.
- A self-learner can see a simple dashboard of practice and completion.

---

## 6.7 Billing and Subscription Features
The system must support:
- subscription checkout
- recurring billing
- subscription status synchronization
- plan-based feature gating
- customer billing portal access
- webhook handling for billing events
- free tier limits

### Initial plans
- Free
- Individual Premium
- Studio

### Gated features may include
- number of students
- number of saved templates
- number of exports per month
- progress history depth
- branded exports
- studio reporting

---

## 6.8 Admin and Operational Features
The system should support:
- basic admin user role
- account lookup by email
- subscription status inspection
- export/job inspection
- support diagnostics
- feature flags for staged rollout

---

## 7. Non-Functional Requirements

### 7.1 Performance
- UI interactions must feel fast and responsive.
- Simple configuration changes should update preview rapidly.
- The product should remain usable on modest devices.

### 7.2 Reliability
- Export jobs must be retryable.
- Webhook handling must be idempotent.
- Database changes must be migration-based.

### 7.3 Security
- all premium/account data must be protected server-side
- row-level access controls must isolate each user’s data
- billing webhooks must be verified
- sensitive secrets must never be exposed to the browser

### 7.4 Scalability
- architecture must support moving from hobby scale to paid SaaS without rewrite
- stateless web tier preferred
- storage and background export processing must be separable from frontend rendering

### 7.5 Cost Efficiency
- free or low-cost tiers should be sufficient during early validation
- usage-heavy features should be meterable and controllable
- optional components should not be required before revenue exists

---

## 8. Recommended Technical Architecture

## 8.1 Recommended Stack
### Frontend / App Shell
- **Next.js** (App Router)
- React
- TypeScript
- Tailwind CSS or equivalent utility-first design system
- shadcn/ui or equivalent component system

### Backend Platform
- **Supabase**
  - Postgres database
  - Auth
  - Storage
  - Row Level Security
  - Edge Functions where appropriate

### Payments / Billing
- **Paddle**
  - subscription billing
  - tax compliance
  - merchant of record responsibilities
  - hosted checkout / billing workflows
  - webhook events for subscription state

### Rendering / Export Core
- existing Typst + Scorify generation pipeline
- worker/server export layer for premium PDF generation

### Hosting / Delivery
- **Vercel** for the Next.js app initially
- **Cloudflare** for DNS/CDN/WAF/caching
- optional Cloudflare Workers later for selected edge or media tasks

### Observability / Email / Ops
- Postmark / Resend for transactional email
- Sentry for error tracking
- simple analytics (Plausible / PostHog later if needed)

---

## 8.2 Why This Stack
### Next.js
Use Next.js as the application shell because it allows:
- fast frontend development
- SSR/ISR where helpful
- route handlers for backend endpoints
- server actions for tightly coupled app mutations
- easy integration with auth and billing flows

### Supabase
Use Supabase because it consolidates:
- relational database
- auth
- storage
- row-level security
- server-side logic support

This keeps the early architecture simple and inexpensive.

### Paddle
Use Paddle because it reduces early tax/compliance burden. This is especially attractive for a solo founder selling subscriptions internationally.

---

## 9. Frontend / Backend Separation Model

Although Next.js is a full-stack framework, the system should still be logically separated into layers.

## 9.1 Frontend Responsibilities
The browser/UI layer should handle:
- navigation and rendering
- packet builder interface
- local preview configuration state
- dashboard display
- user interactions
- lightweight client-side preview rendering where useful

This layer must **not** contain:
- billing secrets
- entitlement authority
- secure export authorization logic
- privileged database operations

## 9.2 Next.js Server Responsibilities
The Next.js server layer should handle:
- authenticated server actions
- route handlers for app-specific API logic
- secure orchestration of export requests
- dashboard/server page rendering
- calling Supabase using server credentials where required
- calling Paddle or validating Paddle state for premium access

## 9.3 Supabase Responsibilities
Supabase should own:
- persistent relational data
- user auth identities
- storage for generated files/assets
- access policies via Row Level Security
- selected background/business logic via SQL / functions / edge functions

## 9.4 Paddle Responsibilities
Paddle should own:
- checkout
- subscription records on the payment side
- taxes and related compliance burden within its Merchant of Record model
- billing event notifications via webhooks

## 9.5 Recommended Integration Boundaries
Recommended practical flow:
1. Frontend requests checkout or premium action from Next.js server.
2. Next.js server creates or initiates the Paddle action.
3. Paddle checkout occurs in hosted or embedded flow.
4. Paddle webhook hits secure server endpoint.
5. Secure backend updates subscription entitlements in database.
6. UI reflects entitlement state.

This keeps payment state authoritative and secure.

---

## 10. Data Model Requirements

## 10.1 Core Tables
### users
- id
- email
- created_at

### profiles
- user_id
- display_name
- account_type
- studio_name
- timezone
- locale

### subscriptions
- id
- user_id
- provider (`paddle`)
- provider_customer_id
- provider_subscription_id
- plan_key
- status
- current_period_end
- cancel_at_period_end
- updated_at

### students
- id
- owner_user_id
- name
- level_label
- tags
- notes
- active
- created_at

### templates
- id
- owner_user_id
- name
- description
- category
- config_json
- created_at
- updated_at

### worksheets
- id
- owner_user_id
- student_id nullable
- template_id nullable
- title
- config_json
- pdf_storage_path
- preview_storage_path nullable
- created_at

### assignments
- id
- owner_user_id
- student_id
- worksheet_id
- assigned_date
- due_date nullable
- goals
- teacher_notes
- status
- created_at
- updated_at

### progress_logs
- id
- assignment_id
- actor_user_id
- minutes_practiced
- completion_percent
- confidence_rating nullable
- notes
- created_at

### summary_snapshots
- id
- owner_user_id
- student_id nullable
- period_type
- period_start
- period_end
- summary_json
- created_at

### usage_events
- id
- owner_user_id
- event_type
- quantity
- metadata_json
- created_at

### export_jobs
- id
- owner_user_id
- worksheet_id nullable
- status
- requested_at
- completed_at nullable
- output_storage_path nullable
- error_message nullable

---

## 11. Permissions and Security Requirements

### 11.1 Row-Level Security
All user-owned tables must be protected with RLS.
Users may only access their own profiles, students, templates, worksheets, assignments, logs, and summaries unless explicitly permitted otherwise.

### 11.2 Secret Management
Secrets must be stored only in deployment environment variables or secure secret stores.
Never expose:
- Supabase service role key
- Paddle secrets
- webhook secrets
- server-side export credentials

### 11.3 Webhooks
Webhook endpoints must:
- verify signatures
- be idempotent
- log failures and retries
- never trust client-reported billing state

---

## 12. System Design for Scalability

## 12.1 Scalability Principles
- Keep web tier stateless.
- Keep app data in Postgres.
- Keep files in object storage.
- Use background jobs for expensive export work.
- Gate premium features with entitlement checks, not hidden UI alone.
- Separate preview rendering from authoritative premium export generation.

## 12.2 Low-Scale Strategy
At launch:
- single Next.js app
- single Supabase project
- Paddle integration
- object storage for outputs
- simple export job queue strategy
- minimal analytics / ops tools

## 12.3 Growth Strategy
As usage grows:
- add background job workers for export processing
- cache expensive read paths
- move heavy rendering to dedicated worker processes if needed
- add CDN caching for static assets and downloadable resources
- add analytics/event pipelines later only when justified

---

## 13. Cost-Conscious Initial Deployment Strategy

## 13.1 Goals
- keep monthly costs low before revenue
- avoid unnecessary infrastructure
- preserve ability to scale

## 13.2 Initial Low-Cost Setup
Recommended initial configuration:
- Next.js app on Vercel hobby / low-cost plan
- Supabase starter tier only when needed
- Paddle only incurs cost when transactions occur
- Cloudflare free plan for DNS/CDN basic protection
- transactional email on low-volume tier
- Sentry free tier

## 13.3 What Not to Add Initially
Do not add at first unless needed:
- Kubernetes
- microservices
- custom event buses
- multi-region infrastructure
- dedicated Redis layer
- separate analytics warehouse
- native mobile apps before product-market fit

## 13.4 Scale-Up Triggers
Upgrade components only when metrics justify it, such as:
- export queue latency increases materially
- database limits are regularly approached
- users require more reporting / data retention
- usage volume makes background compute separation worthwhile

---

## 14. Export Architecture Requirements

## 14.1 Preview vs Premium Export
The system should distinguish between:
- **preview rendering** (fast, potentially client-assisted)
- **premium export rendering** (server-authoritative, metered, protected)

## 14.2 Export Job Flow
1. User requests export.
2. Server validates entitlement.
3. Export job record is created.
4. Rendering executes in server/background environment.
5. Output PDF is stored.
6. Job status is updated.
7. User downloads PDF.

## 14.3 Why This Matters
This protects:
- premium value
- usage metering
- output quality consistency
- source code and business logic boundaries

---

## 15. Billing and Entitlement Requirements

## 15.1 Paddle Integration Requirements
- hosted checkout or embedded checkout support
- customer portal / subscription management access
- subscription create/update/cancel handling via webhooks
- trial support later if desired
- plan upgrades/downgrades

## 15.2 Entitlement Model
The app should derive entitlements from the subscription state stored internally after webhook confirmation.

### Example entitlements
- free_exports_per_month
- max_saved_templates
- max_students
- premium_summary_access
- branded_export_access
- studio_reporting_access

---

## 16. UI/UX Requirements

### 16.1 Design Priorities
- extremely simple and fast workflow
- minimal friction from login to packet creation
- clear progressive disclosure of advanced options
- attractive printable outputs
- mobile-responsive web UI, even before native app exists

### 16.2 Key Screens
- landing page
- sign up / sign in
- dashboard
- packet builder
- saved templates
- students list
- student detail page
- assignments page
- progress dashboard
- billing/settings page

### 16.3 Builder UX Requirements
- preset-first UX
- expert options hidden behind “Advanced” controls
- fast preview feedback
- one-click duplicate/regenerate actions
- easy student assignment from worksheet creation flow

---

## 17. Development Phases

## Phase 0 — Foundation Refactor
### Goals
- preserve current generator core
- separate generator logic from presentation
- create a private commercial repo or app workspace

### Deliverables
- extracted generator core module
- TypeScript typing around config objects
- validation schemas for packet configs
- improved internal code organization

---

## Phase 1 — SaaS MVP
### Goals
- ship a minimal paid-capable product

### Features
- auth
- dashboard
- saved templates
- packet generation
- worksheet metadata
- PDF export
- basic billing

### Outcome
A user can pay, sign in, create technique packets, save them, and export them.

---

## Phase 2 — Teacher Workflow Layer
### Features
- student profiles
- assignment history
- teacher notes
- duplicate prior assignments
- student-specific packet reuse

### Outcome
The app becomes useful as a repeat teacher workflow tool.

---

## Phase 3 — Progress and Reporting
### Features
- practice logs
- progress summaries
- completion trends
- summary dashboards
- self-learner mode improvements

### Outcome
The app becomes sticky and retention improves.

---

## Phase 4 — Studio Features
### Features
- studio branding
- more students and templates
- advanced reports
- bulk workflows
- stronger admin/support tooling

### Outcome
Higher-value plans become justified.

---

## Phase 5 — Growth / Platform Extensions
### Features
- audio preview and MIDI export
- MusicXML support
- exam-board packs
- additional technique systems
- optional mobile apps
- additional instruments later

---

## 18. Deployment Phases

## Phase A — Prototype/Internal Alpha
- private deployment
- auth enabled
- no public billing yet
- test with personal usage and a few trusted teachers

## Phase B — Paid Beta
- Paddle enabled
- limited public signup
- capped plans
- collect qualitative feedback and billing friction data

## Phase C — Public Launch
- marketing site polished
- production support workflows in place
- summaries and teacher workflows at reasonable maturity

## Phase D — Scale Optimization
- queue/backfill improvements
- dedicated export worker separation if needed
- cost optimization and caching

---

## 19. Repository and Code Organization Recommendation

Recommended structure:

```text
/apps
  /web                 # Next.js SaaS app
/packages
  /generator-core      # shared technique generation logic
  /render-core         # Typst/scorify orchestration
  /ui                  # optional shared UI library
/infrastructure
  /supabase            # migrations, SQL, RLS, functions
/docs                  # product and architecture docs
```

### Notes
- Keep the commercial app private.
- Optionally leave non-commercial or demo pieces public.
- Avoid keeping premium logic only in browser code.

---

## 20. Testing Requirements

### Unit Tests
- config generation
- template persistence rules
- entitlement calculations
- summary generation logic

### Integration Tests
- auth flows
- billing webhook flows
- export job flows
- student assignment flows

### End-to-End Tests
- user sign-up to export
- teacher creates student and assigns worksheet
- subscription change affects entitlements correctly

---

## 21. Analytics Requirements

Track at minimum:
- signups
- template saves
- export requests
- successful exports
- student creation events
- assignment creation events
- retention / weekly active use
- upgrade conversion events

These should be privacy-conscious and minimal at first.

---

## 22. Mobile Readiness Requirements

The architecture should remain mobile-friendly by:
- keeping business logic server-accessible via clean APIs/actions
- centralizing auth and account data in Supabase
- centralizing billing state in backend records
- avoiding browser-only assumptions in core domain logic

This makes a future mobile app much easier because the mobile client can consume the same backend data and entitlement model.

---

## 23. Recommended Initial Scope Cut

To ship faster, the first commercial release should exclude:
- advanced collaborative studio accounts
- heavy analytics dashboards
- AI-generated pedagogy recommendations
- multi-instrument support
- native mobile app
- complex community/social features

Focus instead on:
- packet generation
- saved templates
- student association
- export
- billing
- basic progress tracking

---

## 24. Success Metrics

### Product Metrics
- time to first packet
- exports per active user
- templates saved per active teacher
- weekly retention
- number of students created per paying teacher

### Business Metrics
- free-to-paid conversion
- churn rate
- average revenue per paying user
- support burden per 100 customers
- infrastructure cost as a percentage of revenue

---

## 25. Final Recommendation

The correct path is to preserve the current project’s fast Typst-driven generation core while rebuilding the commercial product around it as a private, account-backed SaaS.

The best initial stack for that is:
- **Next.js** for the application shell
- **Supabase** for app data, auth, and storage
- **Paddle** for payments and tax/compliance handling
- **Cloudflare + Vercel** for practical low-cost delivery and scaling

This provides a low-cost starting point, a clean growth path, and a strong separation between the visible frontend experience and the protected premium business logic that will actually justify subscription fees.
