"use client";

import { useState, useEffect, useRef } from "react";

type GidData = {
  employeeNo: string;
  name: string;
  globalId: string;
  email: string;
};

type GidResult =
  | { found: false }
  | { found: true; data: GidData };

/**
 * Debounced GID-list lookup. Looks up by employee number (default) or by
 * GID (`mode: "gid"`). Returns `data` only while the query is still current
 * (stale in-flight responses are dropped).
 */
export function useGidLookup(value: string, mode: "emp" | "gid" = "emp") {
  const [data, setData] = useState<GidData | null>(null);
  const [loading, setLoading] = useState(false);
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);
  const valueRef = useRef(value);

  useEffect(() => {
    valueRef.current = value;
  }, [value]);

  useEffect(() => {
    const q = value.trim();
    if (debounce.current) clearTimeout(debounce.current);

    debounce.current = setTimeout(async () => {
      setData(null);
      setLoading(q.length >= 3);
      if (q.length < 3) return;
      try {
        const param =
          mode === "gid" ? `gid=${encodeURIComponent(q)}` : `emp=${encodeURIComponent(q)}`;
        const res = await fetch(`/api/gid-lookup?${param}`);
        const result: GidResult = await res.json();
        if (result.found && valueRef.current.trim() === q) setData(result.data);
      } catch {
        // silent fail
      } finally {
        setLoading(false);
      }
    }, 400);

    return () => {
      if (debounce.current) clearTimeout(debounce.current);
    };
  }, [value, mode]);

  return { data, loading };
}
