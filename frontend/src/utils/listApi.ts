import { apiRequest } from "./api";

export type PaginatedResponse<T> = {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
};

export function parseListResponse<T>(json: unknown): T[] {
  if (Array.isArray(json)) {
    return json as T[];
  }
  if (json && typeof json === "object" && "results" in json) {
    return (json as PaginatedResponse<T>).results ?? [];
  }
  return [];
}

export async function fetchList<T>(
  endpoint: string,
  params?: Record<string, string | number | undefined>
): Promise<T[]> {
  const search = new URLSearchParams();
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== "") {
        search.set(key, String(value));
      }
    });
  }
  const qs = search.toString();
  const url = qs ? `${endpoint}?${qs}` : endpoint;
  const res = await apiRequest(url);
  if (!res.ok) {
    throw new Error(`Failed to fetch ${endpoint}`);
  }
  const json = await res.json();
  return parseListResponse<T>(json);
}

/** Fetch all pages when a full reference list is required (dropdowns, etc.). */
export async function fetchAllPages<T>(
  endpoint: string,
  params?: Record<string, string | number | undefined>
): Promise<T[]> {
  const items: T[] = [];
  let page = 1;

  while (true) {
    const search = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== "") {
          search.set(key, String(value));
        }
      });
    }
    search.set("page", String(page));
    search.set("page_size", "500");

    const res = await apiRequest(`${endpoint}?${search.toString()}`);
    if (!res.ok) {
      throw new Error(`Failed to fetch ${endpoint}`);
    }
    const json = await res.json();
    if (Array.isArray(json)) {
      return json as T[];
    }

    items.push(...parseListResponse<T>(json));
    if (!(json as PaginatedResponse<T>).next) {
      break;
    }
    page += 1;
  }

  return items;
}
