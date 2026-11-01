import { AppLocale } from '../db/schema.types';

export class ApiClientError extends Error {
  public code: string;
  public status: number;
  public details?: unknown;

  constructor(message: string, status: number = 500, code: string = 'API_ERROR', details?: unknown) {
    super(message);
    this.name = 'ApiClientError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export interface ApiProductItem {
  id: string;
  slug: string;
  part_number: string;
  brand: string;
  category_id?: string;
  category_slug?: string;
  category_name?: string;
  category?: {
    id: string;
    slug: string;
    name: string;
  };
  condition: 'new' | 'reconditioned' | 'used';
  selling_price: number;
  stock_qty: number;
  low_stock_threshold?: number;
  weight_kg: number;
  is_active: boolean;
  name: string;
  description: string;
  images: string[];
  compatibility: Array<{
    make: string;
    model: string;
    year_from: number;
    year_to: number | null;
    chassis_code?: string | null;
  }>;
}

export interface GetProductsParams {
  query?: string;
  category?: string;
  brand?: string;
  condition?: string;
  make?: string;
  model?: string;
  year?: number;
  minPrice?: number;
  maxPrice?: number;
  inStockOnly?: boolean;
  sortBy?: 'newest' | 'price_asc' | 'price_desc';
  page?: number;
  limit?: number;
  locale?: AppLocale;
}

export interface CreateOrderPayload {
  customerName: string;
  phone: string;
  address: string;
  district: string;
  items: Array<{
    productId: string;
    qty: number;
  }>;
  notes?: string;
  locale?: AppLocale;
  _hp?: string;
}

export interface CreateOrderResponse {
  orderCode: string;
  subtotal: number;
  deliveryCost: number;
  total: number;
  status: string;
  whatsAppUrl: string;
  whatsAppMessage: string;
}

const DEFAULT_API_BASE = 'http://localhost:4000/api/v1';

export class ApiClient {
  private baseUrl: string;

  constructor(baseUrl?: string) {
    this.baseUrl = (baseUrl || process.env.NEXT_PUBLIC_API_URL || DEFAULT_API_BASE).replace(/\/$/, '');
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

    try {
      const res = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          ...options.headers,
        },
      });

      const json = await res.json().catch(() => null);

      if (!res.ok) {
        const errorInfo = json?.error;
        throw new ApiClientError(
          errorInfo?.message || `Request failed with status ${res.status}`,
          res.status,
          errorInfo?.code || 'HTTP_ERROR',
          errorInfo?.details
        );
      }

      return json?.data !== undefined ? json.data : json;
    } catch (err: unknown) {
      if (err instanceof ApiClientError) {
        throw err;
      }
      const message = err instanceof Error ? err.message : 'Unable to connect to ShiftLK API backend';
      throw new ApiClientError(
        message,
        0,
        'NETWORK_ERROR'
      );
    }
  }

  async getProducts(params: GetProductsParams = {}): Promise<{
    items: ApiProductItem[];
    pagination?: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> {
    const queryParams = new URLSearchParams();

    if (params.query) queryParams.set('query', params.query);
    if (params.category && params.category !== 'all') queryParams.set('category', params.category);
    if (params.brand && params.brand !== 'all') queryParams.set('brand', params.brand);
    if (params.condition && params.condition !== 'all') queryParams.set('condition', params.condition);
    if (params.make && params.make !== 'all') queryParams.set('make', params.make);
    if (params.model && params.model !== 'all') queryParams.set('model', params.model);
    if (params.year) queryParams.set('year', String(params.year));
    if (params.minPrice !== undefined) queryParams.set('minPrice', String(params.minPrice));
    if (params.maxPrice !== undefined) queryParams.set('maxPrice', String(params.maxPrice));
    if (params.inStockOnly) queryParams.set('inStockOnly', 'true');
    if (params.sortBy) queryParams.set('sortBy', params.sortBy);
    if (params.page) queryParams.set('page', String(params.page));
    if (params.limit) queryParams.set('limit', String(params.limit));
    if (params.locale) queryParams.set('locale', params.locale);

    const qs = queryParams.toString();
    const endpoint = `/products${qs ? `?${qs}` : ''}`;
    const url = `${this.baseUrl}${endpoint}`;

    const res = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
    });

    const json = await res.json().catch(() => null);
    if (!res.ok) {
      const errorInfo = json?.error;
      throw new ApiClientError(
        errorInfo?.message || `Request failed with status ${res.status}`,
        res.status,
        errorInfo?.code || 'HTTP_ERROR',
        errorInfo?.details
      );
    }

    const items: ApiProductItem[] = Array.isArray(json)
      ? json
      : Array.isArray(json?.data)
      ? json.data
      : Array.isArray(json?.items)
      ? json.items
      : [];

    return {
      items,
      pagination: json?.pagination,
    };
  }

  async getProductBySlug(slug: string, locale: AppLocale = 'en'): Promise<ApiProductItem | null> {
    try {
      const data = await this.request<ApiProductItem>(
        `/products/${encodeURIComponent(slug)}?locale=${locale}`,
        { method: 'GET' }
      );
      return data || null;
    } catch (err: unknown) {
      if (err instanceof ApiClientError && err.status === 404) {
        return null;
      }
      throw err;
    }
  }

  async getCategories(locale?: AppLocale): Promise<
    Array<{
      id: string;
      slug: string;
      icon: string;
      name: string;
      description?: string;
      translations?: Record<string, { name: string; description?: string }>;
    }>
  > {
    const qs = locale ? `?locale=${locale}` : '';
    return this.request(`/categories${qs}`, { method: 'GET' });
  }

  async getBrands(): Promise<
    Array<{
      id: string;
      slug: string;
      name: string;
      country?: string;
    }>
  > {
    return this.request('/brands', { method: 'GET' });
  }

  async getDeliveryZones(): Promise<
    Array<{
      id: string;
      district: string;
      province: string;
      base_fee: number;
      extra_per_kg: number;
      estimated_days: string;
    }>
  > {
    return this.request('/delivery-zones', { method: 'GET' });
  }

  async createOrder(payload: CreateOrderPayload): Promise<CreateOrderResponse> {
    return this.request<CreateOrderResponse>('/orders', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async getOrderStatus(code: string, phone: string) {
    return this.request(
      `/orders/${encodeURIComponent(code)}?phone=${encodeURIComponent(phone)}`,
      { method: 'GET', cache: 'no-store' }
    );
  }

  async getPublicSettings(): Promise<{ whatsappNumber: string; defaultLowStockAlert: number }> {
    return this.request('/settings/public', { method: 'GET' });
  }
}

export const apiClient = new ApiClient();
