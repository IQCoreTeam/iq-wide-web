import { gwFetch } from "@/lib/gateway/reader";

export interface SearchHit {
  kind: "dbroot" | "table" | "row";
  id: string;
  dbroot: string;
  label: string;
  snippet: string;
  rank: number;
}

export async function searchCatalog(q: string, limit = 20): Promise<SearchHit[]> {
  const term = q.trim();
  if (!term) return [];
  const res = await gwFetch(`/search?q=${encodeURIComponent(term)}&limit=${limit}`);
  const data = (await res.json()) as { hits?: SearchHit[] };
  return data.hits ?? [];
}
