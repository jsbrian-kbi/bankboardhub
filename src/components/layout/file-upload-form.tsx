"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const MAX_FILE_SIZE_MB = 20;
const ACCEPTED_EXTENSIONS = ".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.hwp,.txt,.zip";

interface FileUploadFormProps {
  domain: string;
  onSuccess?: () => void | Promise<void>;
}

export function FileUploadForm({ domain, onSuccess }: FileUploadFormProps) {
  const [title, setTitle] = useState("");
  const [sourceName, setSourceName] = useState("");
  const [body, setBody] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      setMessage("문서명을 입력해주세요.");
      return;
    }

    if (!file) {
      setMessage("파일을 선택해주세요.");
      return;
    }

    if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      setMessage(`파일 크기는 ${MAX_FILE_SIZE_MB}MB 이하여야 합니다.`);
      return;
    }

    setIsLoading(true);
    setMessage("");

    const formData = new FormData();
    formData.append("file", file);
    formData.append("domain", domain);
    formData.append("title", title.trim());
    formData.append("source_name", sourceName.trim());
    formData.append("body", body.trim());

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
      await onSuccess?.();
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>파일 업로드</CardTitle>
      </CardHeader>
      <CardContent>
        <form className="grid gap-3" onSubmit={onSubmit}>
          <label className="grid gap-1 text-sm text-slate-700">
            문서명
            <input
              className="h-10 rounded-md border border-slate-300 px-3"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
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
            <textarea
              className="min-h-20 rounded-md border border-slate-300 px-3 py-2"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="비워두면 파일명으로 자동 입력됩니다."
            />
          </label>
          <label className="grid gap-1 text-sm text-slate-700">
            파일 (최대 {MAX_FILE_SIZE_MB}MB)
            <input
              type="file"
              className="text-sm"
              accept={ACCEPTED_EXTENSIONS}
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              required
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
