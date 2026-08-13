export interface TrendItem {
  platform: string;
  title: string;
  /** Short italic teaser shown above the description on the featured trend only. */
  leadIn?: string;
  description: string;
  growthPercent: number;
  /** Weekly data points, oldest first. Needs at least 2 values. */
  sparkline: number[];
  /** Content thumbnail. Falls back to a colored platform tile when omitted. */
  thumbnailUrl?: string;
}

export interface GenerateEmailRequest {
  recipientName: string;
  niche: string;
  weekNumber: number;
  /** First item is featured as "trend of the week"; the rest are listed below it. */
  trends: TrendItem[];
  ctaUrl?: string;
  unsubscribeUrl?: string;
  /** Defaults to the SoMe trend report sender if omitted. */
  fromName?: string;
  fromEmail?: string;
  replyTo?: string;
}

export interface GenerateEmailResponse {
  subject: string;
  previewText: string;
  html: string;
  text: string;
  fromName: string;
  fromEmail: string;
  replyTo: string;
}
