import { buildSparkline } from "./sparkline";
import type { GenerateEmailRequest, GenerateEmailResponse, TrendItem } from "./types";

const DEFAULT_FROM_NAME = "SoMe";
const DEFAULT_FROM_EMAIL = "trender@app.somesoftware.io";
// Must be an absolute URL — recipients' mail clients can't resolve a
// relative path like "/Logo.png" the way a browser on the same origin can.
const LOGO_URL = "https://sometrendautomation1-6anu.vercel.app/Logo.png";

const PAGE_BG = "#f3effa";
const CARD_BG = "#ffffff";
const BORDER_SOFT = "#efeafb";
const TEXT_PRIMARY = "#150B2E";
const TEXT_MUTED = "#8b7fae";
const ACCENT = "#7636ec";

// Gradient text (webkit-only): falls back to solid ACCENT purple via the
// plain `color` value in clients that don't support background-clip:text
// (e.g. Outlook desktop), so the highlighted word is never invisible.
const GRADIENT_TEXT_STYLE =
  "background:linear-gradient(90deg,#5b7fff,#9333ea);-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent;color:" +
  ACCENT +
  ";";

const BLUR_PX = 7; // moderate blur — "lite mindre blurrad" per feedback

function escapeHtml(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// Solid platform tile — stands in for a real content thumbnail when we don't
// have one yet. Still gets blurred + tinted like a real photo would.
const PLATFORM_TILE_STYLES: Record<string, string> = {
  tiktok: "background-color:#111827;",
  instagram: "background-color:#c13584;background:linear-gradient(135deg,#833ab4 0%,#fd1d1d 55%,#fcb045 100%);",
  youtube: "background-color:#ff0000;",
};
const DEFAULT_TILE_STYLE = `background-color:${ACCENT};`;

function platformTileStyle(platform: string): string {
  return PLATFORM_TILE_STYLES[platform.toLowerCase()] ?? DEFAULT_TILE_STYLE;
}

// Simple, recognizable glyphs (not traced brand artwork) for each platform's
// app-icon badge: a musical note for TikTok, a camera for Instagram, a play
// triangle for YouTube. Each has its own viewBox cropped tight to the glyph's
// actual bounding box (computed by hand) so it renders centered and fills
// the badge, instead of sitting off-center in a generic 24x24 box.
const PLATFORM_GLYPHS: Record<string, { viewBox: string; markup: string }> = {
  tiktok: {
    // Hollow (ring) note head + stem + curled flag, duplicated in TikTok's
    // signature cyan/magenta duotone offset.
    viewBox: "2.3 3.2 18 18",
    markup:
      '<g transform="translate(-1,0.9)"><circle cx="9" cy="16.5" r="3" fill="none" stroke="#25F4EE" stroke-width="1.8"/><path d="M12 5v11.5" stroke="#25F4EE" stroke-width="2.1" stroke-linecap="round"/><path d="M12 5c0 2.6 2 4.7 4.6 4.9" stroke="#25F4EE" stroke-width="2.1" stroke-linecap="round" fill="none"/></g>' +
      '<g transform="translate(1,-0.9)"><circle cx="9" cy="16.5" r="3" fill="none" stroke="#FE2C55" stroke-width="1.8"/><path d="M12 5v11.5" stroke="#FE2C55" stroke-width="2.1" stroke-linecap="round"/><path d="M12 5c0 2.6 2 4.7 4.6 4.9" stroke="#FE2C55" stroke-width="2.1" stroke-linecap="round" fill="none"/></g>' +
      '<circle cx="9" cy="16.5" r="3" fill="none" stroke="#fff" stroke-width="1.8"/><path d="M12 5v11.5" stroke="#fff" stroke-width="2.1" stroke-linecap="round"/><path d="M12 5c0 2.6 2 4.7 4.6 4.9" stroke="#fff" stroke-width="2.1" stroke-linecap="round" fill="none"/>',
  },
  instagram: {
    viewBox: "0 0 24 24",
    markup:
      '<rect x="3.5" y="3.5" width="17" height="17" rx="5.5" fill="none" stroke="#fff" stroke-width="2"/><circle cx="12" cy="12" r="4" fill="none" stroke="#fff" stroke-width="2"/><circle cx="17" cy="7" r="1.2" fill="#fff"/>',
  },
  youtube: {
    // A right-pointing triangle's centroid sits left of its bounding-box
    // center (the flat edge carries more visual "weight" than the tip), so
    // geometric centering in the viewBox reads as off-center to the eye.
    // Shifted right so the centroid lines up with the viewBox's center.
    viewBox: "5.75 4.5 15 15",
    markup: '<polygon points="10.75,7.5 18.25,12 10.75,16.5" fill="#fff"/>',
  },
};
const DEFAULT_GLYPH = { viewBox: "0 0 24 24", markup: '<circle cx="12" cy="12" r="4" fill="#fff"/>' };

const FIRST_BG = ACCENT;
const FIRST_TEXT = "#ffffff";
const RANK_BG = "rgba(255,255,255,0.92)";
const RANK_TEXT = TEXT_PRIMARY;

function rankBadge(rank: number, isFirst: boolean): string {
  const size = isFirst ? 26 : 22;
  const bg = isFirst ? FIRST_BG : RANK_BG;
  const color = isFirst ? FIRST_TEXT : RANK_TEXT;
  return `<table cellpadding="0" cellspacing="0" style="width:${size}px;flex-shrink:0;"><tr><td width="${size}" height="${size}" align="center" valign="middle" style="background-color:${bg};border-radius:50%;font-size:${isFirst ? 13 : 11}px;font-weight:800;color:${color};">${rank}</td></tr></table>`;
}

function platformIconBadge(platform: string, size: number): string {
  const key = platform.toLowerCase();
  const glyph = PLATFORM_GLYPHS[key] ?? DEFAULT_GLYPH;
  // Explicit width/style on the table itself (not just the td) — without it,
  // a flex-column parent (like the photo card content overlay) stretches
  // this table to the full container width instead of staying icon-sized.
  return `<table cellpadding="0" cellspacing="0" style="width:${size}px;flex-shrink:0;"><tr><td width="${size}" height="${size}" align="center" valign="middle" style="${platformTileStyle(platform)}border-radius:${Math.round(size * 0.28)}px;">
    <svg width="${Math.round(size * 0.58)}" height="${Math.round(size * 0.58)}" viewBox="${glyph.viewBox}" style="display:block;">${glyph.markup}</svg>
  </td></tr></table>`;
}

// The blurred photo background shared by the hero and grid cards: a real
// thumbnail when we have one, otherwise a solid platform-colored fallback —
// either way it's blurred and scaled up slightly so the blur never shows a
// sharp/transparent edge at the card boundary.
function renderBlurredBackdrop(trend: TrendItem, height: number, heightClass: string): string {
  const common = `display:block;width:100%;height:${height}px;object-fit:cover;filter:blur(${BLUR_PX}px);-webkit-filter:blur(${BLUR_PX}px);transform:scale(1.12);`;
  if (trend.thumbnailUrl) {
    return `<img src="${escapeHtml(trend.thumbnailUrl)}" alt="" class="${heightClass}" style="${common}" />`;
  }
  return `<div class="${heightClass}" style="${platformTileStyle(trend.platform)}${common}"></div>`;
}

function growthColors() {
  // Lighter tint of the brand purple (not the raw ACCENT hex) for contrast
  // against the dark photo-card overlay the number and sparkline sit on.
  return { text: "#c4b5fd", stroke: "#c4b5fd" };
}

function formatGrowth(percent: number): string {
  const sign = percent > 0 ? "+" : "";
  return `${sign}${percent}%`;
}

function growthSentence(percent: number): string {
  const verb = percent >= 0 ? "ökning" : "minskning";
  return `${formatGrowth(percent)} ${verb} senaste veckan`;
}

// Shared "photo card" shell: blurred backdrop, dark wash for contrast, all
// copy layered on top via position:absolute. Renders fine in real browsers
// and WebKit-based mail clients (Apple Mail); Outlook/Gmail app fall back to
// stacked content without the overlay — degraded, not broken.
function renderPhotoCard(params: {
  trend: TrendItem;
  ctaUrl: string;
  width: number | "100%";
  height: number;
  radius: number;
  heightClass: string;
  content: string;
}): string {
  const { trend, ctaUrl, width, height, radius, heightClass, content } = params;
  const tableWidth = width === "100%" ? "100%" : width;
  return `<table width="${tableWidth}" cellpadding="0" cellspacing="0" style="border-collapse:collapse;"><tr><td>
    <a href="${escapeHtml(ctaUrl)}" style="display:block;text-decoration:none;">
      <div class="${heightClass}" style="position:relative;width:100%;height:${height}px;border-radius:${radius}px;overflow:hidden;background-color:#1c1033;">
        ${renderBlurredBackdrop(trend, height, heightClass)}
        <div style="position:absolute;top:0;left:0;right:0;bottom:0;background:rgba(10,6,20,0.56);"></div>
        <div style="position:absolute;top:0;left:0;right:0;bottom:0;padding:16px;box-sizing:border-box;display:flex;flex-direction:column;">
          ${content}
        </div>
      </div>
    </a>
  </td></tr></table>`;
}

function renderFeaturedTrend(trend: TrendItem, ctaUrl: string): string {
  // viewBox matches the SVG's actual rendered size (90x34) exactly, so
  // there's no non-uniform stretch distorting the endpoint circle into an
  // ellipse; padding (6) is bigger than the marker radius (5) so it isn't
  // clipped top/bottom either.
  const spark = buildSparkline(trend.sparkline, 90, 34, 6, 5);
  const colors = growthColors();

  const content = `
          <table width="100%" cellpadding="0" cellspacing="0"><tr>
            <td style="vertical-align:middle;">
              <div style="display:inline-block;background:rgba(255,255,255,0.16);color:#ffffff;font-size:10px;font-weight:800;letter-spacing:1px;text-transform:uppercase;padding:5px 10px;border-radius:20px;">Veckans st&ouml;rsta trend</div>
            </td>
            <td align="right" style="vertical-align:middle;">${rankBadge(1, true)}</td>
          </tr></table>

          <div style="flex:1;"></div>

          <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:10px;"><tr><td align="center">${platformIconBadge(trend.platform, 36)}</td></tr></table>
          <div style="font-size:23px;font-weight:800;color:#ffffff;letter-spacing:-0.4px;line-height:1.25;margin-bottom:6px;text-align:center;">${escapeHtml(trend.title)}</div>
          ${trend.leadIn ? `<div style="font-size:13.5px;font-style:italic;color:rgba(255,255,255,0.85);margin-bottom:8px;text-align:center;">${escapeHtml(trend.leadIn)}</div>` : ""}
          <div style="font-size:13.5px;color:rgba(255,255,255,0.92);line-height:1.6;margin-bottom:18px;text-align:center;">${escapeHtml(trend.description)}</div>

          <table width="100%" cellpadding="0" cellspacing="0" style="table-layout:fixed;">
            <tr>
              <td style="vertical-align:bottom;word-wrap:break-word;text-align:center;">
                <span style="font-size:20px;font-weight:800;color:${colors.text};font-variant-numeric:tabular-nums;">${growthSentence(trend.growthPercent)}</span>
              </td>
              <td width="90" style="vertical-align:bottom;">
                <svg width="90" height="34" viewBox="0 0 90 34" style="display:block;margin-left:auto;">
                  <polyline points="${spark.polyline}" fill="none" stroke="${colors.stroke}" stroke-width="3"/>
                  <circle cx="${spark.last.x}" cy="${spark.last.y}" r="5" fill="${colors.stroke}"/>
                </svg>
              </td>
            </tr>
          </table>`;

  return `
      <table width="100%" cellpadding="0" cellspacing="0" class="sm-px" style="padding:22px 36px 0;">
        <tr><td>
          ${renderPhotoCard({ trend, ctaUrl, width: "100%", height: 420, radius: 20, heightClass: "sm-hero", content })}
        </td></tr>
      </table>`;
}

function renderTrendCard(trend: TrendItem, ctaUrl: string, rank: number): string {
  const colors = growthColors();

  const content = `
          <table width="100%" cellpadding="0" cellspacing="0"><tr>
            <td style="vertical-align:top;">${rankBadge(rank, false)}</td>
            <td align="right" style="vertical-align:top;">${platformIconBadge(trend.platform, 32)}</td>
          </tr></table>
                    <div style="flex:1;"></div>
                    <div style="font-size:14px;font-weight:800;color:#ffffff;line-height:1.3;margin-bottom:6px;text-align:center;height:36px;overflow:hidden;">${escapeHtml(trend.title)}</div>
                    <div style="font-size:11.5px;color:rgba(255,255,255,0.85);line-height:1.5;margin-bottom:10px;text-align:center;height:34px;overflow:hidden;">${escapeHtml(trend.description)}</div>
                    <div style="font-size:13px;font-weight:800;color:${colors.text};font-variant-numeric:tabular-nums;text-align:center;">${formatGrowth(trend.growthPercent)}</div>`;

  return renderPhotoCard({ trend, ctaUrl, width: "100%", height: 260, radius: 16, heightClass: "sm-card", content });
}

function renderTrendGrid(trends: TrendItem[], ctaUrl: string, startRank: number): string {
  const cards = trends.map((trend, i) => renderTrendCard(trend, ctaUrl, startRank + i));
  const rows: string[] = [];
  for (let i = 0; i < cards.length; i += 2) {
    const left = cards[i];
    const right = cards[i + 1];
    rows.push(`
          <table width="100%" cellpadding="0" cellspacing="0"${i > 0 ? ' style="margin-top:14px;"' : ""}>
            <tr>
              <td width="48%" style="vertical-align:top;">${left}</td>
              <td width="4%"></td>
              <td width="48%" style="vertical-align:top;">${right ?? ""}</td>
            </tr>
          </table>`);
  }
  return rows.join("\n");
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
    `Hej ${data.recipientName}`,
    "",
    `SoMe presenterar dina hetaste trender inom ${data.niche}`,
    "",
    "VECKANS STÖRSTA TREND",
    `${featured.title} (${featured.platform.toUpperCase()}). ${growthSentence(featured.growthPercent)}`,
    featured.description,
    "",
    "FLER TRENDER ATT HÅLLA KOLL PÅ",
    rows,
    "",
    `Se dina trender: ${ctaUrl}`,
    "",
    `Avsluta prenumerationen: ${unsubscribeUrl}`,
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
  const subject = `Veckans trender, vecka ${data.weekNumber}`;
  const previewText = `Veckans starkaste trend och ${rest.length} till väntar.`;

  const gridHtml = renderTrendGrid(rest, ctaUrl, 2);

  const html = `<!DOCTYPE html>
<html lang="sv">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>Veckans trender - SoMe</title>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700;800&amp;display=swap" rel="stylesheet">
<style>
  @media screen and (max-width: 480px) {
    .sm-px { padding-left: 20px !important; padding-right: 20px !important; }
    /* Keep the desktop hierarchy on mobile: the featured trend stays big
       and portrait (~9:16-ish), the other 4 stay clearly smaller — not
       the same size as the hero. They stay 2-per-row (not fully stacked). */
    .sm-hero { height: 480px !important; }
    .sm-card { height: 220px !important; }
  }
</style>
</head>
<body style="margin:0;padding:0;background:${PAGE_BG};font-family:'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
<span style="display:none;max-height:0;overflow:hidden;mso-hide:all;">${escapeHtml(previewText)}</span>
<table width="100%" cellpadding="0" cellspacing="0" style="background:${PAGE_BG};padding:36px 16px;font-family:'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

  <!-- Header band: real SoMe logo file -->
  <tr>
    <td class="sm-px" style="background-color:${CARD_BG};border-radius:20px 20px 0 0;padding:22px 36px;border-bottom:1px solid ${BORDER_SOFT};">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="vertical-align:middle;">
            <img src="${LOGO_URL}" width="110" height="61" alt="SoMe" style="display:block;width:110px;height:61px;" />
          </td>
          <td align="right" style="vertical-align:middle;font-size:10.5px;font-weight:700;color:${TEXT_MUTED};text-transform:uppercase;letter-spacing:1.2px;">Vecka ${data.weekNumber} trender</td>
        </tr>
      </table>
    </td>
  </tr>

  <!-- Card -->
  <tr>
    <td style="background:${CARD_BG};border-radius:0 0 20px 20px;box-shadow:0 1px 4px rgba(0,0,0,0.05),0 14px 36px rgba(21,11,46,0.12);">

      <!-- Intro -->
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr><td class="sm-px" style="padding:38px 36px 8px;text-align:center;">
          <div style="font-size:17px;font-weight:800;color:${TEXT_PRIMARY};margin-bottom:8px;">Hej ${escapeHtml(data.recipientName)}</div>
          <div style="font-size:26px;font-weight:800;color:${TEXT_PRIMARY};letter-spacing:-0.5px;line-height:1.3;">SoMe presenterar dina hetaste trender inom <span style="${GRADIENT_TEXT_STYLE}">${escapeHtml(data.niche)}</span></div>
        </td></tr>
      </table>

      <!-- Trend of the week: blurred photo hero -->
${renderFeaturedTrend(featured, ctaUrl)}

      <!-- Divider label -->
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr><td class="sm-px" style="padding:30px 36px 12px;">
          <div style="font-size:11px;font-weight:800;color:${TEXT_MUTED};text-transform:uppercase;letter-spacing:1.2px;text-align:center;border-bottom:1px solid ${BORDER_SOFT};padding-bottom:12px;">Fler trender att h&aring;lla koll p&aring;</div>
        </td></tr>
      </table>

      <!-- Trend grid -->
      <table width="100%" cellpadding="0" cellspacing="0" class="sm-px" style="padding:0 36px;">
        <tr><td>
${gridHtml}
        </td></tr>
      </table>

      <!-- CTA -->
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr><td class="sm-px" style="padding:34px 36px 12px;text-align:center;">
          <div style="font-size:16px;font-weight:800;color:${TEXT_PRIMARY};margin-bottom:14px;">Se vad som trendar inom <span style="${GRADIENT_TEXT_STYLE}">${escapeHtml(data.niche)}</span></div>
          <a href="${escapeHtml(ctaUrl)}" style="display:inline-block;background:${ACCENT};color:#ffffff;text-decoration:none;font-size:15px;font-weight:800;padding:16px 32px;border-radius:12px;letter-spacing:0.2px;box-shadow:0 4px 18px rgba(118,54,236,0.35);">Se dina trender &rarr;</a>
        </td></tr>
      </table>

      <!-- Footer (inside the card) -->
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr><td class="sm-px" style="padding:0 36px 36px;text-align:center;font-size:11.5px;color:${TEXT_MUTED};line-height:1.7;">
          <img src="${LOGO_URL}" width="160" height="89" alt="SoMe" style="display:block;width:160px;height:89px;margin:0 auto 18px;" />
          <div style="font-size:12px;color:${TEXT_MUTED};margin-bottom:4px;">N&auml;sta utskick kommer m&aring;ndag kl. 08:00</div>
          Du f&aring;r detta mejl varje vecka fr&aring;n SoMe.<br>
          <a href="${escapeHtml(unsubscribeUrl)}" style="color:${TEXT_MUTED};text-decoration:underline;">Avsluta prenumerationen</a>
        </td></tr>
      </table>

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
