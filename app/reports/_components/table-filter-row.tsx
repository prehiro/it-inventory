"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { DateRangePreset } from "./date-range-preset";

/* ──────────────────────────────────────────
   TableFilterRow — column filter row under the table header
   (one field per column, matching the header). Styling mirrors
   PC Ledger's per-column filter row. Server-side filtering via URL.
   ────────────────────────────────────────── */

const CATEGORIES = ["All", "FA", "NCA", "GENERAL"];
const STATUS_OPTIONS = ["All", "AVAILABLE", "RETURNED_KEEP", "RELEASED"];
const TYPE_OPTIONS = [
  "All",
  "PC",
  "Laptop",
  "Tablet",
  "Mouse",
  "Keyboard",
  "Monitor",
  "Projector",
  "Camera",
  "CCTV",
  "Printer",
  "Kensington",
  "Adaptor",
];

function Dropdown({
  value,
  onChange,
  options,
  placeholder,
  align = "left",
}: {
  value: string;
  onChange: (v: string) => void;
  options: string[];
  placeholder: string;
  align?: "left" | "right";
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`flex w-full items-center justify-between gap-1 rounded border border-slate-200 bg-white px-2 py-1 text-xs text-slate-700 outline-none transition focus:border-[#2563eb] focus:ring-0 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 ${
          open ? "border-[#2563eb]" : ""
        }`}
      >
        <span className={value === "All" ? "text-slate-400 dark:text-slate-500" : "text-slate-700 dark:text-slate-200"}>
          {value === "All" ? placeholder : value}
        </span>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-3.5 w-3.5 shrink-0 text-slate-400" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>
      {open && (
        <div
          className={`absolute z-50 mt-1 min-w-[9rem] overflow-y-auto rounded-lg bg-white p-1 shadow-xl ring-1 ring-slate-200 dark:bg-slate-800 dark:ring-slate-700 ${
            align === "right" ? "right-0" : "left-0"
          } max-h-52 w-full`}
        >
          {options.map((o) => (
            <button
              key={o}
              type="button"
              onClick={() => {
                onChange(o);
                setOpen(false);
              }}
              className={`flex w-full items-center justify-between gap-2 rounded-md px-2.5 py-1.5 text-left text-xs transition ${
                value === o
                  ? "bg-[#2563eb] font-semibold text-white"
                  : "text-slate-700 hover:bg-blue-50 hover:font-semibold hover:text-[#2563eb] dark:text-slate-200 dark:hover:bg-blue-500/15 dark:hover:text-blue-300"
              }`}
            >
              <span>{o}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

const inputClass =
  "w-full rounded border border-slate-200 bg-white px-2 py-1 text-xs text-slate-700 outline-none placeholder:text-slate-400 focus:border-[#2563eb] focus:ring-0 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:placeholder:text-slate-500";

export function TableFilterRow({
  basePath,
  initial,
  show,
  withStatus = false,
  withAssignee = false,
  mergeBrandModel = false,
  withHostname = false,
}: {
  basePath: string;
  initial: { type: string; category: string; serial?: string; brand?: string; model?: string; q?: string; po: string; location: string; from: string; to: string; status?: string; assignee?: string; hostname?: string };
  show: boolean;
  withStatus?: boolean;
  withAssignee?: boolean;
  /** Release: combine Brand + Model into a single filter cell (matches merged header). */
  mergeBrandModel?: boolean;
  /** Show an extra HOSTNAME filter cell after Location. */
  withHostname?: boolean;
}) {
  const router = useRouter();
  const [type, setType] = useState(initial.type || "All");
  const [category, setCategory] = useState(initial.category || "All");
  // Brand / model / serial are independent fields (AND semantics). They were all
  // bound to a single `q` before, which made typing in one populate the others.
  const [serial, setSerial] = useState(initial.serial || "");
  const [debouncedSerial, setDebouncedSerial] = useState(initial.serial || "");
  const [brand, setBrand] = useState(initial.brand || "");
  const [debouncedBrand, setDebouncedBrand] = useState(initial.brand || "");
  const [model, setModel] = useState(initial.model || "");
  const [debouncedModel, setDebouncedModel] = useState(initial.model || "");
  const [po, setPo] = useState(initial.po);
  const [debouncedPo, setDebouncedPo] = useState(initial.po);
  const [location, setLocation] = useState(initial.location);
  const [debouncedLocation, setDebouncedLocation] = useState(initial.location);
  const [from, setFrom] = useState(initial.from);
  const [to, setTo] = useState(initial.to);
  const [status, setStatus] = useState(initial.status || "All");
  const [assignee, setAssignee] = useState(initial.assignee || "");
  const [debouncedAssignee, setDebouncedAssignee] = useState(initial.assignee || "");
  const [hostname, setHostname] = useState(initial.hostname || "");
  const [debouncedHostname, setDebouncedHostname] = useState(initial.hostname || "");
  const firstRun = useRef(true);

  // Debounce text inputs — avoid a router push per keystroke
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSerial(serial), 400);
    return () => clearTimeout(t);
  }, [serial]);
  useEffect(() => {
    const t = setTimeout(() => setDebouncedBrand(brand), 400);
    return () => clearTimeout(t);
  }, [brand]);
  useEffect(() => {
    const t = setTimeout(() => setDebouncedModel(model), 400);
    return () => clearTimeout(t);
  }, [model]);
  useEffect(() => {
    const t = setTimeout(() => setDebouncedPo(po), 400);
    return () => clearTimeout(t);
  }, [po]);
  useEffect(() => {
    const t = setTimeout(() => setDebouncedLocation(location), 400);
    return () => clearTimeout(t);
  }, [location]);
  useEffect(() => {
    const t = setTimeout(() => setDebouncedAssignee(assignee), 400);
    return () => clearTimeout(t);
  }, [assignee]);
  useEffect(() => {
    const t = setTimeout(() => setDebouncedHostname(hostname), 400);
    return () => clearTimeout(t);
  }, [hostname]);

  function push() {
    const p = new URLSearchParams();
    if (type !== "All") p.set("type", type);
    if (category !== "All") p.set("category", category);
    if (debouncedSerial) p.set("serial", debouncedSerial);
    if (debouncedBrand) p.set("brand", debouncedBrand);
    if (debouncedModel) p.set("model", debouncedModel);
    if (debouncedPo) p.set("po", debouncedPo);
    if (debouncedLocation) p.set("location", debouncedLocation);
    if (from) p.set("from", from);
    if (to) p.set("to", to);
    if (withStatus && status !== "All") p.set("status", status);
    if (withAssignee && debouncedAssignee) p.set("assignee", debouncedAssignee);
    if (withHostname && debouncedHostname) p.set("hostname", debouncedHostname);
    p.set("page", "1");
    router.push(`${basePath}?${p.toString()}`);
  }

  useEffect(() => {
    if (firstRun.current) {
      firstRun.current = false;
      return;
    }
    push();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type, category, debouncedSerial, debouncedBrand, debouncedModel, debouncedPo, debouncedLocation, from, to, status, debouncedAssignee, debouncedHostname]);

  return (
    <tr className={`border-b border-slate-100 bg-white dark:border-slate-700 dark:bg-slate-900 ${show ? "" : "hidden"}`}>
      {/* Serial Number */}
      <td className="px-2 py-2">
        <input value={serial} onChange={(e) => setSerial(e.target.value)} placeholder="Filter…" className={inputClass} />
      </td>
      {/* Type */}
      <td className="px-2 py-2">
        <Dropdown value={type} onChange={setType} options={TYPE_OPTIONS} placeholder="All" />
      </td>
      {/* Brand / Brand+Model / Model */}
      {mergeBrandModel ? (
        <>
          <td className="px-2 py-2">
            <input value={brand} onChange={(e) => setBrand(e.target.value)} placeholder="Filter…" className={inputClass} />
          </td>
          <td className="px-2 py-2">
            <input value={model} onChange={(e) => setModel(e.target.value)} placeholder="Filter…" className={inputClass} />
          </td>
        </>
      ) : (
        <>
          <td className="px-2 py-2">
            <input value={brand} onChange={(e) => setBrand(e.target.value)} placeholder="Filter…" className={inputClass} />
          </td>
          <td className="px-2 py-2">
            <input value={model} onChange={(e) => setModel(e.target.value)} placeholder="Filter…" className={inputClass} />
          </td>
        </>
      )}
      {/* Category */}
      <td className="px-2 py-2">
        <Dropdown value={category} onChange={setCategory} options={CATEGORIES} placeholder="All" />
      </td>
      {/* PO Number */}
      <td className="px-2 py-2">
        <input value={po} onChange={(e) => setPo(e.target.value)} placeholder="Filter…" className={inputClass} />
      </td>
      {withAssignee && (
        <td className="px-2 py-2">
          <input value={assignee} onChange={(e) => setAssignee(e.target.value)} placeholder="Filter…" className={inputClass} />
        </td>
      )}
      {/* Location */}
      <td className="px-2 py-2">
        <input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Filter…" className={inputClass} />
      </td>
      {withHostname && (
        <td className="px-2 py-2">
          <input value={hostname} onChange={(e) => setHostname(e.target.value)} placeholder="Filter…" className={inputClass} />
        </td>
      )}
      {/* Received */}
      <td className="px-2 py-2">
        <DateRangePreset from={from} to={to} onChange={(f, t) => { setFrom(f); setTo(t); }} />
      </td>
      {withStatus && (
        <td className="px-2 py-2">
          <Dropdown value={status} onChange={setStatus} options={STATUS_OPTIONS} placeholder="All" />
        </td>
      )}
    </tr>
  );
}
