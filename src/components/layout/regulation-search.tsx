"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

const lawFilters = [
  "상법",
  "금융회사지배구조법",
  "은행법",
  "금융지주회사법",
  "금융소비자보호법",
  "자본시장법",
  "개인정보보호법",
  "AI 기본법",
];

export function RegulationSearch() {
  const router = useRouter();
  const [query, setQuery] = useState("");

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    if (!q) {
      return;
    }
    router.push(`/search?q=${encodeURIComponent(q)}`);
  };

  return (
    <div className="space-y-4">
      <form onSubmit={onSubmit} className="flex gap-2">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="조문·키워드 검색 (예: 사외이사, 내부통제)"
          className="h-11 flex-1 rounded-md border border-slate-300 px-3 text-sm"
        />
        <Button type="submit">검색</Button>
      </form>
      <div className="flex flex-wrap gap-2">
        {lawFilters.map((law) => (
          <button
            key={law}
            type="button"
            onClick={() => router.push(`/search?q=${encodeURIComponent(law)}`)}
            className="rounded-full border border-slate-300 bg-white px-3 py-1 text-xs text-slate-700 hover:bg-slate-50"
          >
            {law}
          </button>
        ))}
      </div>
    </div>
  );
}
