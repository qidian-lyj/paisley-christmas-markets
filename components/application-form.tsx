"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import {
  submitApplicationAction,
  type ApplicationFormState,
} from "@/app/apply/actions";
import { CATEGORY_LABELS, TRADER_CATEGORIES } from "@/lib/types";
import { createClient } from "@/lib/supabase/client";
import { errorClass, inputClass, labelClass } from "@/components/form-controls";

export function ApplicationForm() {
  const [state, formAction, pending] = useActionState<
    ApplicationFormState,
    FormData
  >(submitApplicationAction, null);

  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [photoUploading, setPhotoUploading] = useState(false);
  const [photoError, setPhotoError] = useState<string | null>(null);

  async function handlePhotoChange(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setPhotoError("Please choose an image file (JPG, PNG or WebP).");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setPhotoError("Images must be 5 MB or smaller.");
      return;
    }
    setPhotoUploading(true);
    setPhotoError(null);
    setPhotoUrl(null);
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setPhotoError("Session expired — please log in again.");
        return;
      }
      const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
      const path = `${user.id}/${Date.now()}.${ext}`;
      const { error } = await supabase.storage
        .from("application-photos")
        .upload(path, file, { contentType: file.type });
      if (error) throw error;
      const { data } = supabase.storage
        .from("application-photos")
        .getPublicUrl(path);
      setPhotoUrl(data.publicUrl);
    } catch {
      setPhotoError("Upload failed — please try again.");
    } finally {
      setPhotoUploading(false);
    }
  }

  if (state?.success) {
    return (
      <div className="max-w-2xl border-t-2 border-gold-400 pt-8">
        <h2 className="font-display text-2xl">Application received</h2>
        <p className="mt-3 leading-relaxed text-ink/75">
          Thank you — the market team reviews applications within five working
          days. You can follow the decision from your account page.
        </p>
        <Link
          href="/account"
          className="mt-6 inline-block rounded-md bg-pine-700 px-5 py-2.5 text-sm font-medium text-paper transition-colors hover:bg-pine-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pine-700"
        >
          View my applications
        </Link>
      </div>
    );
  }

  return (
    <form action={formAction} className="max-w-2xl space-y-6">
      {state?.error && (
        <p role="alert" className={errorClass}>
          {state.error}
        </p>
      )}

      <div className="grid gap-6 sm:grid-cols-2">
        <div>
          <label htmlFor="business_name" className={labelClass}>
            Business name
          </label>
          <input
            id="business_name"
            name="business_name"
            type="text"
            required
            maxLength={80}
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="contact_name" className={labelClass}>
            Contact name
          </label>
          <input
            id="contact_name"
            name="contact_name"
            type="text"
            required
            maxLength={80}
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
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="phone" className={labelClass}>
            Phone{" "}
            <span className="font-normal text-ink/50">(optional)</span>
          </label>
          <input id="phone" name="phone" type="tel" className={inputClass} />
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="category" className={labelClass}>
            Stall category
          </label>
          <select
            id="category"
            name="category"
            required
            defaultValue=""
            className={inputClass}
          >
            <option value="" disabled>
              Choose a category
            </option>
            {TRADER_CATEGORIES.map((category) => (
              <option key={category} value={category}>
                {CATEGORY_LABELS[category]}
              </option>
            ))}
          </select>
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="price_info" className={labelClass}>
            Typical pricing{" "}
            <span className="font-normal text-ink/50">(optional)</span>
          </label>
          <input
            id="price_info"
            name="price_info"
            type="text"
            maxLength={60}
            placeholder="e.g. £3 – £8 per item, or Adults £5, children £3"
            className={inputClass}
          />
          <p className="mt-1.5 text-xs text-ink/55">
            Shown on your public stall listing once approved.
          </p>
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="photo" className={labelClass}>
            Stall photo
          </label>
          <div className="mt-1.5 flex items-center gap-3">
            <label
              htmlFor="photo"
              className="cursor-pointer rounded-md bg-pine-700 px-3 py-2 text-sm font-medium text-paper transition-colors hover:bg-pine-800"
            >
              Choose photo
            </label>
            <span className="text-xs text-ink/55">JPG, PNG or WebP — up to 5 MB</span>
          </div>
          <input
            id="photo"
            name="photo"
            type="file"
            accept="image/*"
            className="sr-only"
            onChange={handlePhotoChange}
          />
          {photoUploading && (
            <p className="mt-1.5 text-xs text-ink/55">Uploading photo…</p>
          )}
          {photoUrl && (
            <img
              src={photoUrl}
              alt="Stall photo preview"
              className="mt-2 h-28 w-44 rounded-md object-cover"
            />
          )}
          {photoError && (
            <p role="alert" className="mt-1.5 text-xs text-berry-700">
              {photoError}
            </p>
          )}
          <input type="hidden" name="image_url" value={photoUrl ?? ""} />
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="pitch" className={labelClass}>
            Tell us about your stall
          </label>
          <textarea
            id="pitch"
            name="pitch"
            required
            rows={5}
            minLength={20}
            maxLength={600}
            placeholder="What do you sell? Have you traded at markets before?"
            className={inputClass}
          />
          <p className="mt-1.5 text-xs text-ink/55">
            At least 20 characters. This text may appear on your public stall
            listing.
          </p>
        </div>
      </div>

      <button
        type="submit"
        disabled={pending || photoUploading}
        className="rounded-md bg-berry-600 px-6 py-3 text-sm font-medium text-paper transition-colors hover:bg-berry-700 disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-berry-600"
      >
        {pending || photoUploading ? "Sending…" : "Submit application"}
      </button>
    </form>
  );
}
