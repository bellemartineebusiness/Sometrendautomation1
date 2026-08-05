import { buildSparkline } from "./sparkline";
import type { GenerateEmailRequest, GenerateEmailResponse, TrendItem } from "./types";

const DEFAULT_FROM_NAME = "SoMe";
const DEFAULT_FROM_EMAIL = "trender@app.somesoftware.io";

function escapeHtml(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

const PLATFORM_ROW_STYLES: Record<string, { bg: string; color: string }> = {
  tiktok: { bg: "#111827", color: "#ffffff" },
  instagram: { bg: "#fce7f3", color: "#be185d" },
  youtube: { bg: "#fee2e2", color: "#dc2626" },
};
const DEFAULT_ROW_STYLE = { bg: "#ede9fe", color: "#5b21b6" };

function platformRowStyle(platform: string) {
  return PLATFORM_ROW_STYLES[platform.toLowerCase()] ?? DEFAULT_ROW_STYLE;
}

function growthColors(percent: number) {
  return percent >= 0
    ? { text: "#15803d", stroke: "#22c55e", fill: "#22c55e", big: "#4ade80" }
    : { text: "#b91c1c", stroke: "#ef4444", fill: "#ef4444", big: "#f87171" };
}

function formatGrowth(percent: number): string {
  const sign = percent > 0 ? "+" : "";
  return `${sign}${percent}%`;
}

function renderFeaturedTrend(trend: TrendItem): string {
  const spark = buildSparkline(trend.sparkline, 200, 52);
  const colors = growthColors(trend.growthPercent);

  return `
      <table width="100%" cellpadding="0" cellspacing="0" style="padding:22px 36px 0;">
        <tr><td style="background-color:#1c1033;border-radius:18px;padding:0;">
          <!--[if !mso]><!-->
          <div style="background:linear-gradient(158deg,#1c1033 0%,#120821 100%);border:1px solid rgba(255,255,255,0.07);border-radius:18px;padding:27px 27px 25px;">
          <!--<![endif]-->

          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td>
                <table cellpadding="0" cellspacing="0"><tr>
                  <td style="background:rgba(251,191,36,0.14);border:1px solid rgba(251,191,36,0.35);border-radius:20px;padding:4px 11px 4px 9px;font-size:10px;font-weight:800;color:#fbbf24;letter-spacing:0.5px;">&#128293;&nbsp;VECKANS TREND</td>
                </tr></table>
              </td>
              <td align="right" style="font-size:38px;font-weight:800;color:#3d2e63;line-height:1;font-family:Georgia,'Times New Roman',serif;font-variant-numeric:tabular-nums;">01</td>
            </tr>
          </table>

          <div style="font-size:20px;font-weight:800;color:#ffffff;letter-spacing:-0.3px;margin:16px 0 8px;line-height:1.3;">${escapeHtml(trend.title)}</div>
          <div style="font-size:13.5px;color:#b7ade0;line-height:1.65;max-width:420px;margin-bottom:20px;">${escapeHtml(trend.description)}</div>

          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td width="54%" style="vertical-align:bottom;">
                <table cellpadding="0" cellspacing="0"><tr>
                  <td style="background:#0f0619;border:1px solid rgba(255,255,255,0.08);border-radius:20px;padding:3px 10px;font-size:10px;font-weight:800;color:#e4dcf7;letter-spacing:0.4px;">${escapeHtml(trend.platform.toUpperCase())}</td>
                </tr></table>
                <div style="margin-top:12px;">
                  <span style="font-size:26px;font-weight:800;color:${colors.big};font-variant-numeric:tabular-nums;">${formatGrowth(trend.growthPercent)}</span>
                  <span style="font-size:11.5px;color:#9584c4;display:block;margin-top:2px;">fler videor denna vecka</span>
                </div>
              </td>
              <td width="46%" style="vertical-align:bottom;">
                <svg width="100%" height="52" viewBox="0 0 200 52" preserveAspectRatio="none" style="display:block;">
                  <polygon points="${spark.polygon}" fill="${colors.fill}" opacity="0.12"/>
                  <polyline points="${spark.polyline}" fill="none" stroke="${colors.stroke}" stroke-width="2.25"/>
                  <circle cx="${spark.last.x}" cy="${spark.last.y}" r="4" fill="${colors.stroke}"/>
                </svg>
              </td>
            </tr>
          </table>

          <!--[if !mso]><!-->
          </div>
          <!--<![endif]-->
        </td></tr>
      </table>`;
}

function renderTrendRow(trend: TrendItem, rank: number, isLast: boolean): string {
  const spark = buildSparkline(trend.sparkline, 72, 26);
  const colors = growthColors(trend.growthPercent);
  const style = platformRowStyle(trend.platform);
  const border = isLast ? "" : "border-bottom:1px solid #f1eef8;";

  return `
          <table width="100%" cellpadding="0" cellspacing="0" style="${border}padding:15px 0;">
            <tr>
              <td width="30" style="vertical-align:middle;font-size:19px;font-weight:800;color:#ddd6f0;font-family:Georgia,'Times New Roman',serif;font-variant-numeric:tabular-nums;">${String(rank).padStart(2, "0")}</td>
              <td style="vertical-align:middle;padding-right:10px;">
                <table cellpadding="0" cellspacing="0"><tr>
                  <td style="background:${style.bg};border-radius:20px;padding:3px 10px;font-size:9.5px;font-weight:800;color:${style.color};letter-spacing:0.4px;">${escapeHtml(trend.platform.toUpperCase())}</td>
                </tr></table>
                <div style="font-size:14.5px;font-weight:700;color:#150B2E;margin:7px 0 3px;">${escapeHtml(trend.title)}</div>
                <div style="font-size:12px;color:#6b647a;line-height:1.5;">${escapeHtml(trend.description)}</div>
              </td>
              <td width="78" align="right" style="vertical-align:middle;">
                <svg width="72" height="26" viewBox="0 0 72 26" preserveAspectRatio="none" style="display:block;margin-left:auto;">
                  <polygon points="${spark.polygon}" fill="${colors.fill}" opacity="0.12"/>
                  <polyline points="${spark.polyline}" fill="none" stroke="${colors.stroke}" stroke-width="1.75"/>
                  <circle cx="${spark.last.x}" cy="${spark.last.y}" r="2.75" fill="${colors.stroke}"/>
                </svg>
                <div style="font-size:11.5px;font-weight:800;color:${colors.text};margin-top:3px;">${formatGrowth(trend.growthPercent)}</div>
              </td>
            </tr>
          </table>`;
}

function renderPlainText(
  data: GenerateEmailRequest,
  featured: TrendItem,
  rest: TrendItem[],
  ctaUrl: string,
  unsubscribeUrl: string
): string {
  const rows = rest
    .map(
      (trend, i) =>
        `${i + 2}. ${trend.title} (${trend.platform.toUpperCase()}) ${formatGrowth(trend.growthPercent)}\n   ${trend.description}`
    )
    .join("\n\n");

  return [
    `SoMe — Trendrapport, vecka ${data.weekNumber}`,
    "",
    `Hej ${data.recipientName} — baserat på er nisch ${data.niche} har vi rankat veckans starkaste rörelser åt er.`,
    "",
    "VECKANS TREND",
    `${featured.title} (${featured.platform.toUpperCase()}) ${formatGrowth(featured.growthPercent)}`,
    featured.description,
    "",
    "FLER TRENDER DENNA VECKA",
    rows,
    "",
    `Se hela trendrapporten: ${ctaUrl}`,
    "",
    `Avsluta veckans trender: ${unsubscribeUrl}`,
  ].join("\n");
}

export function renderTrendsEmail(data: GenerateEmailRequest): GenerateEmailResponse {
  if (data.trends.length < 1) {
    throw new Error("at least one trend is required");
  }

  const [featured, ...rest] = data.trends;
  const ctaUrl = data.ctaUrl ?? "#";
  const unsubscribeUrl = data.unsubscribeUrl ?? "#";
  const fromName = data.fromName ?? DEFAULT_FROM_NAME;
  const fromEmail = data.fromEmail ?? DEFAULT_FROM_EMAIL;
  const replyTo = data.replyTo ?? fromEmail;
  const subject = `\u{1F525} Veckans trender — vecka ${data.weekNumber}`;
  const previewText = `Veckans trend växte ${featured.growthPercent}% — se den och ${rest.length} till innan de slår igenom`;

  const rowsHtml = rest
    .map((trend, i) => renderTrendRow(trend, i + 2, i === rest.length - 1))
    .join("\n");

  const html = `<!DOCTYPE html>
<html lang="sv">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>Veckans trender - SoMe</title>
</head>
<body style="margin:0;padding:0;background:#f3effa;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
<span style="display:none;max-height:0;overflow:hidden;mso-hide:all;">${escapeHtml(previewText)}</span>
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f3effa;padding:36px 16px;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

  <!-- Header band -->
  <tr>
    <td style="background-color:#1c1033;border-radius:20px 20px 0 0;padding:0;">
      <!--[if !mso]><!-->
      <div style="background:linear-gradient(135deg,#1c1033 0%,#150B2E 60%);border-radius:20px 20px 0 0;padding:26px 36px 20px;">
      <!--<![endif]-->
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="font-size:16px;font-weight:800;color:#ffffff;letter-spacing:-0.2px;">SoMe<span style="color:#7636ec;">.</span></td>
          <td align="right" style="font-size:10.5px;font-weight:700;color:#9584c4;text-transform:uppercase;letter-spacing:1.2px;">Trendrapport &middot; Vecka ${data.weekNumber}</td>
        </tr>
      </table>
      <!--[if !mso]><!-->
      </div>
      <!--<![endif]-->
    </td>
  </tr>

  <!-- Card -->
  <tr>
    <td style="background:#ffffff;border-radius:0 0 20px 20px;box-shadow:0 1px 4px rgba(0,0,0,0.05),0 14px 36px rgba(21,11,46,0.12);">

      <!-- Intro -->
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr><td style="padding:38px 36px 8px;">
          <div style="font-size:25px;font-weight:800;color:#150B2E;letter-spacing:-0.5px;line-height:1.28;margin-bottom:8px;">Fem trender att hänga med på</div>
          <div style="font-size:14px;font-weight:500;color:#6b647a;line-height:1.6;">Hej ${escapeHtml(data.recipientName)} &mdash; baserat på ditt team&#39;s nisch <span style="color:#150B2E;font-weight:700;">${escapeHtml(data.niche)}</span> har vi rankat veckans starkaste rörelser åt dig.</div>
        </td></tr>
      </table>

      <!-- Trend of the week: dark featured card -->
${renderFeaturedTrend(featured)}

      <!-- Divider label -->
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr><td style="padding:30px 36px 12px;">
          <div style="font-size:11px;font-weight:800;color:#a39cc9;text-transform:uppercase;letter-spacing:1.2px;border-bottom:1px solid #efeafb;padding-bottom:12px;">Fler trender denna vecka</div>
        </td></tr>
      </table>

      <!-- Trend rows -->
      <table width="100%" cellpadding="0" cellspacing="0" style="padding:0 36px;">
        <tr><td>
${rowsHtml}
        </td></tr>
      </table>

      <!-- CTA -->
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr><td style="padding:30px 36px 40px;text-align:center;">
          <a href="${escapeHtml(ctaUrl)}" style="display:inline-block;background:#7636ec;color:#ffffff;text-decoration:none;font-size:15.5px;font-weight:800;padding:16px 44px;border-radius:12px;letter-spacing:0.2px;box-shadow:0 4px 18px rgba(118,54,236,0.35);">Se hela trendrapporten &rarr;</a>
          <div style="font-size:12px;color:#a39cc9;margin-top:12px;">Uppdateras varje måndag kl. 08:00</div>
        </td></tr>
      </table>

    </td>
  </tr>

  <!-- Footer -->
  <tr>
    <td style="padding:22px 12px 0;text-align:center;font-size:11.5px;color:#9c93b8;line-height:1.7;">
      Du får det här mejlet varje vecka för att du prenumererar på SoMes trendrapport &nbsp;&middot;&nbsp;
      <a href="#" style="color:#7636ec;text-decoration:none;">app.somesoftware.io</a><br>
      <a href="${escapeHtml(unsubscribeUrl)}" style="color:#9c93b8;text-decoration:underline;">Avsluta veckans trender</a>
    </td>
  </tr>

</table>
</td></tr>
</table>
</body>
</html>`;

  const text = renderPlainText(data, featured, rest, ctaUrl, unsubscribeUrl);

  return { subject, previewText, html, text, fromName, fromEmail, replyTo };
}
