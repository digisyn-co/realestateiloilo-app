"use client";

import { useFormState, useFormStatus } from "react-dom";
import { useState } from "react";
import { createListingAction } from "@/lib/dashboard-actions";
import { PROPERTY_TYPES, PROPERTY_TYPE_LABELS } from "@/lib/enums";
import { ALL_AREAS } from "@/lib/iloilo";

const STEPS = ["Type", "Sale/Rent", "Location", "Details", "Pricing", "Photos", "Description", "Amenities", "Review"];
const AMENITIES = ["Parking", "Swimming Pool", "Furnished", "Balcony", "Garden", "Security", "Gym", "Backup Power", "Gated", "Near School", "Near Mall", "Pet Friendly"];

export function ListingWizard() {
  const [state, action] = useFormState(createListingAction, {});
  const [step, setStep] = useState(0);
  const [data, setData] = useState<Record<string, string>>({ propertyType: "HOUSE", listingType: "SALE" });
  const [amenities, setAmenities] = useState<string[]>([]);

  const set = (k: string, v: string) => setData((d) => ({ ...d, [k]: v }));
  const toggleAmenity = (a: string) => setAmenities((list) => (list.includes(a) ? list.filter((x) => x !== a) : [...list, a]));

  const canNext = () => {
    if (step === 2) return !!data.city;
    if (step === 4) return !!data.price && Number(data.price) > 0;
    if (step === 6) return (data.description || "").length >= 10;
    return true;
  };

  return (
    <form action={action} className="border border-[#1A3550] bg-[#0D2540]">
      {/* hidden fields carry state to the server action */}
      {Object.entries(data).map(([k, v]) => (
        <input key={k} type="hidden" name={k} value={v} />
      ))}
      <input type="hidden" name="amenities" value={amenities.join(",")} />

      {/* stepper */}
      <div className="flex flex-wrap gap-2 border-b border-[#1A3550] px-5 py-4">
        {STEPS.map((s, i) => (
          <span key={s} className={`text-[9px] font-semibold uppercase tracking-[0.14em] ${i === step ? "text-[#C6A15C]" : i < step ? "text-[#5FA39C]" : "text-[#46617A]"}`}>
            {i + 1}. {s}
          </span>
        ))}
      </div>

      <div className="min-h-[280px] p-6">
        {step === 0 && (
          <Field label="What type of property?">
            <div className="flex flex-wrap gap-2">
              {PROPERTY_TYPES.map((t) => (
                <Choice key={t} active={data.propertyType === t} onClick={() => set("propertyType", t)}>{PROPERTY_TYPE_LABELS[t]}</Choice>
              ))}
            </div>
          </Field>
        )}
        {step === 1 && (
          <Field label="For sale or for rent?">
            <div className="flex gap-2">
              <Choice active={data.listingType === "SALE"} onClick={() => set("listingType", "SALE")}>For sale</Choice>
              <Choice active={data.listingType === "RENT"} onClick={() => set("listingType", "RENT")}>For rent</Choice>
            </div>
          </Field>
        )}
        {step === 2 && (
          <div className="grid gap-4">
            <Field label="District / town">
              <select value={data.city || ""} onChange={(e) => set("city", e.target.value)} className="dfield">
                <option value="">Choose a location</option>
                {ALL_AREAS.map((a) => (
                  <option key={a.slug} value={a.name}>{a.name}</option>
                ))}
              </select>
            </Field>
            <Field label="Barangay (optional)">
              <input value={data.barangay || ""} onChange={(e) => set("barangay", e.target.value)} className="dfield" placeholder="e.g. Tabuc Suba" />
            </Field>
          </div>
        )}
        {step === 3 && (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
            <Field label="Bedrooms"><input value={data.bedrooms || ""} onChange={(e) => set("bedrooms", e.target.value)} inputMode="numeric" className="dfield" /></Field>
            <Field label="Bathrooms"><input value={data.bathrooms || ""} onChange={(e) => set("bathrooms", e.target.value)} inputMode="numeric" className="dfield" /></Field>
            <Field label="Parking"><input value={data.parking || ""} onChange={(e) => set("parking", e.target.value)} inputMode="numeric" className="dfield" /></Field>
            <Field label="Floor area (sqm)"><input value={data.floorArea || ""} onChange={(e) => set("floorArea", e.target.value)} inputMode="numeric" className="dfield" /></Field>
            <Field label="Lot area (sqm)"><input value={data.lotArea || ""} onChange={(e) => set("lotArea", e.target.value)} inputMode="numeric" className="dfield" /></Field>
          </div>
        )}
        {step === 4 && (
          <Field label={data.listingType === "RENT" ? "Monthly rent (₱)" : "Asking price (₱)"}>
            <input value={data.price || ""} onChange={(e) => set("price", e.target.value)} inputMode="numeric" className="dfield max-w-xs text-[22px]" placeholder="0" />
          </Field>
        )}
        {step === 5 && (
          <Field label="Main photo URL">
            <input value={data.imageUrl || ""} onChange={(e) => set("imageUrl", e.target.value)} className="dfield" placeholder="/property-images/a1.png or https://…" />
            <p className="mt-2 text-[12px] text-[#8AA0B4]">In production this is a drag-and-drop uploader with automatic thumbnail generation. For now, paste an image URL (optional).</p>
          </Field>
        )}
        {step === 6 && (
          <>
            <Field label="Title">
              <input value={data.title || ""} onChange={(e) => set("title", e.target.value)} className="dfield" placeholder="Modern 3-Bedroom Family Home" />
            </Field>
            <Field label="Description">
              <textarea rows={5} value={data.description || ""} onChange={(e) => set("description", e.target.value)} className="dfield resize-none" placeholder="Describe the home…" />
            </Field>
          </>
        )}
        {step === 7 && (
          <Field label="Amenities & features">
            <div className="flex flex-wrap gap-2">
              {AMENITIES.map((a) => (
                <Choice key={a} active={amenities.includes(a)} onClick={() => toggleAmenity(a)}>{a}</Choice>
              ))}
            </div>
          </Field>
        )}
        {step === 8 && (
          <div>
            <h3 className="mb-4 font-serif text-[22px]">Review & publish</h3>
            <dl className="grid gap-px bg-[#1A3550]">
              {[
                ["Title", data.title || "—"],
                ["Type", `${PROPERTY_TYPE_LABELS[(data.propertyType as keyof typeof PROPERTY_TYPE_LABELS) || "HOUSE"]} · ${data.listingType}`],
                ["Location", `${data.barangay ? data.barangay + ", " : ""}${data.city || "—"}`],
                ["Price", data.price ? "₱" + Number(data.price).toLocaleString() : "—"],
                ["Specs", [data.bedrooms && `${data.bedrooms} bed`, data.bathrooms && `${data.bathrooms} bath`, data.floorArea && `${data.floorArea} sqm`].filter(Boolean).join(" · ") || "—"],
                ["Amenities", amenities.join(", ") || "—"],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between gap-4 bg-[#0A1C33] px-4 py-3 text-[13.5px]">
                  <span className="text-[#8AA0B4]">{k}</span>
                  <span className="text-right">{v}</span>
                </div>
              ))}
            </dl>
            <p className="mt-4 text-[12px] text-[#8AA0B4]">On publish, the listing is submitted for admin review. It goes live once approved.</p>
          </div>
        )}
        {state.error && <p className="mt-4 text-[13px] text-[#E2712B]">{state.error}</p>}
      </div>

      <div className="flex items-center justify-between border-t border-[#1A3550] px-6 py-4">
        <button type="button" onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0} className="text-[12px] font-semibold text-[#8AA0B4] disabled:opacity-40">
          ← Back
        </button>
        {step < STEPS.length - 1 ? (
          <button type="button" onClick={() => canNext() && setStep((s) => s + 1)} disabled={!canNext()} className="border border-[#C6A15C] bg-[#C6A15C] px-6 py-3 text-[10px] font-bold uppercase tracking-[0.16em] text-[#0A1C33] disabled:opacity-40">
            Continue →
          </button>
        ) : (
          <Publish />
        )}
      </div>
    </form>
  );
}

function Publish() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="border border-[#C6A15C] bg-[#C6A15C] px-6 py-3 text-[10px] font-bold uppercase tracking-[0.16em] text-[#0A1C33] disabled:opacity-60">
      {pending ? "Publishing…" : "Publish listing"}
    </button>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-4">
      <div className="mb-2 text-[9px] font-semibold uppercase tracking-[0.16em] text-[#8AA0B4]">{label}</div>
      {children}
    </div>
  );
}

function Choice({ active, onClick, children }: { active?: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" onClick={onClick} className={`rounded-full px-4 py-2.5 text-[13px] font-semibold ${active ? "bg-[#C6A15C] text-[#0A1C33]" : "border border-[#274563] text-[#EDE7D6]/80 hover:border-[#C6A15C]"}`}>
      {children}
    </button>
  );
}
