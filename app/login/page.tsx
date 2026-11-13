"use client";

import Link from "next/link";
import { useActionState } from "react";
import { signInAction, type AuthFormState } from "@/lib/auth-actions";
import { errorClass, inputClass, labelClass } from "@/components/form-controls";

export default function LoginPage() {
  const [state, formAction, pending] = useActionState<AuthFormState, FormData>(
    signInAction,
    null
  );

  return (
    <div className="mx-auto w-full max-w-sm px-4 py-20">
      <h1 className="font-display text-3xl">Welcome back</h1>
      <p className="mt-2 text-sm text-ink/70">
        Log in to track your stall application.
      </p>

      <form action={formAction} className="mt-8 space-y-5">
        {state?.error && (
          <p role="alert" className={errorClass}>
            {state.error}
          </p>
        )}

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
            autoComplete="current-password"
            className={inputClass}
          />
        </div>

        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-md bg-berry-600 px-5 py-2.5 text-sm font-medium text-paper transition-colors hover:bg-berry-700 disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-berry-600"
        >
          {pending ? "Logging in…" : "Log in"}
        </button>
      </form>

      <p className="mt-6 text-sm text-ink/70">
        New trader?{" "}
        <Link
          href="/register"
          className="text-berry-700 underline underline-offset-2"
        >
          Create an account
        </Link>
      </p>
    </div>
  );
}
