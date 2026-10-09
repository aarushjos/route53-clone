export type Zone = {
  id: number;
  name: string;
  type: "public" | "private";
  comment: string;
  created_at: string;
  record_count: number;
};

export type Page<T> = {
  items: T[];
  total: number;
  page: number;
  page_size: number;
};

export type DnsRecord = {
  id: number;
  zone_id: number;
  name: string;
  type: string;
  ttl: number;
  values: string[];
  routing_policy: string;
  created_at: string;
};