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

    const { date, gym, running, walking, cycling } = body;

    if (!date) {
        return new Response("Date is required", { status: 400 });
    }

    type ActivityPayload = {
        date: string;
        gym?: boolean;
        running?: boolean;
        walking?: boolean;
        cycling?: boolean;
    };

    const payload: ActivityPayload = { date };

    if (typeof gym === "boolean") payload.gym = gym;
    if (typeof running === "boolean") payload.running = running;
    if (typeof walking === "boolean") payload.walking = walking;
    if (typeof cycling === "boolean") payload.cycling = cycling;

    const { error } = await supabase
    .from("health_days")
    .upsert(payload, { onConflict: "date" });

    if (error) {
        console.error("Supabase error:", error);
        return new Response(error.message, { status: 500 });
    }

    return Response.json({ ok: true });
}
