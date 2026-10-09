import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "./api";
import type { Page, Zone } from "./types";

export type ZoneFilters = {
  search: string;
  type: string;
  page: number;
  pageSize: number;
};

export function useZones(f: ZoneFilters) {
  const qs = new URLSearchParams({
    search: f.search,
    type: f.type,
    page: String(f.page),
    page_size: String(f.pageSize),
  });
  return useQuery({
    queryKey: ["zones", f],
    queryFn: () => api<Page<Zone>>(`/zones?${qs}`),
    placeholderData: keepPreviousData,
  });
}

export function useCreateZone() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { name: string; comment: string; type: string }) =>
      api<Zone>("/zones", { method: "POST", body: JSON.stringify(body) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["zones"] }),
  });
}

export function useDeleteZone() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api<void>(`/zones/${id}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["zones"] }),
  });
}

export function useZone(id: number) {
  return useQuery({
    queryKey: ["zone", id],
    queryFn: () => api<Zone>(`/zones/${id}`),
    retry: false,
    enabled: id > 0,
  });
}

export function useUpdateZone(id: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { comment: string }) =>
      api<Zone>(`/zones/${id}`, { method: "PUT", body: JSON.stringify(body) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["zone", id] });
      qc.invalidateQueries({ queryKey: ["zones"] });
    },
  });
}