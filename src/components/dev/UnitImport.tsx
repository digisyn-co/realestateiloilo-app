"use client";

import { useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { buildImportPreview, type ImportPreview } from "@/lib/developer/inventory";
import { commitUnitImportAction, type DevActionResult } from "@/lib/developer-actions";

const SAMPLE = `Building,Unit Number,Floor,Unit Type,Bedrooms,Bathrooms,Floor Area,Price,Status,Parking,Orientation
Tower A,A-101,1,Studio,0,1,28,4200000,Available,0,East
Tower A,A-102,1,Studio,0,1,28,4300000,Reserved,0,East
Tower A,A-201,2,1BR,1,1,42,6800000,Sold,1,North
Tower A,A-301,3,2BR,2,2,65,9400000,Available,1,West`;

export function UnitImport({ projectId }: { projectId: string }) {
  const [text, setText] = useState("");
  const [preview, setPreview] = useState<ImportPreview | null>(null);
  const [state, action] = useFormState<DevActionResult, FormData>(commitUnitImportAction, {});

  function runPreview(value: string) {
    setText(value);
    if (value.trim().length < 10) {
      setPreview(null);
      return;
    }
    try {
      setPreview(buildImportPreview(value));
    } catch {
      setPreview(null);
    }
  }

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const content = await file.text();
    runPreview(content);
  }

  if (state.ok) {
    return (
      <div className="border border-[#2E5A40] bg-[#0B241A] p-5 text-[13.5px] text-[#6FB58F]">
        {state.message} <a href="" className="text-[#D6A84F]">Refresh to see the inventory.</a>
      </div>
    );
  }

  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <label className="cursor-pointer border border-[#245140] px-4 py-2.5 text-[10px] font-bold uppercase tracking-[0.16em] hover:border-[#D6A84F] hover:text-[#D6A84F]">
          Upload CSV / JSON
          <input type="file" accept=".csv,.json,.txt" onChange={onFile} className="hidden" />
        </label>
        <button type="button" onClick={() => runPreview(SAMPLE)} className="text-[12px] text-[#95A79C] hover:text-[#D6A84F]">Paste sample data</button>
      </div>
      <textarea
        value={text}
        onChange={(e) => runPreview(e.target.value)}
        rows={7}
        placeholder="Paste CSV or JSON. Columns: Building, Unit Number, Floor, Unit Type, Bedrooms, Bathrooms, Floor Area, Price, Status, Parking, Orientation"
        className="dfield resize-none font-mono text-[12px]"
      />

      {preview && (
        <div className="border border-[#183A2B] bg-[#05120C]">
          <div className="flex flex-wrap gap-5 border-b border-[#183A2B] px-5 py-3 text-[13px]">
            <span>{preview.total} rows detected</span>
            <span className="text-[#6FB58F]">✓ {preview.valid} valid</span>
            {preview.invalid > 0 && <span className="text-[#E2712B]">⚠ {preview.invalid} errors</span>}
          </div>
          <div className="max-h-64 overflow-auto">
            <table className="w-full min-w-[640px] text-left text-[12.5px]">
              <thead>
                <tr className="border-b border-[#183A2B] text-[8.5px] uppercase tracking-[0.16em] text-[#95A79C]">
                  <th className="px-4 py-2">Row</th>
                  <th className="px-4 py-2">Unit</th>
                  <th className="px-4 py-2">Type</th>
                  <th className="px-4 py-2">Price</th>
                  <th className="px-4 py-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {preview.rows.slice(0, 100).map((r) => (
                  <tr key={r.index} className="border-b border-[#183A2B]">
                    <td className="px-4 py-2 text-[#95A79C]">{r.index}</td>
                    <td className="px-4 py-2">{r.normalized?.unitNumber || r.raw["Unit Number"] || "—"}</td>
                    <td className="px-4 py-2 text-[#95A79C]">{r.normalized?.unitType || "—"}</td>
                    <td className="px-4 py-2 tabular-nums">{r.normalized ? "₱" + r.normalized.price.toLocaleString() : "—"}</td>
                    <td className="px-4 py-2">
                      {r.errors.length === 0 ? (
                        <span className="text-[#6FB58F]">{r.normalized?.status}</span>
                      ) : (
                        <span className="text-[#E2712B]">{r.errors.join(", ")}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {state.error && <p className="px-5 py-2 text-[13px] text-[#E2712B]">{state.error}</p>}
          <form action={action} className="flex items-center justify-end gap-3 border-t border-[#183A2B] px-5 py-3">
            <input type="hidden" name="projectId" value={projectId} />
            <input type="hidden" name="data" value={text} />
            <button type="button" onClick={() => { setText(""); setPreview(null); }} className="text-[12px] text-[#95A79C] hover:text-[#F4F0E6]">Cancel</button>
            <SubmitBtn count={preview.valid} />
          </form>
        </div>
      )}
    </div>
  );
}

function SubmitBtn({ count }: { count: number }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending || count === 0} className="border border-[#D6A84F] bg-[#D6A84F] px-5 py-2.5 text-[10px] font-bold uppercase tracking-[0.16em] text-[#05120C] disabled:opacity-50">
      {pending ? "Importing…" : `Import ${count} valid rows`}
    </button>
  );
}
