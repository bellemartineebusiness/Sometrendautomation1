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
const PLATFORM_TILE_FALLBACK_COLORS: Record<string, string> = {
  tiktok: "#111827",
  instagram: "#c13584",
  youtube: "#ff0000",
};

function platformTileStyle(platform: string): string {
  return PLATFORM_TILE_STYLES[platform.toLowerCase()] ?? DEFAULT_TILE_STYLE;
}

// VML's <v:fill color> only accepts a flat color, not a CSS gradient —
// used for the Outlook-only background fallback.
function platformTileFallbackColor(platform: string): string {
  return PLATFORM_TILE_FALLBACK_COLORS[platform.toLowerCase()] ?? ACCENT;
}

// Platform glyphs as real PNG files (not inline <svg>) — Gmail strips inline
// SVG markup entirely out of email HTML during its sanitization pass, so
// icons rendered as <svg> silently vanish in Gmail (web and app) even
// though they render fine in a plain browser. PNGs referenced by URL are
// universally supported instead. Same reasoning as LOGO_URL: must be an
// absolute URL, a mail client can't resolve a relative path.
const ICON_BASE_URL = "https://sometrendautomation1-6anu.vercel.app/icons";
const PLATFORM_ICON_URLS: Record<string, string> = {
  tiktok: `${ICON_BASE_URL}/tiktok.png`,
  instagram: `${ICON_BASE_URL}/instagram.png`,
  youtube: `${ICON_BASE_URL}/youtube.png`,
};

const FIRST_BG = ACCENT;
const FIRST_TEXT = "#ffffff";
const RANK_BG = "rgba(255,255,255,0.92)";
const RANK_TEXT = TEXT_PRIMARY;

function rankBadge(rank: number, isFirst: boolean): string {
  const size = isFirst ? 26 : 22;
  // Outlook desktop doesn't understand rgba() and drops the whole
  // declaration — a solid hex declared first is kept as the fallback there,
  // while clients that do support rgba() apply the second (translucent)
  // declaration since it comes later in the same style attribute.
  const bg = isFirst ? `background-color:${FIRST_BG};` : `background-color:#f3f0fb;background-color:${RANK_BG};`;
  const color = isFirst ? FIRST_TEXT : RANK_TEXT;
  return `<table cellpadding="0" cellspacing="0" style="width:${size}px;"><tr><td width="${size}" height="${size}" align="center" valign="middle" style="${bg}border-radius:50%;font-size:${isFirst ? 13 : 11}px;font-weight:800;color:${color};box-shadow:0 2px 6px rgba(0,0,0,0.25);">${rank}</td></tr></table>`;
}

function platformIconBadge(platform: string, size: number): string {
  const key = platform.toLowerCase();
  const iconUrl = PLATFORM_ICON_URLS[key];
  const iconLabel = key.charAt(0).toUpperCase() + key.slice(1);
  const glyphSize = Math.round(size * 0.58);
  const glyph = iconUrl
    ? `<img src="${iconUrl}" width="${glyphSize}" height="${glyphSize}" alt="${iconLabel}" style="display:block;width:${glyphSize}px;height:${glyphSize}px;max-width:100%;" />`
    : `<div style="width:${Math.round(glyphSize * 0.5)}px;height:${Math.round(glyphSize * 0.5)}px;border-radius:50%;background:#fff;"></div>`;
  return `<table cellpadding="0" cellspacing="0" style="width:${size}px;"><tr><td width="${size}" height="${size}" align="center" valign="middle" style="${platformTileStyle(platform)}border-radius:${Math.round(size * 0.28)}px;box-shadow:0 2px 6px rgba(0,0,0,0.25);">
    ${glyph}
  </td></tr></table>`;
}

// CSS filter:blur() isn't reliably supported across mail clients (Outlook
// drops it entirely, some Gmail app versions ignore it), so instead of
// blurring in CSS we bake the blur into the image itself via images.weserv.nl
// (a free public image proxy). The served bytes are already blurred, so
// every client renders it identically — no CSS feature support required.
function blurredThumbnailUrl(url: string, pixelWidth: number): string {
  const proxied = new URL("https://images.weserv.nl/");
  proxied.searchParams.set("url", url);
  proxied.searchParams.set("w", String(pixelWidth * 2)); // 2x for retina
  proxied.searchParams.set("fit", "cover");
  proxied.searchParams.set("blur", "12");
  return proxied.toString();
}

function growthColors() {
  // Lighter tint of the brand purple (not the raw ACCENT hex) for contrast
  // against the dark photo-card overlay the number and sparkline sit on.
  return { text: "#c4b5fd", stroke: "#c4b5fd" };
}

