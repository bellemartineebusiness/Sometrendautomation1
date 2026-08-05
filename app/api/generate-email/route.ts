import { NextRequest, NextResponse } from "next/server";
import { renderTrendsEmail } from "@/lib/email/template";
import { sampleEmailRequest } from "@/lib/email/sample-data";
import type { GenerateEmailRequest, TrendItem } from "@/lib/email/types";

function isTrendItem(value: unknown): value is TrendItem {
  if (typeof value !== "object" || value === null) return false;
  const t = value as Record<string, unknown>;
  return (
    typeof t.platform === "string" &&
    typeof t.title === "string" &&
    typeof t.description === "string" &&
    typeof t.growthPercent === "number" &&
    Array.isArray(t.sparkline) &&
    t.sparkline.length >= 2 &&
    t.sparkline.every((v) => typeof v === "number")
  );
}

function validateRequest(body: unknown): { data: GenerateEmailRequest } | { error: string } {
  if (typeof body !== "object" || body === null) {
    return { error: "request body must be a JSON object" };
  }
  const b = body as Record<string, unknown>;

  if (typeof b.recipientName !== "string" || b.recipientName.trim() === "") {
    return { error: "recipientName is required" };
  }
  if (typeof b.niche !== "string" || b.niche.trim() === "") {
    return { error: "niche is required" };
  }
  if (typeof b.weekNumber !== "number") {
    return { error: "weekNumber is required and must be a number" };
  }
  if (!Array.isArray(b.trends) || b.trends.length === 0) {
    return { error: "trends must be a non-empty array" };
  }
  if (!b.trends.every(isTrendItem)) {
    return {
      error:
        "each trend requires platform, title, description, growthPercent, and a sparkline array with at least 2 numbers",
    };
  }
  if (b.ctaUrl !== undefined && typeof b.ctaUrl !== "string") {
    return { error: "ctaUrl must be a string" };
  }
  if (b.unsubscribeUrl !== undefined && typeof b.unsubscribeUrl !== "string") {
    return { error: "unsubscribeUrl must be a string" };
  }
  for (const field of ["fromName", "fromEmail", "replyTo"] as const) {
    if (b[field] !== undefined && typeof b[field] !== "string") {
      return { error: `${field} must be a string` };
    }
  }

  return {
    data: {
      recipientName: b.recipientName,
      niche: b.niche,
      weekNumber: b.weekNumber,
      trends: b.trends as TrendItem[],
      ctaUrl: b.ctaUrl as string | undefined,
      unsubscribeUrl: b.unsubscribeUrl as string | undefined,
      fromName: b.fromName as string | undefined,
      fromEmail: b.fromEmail as string | undefined,
      replyTo: b.replyTo as string | undefined,
    },
  };
}

function isAuthorized(request: NextRequest): boolean {
  const apiKey = process.env.GENERATE_EMAIL_API_KEY;
  if (!apiKey) return true; // no key configured -> auth disabled (local/dev)
  const header = request.headers.get("authorization");
  return header === `Bearer ${apiKey}`;
}

export async function POST(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid JSON body" }, { status: 400 });
  }

  const result = validateRequest(body);
  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  try {
    const email = renderTrendsEmail(result.data);
    return NextResponse.json(email);
  } catch (err) {
    const message = err instanceof Error ? err.message : "failed to render email";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

// Renders sample data as HTML in the browser for quick visual checks.
export async function GET() {
  const email = renderTrendsEmail(sampleEmailRequest);
  return new NextResponse(email.html, {
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}
