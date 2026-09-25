/**
 * Production-ready API client with type safety and error wrapping.
 */

export interface ApiResponse<T> {
  data: T | null;
  error: string | null;
  status: number;
}

export async function apiClient<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  try {
    const res = await fetch(endpoint, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    if (!res.ok) {
      const errorText = await res.text();
      return { data: null, error: errorText || `HTTP Error ${res.status}`, status: res.status };
    }

    const data = (await res.json()) as T;
    return { data, error: null, status: res.status };
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Network request failed',
      status: 0,
    };
  }
}
