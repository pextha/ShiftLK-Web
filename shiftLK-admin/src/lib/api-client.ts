const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export class ApiError extends Error {
  code: string;
  status: number;
  details?: any;

  constructor(message: string, code: string = 'API_ERROR', status: number = 500, details?: any) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

interface RequestOptions extends RequestInit {
  params?: Record<string, string | number | boolean | undefined | null>;
}

export async function apiClient<T = any>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const { params, headers, ...restOptions } = options;

  let url = endpoint.startsWith('http') ? endpoint : `${API_URL}${endpoint}`;

  if (params) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        searchParams.append(key, String(value));
      }
    });
    const queryString = searchParams.toString();
    if (queryString) {
      url += (url.includes('?') ? '&' : '?') + queryString;
    }
  }

  const defaultHeaders: HeadersInit = {
    Accept: 'application/json',
    ...(restOptions.body && !(restOptions.body instanceof FormData)
      ? { 'Content-Type': 'application/json' }
      : {}),
    ...headers,
  };

  try {
    const response = await fetch(url, {
      credentials: 'include',
      headers: defaultHeaders,
      ...restOptions,
    });

    // Handle CSV or text responses
    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('text/csv') || contentType.includes('text/plain')) {
      if (!response.ok) {
        throw new ApiError('Failed to fetch file', 'DOWNLOAD_FAILED', response.status);
      }
      return (await response.text()) as unknown as T;
    }

    let json: any = {};
    try {
      json = await response.json();
    } catch {
      json = {};
    }

    if (!response.ok) {
      const errObj = json.error || {};
      const message = errObj.message || json.message || `Request failed with status ${response.status}`;
      const code = errObj.code || 'HTTP_ERROR';

      // If 401 Unauthorized in browser and not on login page, redirect
      if (response.status === 401 && typeof window !== 'undefined' && !window.location.pathname.startsWith('/login')) {
        window.location.href = '/login';
      }

      throw new ApiError(message, code, response.status, errObj.details);
    }

    return json.data !== undefined ? json.data : json;
  } catch (error: any) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(
      error.message || 'Unable to connect to server. Please check your connection.',
      'NETWORK_ERROR',
      0
    );
  }
}
