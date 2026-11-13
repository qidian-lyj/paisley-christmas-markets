"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

type AdminContext = { supabase: SupabaseClient; adminId: string };

/** Every admin action re-verifies the session and role server-side. */
async function requireAdmin(): Promise<AdminContext> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profileRow } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  const role = (profileRow as { role: string } | null)?.role;

  if (role !== "admin") {
    redirect("/");
  }

  return { supabase, adminId: user.id };
}

export async function reviewApplicationAction(formData: FormData) {
  const { supabase, adminId } = await requireAdmin();

  const id = Number(formData.get("id"));
  const decision = String(formData.get("decision"));

  if (!Number.isInteger(id) || (decision !== "approved" && decision !== "rejected")) {
    return;
  }

  const { data: applicationRow } = await supabase
    .from("applications")
    .select("id, user_id, business_name, category, pitch, price_info, status, email, phone")
    .eq("id", id)
    .single();
  const application = applicationRow as {
    id: number;
    user_id: string | null;
    business_name: string;
    category: string;
    pitch: string;
    price_info: string | null;
    status: string;
    email: string;
    phone: string | null;
  } | null;

  if (!application || application.status !== "pending") {
    revalidatePath("/admin");
    return;
  }

  const { error } = await supabase
    .from("applications")
    .update({ status: decision, reviewed_by: adminId })
    .eq("id", id);

  if (error) {
    return;
  }

  // An approved application automatically becomes a public stall listing,
  // carrying the applicant's contact details onto the stall.
  if (decision === "approved") {
    await supabase.from("stalls").insert({
      application_id: application.id,
      trader_id: application.user_id,
      name: application.business_name,
      category: application.category,
      description: application.pitch,
      contact_email: application.email,
      contact_phone: application.phone,
      price_info: application.price_info,
      approved: true,
    });
  }

  revalidatePath("/admin");
  revalidatePath("/traders");
}

export async function toggleStallAction(formData: FormData) {
  const { supabase } = await requireAdmin();

  const id = Number(formData.get("id"));
  if (!Number.isInteger(id)) {
    return;
  }

  const { data: stallRow } = await supabase
    .from("stalls")
    .select("approved")
    .eq("id", id)
    .single();
  const approved = (stallRow as { approved: boolean } | null)?.approved;

  if (typeof approved !== "boolean") {
    return;
  }

  await supabase.from("stalls").update({ approved: !approved }).eq("id", id);

  revalidatePath("/admin/stalls");
  revalidatePath("/traders");
}

export async function deleteStallAction(formData: FormData) {
  const { supabase } = await requireAdmin();

  const id = Number(formData.get("id"));
  if (!Number.isInteger(id)) {
    return;
  }

  await supabase.from("stalls").delete().eq("id", id);

  revalidatePath("/admin/stalls");
  revalidatePath("/traders");
}

export async function addEventAction(formData: FormData) {
  const { supabase } = await requireAdmin();

  const title = String(formData.get("title") ?? "").trim();
  const scheduledAt = String(formData.get("scheduled_at") ?? "");
  const location = String(formData.get("location") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();

  if (!title || !scheduledAt) {
    return;
  }

  const parsed = new Date(scheduledAt);
  if (Number.isNaN(parsed.getTime())) {
    return;
  }

  await supabase.from("events").insert({
    title,
    scheduled_at: parsed.toISOString(),
    location: location || null,
    description: description || null,
  });

  revalidatePath("/admin/events");
  revalidatePath("/events");
}

export async function deleteEventAction(formData: FormData) {
  const { supabase } = await requireAdmin();

  const id = Number(formData.get("id"));
  if (!Number.isInteger(id)) {
    return;
  }

  await supabase.from("events").delete().eq("id", id);

  revalidatePath("/admin/events");
  revalidatePath("/events");
}
