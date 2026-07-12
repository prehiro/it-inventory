"use client";

import { useState, useTransition } from "react";
import { deleteModelAction } from "@/app/actions/master-data";

export type ModelRow = {
  id: string;
  type: string;
  name: string;
  brand: string;
  category: string;
  itemCount: number;
};

type ModalState = "none" | "confirm" | "blocked" | "error" | "success";

export function MasterDataTable({ models }: { models: ModelRow[] }) {
  const [pending, start] = useTransition();
  const [modal, setModal] = useState<ModalState>("none");
  const [target, setTarget] = useState<ModelRow | null>(null);
  const [error, setError] = useState<string | null>(null);

  function open(m: ModelRow) {
    setTarget(m);
    setError(null);
    setModal(m.itemCount > 0 ? "blocked" : "confirm");
  }

  function doDelete() {
    if (!target) return;
    start(async () => {
      const res = await deleteModelAction(target.id);
      if (!res.ok) {
        setError(res.error);
        setModal("error");
        return;
      }
      setModal("success");
    });
  }

  const canClose = !pending;

  return (
    <>
      <div className="mt-8 overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs font-medium uppercase tracking-wide text-slate-500 dark:bg-slate-800/50 dark:text-slate-400">
            <tr>
              <th className="px-5 py-3">Type</th>
              <th className="px-5 py-3">Brand</th>
              <th className="px-5 py-3">Model</th>
              <th className="px-5 py-3">Category</th>
              <th className="px-5 py-3">Items</th>
              <th className="px-5 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {models.map((m) => (
              <tr key={m.id} className="row-hover">
                <td className="px-5 py-3 font-medium text-slate-800 dark:text-slate-100">{m.type}</td>
                <td className="px-5 py-3 text-slate-600 dark:text-slate-300">{m.brand}</td>
                <td className="px-5 py-3 text-slate-600 dark:text-slate-300">{m.name}</td>
                <td className="px-5 py-3">
                  <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">{m.category}</span>
                </td>
                <td className="px-5 py-3 text-slate-600 dark:text-slate-300">{m.itemCount}</td>
                <td className="px-5 py-3 text-right">
                  <button
                    disabled={pending}
                    onClick={() => open(m)}
                    className="rounded-lg px-2.5 py-1 text-xs font-medium text-rose-600 transition hover:bg-rose-50 disabled:opacity-60 dark:hover:bg-rose-500/10"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
            {models.length === 0 && (
              <tr><td colSpan={6} className="px-5 py-8 text-center text-slate-400">No models yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {modal !== "none" && target && (
        <div
          onClick={() => canClose && setModal("none")}
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4 backdrop-blur-sm dark:bg-black/50"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            className="w-full max-w-sm animate-fade-in rounded-2xl bg-white p-6 text-center shadow-xl ring-1 ring-slate-200 dark:bg-slate-800 dark:ring-slate-700"
          >
            <div key={modal} className="animate-fade-in">
            {modal === "confirm" && (
              <>
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-rose-50 text-rose-600 dark:bg-rose-500/15 dark:text-rose-400">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-6 w-6" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
                    <path d="M10 11v6M14 11v6" />
                  </svg>
                </div>
                <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                  Hapus model &ldquo;{target.name}&rdquo;?
                </h3>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  Model akan disembunyikan dari katalog master data.
                </p>
                <div className="mt-5 flex justify-center gap-2">
                  <button
                    onClick={() => setModal("none")}
                    className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-700"
                  >
                    Batal
                  </button>
                  <button
                    onClick={doDelete}
                    disabled={pending}
                    className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-rose-500 disabled:opacity-60"
                  >
                    {pending ? "Menghapus…" : "Hapus"}
                  </button>
                </div>
              </>
            )}

            {modal === "blocked" && (
              <>
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-amber-50 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-6 w-6" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" />
                    <path d="M12 9v4m0 4h.01" />
                  </svg>
                </div>
                <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                  Tidak bisa dihapus
                </h3>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  Model &ldquo;{target.name}&rdquo; masih dipakai {target.itemCount} item aktif.
                  Hapus atau dispose item tersebut dulu.
                </p>
                <div className="mt-5 flex justify-center">
                  <button
                    onClick={() => setModal("none")}
                    className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800 dark:bg-slate-700 dark:hover:bg-slate-600"
                  >
                    Oke
                  </button>
                </div>
              </>
            )}

            {modal === "error" && (
              <>
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-rose-50 text-rose-600 dark:bg-rose-500/15 dark:text-rose-400">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-6 w-6" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="9" />
                    <path d="M12 8v4M12 16h.01" />
                  </svg>
                </div>
                <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                  Gagal menghapus
                </h3>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{error}</p>
                <div className="mt-5 flex justify-center">
                  <button
                    onClick={() => setModal("none")}
                    className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800 dark:bg-slate-700 dark:hover:bg-slate-600"
                  >
                    Oke
                  </button>
                </div>
              </>
            )}

            {modal === "success" && (
              <>
                <div className="mx-auto mb-4 flex h-14 w-14 animate-check-pop items-center justify-center rounded-full bg-emerald-50 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="h-7 w-7" strokeLinecap="round" strokeLinejoin="round">
                    <path className="animate-check-draw" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                  Model dihapus
                </h3>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  &ldquo;{target.name}&rdquo; telah disembunyikan dari katalog.
                </p>
                <div className="mt-5 flex justify-center">
                  <button
                    onClick={() => setModal("none")}
                    className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-500"
                  >
                    Selesai
                  </button>
                </div>
              </>
            )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
