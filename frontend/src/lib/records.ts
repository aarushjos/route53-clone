import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "./api";
import type { DnsRecord, Page } from "./types";

export type RecordFilters = {
  search: string;
  type: string;
  page: number;
  pageSize: number;
};

export function useRecords(zoneId: number, f: RecordFilters) {
  const qs = new URLSearchParams({
    search: f.search,
    type: f.type,
    page: String(f.page),
    page_size: String(f.pageSize),
  });
  return useQuery({
    queryKey: ["records", zoneId, f],
    queryFn: () => api<Page<DnsRecord>>(`/zones/${zoneId}/records?${qs}`),
    placeholderData: keepPreviousData,
  });
}

export function useDeleteRecord(zoneId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (recordId: number) =>
      api<void>(`/zones/${zoneId}/records/${recordId}`, { method: "DELETE" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["records", zoneId] });
      qc.invalidateQueries({ queryKey: ["zone", zoneId] });
      qc.invalidateQueries({ queryKey: ["zones"] });
    },
  });
}