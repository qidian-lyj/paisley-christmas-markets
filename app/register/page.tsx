"use client";

import Link from "next/link";
import { useActionState } from "react";
import { signUpAction, type AuthFormState } from "@/lib/auth-actions";
import { errorClass, inputClass, labelClass } from "@/components/form-controls";

export default function RegisterPage() {
  const [state, formAction, pending] = useActionState<AuthFormState, FormData>(
    signUpAction,
    null
  );

  return (
    <div className="mx-auto w-full max-w-sm px-4 py-20">
      <h1 className="font-display text-3xl">Create an account</h1>
      <p className="mt-2 text-sm text-ink/70">
        Trader accounts let you apply for stalls and track decisions.
      </p>

      <form action={formAction} className="mt-8 space-y-5">
        {state?.error && (
          <p role="alert" className={errorClass}>
            {state.error}
          </p>
        )}
        {state?.message && (
          <p
            role="status"
            className="rounded-md border border-pine-700/40 bg-pine-700/10 px-4 py-3 text-sm text-pine-800"
          >
            {state.message}
          </p>
        )}

        <div>
          <label htmlFor="full_name" className={labelClass}>
            Full name
          </label>
          <input
            id="full_name"
            name="full_name"
            type="text"
            required
            autoComplete="name"
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="email" className={labelClass}>
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="password" className={labelClass}>
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            className={inputClass}
          />
          <p className="mt-1.5 text-xs text-ink/55">
            At least 8 characters.
          </p>
        </div>

        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-md bg-berry-600 px-5 py-2.5 text-sm font-medium text-paper transition-colors hover:bg-berry-700 disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-berry-600"
        >
          {pending ? "Creating account…" : "Create account"}
        </button>
      </form>

      <p className="mt-6 text-sm text-ink/70">
        Already have an account?{" "}
        <Link
          href="/login"
          className="text-berry-700 underline underline-offset-2"
        >
          Log in
        </Link>
      </p>
    </div>
  );
}
