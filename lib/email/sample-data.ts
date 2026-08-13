import type { GenerateEmailRequest } from "./types";

export const sampleEmailRequest: GenerateEmailRequest = {
  recipientName: "Anna",
  niche: "Fitness & Hälsa",
  weekNumber: 32,
  ctaUrl: "https://app.somesoftware.io/trends",
  unsubscribeUrl: "https://app.somesoftware.io/unsubscribe",
  trends: [
    {
      platform: "tiktok",
      title: "Fixa det själv tar fart",
      leadIn: "Tillväxten går rakt upp just nu.",
      description: "Ett ljudspår driver hela flödet just nu.",
      growthPercent: 340,
      sparkline: [8, 11, 9, 22, 17, 34, 27, 47],
      thumbnailUrl:
        "https://d8j0ntlcm91z4.cloudfront.net/user_3Dfwd9pWNUaegAimaz2JGvZ7qj7/hf_20260806_090817_1b092d7c-ea66-441e-af93-3a5dfac1d47a.png",
    },
    {
      platform: "instagram",
      title: "Oredigerat vardagsinnehåll vinner",
      description: "Rått och äkta slår det polerade.",
      growthPercent: 128,
      sparkline: [6, 9, 7, 16, 13, 20, 23],
      thumbnailUrl:
        "https://d8j0ntlcm91z4.cloudfront.net/user_3Dfwd9pWNUaegAimaz2JGvZ7qj7/hf_20260806_090817_f5100b1e-4d76-4e24-946f-5e9fa2fe9adc.png",
    },
    {
      platform: "youtube",
      title: "Tystnaden som håller kvar tittarna",
      description: "Lugna vlogs håller tittarna kvar längre.",
      growthPercent: 97,
      sparkline: [8, 7, 12, 11, 17, 15, 22],
      thumbnailUrl:
        "https://d8j0ntlcm91z4.cloudfront.net/user_3Dfwd9pWNUaegAimaz2JGvZ7qj7/hf_20260806_090349_3d6a91b4-1b5b-415c-a05d-3c4f972b08b0.png",
    },
    {
      platform: "tiktok",
      title: "Greenscreen tar över flödet",
      description: "Kreatörer bygger vidare på andras klipp.",
      growthPercent: 74,
      sparkline: [10, 12, 11, 17, 15, 19, 21],
      thumbnailUrl:
        "https://d8j0ntlcm91z4.cloudfront.net/user_3Dfwd9pWNUaegAimaz2JGvZ7qj7/hf_20260806_090817_46ab00cf-3911-4c3f-bb12-7879ed1b73d0.png",
    },
    {
      platform: "instagram",
      title: "Bilder som stoppar scrollen",
      description: "Sparandet skjuter i höjden.",
      growthPercent: 51,
      sparkline: [12, 11, 15, 14, 18, 17, 20],
      thumbnailUrl:
        "https://d8j0ntlcm91z4.cloudfront.net/user_3Dfwd9pWNUaegAimaz2JGvZ7qj7/hf_20260806_090305_a3a1ab9c-b5d2-4b87-8913-5f7bc03a2733.png",
    },
  ],
};
