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

export function useRecord(zoneId: number, recordId: number) {
  return useQuery({
    queryKey: ["record", zoneId, recordId],
    queryFn: () => api<DnsRecord>(`/zones/${zoneId}/records/${recordId}`),
    retry: false,
  });
}

function useRefreshAfterChange(zoneId: number) {
  const qc = useQueryClient();
  return () => {
    qc.invalidateQueries({ queryKey: ["records", zoneId] });
    qc.invalidateQueries({ queryKey: ["record", zoneId] });
    qc.invalidateQueries({ queryKey: ["zone", zoneId] });
    qc.invalidateQueries({ queryKey: ["zones"] });
  };
}

export function useCreateRecord(zoneId: number) {
  const refresh = useRefreshAfterChange(zoneId);
  return useMutation({
    mutationFn: (body: { name: string; type: string; ttl: number; values: string[] }) =>
      api<DnsRecord>(`/zones/${zoneId}/records`, {
        method: "POST",
        body: JSON.stringify({ ...body, routing_policy: "Simple" }),
      }),
    onSuccess: refresh,
  });
}

export function useUpdateRecord(zoneId: number, recordId: number) {
  const refresh = useRefreshAfterChange(zoneId);
  return useMutation({
    mutationFn: (body: { ttl: number; values: string[] }) =>
      api<DnsRecord>(`/zones/${zoneId}/records/${recordId}`, {
        method: "PUT",
        body: JSON.stringify(body),
      }),
    onSuccess: refresh,
  });
}