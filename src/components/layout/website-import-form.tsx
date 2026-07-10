"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface WebsiteImportFormProps {
  domain: string;
  onSuccess?: () => void | Promise<void>;
}

function normalizeWebsiteUrlInput(input: string) {
  const trimmed = input.trim();
  if (!trimmed) return "";
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

export function WebsiteImportForm({ domain, onSuccess }: WebsiteImportFormProps) {
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const [sourceName, setSourceName] = useState("");
  const [body, setBody] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const loadPreview = async () => {
    const trimmedUrl = normalizeWebsiteUrlInput(url);
    if (!trimmedUrl) {
      setMessage("웹사이트 URL을 입력해주세요.");
      return;
    }

    setIsLoading(true);
    setMessage("");

    const response = await fetch(`/api/admin/import-url?url=${encodeURIComponent(trimmedUrl)}`);
    const result = (await response.json()) as {
      error?: string;
      data?: { title: string; description: string; siteName: string };
    };

    setIsLoading(false);

    if (!response.ok) {
      setMessage(result.error ?? "웹페이지 정보를 가져오지 못했습니다.");
      return;
    }

    setTitle(result.data?.title ?? "");
    setBody(result.data?.description ?? "");
    setSourceName(result.data?.siteName ?? "");
    setMessage("페이지 정보를 불러왔습니다. 내용을 확인한 뒤 등록하세요.");
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedUrl = normalizeWebsiteUrlInput(url);
    if (!trimmedUrl) {
      setMessage("웹사이트 URL을 입력해주세요.");
      return;
    }

    if (!title.trim()) {
      setMessage("문서명을 입력해주세요.");
      return;
    }

    const summary = body.trim() || `${title.trim()} 웹페이지`;

    setIsLoading(true);
    setMessage("");

    const response = await fetch("/api/admin/import-url", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        domain,
        url: trimmedUrl,
        title: title.trim(),
        body: summary,
        source_name: sourceName.trim() || undefined,
      }),
    });

    const result = (await response.json()) as { error?: string; message?: string };
    setIsLoading(false);
    setMessage(result.error ?? result.message ?? "등록 완료");

    if (response.ok) {
      setUrl("");
      setTitle("");
      setSourceName("");
      setBody("");
      await onSuccess?.();
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>웹사이트 등록</CardTitle>
      </CardHeader>
      <CardContent>
        <form className="grid gap-3" onSubmit={onSubmit}>
          <label className="grid gap-1 text-sm text-slate-700">
            웹사이트 URL
            <div className="flex gap-2">
              <input
                className="h-10 flex-1 rounded-md border border-slate-300 px-3"
                placeholder="https://example.com/article"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
              />
              <Button type="button" variant="outline" onClick={() => void loadPreview()} disabled={isLoading}>
                미리보기
              </Button>
            </div>
          </label>
          <label className="grid gap-1 text-sm text-slate-700">
            문서명
            <input
              className="h-10 rounded-md border border-slate-300 px-3"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </label>
          <label className="grid gap-1 text-sm text-slate-700">
            발행기관 / 사이트명
            <input
              className="h-10 rounded-md border border-slate-300 px-3"
              value={sourceName}
              onChange={(e) => setSourceName(e.target.value)}
            />
          </label>
          <label className="grid gap-1 text-sm text-slate-700">
            요약
            <textarea
              className="min-h-24 rounded-md border border-slate-300 px-3 py-2"
              value={body}
              onChange={(e) => setBody(e.target.value)}
            />
          </label>
          <Button type="submit" className="w-fit" disabled={isLoading}>
            {isLoading ? "등록 중..." : "웹사이트 등록"}
          </Button>
          {message ? <p className="text-sm text-slate-600">{message}</p> : null}
        </form>
      </CardContent>
    </Card>
  );
}
