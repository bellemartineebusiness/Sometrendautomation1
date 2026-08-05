import type { Subscriber } from "./trend-data";
import type { TrendItem } from "./email/types";
import { mockSubscribers, mockTrendsByNiche } from "./mock-data";

// MOCK_MODE stand-ins for the Supabase/Resend-backed functions in
// trend-data.ts, digest-log.ts, and email/send.ts. None of these make an
// external network call — safe to exercise with zero production credentials.

const sentInThisProcess = new Set<string>();

export async function getMockSubscribers(): Promise<Subscriber[]> {
  return mockSubscribers;
}

export async function getMockTrendsForWeek(): Promise<Map<string, TrendItem[]>> {
  return mockTrendsByNiche;
}

export async function mockHasAlreadySent(
  subscriberId: string,
  week: number,
  year: number
): Promise<boolean> {
  return sentInThisProcess.has(`${subscriberId}:${week}:${year}`);
}

export async function mockLogDigestResult(params: {
  subscriberId: string;
  week: number;
  year: number;
  status: "sent" | "failed";
  error?: string;
}): Promise<void> {
  if (params.status === "sent") {
    sentInThisProcess.add(`${params.subscriberId}:${params.week}:${params.year}`);
  }
  console.log("[MOCK_MODE] digest log:", params);
}

export async function mockSendTrendDigest(params: {
  to: string;
  subject: string;
  html: string;
  text: string;
  fromName: string;
  fromEmail: string;
  replyTo: string;
}): Promise<void> {
  console.log("[MOCK_MODE] would send email:", {
    to: params.to,
    from: `${params.fromName} <${params.fromEmail}>`,
    subject: params.subject,
    htmlLength: params.html.length,
  });
}
