import { supabase } from "@/lib/supabase";

export async function POST(req: Request) {
  const auth = req.headers.get("authorization");

  if (auth !== `Bearer ${process.env.HEALTH_API_TOKEN}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return new Response("Invalid JSON", { status: 400 });
  }

  const { date, steps, active_kcal, basal_kcal } = body;

  if (!date || steps == null || active_kcal == null) {
    return new Response("Invalid payload", { status: 400 });
  }

  const total_kcal =
    basal_kcal != null ? active_kcal + basal_kcal : null;

  const { error } = await supabase
    .from("health_days")
    .upsert({
      date,
      steps,
      active_kcal,
      basal_kcal,
      total_kcal
    });

  if (error) {
    console.error("Supabase error:", error);
    return new Response(error.message, { status: 500 });
  }

  return Response.json({ ok: true });
}
