import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", "/dashboard/", "/settings/", "/alerts/", "/api-keys/"],
    },
    sitemap: "https://cryptovision.io/sitemap.xml",
  };
}
