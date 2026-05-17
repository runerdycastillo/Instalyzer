# Tier 2 / Hard Launch Plan

## Purpose

Use this document to remember what belongs after the current soft launch.

Current soft launch should stay focused on:

- one strong free workflow
- desktop workspace gate and desktop-link handoff
- internal email capture for desktop-link requests
- browser-local datasets
- real support inbox and contact form
- no paid-plan promises that the product cannot fulfill yet

Tier 2 / hard launch is the next major product stage where Instalyzer starts becoming a paid SaaS instead of only a free soft-launch tool.

## Working Definition

Tier 2 / hard launch means:

- public launch is more realistic
- the first paid tier is live or about to go live
- email capture moves beyond internal notification emails
- accounts, storage, billing, and paid-tool access are no longer deferred
- legal/support copy is updated to match real paid usage

## What Stays In Soft Launch

Keep these simple for now:

- desktop-link request capture as an internal email to the support inbox
- marketing opt-in marked clearly but not yet sent into a marketing automation system
- datasets stored locally in the browser
- one live tool: `Not Following Back`
- future tools shown as coming soon only when useful for product direction
- pricing hidden or framed carefully until payment is real

Important rule:

- unchecked desktop-link emails are transactional/support records only, not marketing leads.

## Tier 2 Build Scope

### 1. First Paid Tier

Goal:

- introduce the first real paid plan after the free soft-launch workflow is stable.

Likely starting shape:

- Free: `Not Following Back` and the core dataset import/workspace flow
- Basic or Pro: first paid creator-insight unlock
- Premium: later, broader reporting and deeper tools

Open decisions:

- whether the first paid tier is called `Basic`, `Pro`, or something else
- monthly price
- usage limits
- whether free users can create multiple datasets
- whether paid users unlock additional tools, export history, comparison, reports, or all of the above

### 2. Billing And Access Control

Tier 2 needs:

- auth/sign up/sign in
- account-owned datasets
- billing provider selection
- checkout flow
- plan status in the app
- server-side entitlement checks for paid features
- billing/account support category

Likely provider options:

- Stripe
- Lemon Squeezy
- Paddle

Decision rule:

- pick the provider that gets the first paid tier live with the least custom billing code.

### 3. Real Lead And Opt-In Storage

Soft launch capture can use internal email notifications.

Tier 2 should add durable storage for:

- email
- requested desktop URL
- device range
- source
- referrer
- UTM values
- marketing opt-in
- created timestamp
- follow-up status if needed

Recommended direction:

- database table as source of truth
- optional email marketing/contact integration only for opted-in users
- keep transactional desktop-link requests separate from marketing consent

### 4. Persistent Dataset Storage

Tier 2 should replace browser-only persistence for paying users.

Needed pieces:

- backend dataset records
- user ownership model
- upload/import status
- dataset metadata
- parsed relationship records
- parsed insight summaries
- saved tool outputs or report snapshots later

Soft-launch localStorage can remain useful for unauthenticated/free trial behavior, but it should not be the long-term paid storage model.

### 5. Tool Expansion

Most realistic paid-tool sequence:

1. Audience Insights
2. Reach / Visibility Summary
3. Content Interaction Summary
4. Mutuals / Relationship Analysis
5. Story Engagement Breakdown
6. Posting Pattern / Activity Guidance
7. richer combined reports later

Packaging rule:

- do not promise a tool until the export parser and product wording can support it honestly.

Likely paid unlock:

- Basic or Pro should feel like the first real creator-insight unlock, not just a second relationship utility.

### 6. Parser And Data Confidence

Before paid launch, parser work should be stronger around:

- insight summary files
- relationship completeness checks
- export request metadata
- account timeline bounds
- missing or partial export messaging
- corrupted ZIP and wrong-format handling
- test fixtures from realistic exports

Paid tools should be backed by clear data confidence labels where needed.

### 7. Legal, Privacy, And Support Pass

When payment becomes real, update:

- Terms of Service
- Privacy Policy
- Data Deletion Request page
- contact/support copy
- pricing copy
- billing/refund language
- account deletion/data deletion flow expectations

Support should also cover:

- billing help
- account access
- failed payment
- dataset import problems
- paid-feature access issues

### 8. Email Brand Trust

Hard launch should make support and auth emails feel fully branded and trustworthy.

Needed pieces:

- keep `support@instalyzer.app` as the visible sender/reply-to identity
- confirm SPF, DKIM, and DMARC are passing for Firebase/Auth emails
- move DMARC toward an enforcement policy when the domain is ready
- set up BIMI so Gmail and other supported inboxes can show the Instalyzer logo instead of the default sender initial
- prepare the compliant BIMI logo asset and required DNS record
- decide whether a VMC/CMC certificate is needed for the inboxes we care about most
- verify real password reset and support email appearance in Gmail, Outlook, and Apple Mail before public launch

Soft-launch note:

- the default sender initial is acceptable for now as long as `mailed-by`, `signed-by`, sender, and reply-to all point to `instalyzer.app`

### 9. Product QA Before Hard Launch

Run a deliberate QA pass across:

- homepage
- help
- contact
- privacy/terms/deletion
- dataset creation
- datasets index
- dataset workspace
- live tools
- billing and checkout
- account settings
- desktop-link gate
- email capture and opt-in behavior

Paid launch should not happen until the main paid flow can be tested end to end.

## Do Not Do Too Early

Avoid doing these during the current soft-launch gate/capture phase:

- full billing implementation
- paid-plan legal rewrites
- marketing automation integration before consent storage is clear
- broad tool promises
- heavy backend dashboard/admin work
- advanced AI recommendations

These belong after the current core flow, gate, capture, and responsive polish are stable.

## Next Review Point

Revisit this document when one of these becomes true:

- desktop-link capture is implemented and stable
- tablet/mobile gate QA is done
- parser extraction is the active focus again
- the first paid tier name and pricing are being decided
- auth/accounts become the next major build phase