// The sparkline was inline <svg> like the platform icons — same problem,
// same fix: render it server-side (via QuickChart's free chart-image API)
// and use a plain <img>, since Gmail strips <svg> out of email HTML.
function sparklineImageUrl(values: number[], color: string, width: number, height: number): string {
  const pointRadius = values.map((_, i) => (i === values.length - 1 ? 5 : 0));
  const config = {
    type: "line",
    data: {
      labels: values.map((_, i) => i),
      datasets: [
        {
          data: values,
          borderColor: color,
          borderWidth: 3,
          fill: false,
          tension: 0.3,
          pointRadius,
          pointBackgroundColor: color,
          pointBorderWidth: 0,
        },
      ],
    },
    options: {
      responsive: false,
      legend: { display: false },
      scales: { xAxes: [{ display: false }], yAxes: [{ display: false }] },
      layout: { padding: 2 },
    },
  };
  const params = new URLSearchParams({
    w: String(width),
    h: String(height),
    devicePixelRatio: "2",
    bkg: "transparent",
    c: JSON.stringify(config),
  });
  return `https://quickchart.io/chart?${params.toString()}`;
}

function formatGrowth(percent: number): string {
  const sign = percent > 0 ? "+" : "";
  return `${sign}${percent}%`;
}

function growthSentence(percent: number): string {
  const verb = percent >= 0 ? "ökning" : "minskning";
  return `${formatGrowth(percent)} ${verb} senaste veckan`;
}

// Shared "photo card" shell: copy sits in normal table flow, layered on top
// of a real HTML/CSS background image via nested tables — no
// position:absolute, no flexbox. Both of those silently drop the overlay in
// the Gmail app (and degrade in Outlook), leaving a bare photo with none of
// the text visible. A background-image `<td>` with the content in an
// ordinary nested table renders correctly everywhere, including Gmail app.
function renderPhotoCard(params: {
  trend: TrendItem;
  ctaUrl: string;
  height: number;
  widthPx: number;
  radius: number;
  heightClass: string;
  content: string;
}): string {
  const { trend, ctaUrl, height, widthPx, radius, heightClass, content } = params;
  const thumb = trend.thumbnailUrl ? blurredThumbnailUrl(trend.thumbnailUrl, 600) : undefined;
  const bgImageCss = thumb
    ? `background-image:url('${escapeHtml(thumb)}');background-size:cover;background-position:center;`
    : "";
  const bgAttr = thumb ? ` background="${escapeHtml(thumb)}"` : "";
  // Outlook desktop (Word engine) renders the `background` attribute
  // unreliably — it can tile or misalign instead of cropping to cover like
  // CSS background-size:cover does. VML (mso-only, ignored by every other
  // client) gives it a precise, cropped fill instead of the default.
  const vmlFill = thumb
    ? `<v:fill type="frame" src="${escapeHtml(thumb)}" color="#1c1033" />`
    : `<v:fill color="${platformTileFallbackColor(trend.platform)}" />`;

  return `<table width="100%" cellpadding="0" cellspacing="0" style="table-layout:fixed;border-collapse:separate;box-shadow:0 8px 24px rgba(21,11,46,0.22);border-radius:${radius}px;">
    <tr>
      <td class="${heightClass}"${bgAttr} bgcolor="#1c1033" height="${height}" style="${platformTileStyle(trend.platform)}${bgImageCss}background-color:#1c1033;border-radius:${radius}px;height:${height}px;">
        <!--[if mso]>
        <v:rect xmlns:v="urn:schemas-microsoft-com:vml" fill="true" stroke="false" style="width:${widthPx}px;height:${height}px;">
        ${vmlFill}
        <v:textbox inset="0,0,0,0">
        <![endif]-->
        <a href="${escapeHtml(ctaUrl)}" style="display:block;text-decoration:none;">
          <table width="100%" cellpadding="0" cellspacing="0" style="table-layout:fixed;background-color:#150b28;background-color:rgba(10,6,20,0.56);border-radius:${radius}px;">
            <tr><td style="padding:16px;">
              ${content}
            </td></tr>
          </table>
        </a>
        <!--[if mso]>
        </v:textbox>
        </v:rect>
        <![endif]-->
      </td>
    </tr>
  </table>`;
}

