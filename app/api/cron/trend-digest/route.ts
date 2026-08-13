import { NextRequest, NextResponse } from "next/server";
import { renderTrendsEmail } from "@/lib/email/template";
import { sendTrendDigest } from "@/lib/email/send";
import { getIsoWeek } from "@/lib/email/iso-week";
import { getActiveSubscribers, getTrendsForWeek, type Subscriber } from "@/lib/trend-data";
import { hasAlreadySent, logDigestResult } from "@/lib/digest-log";
import {
  getMockSubscribers,
  getMockTrendsForWeek,
  mockHasAlreadySent,
  mockLogDigestResult,
  mockSendTrendDigest,
} from "@/lib/mock-digest";

const APP_BASE_URL = process.env.APP_BASE_URL ?? "https://app.somesoftware.io";

// When on, the route never touches Supabase or Resend — it runs entirely on
// hardcoded fixture data and logs to the console instead of sending/writing.
// Lets the whole chain (auth, n8n reachability, email rendering, logging)
// get verified with zero production credentials.
const MOCK_MODE = process.env.MOCK_MODE === "true";

// Independent of MOCK_MODE: if a real Resend key is configured, actually send
// the email (still built from mock data when MOCK_MODE is on) instead of just
// logging it. Lets you verify real delivery without needing Supabase yet.
const REAL_SEND = Boolean(process.env.RESEND_API_KEY);

function isAuthorized(request: NextRequest): boolean {
  const key = process.env.INTERNAL_API_KEY;
  if (!key) return false; // this route must never run without an explicitly configured key
  return request.headers.get("x-internal-api-key") === key;
}

interface RequestBody {
  dryRun?: boolean;
  testEmail?: string;
  weekNumber?: number;
  year?: number;
  fromName?: string;
  fromEmail?: string;
  replyTo?: string;
}

async function parseBody(request: NextRequest): Promise<RequestBody> {
  try {
    const raw = (await request.json()) as unknown;
    if (typeof raw !== "object" || raw === null) return {};
    const b = raw as Record<string, unknown>;
    return {
      dryRun: b.dryRun === true,
      testEmail: typeof b.testEmail === "string" ? b.testEmail : undefined,
      weekNumber: typeof b.weekNumber === "number" ? b.weekNumber : undefined,
      year: typeof b.year === "number" ? b.year : undefined,
      fromName: typeof b.fromName === "string" ? b.fromName : undefined,
      fromEmail: typeof b.fromEmail === "string" ? b.fromEmail : undefined,
      replyTo: typeof b.replyTo === "string" ? b.replyTo : undefined,
    };
  } catch {
    return {};
  }
}

export async function POST(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const body = await parseBody(request);
  if (body.dryRun && !body.testEmail) {
    return NextResponse.json({ error: "dryRun requires testEmail" }, { status: 400 });
  }

  const now = getIsoWeek();
  const week = body.weekNumber ?? now.week;
  const year = body.year ?? now.year;

  let allSubscribers: Subscriber[];
  let trendsByNiche: Awaited<ReturnType<typeof getTrendsForWeek>>;
  try {
    [allSubscribers, trendsByNiche] = MOCK_MODE
      ? await Promise.all([getMockSubscribers(), getMockTrendsForWeek()])
      : await Promise.all([getActiveSubscribers(), getTrendsForWeek(week, year)]);
  } catch (err) {
    const message = err instanceof Error ? err.message : "failed to load data";
    return NextResponse.json({ error: message }, { status: 500 });
  }

  const subscribers: Subscriber[] = body.testEmail
    ? allSubscribers.slice(0, 1).map((s) => ({ ...s, email: body.testEmail! }))
    : allSubscribers;

  if (body.testEmail && subscribers.length === 0) {
    return NextResponse.json(
      { error: "no subscribers exist to base a test send on" },
      { status: 400 }
    );
  }

  const result = {
    mockMode: MOCK_MODE,
    realSend: REAL_SEND,
    dryRun: Boolean(body.dryRun),
    week,
    year,
    sent: 0,
    skipped: 0,
    failed: 0,
    errors: [] as string[],
    emails: [] as { to: string; subject: string; html: string; text: string }[],
  };

  for (const subscriber of subscribers) {
    try {
      const alreadySent = MOCK_MODE
        ? await mockHasAlreadySent(subscriber.id, week, year)
        : await hasAlreadySent(subscriber.id, week, year);
      if (!body.dryRun && alreadySent) {
        result.skipped++;
        continue;
      }

      const trends = trendsByNiche.get(subscriber.niche) ?? [];
      if (trends.length === 0) {
        result.skipped++;
        continue;
      }

      const email = renderTrendsEmail({
        recipientName: subscriber.name,
        niche: subscriber.niche,
        weekNumber: week,
        trends,
        ctaUrl: `${APP_BASE_URL}/trends`,
        unsubscribeUrl: `${APP_BASE_URL}/unsubscribe?t=${subscriber.unsubscribeToken}`,
        fromName: body.fromName,
        fromEmail: body.fromEmail,
        replyTo: body.replyTo,
      });

      const sendParams = {
        to: subscriber.email,
        subject: email.subject,
        html: email.html,
        text: email.text,
        fromName: email.fromName,
        fromEmail: email.fromEmail,
        replyTo: email.replyTo,
      };
      if (REAL_SEND) {
        await sendTrendDigest(sendParams);
      } else {
        await mockSendTrendDigest(sendParams);
      }

      if (!body.dryRun) {
        const logParams = { subscriberId: subscriber.id, week, year, status: "sent" as const };
        if (MOCK_MODE) {
          await mockLogDigestResult(logParams);
        } else {
          await logDigestResult(logParams);
        }
      }
      result.sent++;
      if (MOCK_MODE) {
        result.emails.push({ to: subscriber.email, subject: email.subject, html: email.html, text: email.text });
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "unknown error";
      result.failed++;
      result.errors.push(`${subscriber.email}: ${message}`);
      if (!body.dryRun) {
        const logParams = {
          subscriberId: subscriber.id,
          week,
          year,
          status: "failed" as const,
          error: message,
        };
        const write = MOCK_MODE ? mockLogDigestResult(logParams) : logDigestResult(logParams);
        await write.catch(() => {});
      }
    }
  }

  return NextResponse.json(result);
}
