import { getSupabaseAdmin } from "./supabase";

// Idempotency guard: has this subscriber already received this week's digest?
export async function hasAlreadySent(
  subscriberId: string,
  week: number,
  year: number
): Promise<boolean> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("trend_digest_log")
    .select("id")
    .eq("subscriber_id", subscriberId)
    .eq("week_number", week)
    .eq("year", year)
    .eq("status", "sent")
    .maybeSingle();

  if (error) {
    throw new Error(`failed to check digest log: ${error.message}`);
  }
  return data !== null;
}

export async function logDigestResult(params: {
  subscriberId: string;
  week: number;
  year: number;
  status: "sent" | "failed";
  error?: string;
}): Promise<void> {
  const supabase = getSupabaseAdmin();
  const { error } = await supabase.from("trend_digest_log").insert({
    subscriber_id: params.subscriberId,
    week_number: params.week,
    year: params.year,
    status: params.status,
    error: params.error,
  });

  if (error) {
    throw new Error(`failed to write digest log: ${error.message}`);
  }
}
