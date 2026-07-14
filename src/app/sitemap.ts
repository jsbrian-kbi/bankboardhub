import type { MetadataRoute } from "next";
import { committeeMenus, topMenus } from "@/data/navigation";
import { getDocumentsByDomain } from "@/lib/public-data";
import { getSiteUrl } from "@/lib/site-url";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = getSiteUrl();
  const paths = [
    "/",
    "/login",
    "/search",
    ...topMenus.map((menu) => menu.href),
    ...committeeMenus.map((slug) => `/committees/${slug}`),
  ];

  const news = await getDocumentsByDomain("news", 100);

  return [
    ...paths.map((path) => ({
      url: `${baseUrl}${path}`,
      lastModified: new Date(),
      changeFrequency: (path === "/" ? "daily" : "weekly") as "daily" | "weekly",
      priority: path === "/" ? 1 : 0.7,
    })),
    ...news.map((item) => ({
      url: `${baseUrl}/news/${item.id}`,
      lastModified: new Date(item.created_at),
      changeFrequency: "weekly" as const,
      priority: 0.6,
    })),
  ];
}
