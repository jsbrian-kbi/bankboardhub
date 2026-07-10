"use client";

import { useState } from "react";
import { AdminColumn, AdminCrudPage, AdminField } from "@/components/layout/admin-crud-page";
import { FileUploadForm } from "@/components/layout/file-upload-form";
import { WebsiteImportForm } from "@/components/layout/website-import-form";
import { getSourceTypeLabel } from "@/lib/content-domains";
import type { ContentDomain } from "@/lib/content-domains";

interface AdminContentManagerProps {
  title: string;
  description: string;
  domain: ContentDomain;
  publicPath?: string;
  initialRows: Record<string, unknown>[];
  fields: AdminField[];
  columns: AdminColumn[];
  crudTitle?: string;
  crudDescription?: string;
}

export function AdminContentManager({
  title,
  description,
  domain,
  publicPath,
  initialRows,
  fields,
  columns,
  crudTitle = "등록 콘텐츠 관리",
  crudDescription = "등록된 문서·웹사이트를 수정하거나 삭제할 수 있습니다.",
}: AdminContentManagerProps) {
  const [listVersion, setListVersion] = useState(0);

  const refreshList = async () => {
    setListVersion((current) => current + 1);
  };

  const listColumns = columns.some((column) => column.key === "source_type")
    ? columns
    : [...columns, { key: "source_type", label: "유형" }];

  return (
    <div className="grid gap-6">
      <div className="grid gap-2">
        <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
        <p className="text-sm text-slate-600">
          {description}
          {publicPath ? ` 등록된 콘텐츠는 공개 페이지(${publicPath})에 노출됩니다.` : null}
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <FileUploadForm domain={domain} onSuccess={refreshList} />
        <WebsiteImportForm domain={domain} onSuccess={refreshList} />
      </div>

      <AdminCrudPage
        title={crudTitle}
        description={crudDescription}
        endpoint="/api/admin/content"
        listEndpoint={`/api/admin/content?domain=${domain}`}
        initialDomain={domain}
        initialRows={initialRows}
        listVersion={listVersion}
        fields={fields}
        columns={listColumns}
        mapRowToForm={(row) =>
          fields.reduce<Record<string, string>>((acc, field) => {
            acc[field.name] = row[field.name] == null ? "" : String(row[field.name]);
            return acc;
          }, {})
        }
        renderCell={(key, row) => {
          if (key === "source_type") {
            return getSourceTypeLabel(String(row.source_url ?? ""));
          }

          const value = row[key];
          return value == null ? "-" : String(value);
        }}
      />
    </div>
  );
}
