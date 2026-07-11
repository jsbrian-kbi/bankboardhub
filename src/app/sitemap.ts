import type { MetadataRoute } from "next";
import { committeeMenus, topMenus } from "@/data/navigation";
import { getSiteUrl } from "@/lib/site-url";

export const dynamic = "force-dynamic";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = getSiteUrl();
  const paths = [
    "/",
    "/login",
    "/search",
    ...topMenus.map((menu) => menu.href),
    ...committeeMenus.map((slug) => `/committees/${slug}`),
  ];

  return paths.map((path) => ({
    url: `${baseUrl}${path}`,
    lastModified: new Date(),
    changeFrequency: path === "/" ? "daily" : "weekly",
    priority: path === "/" ? 1 : 0.7,
  }));
}
