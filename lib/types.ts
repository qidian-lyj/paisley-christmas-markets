export type UserRole = "trader" | "admin";

export type ApplicationStatus = "pending" | "approved" | "rejected";

export const TRADER_CATEGORIES = [
  "food",
  "drink",
  "crafts",
  "gifts",
  "charity",
  "other",
] as const;

export type TraderCategory = (typeof TRADER_CATEGORIES)[number];

export const CATEGORY_LABELS: Record<TraderCategory, string> = {
  food: "Food",
  drink: "Drink",
  crafts: "Crafts",
  gifts: "Gifts",
  charity: "Charity",
  other: "Other",
};

export type Profile = {
  id: string;
  full_name: string | null;
  role: UserRole;
  created_at: string;
};

export type Market = {
  id: number;
  title: string;
  description: string | null;
  start_date: string;
  end_date: string;
  location: string | null;
};

export type Application = {
  id: number;
  user_id: string | null;
  business_name: string;
  contact_name: string;
  email: string;
  phone: string | null;
  category: TraderCategory;
  pitch: string;
  price_info: string | null;
  status: ApplicationStatus;
  reviewed_by: string | null;
  created_at: string;
};

export type Stall = {
  id: number;
  market_id: number | null;
  application_id: number | null;
  trader_id: string | null;
  name: string;
  category: TraderCategory;
  description: string | null;
  image_url: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  price_info: string | null;
  approved: boolean;
  created_at: string;
};

export type MarketEvent = {
  id: number;
  market_id: number | null;
  title: string;
  description: string | null;
  scheduled_at: string;
  location: string | null;
};
