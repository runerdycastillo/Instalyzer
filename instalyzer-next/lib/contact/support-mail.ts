import type { ContactSupportCategory } from "@/lib/contact/contact-support";

export type ContactSupportSubmission = {
  name: string;
  email: string;
  category: ContactSupportCategory;
  subject: string;
  message: string;
  context: string;
  submittedAt: string;
  userAgent: string;
  ipAddress: string;
};

export class SupportMailConfigError extends Error {}

function getEnvValue(name: string) {
  return String(process.env[name] || "").trim();
}

function getRequiredEnvValue(name: string) {
  const value = getEnvValue(name);
  if (!value) {
    throw new SupportMailConfigError(`Missing required support email config: ${name}`);
  }
  return value;
}

function buildRecipientList(input: string) {
  return input
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean)
    .map((address) => ({
      emailAddress: {
        address,
      },
    }));
}

function buildSupportMessageBody(submission: ContactSupportSubmission) {
  const submittedAt = new Date(submission.submittedAt);
  const submittedAtLabel = Number.isNaN(submittedAt.getTime())
    ? submission.submittedAt
    : submittedAt.toLocaleString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
        timeZoneName: "short",
      });
  const browserSummary = submission.userAgent.includes("Chrome")
    ? "chrome"
    : submission.userAgent.includes("Firefox")
      ? "firefox"
      : submission.userAgent.includes("Safari")
        ? "safari"
        : submission.userAgent.includes("Edge")
          ? "edge"
          : "browser not detected";
  const lines = [
    "new support message from instalyzer.app",
    "",
    "from:",
    submission.email,
    "",
    "page or tool:",
    submission.context || "not provided",
    "",
    "subject:",
    submission.subject || "not provided",
  ];

  lines.push("", "message:", submission.message);
  lines.push("", "---", `submitted: ${submittedAtLabel}`, `browser: ${browserSummary}`);

  return lines.join("\n");
}

async function getMicrosoftGraphAccessToken() {
  const tenantId = getRequiredEnvValue("MICROSOFT_GRAPH_TENANT_ID");
  const clientId = getRequiredEnvValue("MICROSOFT_GRAPH_CLIENT_ID");
  const clientSecret = getRequiredEnvValue("MICROSOFT_GRAPH_CLIENT_SECRET");
  const tokenEndpoint = `https://login.microsoftonline.com/${encodeURIComponent(
    tenantId,
  )}/oauth2/v2.0/token`;

  const response = await fetch(tokenEndpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      scope: "https://graph.microsoft.com/.default",
      grant_type: "client_credentials",
    }),
  });

  if (!response.ok) {
    throw new Error(`Microsoft token request failed with status ${response.status}`);
  }

  const payload = (await response.json()) as {
    access_token?: string;
  };

  if (!payload.access_token) {
    throw new Error("Microsoft token response did not include an access token.");
  }

  return payload.access_token;
}

export async function sendSupportEmail(submission: ContactSupportSubmission) {
  const senderUser = getRequiredEnvValue("MICROSOFT_GRAPH_SENDER_USER");
  const recipientList = buildRecipientList(getEnvValue("CONTACT_SUPPORT_TO") || senderUser);
  const subjectPrefix = getEnvValue("CONTACT_SUPPORT_SUBJECT_PREFIX") || "[Instalyzer Contact]";
  const accessToken = await getMicrosoftGraphAccessToken();
  const response = await fetch(
    `https://graph.microsoft.com/v1.0/users/${encodeURIComponent(senderUser)}/sendMail`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: {
          subject: `${subjectPrefix} ${submission.subject}`,
          body: {
            contentType: "Text",
            content: buildSupportMessageBody(submission),
          },
          toRecipients: recipientList,
          replyTo: [
            {
              emailAddress: {
                address: submission.email,
                name: submission.name,
              },
            },
          ],
        },
        saveToSentItems: true,
      }),
    },
  );

  if (!response.ok) {
    const details = await response.text();
    throw new Error(
      `Microsoft Graph sendMail failed with status ${response.status}: ${details || "no details returned"}`,
    );
  }
}
