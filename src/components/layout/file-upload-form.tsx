"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const MAX_FILE_SIZE_MB = 50;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;
const UPLOAD_TIMEOUT_MS = 180_000;
const ACCEPTED_EXTENSIONS = ".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.hwp,.txt,.zip";

interface FileUploadFormProps {
  domain: string;
  onSuccess?: () => void | Promise<void>;
}

interface SignResponse {
  path: string;
  signedUrl: string;
  publicUrl: string;
  domain: string;
  title: string;
  source_name: string | null;
  body: string;
  contentType: string;
}

async function readErrorMessage(response: Response) {
  const contentType = response.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    const payload = (await response.json()) as { error?: string; message?: string };
    return payload.error ?? payload.message ?? `요청 실패 (${response.status})`;
  }

  const text = await response.text();
  if (response.status === 401 || response.status === 403) {
    return "로그인이 필요합니다. 다시 로그인한 뒤 업로드해주세요.";
  }
  return text.slice(0, 160) || `요청 실패 (${response.status})`;
}

function formatBytes(bytes: number) {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}

async function uploadToSignedUrl(signedUrl: string, file: File, contentType: string) {
  const response = await fetch(signedUrl, {
    method: "PUT",
    headers: {
      "Content-Type": contentType,
      "x-upsert": "false",
    },
    body: file,
    signal: AbortSignal.timeout(UPLOAD_TIMEOUT_MS),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(`파일 전송 실패 (${response.status})${detail ? `: ${detail.slice(0, 120)}` : ""}`);
  }
}

export function FileUploadForm({ domain, onSuccess }: FileUploadFormProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [title, setTitle] = useState("");
  const [sourceName, setSourceName] = useState("");
  const [body, setBody] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const nextFile = e.target.files?.[0] ?? null;
    if (!nextFile) {
      setFile(null);
      return;
    }

    if (nextFile.size > MAX_FILE_SIZE_BYTES) {
      setFile(null);
      setMessage(`파일 크기는 ${MAX_FILE_SIZE_MB}MB 이하여야 합니다. (현재 ${formatBytes(nextFile.size)})`);
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    setFile(nextFile);
    setMessage("");
    if (!title.trim()) {
      setTitle(nextFile.name.replace(/\.[^.]+$/, ""));
    }
  };

  const clearFile = () => {
    setFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      setMessage("문서명을 입력해주세요.");
      return;
    }

    if (!file) {
      setMessage("아래에서 첨부할 파일을 먼저 선택해주세요.");
      fileInputRef.current?.focus();
      return;
    }

    setIsLoading(true);
    setMessage("");
    setStatus("업로드 준비 중...");

    try {
      setStatus("업로드 권한 확인 중...");
      const signResponse = await fetch("/api/admin/upload/sign", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          domain,
          title: title.trim(),
          fileName: file.name,
          contentType: file.type || "application/octet-stream",
          fileSize: file.size,
          source_name: sourceName.trim() || undefined,
          body: body.trim() || undefined,
        }),
        signal: AbortSignal.timeout(30_000),
      });

      if (!signResponse.ok) {
        setMessage(await readErrorMessage(signResponse));
        return;
      }

      const signed = (await signResponse.json()) as SignResponse;
      if (!signed.signedUrl || !signed.path) {
        setMessage("업로드 URL 발급에 실패했습니다. 서버를 재시작한 뒤 다시 시도해주세요.");
        return;
      }

      setStatus(`파일 전송 중... (${formatBytes(file.size)})`);
      await uploadToSignedUrl(
        signed.signedUrl,
        file,
        signed.contentType || file.type || "application/octet-stream",
      );

      setStatus("자료실에 등록 중...");
      const completeResponse = await fetch("/api/admin/upload/complete", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          path: signed.path,
          domain: signed.domain,
          title: signed.title,
          source_name: signed.source_name,
          body: signed.body,
          publicUrl: signed.publicUrl,
        }),
        signal: AbortSignal.timeout(30_000),
      });

      if (!completeResponse.ok) {
        setMessage(await readErrorMessage(completeResponse));
        return;
      }

      const result = (await completeResponse.json()) as { message?: string };
      setMessage(result.message ?? "파일이 업로드되어 등록되었습니다.");
      setTitle("");
      setSourceName("");
      setBody("");
      clearFile();
      await onSuccess?.();
    } catch (error) {
      if (error instanceof DOMException && error.name === "TimeoutError") {
        setMessage(`업로드 시간이 초과되었습니다. ${MAX_FILE_SIZE_MB}MB 이하 파일로 다시 시도해주세요.`);
      } else if (error instanceof Error && /Failed to fetch|NetworkError/i.test(error.message)) {
        setMessage("네트워크 오류로 업로드에 실패했습니다. 연결 상태를 확인한 뒤 다시 시도해주세요.");
      } else {
        setMessage(error instanceof Error ? error.message : "업로드 중 오류가 발생했습니다.");
      }
    } finally {
      setIsLoading(false);
      setStatus("");
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>파일 업로드</CardTitle>
      </CardHeader>
      <CardContent>
        <form className="grid gap-3" onSubmit={onSubmit}>
          <p className="text-xs text-slate-500">
            PDF, Word, Excel, PPT, HWP, ZIP 등 · 파일 1개당 최대 {MAX_FILE_SIZE_MB}MB
          </p>

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

          <div className="grid gap-2 rounded-md border border-slate-200 bg-slate-50 p-3">
            <label className="grid gap-2 text-sm font-medium text-slate-800">
              1. 첨부 파일 선택 (최대 {MAX_FILE_SIZE_MB}MB)
              <input
                ref={fileInputRef}
                type="file"
                accept={ACCEPTED_EXTENSIONS}
                onChange={onFileChange}
                disabled={isLoading}
                className="block w-full cursor-pointer text-sm file:mr-3 file:cursor-pointer file:rounded-md file:border-0 file:bg-slate-900 file:px-3 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-slate-800"
              />
            </label>
            {file ? (
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600">
                <span>
                  선택됨: <strong className="text-slate-900">{file.name}</strong> ({formatBytes(file.size)})
                </span>
                <Button type="button" variant="ghost" size="sm" onClick={clearFile} disabled={isLoading}>
                  선택 해제
                </Button>
              </div>
            ) : (
              <p className="text-xs text-slate-500">위의 &quot;파일 선택&quot; / Choose File 을 눌러 파일을 고르세요.</p>
            )}
          </div>

          <Button type="submit" className="w-fit" disabled={isLoading || !file}>
            {isLoading ? "업로드 중..." : "2. 업로드 실행"}
          </Button>

          {status ? <p className="text-sm text-slate-500">{status}</p> : null}
          {message ? <p className="text-sm text-slate-600">{message}</p> : null}
        </form>
      </CardContent>
    </Card>
  );
}
