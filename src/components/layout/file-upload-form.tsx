"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function FileUploadForm() {
  const [title, setTitle] = useState("");
  const [sourceName, setSourceName] = useState("");
  const [body, setBody] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!file) {
      setMessage("파일을 선택해주세요.");
      return;
    }

    setIsLoading(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("title", title);
    formData.append("source_name", sourceName);
    formData.append("body", body);

    const response = await fetch("/api/admin/upload", {
      method: "POST",
      body: formData,
    });

    const result = (await response.json()) as { error?: string; message?: string };
    setIsLoading(false);
    setMessage(result.error ?? result.message ?? "업로드 완료");

    if (response.ok) {
      setTitle("");
      setSourceName("");
      setBody("");
      setFile(null);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>파일 업로드 (Supabase Storage)</CardTitle>
      </CardHeader>
      <CardContent>
        <form className="grid gap-3" onSubmit={onSubmit}>
          <label className="grid gap-1 text-sm text-slate-700">
            문서명
            <input
              className="h-10 rounded-md border border-slate-300 px-3"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </label>
          <label className="grid gap-1 text-sm text-slate-700">
            발행기관
            <input
              className="h-10 rounded-md border border-slate-300 px-3"
              value={sourceName}
              onChange={(e) => setSourceName(e.target.value)}
            />
          </label>
          <label className="grid gap-1 text-sm text-slate-700">
            요약
            <input
              className="h-10 rounded-md border border-slate-300 px-3"
              value={body}
              onChange={(e) => setBody(e.target.value)}
            />
          </label>
          <label className="grid gap-1 text-sm text-slate-700">
            파일 (PDF, DOCX, XLSX 등)
            <input
              type="file"
              className="text-sm"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
          </label>
          <Button type="submit" className="w-fit" disabled={isLoading}>
            {isLoading ? "업로드 중..." : "파일 업로드"}
          </Button>
          {message ? <p className="text-sm text-slate-600">{message}</p> : null}
        </form>
      </CardContent>
    </Card>
  );
}
