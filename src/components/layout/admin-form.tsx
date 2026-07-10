"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export interface AdminField {
  name: string;
  label: string;
}

interface AdminFormProps {
  title: string;
  description: string;
  endpoint: string;
  fields: AdminField[];
  initialDomain?: string;
}

export function AdminForm({ title, description, endpoint, fields, initialDomain }: AdminFormProps) {
  const initialState = useMemo(
    () =>
      fields.reduce<Record<string, string>>((acc, field) => {
        acc[field.name] = "";
        return acc;
      }, {}),
    [fields],
  );

  const [form, setForm] = useState<Record<string, string>>(initialState);
  const [message, setMessage] = useState("");

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = { ...form, domain: initialDomain };

    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const result = (await response.json()) as { error?: string; message?: string };
    setMessage(result.error ?? result.message ?? "저장되었습니다.");

    if (response.ok) {
      setForm(initialState);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
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
          <Button type="submit" className="w-fit">저장</Button>
          {message ? <p className="text-sm text-slate-600">{message}</p> : null}
        </form>
      </CardContent>
    </Card>
  );
}
