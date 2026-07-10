"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export interface AdminField {
  name: string;
  label: string;
}

export interface AdminColumn {
  key: string;
  label: string;
}

interface AdminCrudPageProps {
  title: string;
  description: string;
  endpoint: string;
  listEndpoint?: string;
  fields: AdminField[];
  columns: AdminColumn[];
  initialDomain?: string;
  transformPayload?: (form: Record<string, string>, domain?: string) => Record<string, unknown>;
  mapRowToForm?: (row: Record<string, unknown>) => Record<string, string>;
  getPatchPayload?: (form: Record<string, string>) => Record<string, unknown>;
}

export function AdminCrudPage({
  title,
  description,
  endpoint,
  listEndpoint,
  fields,
  columns,
  initialDomain,
  transformPayload,
  mapRowToForm,
  getPatchPayload,
}: AdminCrudPageProps) {
  const emptyForm = useMemo(
    () =>
      fields.reduce<Record<string, string>>((acc, field) => {
        acc[field.name] = "";
        return acc;
      }, {}),
    [fields],
  );

  const [form, setForm] = useState<Record<string, string>>(emptyForm);
  const [rows, setRows] = useState<Record<string, unknown>[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const fetchList = useCallback(async () => {
    const url = listEndpoint ?? endpoint;
    const response = await fetch(url, { cache: "no-store" });
    const result = (await response.json()) as { data?: Record<string, unknown>[]; error?: string };
    if (!response.ok) {
      setMessage(result.error ?? "목록 조회에 실패했습니다.");
      return;
    }
    setRows(result.data ?? []);
  }, [endpoint, listEndpoint]);

  useEffect(() => {
    void fetchList();
  }, [fetchList]);

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const payload = editingId
      ? getPatchPayload
        ? getPatchPayload(form)
        : transformPayload
          ? transformPayload(form, initialDomain)
          : { ...form }
      : transformPayload
        ? transformPayload(form, initialDomain)
        : { ...form, ...(initialDomain ? { domain: initialDomain } : {}) };

    const response = await fetch(editingId ? `${endpoint}/${editingId}` : endpoint, {
      method: editingId ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const result = (await response.json()) as { error?: string; message?: string };
    setIsLoading(false);
    setMessage(result.error ?? result.message ?? (editingId ? "수정되었습니다." : "저장되었습니다."));

    if (response.ok) {
      resetForm();
      await fetchList();
    }
  };

  const onEdit = (row: Record<string, unknown>) => {
    const nextForm = mapRowToForm
      ? mapRowToForm(row)
      : fields.reduce<Record<string, string>>((acc, field) => {
          const value = row[field.name];
          acc[field.name] = value == null ? "" : String(value);
          return acc;
        }, { ...emptyForm });
    setForm(nextForm);
    setEditingId(String(row.id));
    setMessage("");
  };

  const onDelete = async (id: string) => {
    if (!window.confirm("정말 삭제하시겠습니까?")) {
      return;
    }

    setIsLoading(true);
    const response = await fetch(`${endpoint}/${id}`, { method: "DELETE" });
    const result = (await response.json()) as { error?: string; message?: string };
    setIsLoading(false);
    setMessage(result.error ?? result.message ?? "삭제되었습니다.");

    if (response.ok) {
      if (editingId === id) {
        resetForm();
      }
      await fetchList();
    }
  };

  return (
    <div className="grid gap-6">
      <Card>
        <CardHeader>
          <CardTitle>{editingId ? `${title} 수정` : title}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-4 text-sm text-slate-600">{description}</p>
          <form className="grid gap-3" onSubmit={onSubmit}>
            {fields.map((field) => (
              <label key={field.name} className="grid gap-1 text-sm text-slate-700">
                {field.label}
                <input
                  className="h-10 rounded-md border border-slate-300 px-3"
                  placeholder={`${field.label} 입력`}
                  value={form[field.name] ?? ""}
                  onChange={(e) => setForm((prev) => ({ ...prev, [field.name]: e.target.value }))}
                />
              </label>
            ))}
            <div className="flex gap-2">
              <Button type="submit" className="w-fit" disabled={isLoading}>
                {editingId ? "수정" : "저장"}
              </Button>
              {editingId ? (
                <Button type="button" variant="outline" onClick={resetForm} disabled={isLoading}>
                  취소
                </Button>
              ) : null}
            </div>
            {message ? <p className="text-sm text-slate-600">{message}</p> : null}
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>등록 목록</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-slate-600">
                {columns.map((column) => (
                  <th key={column.key} className="px-3 py-2 font-medium">
                    {column.label}
                  </th>
                ))}
                <th className="px-3 py-2 font-medium">작업</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td className="px-3 py-4 text-slate-500" colSpan={columns.length + 1}>
                    등록된 데이터가 없습니다.
                  </td>
                </tr>
              ) : (
                rows.map((row) => (
                  <tr key={String(row.id)} className="border-b border-slate-100">
                    {columns.map((column) => (
                      <td key={column.key} className="max-w-xs truncate px-3 py-2">
                        {row[column.key] == null ? "-" : String(row[column.key])}
                      </td>
                    ))}
                    <td className="px-3 py-2">
                      <div className="flex gap-2">
                        <Button type="button" size="sm" variant="outline" onClick={() => onEdit(row)}>
                          수정
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          onClick={() => onDelete(String(row.id))}
                          disabled={isLoading}
                        >
                          삭제
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
