"use client";

import { LoaderCircle, SendHorizonal } from "lucide-react";
import { useState, type FormEvent } from "react";
import {
  CONTACT_SUPPORT_CONTEXT_MAX_LENGTH,
  CONTACT_SUPPORT_EMAIL_MAX_LENGTH,
  CONTACT_SUPPORT_MESSAGE_MAX_LENGTH,
  CONTACT_SUPPORT_SUBJECT_MAX_LENGTH,
  type ContactSupportCategory,
} from "@/lib/contact/contact-support";

type SubmissionState =
  | { status: "idle"; message: string }
  | { status: "success"; message: string }
  | { status: "error"; message: string };

const initialSubmissionState: SubmissionState = {
  status: "idle",
  message: "",
};

const initialFormState = {
  email: "",
  category: "other" as ContactSupportCategory,
  subject: "",
  context: "",
  message: "",
  website: "",
};

export function ContactSupportForm() {
  const [formState, setFormState] = useState(initialFormState);
  const [submissionState, setSubmissionState] = useState(initialSubmissionState);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function updateField<K extends keyof typeof initialFormState>(
    key: K,
    value: (typeof initialFormState)[K],
  ) {
    setFormState((current) => ({
      ...current,
      [key]: value,
    }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setSubmissionState(initialSubmissionState);

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formState),
      });

      const payload = (await response.json().catch(() => null)) as
        | {
            message?: string;
          }
        | null;

      if (!response.ok) {
        setSubmissionState({
          status: "error",
          message:
            payload?.message ||
            "We could not send your message just now. Please try again or use the support inbox below.",
        });
        return;
      }

      setFormState(initialFormState);
      setSubmissionState({
        status: "success",
        message:
          payload?.message ||
          "your message was sent. we'll reply to your email soon.",
      });
    } catch {
      setSubmissionState({
        status: "error",
        message:
          "We could not reach the support route just now. Please try again or use the support inbox below.",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="contact-support-form" onSubmit={handleSubmit}>
      <div className="contact-support-form__intro">
        <p>
          Send your question here and we&apos;ll reply to the email you include below.
        </p>
      </div>

      <div className="contact-support-form__grid">
        <label className="contact-support-form__field">
          <span className="contact-support-form__label">email</span>
          <input
            type="email"
            className="contact-support-form__input"
            value={formState.email}
            onChange={(event) => updateField("email", event.target.value)}
            maxLength={CONTACT_SUPPORT_EMAIL_MAX_LENGTH}
            autoComplete="email"
            required
          />
        </label>

        <label className="contact-support-form__field">
          <span className="contact-support-form__label">subject</span>
          <input
            type="text"
            className="contact-support-form__input"
            value={formState.subject}
            onChange={(event) => updateField("subject", event.target.value)}
            maxLength={CONTACT_SUPPORT_SUBJECT_MAX_LENGTH}
            autoComplete="off"
            required
          />
        </label>

        <label className="contact-support-form__field contact-support-form__field--full">
          <span className="contact-support-form__label">page or tool</span>
          <input
            type="text"
            className="contact-support-form__input"
            value={formState.context}
            onChange={(event) => updateField("context", event.target.value)}
            maxLength={CONTACT_SUPPORT_CONTEXT_MAX_LENGTH}
            autoComplete="off"
            placeholder="for example: contact page, export upload, not following back"
          />
        </label>

        <label
          className="contact-support-form__field contact-support-form__field--hidden"
          aria-hidden="true"
        >
          <span className="contact-support-form__label">website</span>
          <input
            type="text"
            tabIndex={-1}
            autoComplete="off"
            className="contact-support-form__input"
            value={formState.website}
            onChange={(event) => updateField("website", event.target.value)}
          />
        </label>

        <label className="contact-support-form__field contact-support-form__field--full">
          <span className="contact-support-form__label">message</span>
          <textarea
            className="contact-support-form__input contact-support-form__textarea"
            value={formState.message}
            onChange={(event) => updateField("message", event.target.value)}
            maxLength={CONTACT_SUPPORT_MESSAGE_MAX_LENGTH}
            rows={8}
            required
          />
        </label>
      </div>

      <div className="contact-support-form__footer">
        <div className="contact-support-form__submit-row">
          {submissionState.status !== "idle" ? (
            <p
              className={`contact-support-form__status contact-support-form__status--${submissionState.status}`}
              role={submissionState.status === "error" ? "alert" : "status"}
            >
              {submissionState.message}
            </p>
          ) : null}

          <button
            type="submit"
            className="hero-btn hero-btn-primary contact-support-form__submit"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                sending
                <LoaderCircle
                  size={16}
                  aria-hidden="true"
                  className="contact-support-form__spinner"
                />
              </>
            ) : (
              <>
                send
                <SendHorizonal size={16} aria-hidden="true" />
              </>
            )}
          </button>
        </div>
      </div>
    </form>
  );
}
