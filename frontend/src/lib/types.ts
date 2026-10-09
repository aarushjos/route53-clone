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