function renderFeaturedTrend(trend: TrendItem, ctaUrl: string): string {
  const colors = growthColors();
  const sparkUrl = sparklineImageUrl(trend.sparkline, colors.stroke, 90, 34);

  // Mobile-first base (480px, enhanced to 420px on wider screens by the
  // .sm-hero media query) minus the 16px top+bottom padding.
  const heroInnerHeight = 480 - 32;

  const topRow = `
          <table width="100%" cellpadding="0" cellspacing="0"><tr>
            <td style="vertical-align:middle;">
              <div style="display:inline-block;background-color:#3a2f52;background-color:rgba(255,255,255,0.16);color:#ffffff;font-size:10px;font-weight:800;letter-spacing:1px;text-transform:uppercase;padding:5px 10px;border-radius:20px;">Veckans st&ouml;rsta trend</div>
            </td>
            <td align="right" style="vertical-align:middle;">${rankBadge(1, true)}</td>
          </tr></table>`;

  const bottomBlock = `
          <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:10px;"><tr><td align="center">${platformIconBadge(trend.platform, 36)}</td></tr></table>
          <div style="font-size:23px;font-weight:800;color:#ffffff;letter-spacing:-0.4px;line-height:1.25;margin-bottom:6px;text-align:center;">${escapeHtml(trend.title)}</div>
          ${trend.leadIn ? `<div style="font-size:13.5px;font-style:italic;color:#f1edfb;color:rgba(255,255,255,0.85);margin-bottom:8px;text-align:center;">${escapeHtml(trend.leadIn)}</div>` : ""}
          <div style="font-size:13.5px;color:#f8f7fd;color:rgba(255,255,255,0.92);line-height:1.6;margin-bottom:18px;text-align:center;">${escapeHtml(trend.description)}</div>

          <table width="100%" cellpadding="0" cellspacing="0" style="table-layout:fixed;">
            <tr>
              <td style="vertical-align:middle;word-wrap:break-word;text-align:center;">
                <span style="font-size:20px;font-weight:800;color:${colors.text};font-variant-numeric:tabular-nums;">${growthSentence(trend.growthPercent)}</span>
              </td>
              <td width="90" style="vertical-align:middle;">
                <img src="${sparkUrl}" width="90" height="34" alt="Trendkurva senaste veckan" style="display:block;margin-left:auto;width:90px;height:34px;max-width:100%;" />
              </td>
            </tr>
          </table>`;

  // Top row pinned to the top, bottom block pinned to the bottom of the card
  // (via plain table valign, not flexbox) — same "text hugs the bottom of
  // the photo" look as before, just built out of ordinary table rows.
  const content = `
          <table width="100%" height="${heroInnerHeight}" class="sm-hero-inner" cellpadding="0" cellspacing="0" style="table-layout:fixed;">
            <tr><td valign="top">${topRow}</td></tr>
            <tr><td valign="bottom">${bottomBlock}</td></tr>
          </table>`;

  return `
      <table width="100%" cellpadding="0" cellspacing="0" class="sm-px" style="padding:22px 20px 0;">
        <tr><td>
          ${renderPhotoCard({ trend, ctaUrl, height: 480, widthPx: 528, radius: 20, heightClass: "sm-hero", content })}
        </td></tr>
      </table>`;
}

function renderTrendCard(trend: TrendItem, ctaUrl: string, rank: number): string {
  const colors = growthColors();
  // Mobile-first base (220px, enhanced to 260px on wider screens).
  const cardInnerHeight = 220 - 32;

  const topRow = `
          <table width="100%" cellpadding="0" cellspacing="0"><tr>
            <td style="vertical-align:top;">${rankBadge(rank, false)}</td>
            <td align="right" style="vertical-align:top;">${platformIconBadge(trend.platform, 32)}</td>
          </tr></table>`;

  const bottomBlock = `
                    <div style="font-size:14px;font-weight:800;color:#ffffff;line-height:1.3;margin-bottom:6px;text-align:center;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${escapeHtml(trend.title)}</div>
                    <div style="font-size:11.5px;color:#f1edfb;color:rgba(255,255,255,0.85);line-height:1.5;margin-bottom:10px;text-align:center;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${escapeHtml(trend.description)}</div>
                    <div style="font-size:13px;font-weight:800;color:${colors.text};font-variant-numeric:tabular-nums;text-align:center;">${formatGrowth(trend.growthPercent)}</div>`;

  const content = `
          <table width="100%" height="${cardInnerHeight}" class="sm-card-inner" cellpadding="0" cellspacing="0" style="table-layout:fixed;">
            <tr><td valign="top">${topRow}</td></tr>
            <tr><td valign="bottom">${bottomBlock}</td></tr>
          </table>`;

  return renderPhotoCard({ trend, ctaUrl, height: 220, widthPx: 253, radius: 16, heightClass: "sm-card", content });
}

