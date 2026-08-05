import type { GenerateEmailRequest } from "./types";

export const sampleEmailRequest: GenerateEmailRequest = {
  recipientName: "Anna",
  niche: "Fitness & hälsa",
  weekNumber: 32,
  ctaUrl: "https://app.somesoftware.io/trends",
  unsubscribeUrl: "https://app.somesoftware.io/unsubscribe",
  trends: [
    {
      platform: "tiktok",
      title: '"Fixar det själv"-ljudet',
      description:
        "DIY-klipp med samma ljudspår tar över For You-flödet. Korta before/after-videor med snabb klippning presterar bäst just nu.",
      growthPercent: 340,
      sparkline: [8, 11, 9, 22, 17, 34, 27, 47],
    },
    {
      platform: "instagram",
      title: '"En dag i mitt liv"-reels',
      description: "Rå vardag slår det polerade — håll klippen under 30 sek.",
      growthPercent: 128,
      sparkline: [6, 9, 7, 16, 13, 20, 23],
    },
    {
      platform: "youtube",
      title: "Tysta vlogs, ASMR-klippning",
      description: "Ambient ljud ger onormalt hög tittartid i Shorts.",
      growthPercent: 97,
      sparkline: [8, 7, 12, 11, 17, 15, 22],
    },
    {
      platform: "tiktok",
      title: "Greenscreen-reaktionsdueller",
      description: "Duetter på branschnyheter — lätt att haka på.",
      growthPercent: 74,
      sparkline: [10, 12, 11, 17, 15, 19, 21],
    },
    {
      platform: "instagram",
      title: "Före/efter-karuseller",
      description: "Enkla svep-jämförelser ger stabilt sparande och delningar.",
      growthPercent: 51,
      sparkline: [12, 11, 15, 14, 18, 17, 20],
    },
  ],
};
