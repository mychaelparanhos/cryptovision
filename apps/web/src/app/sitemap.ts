import type { MetadataRoute } from "next";
import { SUPPORTED_SYMBOLS } from "@cryptovision/shared";

const BASE_URL = "https://cryptovision.io";

export default function sitemap(): MetadataRoute.Sitemap {
  const symbolPages = SUPPORTED_SYMBOLS.map((s) => ({
    url: `${BASE_URL}/${s.toLowerCase()}`,
    lastModified: new Date(),
    changeFrequency: "hourly" as const,
    priority: 0.8,
  }));

  return [
    {
      url: BASE_URL,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${BASE_URL}/screener`,
      lastModified: new Date(),
      changeFrequency: "hourly",
      priority: 0.9,
    },
    ...symbolPages,
    {
      url: `${BASE_URL}/status`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.3,
    },
  ];
}
