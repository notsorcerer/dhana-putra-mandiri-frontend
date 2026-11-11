"use client";

/**
 * Hook pengambilan data API sederhana dengan status loading/error dan reload.
 */

import { useCallback, useEffect, useState } from "react";
import { ApiError, api } from "./api";
import type { Paginated } from "@/types/api";

export interface ApiState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  reload: () => void;
  setData: React.Dispatch<React.SetStateAction<T | null>>;
}

export function useApi<T>(path: string | null): ApiState<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState<boolean>(path !== null);
  const [error, setError] = useState<string | null>(null);
  const [nonce, setNonce] = useState(0);

  useEffect(() => {
    if (path === null) {
      setData(null);
      setLoading(false);
      setError(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    api<T>(path)
      .then((result) => {
        if (!cancelled) {
          setData(result);
          setLoading(false);
        }
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        const message = err instanceof ApiError ? err.message : "Terjadi kesalahan yang tidak diketahui.";
        setError(message);
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [path, nonce]);

  const reload = useCallback(() => setNonce((n) => n + 1), []);

  return { data, loading, error, reload, setData };
}

export interface PaginatedState<T> extends ApiState<Paginated<T>> {
  page: number;
  setPage: (page: number) => void;
  totalPages: number;
}

const PAGE_SIZE = 20;

/** Hook daftar terpaginasi server-side (DRF ?page=N, PAGE_SIZE = 20). */
export function usePaginated<T>(basePath: string, extraParams?: Record<string, string | number | undefined>): PaginatedState<T> {
  const [page, setPage] = useState(1);

  const search = new URLSearchParams();
  search.set("page", String(page));
  if (extraParams) {
    for (const [key, value] of Object.entries(extraParams)) {
      if (value !== undefined && value !== null && value !== "") {
        search.set(key, String(value));
      }
    }
  }

  const state = useApi<Paginated<T>>(`${basePath}?${search.toString()}`);

  const totalPages = state.data ? Math.max(1, Math.ceil(state.data.count / PAGE_SIZE)) : 1;
  const safePage = Math.min(page, totalPages);

  const changePage = useCallback(
    (next: number) => {
      setPage(Math.max(1, next));
    },
    [],
  );

  return { ...state, page: safePage, setPage: changePage, totalPages };
}
