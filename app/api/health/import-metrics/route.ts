import { supabase } from "@/lib/supabase";

/**
 * Payload sent from iPhone (Apple Health + FatSecret).
 * All fields are raw facts, no derived values are accepted from the client.
 */
type MetricsPayload = {
  date: string;
  active_kcal?: number;
  basal_kcal?: number;
  total_kcal?: number;
  fatsecret_kcal?: number;
  fats?: number;
  carbs?: number;
  proteins?: number;
  steps?: number;
};

export async function POST(req: Request) {
  // Simple token-based authentication
  const auth = req.headers.get("authorization");

  if (auth !== `Bearer ${process.env.HEALTH_API_TOKEN}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  let body: MetricsPayload;

  // Parse JSON body
  try {
    body = await req.json();
  } catch {
    return new Response("Invalid JSON", { status: 400 });
  }

  const {
    date,
    active_kcal,
    basal_kcal,
    total_kcal,
    fatsecret_kcal,
    fats,
    carbs,
    proteins,
    steps
  } = body;

  // Date is mandatory — one row per day
  if (!date) {
    return new Response("Date is required", { status: 400 });
  }

  /**
   * Calculate calorie deficit.
   * This is a deterministic derived fact:
   * kcal_deficit = total_kcal - fatsecret_kcal
   *
   * It is calculated on the backend to keep a single source of truth.
   */
  let kcal_deficit: number | null = null;

  if (
    typeof total_kcal === "number" &&
    typeof fatsecret_kcal === "number"
  ) {
    kcal_deficit = total_kcal - fatsecret_kcal;
  }

  // Prepare payload for upsert.
  // Undefined fields will not overwrite existing values.
  const payload = {
    date,
    active_kcal,
    basal_kcal,
    total_kcal,
    fatsecret_kcal,
    fats,
    carbs,
    proteins,
    steps,
    kcal_deficit
  };

  // Upsert by date to keep one row per day
  const { error } = await supabase
    .from("health_days")
    .upsert(payload, { onConflict: "date" });

  if (error) {
    console.error("Supabase error:", error);
    return new Response(error.message, { status: 500 });
  }

  return Response.json({ ok: true });
}
