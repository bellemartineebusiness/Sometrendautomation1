import { getSupabaseAdmin } from "./supabase";
import type { TrendItem } from "./email/types";

export interface Subscriber {
  id: string;
  email: string;
  name: string;
  niche: string;
  unsubscribeToken: string;
}

export async function getActiveSubscribers(): Promise<Subscriber[]> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("subscribers")
    .select("id, email, name, niche, unsubscribe_token")
    .eq("unsubscribed", false);

  if (error) {
    throw new Error(`failed to load subscribers: ${error.message}`);
  }

  return (data ?? []).map((row) => ({
    id: row.id,
    email: row.email,
    name: row.name,
    niche: row.niche,
    unsubscribeToken: row.unsubscribe_token,
  }));
}

// Groups this week's trends by niche, ordered by rank (1 = featured trend).
export async function getTrendsForWeek(
  week: number,
  year: number
): Promise<Map<string, TrendItem[]>> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("trends")
    .select("niche, platform, title, description, growth_percent, sparkline, rank")
    .eq("week_number", week)
    .eq("year", year)
    .order("rank", { ascending: true });

  if (error) {
    throw new Error(`failed to load trends: ${error.message}`);
  }

  const byNiche = new Map<string, TrendItem[]>();
  for (const row of data ?? []) {
    const list = byNiche.get(row.niche) ?? [];
    list.push({
      platform: row.platform,
      title: row.title,
      description: row.description,
      growthPercent: row.growth_percent,
      sparkline: row.sparkline as number[],
    });
    byNiche.set(row.niche, list);
  }
  return byNiche;
}
