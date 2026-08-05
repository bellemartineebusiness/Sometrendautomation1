import { NextResponse } from "next/server";
import { renderTrendsEmail } from "@/lib/email/template";
import { sampleEmailRequest } from "@/lib/email/sample-data";

// Renders sample data as a sanity check so n8n can confirm the template
// pipeline works before kicking off a full send batch.
export async function GET() {
  try {
    renderTrendsEmail(sampleEmailRequest);
    return NextResponse.json({ status: "ok" });
  } catch (err) {
    const message = err instanceof Error ? err.message : "template render failed";
    return NextResponse.json({ status: "error", error: message }, { status: 503 });
  }
}
