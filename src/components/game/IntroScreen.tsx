'use client';

import { useState, type FormEvent } from 'react';

export interface IntroSubmission {
  fullName: string;
  email: string;
  marketingConsent: boolean;
}

interface IntroScreenProps {
  onSubmit: (data: IntroSubmission) => void;
  initialData?: { fullName?: string; email?: string; marketingConsent?: boolean };
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function IntroScreen({ onSubmit, initialData }: IntroScreenProps) {
  const [fullName, setFullName] = useState(initialData?.fullName ?? '');
  const [email, setEmail] = useState(initialData?.email ?? '');
  const [marketingConsent, setMarketingConsent] = useState(initialData?.marketingConsent ?? false);
  const [emailTouched, setEmailTouched] = useState(false);

  const trimmedName = fullName.trim();
  const trimmedEmail = email.trim();
  const isValid = trimmedName.length > 0 && EMAIL_RE.test(trimmedEmail);

  const emailError =
    emailTouched && trimmedEmail.length > 0 && !EMAIL_RE.test(trimmedEmail)
      ? "That doesn't look like a valid email address."
      : null;

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!isValid) {
      setEmailTouched(true);
      return;
    }
    onSubmit({
      fullName: trimmedName,
      email: trimmedEmail,
      marketingConsent,
    });
  };

  return (
    <div
      className="flex h-full w-full flex-col bg-paper-canvas text-paper-text-primary antialiased"
      style={{ fontFamily: 'var(--font-display)' }}
    >
      <header className="flex flex-shrink-0 items-center justify-between px-8 py-[18px]">
        <div className="flex items-center gap-2.5">
          <div className="flex h-[22px] w-[22px] items-center justify-center rounded-[5px] bg-accent text-[11px] font-extrabold tracking-[-0.04em] text-white">
            N
          </div>
          <div className="text-[13px] font-semibold tracking-[-0.005em]">Not This Cycle</div>
        </div>
        <div className="inline-flex items-center gap-1.5 rounded-full border border-paper-border-subtle bg-paper-elevated px-2.5 py-1 text-[11px] font-medium text-paper-text-secondary">
          <span className="h-1.5 w-1.5 rounded-full bg-presence-online" />
          Live demo
        </div>
      </header>

      <main className="flex flex-1 items-center justify-center px-8 pb-12">
        <div className="flex w-full max-w-[480px] flex-col gap-7">
          <div>
            <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.1em] text-accent">
              <span className="h-[5px] w-[5px] rotate-45 bg-accent" />
              A 5-minute simulation
            </span>
          </div>

          <h1 className="text-[38px] font-bold leading-[1.1] tracking-[-0.025em] text-paper-text-primary">
            Welcome to your next role.
          </h1>

          <p className="max-w-[44ch] text-base leading-[1.65] text-paper-text-secondary">
            You&apos;re being hired as a Product Manager at a fast-growing tech company.
            Receive escalating pings, make calls under ambiguity, and finish with{' '}
            <strong className="font-semibold text-paper-text-primary">
              the kind of performance review we all love receiving
            </strong>
            .
          </p>

          <form onSubmit={handleSubmit} className="mt-1 flex flex-col gap-4" noValidate>
            <div className="flex flex-col gap-[7px]">
              <label
                htmlFor="intro-name"
                className="text-[11px] font-bold uppercase tracking-[0.06em] text-paper-text-tertiary"
              >
                Your Full Name
              </label>
              <input
                id="intro-name"
                type="text"
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
                placeholder="What should your manager call you?"
                autoComplete="name"
                autoFocus
                maxLength={80}
                className="w-full rounded-lg border border-paper-border-default bg-paper-elevated px-3.5 py-3 text-[14.5px] leading-[1.4] text-paper-text-primary outline-none transition-colors placeholder:text-paper-text-quaternary focus:border-accent"
                style={{
                  boxShadow: 'none',
                }}
                onFocus={(event) => {
                  event.currentTarget.style.boxShadow = '0 0 0 3px var(--color-accent-soft)';
                }}
                onBlur={(event) => {
                  event.currentTarget.style.boxShadow = 'none';
                }}
              />
            </div>

            <div className="flex flex-col gap-[7px]">
              <label
                htmlFor="intro-email"
                className="text-[11px] font-bold uppercase tracking-[0.06em] text-paper-text-tertiary"
              >
                Email
              </label>
              <input
                id="intro-email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@work.com"
                autoComplete="email"
                inputMode="email"
                aria-invalid={emailError ? 'true' : undefined}
                aria-describedby={emailError ? 'intro-email-error' : undefined}
                className={`w-full rounded-lg border bg-paper-elevated px-3.5 py-3 text-[14.5px] leading-[1.4] text-paper-text-primary outline-none transition-colors placeholder:text-paper-text-quaternary ${
                  emailError ? 'border-concern focus:border-concern' : 'border-paper-border-default focus:border-accent'
                }`}
                onFocus={(event) => {
                  event.currentTarget.style.boxShadow = emailError
                    ? '0 0 0 3px var(--color-concern-soft)'
                    : '0 0 0 3px var(--color-accent-soft)';
                }}
                onBlur={(event) => {
                  event.currentTarget.style.boxShadow = 'none';
                  setEmailTouched(true);
                }}
              />
              {emailError && (
                <p
                  id="intro-email-error"
                  role="alert"
                  className="text-[12px] leading-[1.45] text-concern"
                >
                  {emailError}
                </p>
              )}
            </div>

            <label className="mt-1 flex cursor-pointer items-start gap-3">
              <input
                type="checkbox"
                checked={marketingConsent}
                onChange={(event) => setMarketingConsent(event.target.checked)}
                className="mt-[3px] h-4 w-4 cursor-pointer rounded border border-paper-border-default"
                style={{ accentColor: 'var(--color-accent)' }}
              />
              <span className="text-[12.5px] leading-[1.55] text-paper-text-secondary">
                Send me occasional emails about new scenarios. No spam, unsubscribe anytime.
              </span>
            </label>

            <button
              type="submit"
              disabled={!isValid}
              className="mt-2 inline-flex w-full cursor-pointer items-center justify-center gap-2.5 rounded-lg border-0 bg-accent px-6 py-3.5 text-[14.5px] font-bold tracking-[-0.005em] text-white transition-colors hover:bg-accent-strong disabled:cursor-not-allowed disabled:opacity-50"
            >
              Get my offer
              <svg
                width="14"
                height="14"
                viewBox="0 0 14 14"
                fill="none"
                aria-hidden
                className="transition-transform group-hover:translate-x-0.5"
              >
                <path
                  d="M3 7h8m0 0L7.5 3.5M11 7l-3.5 3.5"
                  stroke="currentColor"
                  strokeWidth="1.7"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </form>
        </div>
      </main>

      <footer className="flex flex-shrink-0 items-center justify-between px-8 py-[18px] text-[11.5px] text-paper-text-tertiary">
        <div className="flex items-center gap-3">
          <span>Designed for desktop</span>
          <span className="h-[3px] w-[3px] rounded-full bg-paper-text-quaternary" />
          <span>Sound optional</span>
          <span className="h-[3px] w-[3px] rounded-full bg-paper-text-quaternary" />
          <span>Best on a slow afternoon</span>
        </div>
      </footer>
    </div>
  );
}
