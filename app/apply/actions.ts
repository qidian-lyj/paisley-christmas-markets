"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { TRADER_CATEGORIES, type TraderCategory } from "@/lib/types";

export type ApplicationFormState = {
  error?: string;
  success?: boolean;
} | null;

export async function submitApplicationAction(
  _prev: ApplicationFormState,
  formData: FormData
): Promise<ApplicationFormState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Please log in before submitting an application." };
  }

  const business_name = String(formData.get("business_name") ?? "").trim();
  const contact_name = String(formData.get("contact_name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const category = String(formData.get("category") ?? "") as TraderCategory;
  const pitch = String(formData.get("pitch") ?? "").trim();
  const price_info = String(formData.get("price_info") ?? "").trim();
  const image_url = String(formData.get("image_url") ?? "").trim();

  if (!business_name || !contact_name || !email || !pitch) {
    return { error: "Fill in every required field to submit." };
  }
  if (!/^\S+@\S+\.\S+$/.test(email)) {
    return { error: "Enter a valid email address." };
  }
  if (!(TRADER_CATEGORIES as readonly string[]).includes(category)) {
    return { error: "Choose a stall category." };
  }
  if (pitch.length < 20) {
    return {
      error: "Tell us a little more about your stall (at least 20 characters).",
    };
  }
  if (pitch.length > 600) {
    return { error: "Keep your stall description under 600 characters." };
  }
  if (price_info.length > 60) {
    return { error: "Keep the pricing note under 60 characters." };
  }
  if (!image_url.startsWith("https://")) {
    return { error: "Please upload a photo of your stall before submitting." };
  }

  const { error } = await supabase.from("applications").insert({
    user_id: user.id,
    business_name,
    contact_name,
    email,
    phone: phone || null,
    category,
    pitch,
    price_info: price_info || null,
    image_url,
    status: "pending",
  });

  if (error) {
    return { error: "Something went wrong on our side. Please try again." };
  }

  revalidatePath("/account");
  revalidatePath("/admin");

  return { success: true };
}
