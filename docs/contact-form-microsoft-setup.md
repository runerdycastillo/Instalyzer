# Microsoft Contact Form Setup

This document wires the Instalyzer contact form to Microsoft 365 / Outlook by using Microsoft Graph app-only mail send.

Relevant app files:

- `instalyzer-next/app/api/contact/route.ts`
- `instalyzer-next/lib/contact/support-mail.ts`
- `instalyzer-next/.env.example`

## What This Setup Uses

- Microsoft Entra app registration
- Microsoft Graph application permission: `Mail.Send`
- OAuth 2.0 client credentials flow
- `POST /users/{userPrincipalName}/sendMail`

The app already posts form submissions to `/api/contact`. Once the env vars below are configured, the backend will acquire a Graph access token and send the support email into your mailbox.

## Before You Start

You should confirm:

- `support@instalyzer.app` is a real Microsoft 365 mailbox or alias you can send from
- you have access to Microsoft Entra admin / Azure app registrations
- you can grant admin consent for Graph application permissions

## Portal Steps

### 1. Register the app

In Microsoft Entra admin center:

1. Go to `App registrations`
2. Select `New registration`
3. Name it something like `instalyzer-contact-form`
4. Leave this as a single-tenant app unless you have a real reason to widen it
5. Create the app

Record these values from the Overview page:

- `Application (client) ID`
- `Directory (tenant) ID`

## 2. Add Graph mail permission

In the app registration:

1. Open `API permissions`
2. Select `Add a permission`
3. Choose `Microsoft Graph`
4. Choose `Application permissions`
5. Add `Mail.Send`
6. Select `Grant admin consent`

Important:

- this app uses application permissions, not delegated sign-in
- the code is using the client credentials flow, so admin consent is required

## 3. Create a client secret

In the app registration:

1. Open `Certificates & secrets`
2. Create `New client secret`
3. Copy the **Value** immediately

Use that secret value in your local env file. Microsoft only shows it once.

## 4. Confirm the sender mailbox

Decide which mailbox Graph should send as:

- usually `support@instalyzer.app`

This mailbox/UPN goes into:

- `MICROSOFT_GRAPH_SENDER_USER`

If you want the same mailbox to also receive the submitted messages, use the same address for:

- `CONTACT_SUPPORT_TO`

## Local Env Mapping

Create `instalyzer-next/.env.local` and add:

```env
MICROSOFT_GRAPH_TENANT_ID=your-tenant-id
MICROSOFT_GRAPH_CLIENT_ID=your-client-id
MICROSOFT_GRAPH_CLIENT_SECRET=your-client-secret-value
MICROSOFT_GRAPH_SENDER_USER=support@instalyzer.app
CONTACT_SUPPORT_TO=support@instalyzer.app
CONTACT_SUPPORT_SUBJECT_PREFIX=[Instalyzer Contact]
```

Recommended first pass:

- set both sender and recipient to `support@instalyzer.app`
- keep the existing subject prefix

## Restart And Test

After `.env.local` is saved:

1. restart the Next dev server
2. open `/contact`
3. submit a real test message
4. confirm:
   - the API no longer returns the “not fully configured” message
   - the message arrives in the mailbox
   - the reply-to address is the email entered in the form

## Troubleshooting

### “The contact form is not fully configured yet”

At least one required env var is missing:

- `MICROSOFT_GRAPH_TENANT_ID`
- `MICROSOFT_GRAPH_CLIENT_ID`
- `MICROSOFT_GRAPH_CLIENT_SECRET`
- `MICROSOFT_GRAPH_SENDER_USER`

### Graph token request fails

Usually one of these:

- wrong tenant ID
- wrong client ID
- wrong client secret value
- app secret expired

### Graph sendMail fails

Usually one of these:

- `Mail.Send` application permission was not granted
- admin consent was not granted
- `MICROSOFT_GRAPH_SENDER_USER` is not a valid mailbox / user principal name
- the mailbox cannot be used by the app under the current tenant setup

## Current Dev Behavior

The contact route no longer rate-limits local development traffic.

In production, the lightweight rate limit remains active.
