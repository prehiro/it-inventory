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

export function useGidLookup(empNumber: string) {
  const [data, setData] = useState<GidData | null>(null);
  const [loading, setLoading] = useState(false);
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const q = empNumber.trim();
    setData(null);
    if (q.length < 3) return;

    if (debounce.current) clearTimeout(debounce.current);
    debounce.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/gid-lookup?emp=${encodeURIComponent(q)}`);
        const result: GidResult = await res.json();
        if (result.found) setData(result.data);
      } catch {
        // silent fail
      } finally {
        setLoading(false);
      }
    }, 400);

    return () => {
      if (debounce.current) clearTimeout(debounce.current);
    };
  }, [empNumber]);

  return { data, loading };
}