function renderTrendGrid(trends: TrendItem[], ctaUrl: string, startRank: number): string {
  const cards = trends.map((trend, i) => renderTrendCard(trend, ctaUrl, startRank + i));
  const rows: string[] = [];
  for (let i = 0; i < cards.length; i += 2) {
    const left = cards[i];
    const right = cards[i + 1];
    rows.push(`
          <table width="100%" cellpadding="0" cellspacing="0" style="table-layout:fixed;${i > 0 ? "margin-top:14px;" : ""}">
            <tr>
              <!-- Gutter as padding on the card cells themselves, not a
                   separate empty spacer cell — an empty cell (even with a
                   fixed pixel width) rendered inconsistently between rows
                   in the Gmail app, sometimes collapsing to 0. Padding on
                   a cell that already holds content is far more reliable. -->
              <!-- Padding lives on an inner 100%-wide table, not on the
                   50%-width outer <td> itself — table cells add padding on
                   top of their specified width (no border-box), so padding
                   directly on a width="50%" cell made the row overflow its
                   container by 2x the padding, causing a sliver of
                   horizontal overflow at the edge in the Gmail app.
                   table-layout:fixed on every table in this chain is what
                   actually makes any of this hold: without it, the
                   white-space:nowrap title/description inside each card
                   reports its full unwrapped text width as the table's
                   required content width, and every ancestor table quietly
                   grows to fit it instead of respecting the 50% column —
                   the real cause of the page-wide horizontal overflow. -->
              <td width="50%" style="vertical-align:top;">
                <table width="100%" cellpadding="0" cellspacing="0" style="table-layout:fixed;"><tr><td style="padding-right:7px;">${left}</td></tr></table>
              </td>
              <td width="50%" style="vertical-align:top;">
                <table width="100%" cellpadding="0" cellspacing="0" style="table-layout:fixed;"><tr><td style="padding-left:7px;">${right ?? ""}</td></tr></table>
              </td>
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
    "Veckans trender",
    "",
    `Hej ${data.recipientName}, vi på SoMe har plockat ut veckans hetaste trender till dig inom ${data.niche}.`,
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
<meta name="color-scheme" content="light only">
<meta name="supported-color-schemes" content="light only">
<title>Veckans trender - SoMe</title>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700;800&amp;display=swap" rel="stylesheet">
<style>
  /* Force light-mode colors even when Gmail/Apple Mail apply automatic
     dark-mode recoloring — without this, backgrounds and text get
     inverted/adjusted in ways that can make buttons and text unreadable. */
  :root { color-scheme: light only; supported-color-schemes: light only; }
  [data-ogsc] .force-light-bg { background-color: inherit !important; }
  @media (prefers-color-scheme: dark) {
    body, .email-bg { background: #f3effa !important; }
    .card-bg { background: #ffffff !important; color: #150B2E !important; }
    .cta-btn { background: #7636ec !important; color: #ffffff !important; }
  }
  /* Mobile-first: the base inline values below (20px padding, shorter
     cards) are the ones every client sees, including Gmail iOS — which is
     known to strip <style> blocks entirely, unlike Gmail Android/web. This
     query only ENHANCES to roomier desktop spacing on wider screens, so a
     client that ignores <style> falls back to the safe mobile layout
     instead of an unadapted desktop one that could overflow/misalign. */
  @media screen and (min-width: 481px) {
    .sm-px { padding-left: 36px !important; padding-right: 36px !important; }
    .sm-hero { height: 420px !important; }
    .sm-card { height: 260px !important; }
    .sm-hero-inner { height: 388px !important; }
    .sm-card-inner { height: 228px !important; }
  }
</style>
<!--[if mso]>
<style type="text/css">
  /* Outlook desktop always renders at a fixed, desktop-like width and
     doesn't reliably support @media queries, so the mobile-first base
     values above would otherwise stick there too. mso conditional
     comments (unlike @media) are reliably parsed by Outlook and ignored
     as a plain HTML comment by every other client, so this is a safe,
     Outlook-only way to restore the roomier desktop spacing there. */
  .sm-px { padding-left: 36px !important; padding-right: 36px !important; }
  .sm-hero { height: 420px !important; }
  .sm-card { height: 260px !important; }
  .sm-hero-inner { height: 388px !important; }
  .sm-card-inner { height: 228px !important; }
</style>
<![endif]-->
</head>
<body class="email-bg" style="margin:0;padding:0;background:${PAGE_BG};font-family:'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
<span style="display:none;max-height:0;overflow:hidden;mso-hide:all;">${escapeHtml(previewText)}</span>
<table width="100%" cellpadding="0" cellspacing="0" class="email-bg" style="width:100%;box-sizing:border-box;background:${PAGE_BG};padding:36px 16px;font-family:'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
<tr><td align="center">
<table cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

  <!-- Header band: real SoMe logo file -->
  <tr>
    <td class="sm-px card-bg" bgcolor="${CARD_BG}" style="background-color:${CARD_BG};border-radius:20px 20px 0 0;padding:22px 20px;border-bottom:1px solid ${BORDER_SOFT};">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="vertical-align:middle;">
            <img src="${LOGO_URL}" width="110" height="61" alt="SoMe" style="display:block;width:110px;height:61px;max-width:100%;" />
          </td>
          <td align="right" style="vertical-align:middle;font-size:10.5px;font-weight:700;color:${TEXT_MUTED};text-transform:uppercase;letter-spacing:1.2px;">Trender</td>
        </tr>
      </table>
    </td>
  </tr>

  <!-- Card -->
  <tr>
    <td class="card-bg" bgcolor="${CARD_BG}" style="background:${CARD_BG};border-radius:0 0 20px 20px;box-shadow:0 1px 4px rgba(0,0,0,0.05),0 14px 36px rgba(21,11,46,0.12);">

      <!-- Intro -->
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr><td class="sm-px" style="padding:38px 20px 8px;text-align:center;">
          <div style="font-size:26px;font-weight:800;color:${TEXT_PRIMARY};letter-spacing:-0.5px;line-height:1.3;">Veckans trender</div>
          <div style="font-size:15px;font-weight:500;color:${TEXT_MUTED};line-height:1.6;margin-top:10px;">Hej ${escapeHtml(data.recipientName)}, vi p&aring; SoMe har plockat ut veckans hetaste trender till dig inom <span style="${GRADIENT_TEXT_STYLE}">${escapeHtml(data.niche)}</span>.</div>
        </td></tr>
      </table>

      <!-- Trend of the week: blurred photo hero -->
${renderFeaturedTrend(featured, ctaUrl)}

      <!-- Divider label -->
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr><td class="sm-px" style="padding:30px 20px 12px;">
          <div style="font-size:11px;font-weight:800;color:${TEXT_MUTED};text-transform:uppercase;letter-spacing:1.2px;text-align:center;border-bottom:1px solid ${BORDER_SOFT};padding-bottom:12px;">Fler trender att h&aring;lla koll p&aring;</div>
        </td></tr>
      </table>

      <!-- Trend grid -->
      <table width="100%" cellpadding="0" cellspacing="0" class="sm-px" style="padding:0 20px;">
        <tr><td>
${gridHtml}
        </td></tr>
      </table>

      <!-- CTA -->
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr><td class="sm-px" style="padding:34px 20px 12px;text-align:center;">
          <div style="font-size:16px;font-weight:800;color:${TEXT_PRIMARY};margin-bottom:14px;">Se vad som trendar inom <span style="${GRADIENT_TEXT_STYLE}">${escapeHtml(data.niche)}</span></div>
          <!-- Bulletproof button: padding lives on the <td>, not the <a>,
               since Outlook desktop often ignores padding on anchor tags
               and shrinks the tap target. VML rounded-rect gives Outlook a
               reliable filled, rounded, clickable shape underneath. -->
          <table cellpadding="0" cellspacing="0" style="margin:0 auto;">
            <tr>
              <td align="center" bgcolor="${ACCENT}" style="background-color:${ACCENT};border-radius:12px;box-shadow:0 4px 18px rgba(118,54,236,0.35);">
                <!--[if mso]>
                <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="${escapeHtml(ctaUrl)}" style="height:52px;v-text-anchor:middle;width:220px;" arcsize="23%" stroke="f" fillcolor="${ACCENT}">
                <w:anchorlock/>
                <center>
                <![endif]-->
                <a href="${escapeHtml(ctaUrl)}" class="cta-btn" style="display:inline-block;background-color:${ACCENT};color:#ffffff;text-decoration:none;font-size:15px;font-weight:800;line-height:20px;padding:16px 32px;letter-spacing:0.2px;border-radius:12px;">Se dina trender &rarr;</a>
                <!--[if mso]>
                </center>
                </v:roundrect>
                <![endif]-->
              </td>
            </tr>
          </table>
        </td></tr>
      </table>

      <!-- Footer (inside the card) -->
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr><td class="sm-px" style="padding:0 20px 36px;text-align:center;font-size:11.5px;color:${TEXT_MUTED};line-height:1.7;">
          <img src="${LOGO_URL}" width="160" height="89" alt="SoMe" style="display:block;width:160px;height:89px;max-width:100%;margin:0 auto 18px;" />
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
