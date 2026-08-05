import type { TrendItem } from "./email/types";
import type { Subscriber } from "./trend-data";
import { sampleEmailRequest } from "./email/sample-data";

export const mockSubscribers: Subscriber[] = [
  {
    id: "mock-subscriber-1",
    email: "anna@example.com",
    name: sampleEmailRequest.recipientName,
    niche: sampleEmailRequest.niche,
    unsubscribeToken: "mock-token-1",
  },
];

export const mockTrendsByNiche = new Map<string, TrendItem[]>([
  [sampleEmailRequest.niche, sampleEmailRequest.trends],
]);
