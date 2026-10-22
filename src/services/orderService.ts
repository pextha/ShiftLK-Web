import { AppLocale, Order } from '@/lib/db/schema.types';
import { SEED_CATEGORIES, SEED_RAW_PRODUCTS } from '@/lib/db/seed-data';
import { validateSriLankanPhone } from '@/lib/utils/phone-validator';
import {
  buildWhatsAppOrderMessage,
  getWhatsAppUrl,
} from '@/lib/utils/whatsapp';
import { calculateDeliveryFee, getDeliveryZoneByDistrict } from './deliveryService';
import { apiClient, ApiClientError } from '@/lib/api/client';

export interface CreateOrderInput {
  productId: string;
  quantity: number;
  customerName: string;
  phone: string;
  address: string;
  district: string;
  notes?: string;
  locale: AppLocale;
  originUrl?: string;
}

export interface OrderCreationResult {
  success: boolean;
  order?: Order;
  orderCode?: string;
  whatsAppUrl?: string;
  whatsAppMessage?: string;
  error?: string;
}

let localOrderSequence = 124;

export async function createPendingOrder(
  input: CreateOrderInput
): Promise<OrderCreationResult> {
  const {
    productId,
    quantity,
    customerName,
    phone,
    address,
    district,
    notes,
    locale,
    originUrl,
  } = input;

  // 1. Validate inputs locally before network request
  if (!customerName || !customerName.trim()) {
    return { success: false, error: 'Customer name is required' };
  }

  if (!address || !address.trim()) {
    return { success: false, error: 'Delivery address is required' };
  }

  if (!district || !district.trim()) {
    return { success: false, error: 'Delivery district is required' };
  }

  if (!quantity || quantity <= 0) {
    return { success: false, error: 'Valid quantity is required' };
  }

  const phoneValidation = validateSriLankanPhone(phone);
  if (!phoneValidation.isValid) {
    return {
      success: false,
      error: phoneValidation.error || 'Invalid Sri Lankan phone number',
    };
  }

  // 2. Try placing order on the ShiftLK Backend REST API (shiftLK-api)
  try {
    const apiRes = await apiClient.createOrder({
      customerName: customerName.trim(),
      phone: phoneValidation.cleanNumber,
      address: address.trim(),
      district: district.trim(),
      notes: notes?.trim(),
      locale,
      items: [
        {
          productId,
          qty: quantity,
        },
      ],
    });

    return {
      success: true,
      orderCode: apiRes.orderCode,
      whatsAppUrl: apiRes.whatsAppUrl,
      whatsAppMessage: apiRes.whatsAppMessage,
      order: {
        id: apiRes.orderCode,
        order_code: apiRes.orderCode,
        customer_name: customerName.trim(),
        phone: phoneValidation.formattedInternational,
        address: address.trim(),
        district: district.trim(),
        delivery_cost: apiRes.deliveryCost,
        total: apiRes.total,
        status: 'pending',
        customer_language: locale,
        notes: notes?.trim(),
        created_at: new Date().toISOString(),
      },
    };
  } catch (err: unknown) {
    if (err instanceof ApiClientError && err.status >= 400 && err.status < 500) {
      // Forward validation or stock rejection from backend
      return { success: false, error: err.message };
    }
    console.warn('ShiftLK API order placement unreachable, falling back to local fallback generator:', err);
  }

  // 3. Fallback: local in-memory order processor if backend API is offline
  const rawProduct = SEED_RAW_PRODUCTS.find((p) => p.id === productId);
  if (!rawProduct) {
    return { success: false, error: 'Product not found' };
  }

  if (rawProduct.stock_qty < quantity) {
    return {
      success: false,
      error: `Only ${rawProduct.stock_qty} units available in stock`,
    };
  }

  const cat = SEED_CATEGORIES.find((c) => c.id === rawProduct.category_id);
  const zone = await getDeliveryZoneByDistrict(district);
  const deliveryCost = calculateDeliveryFee(
    zone,
    (rawProduct.weight_kg || 1) * quantity,
    { categorySlug: cat?.slug }
  );
  const itemTotal = rawProduct.selling_price * quantity;
  const grandTotal = itemTotal + deliveryCost;

  const orderCode = `SLK-${String(localOrderSequence++).padStart(6, '0')}`;
  const orderId = `ord-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

  const newOrder: Order = {
    id: orderId,
    order_code: orderCode,
    customer_name: customerName.trim(),
    phone: phoneValidation.formattedInternational,
    address: address.trim(),
    district: district.trim(),
    delivery_cost: deliveryCost,
    total: grandTotal,
    status: 'pending',
    customer_language: locale,
    notes: notes?.trim(),
    created_at: new Date().toISOString(),
  };

  const localizedTitle =
    rawProduct.translations[locale]?.name || rawProduct.translations.en.name;
  const productUrl = originUrl
    ? `${originUrl}/${locale}/products/${rawProduct.slug}`
    : `https://shiftlk.lk/${locale}/products/${rawProduct.slug}`;

  const whatsAppMessage = buildWhatsAppOrderMessage({
    orderCode,
    productName: localizedTitle,
    partNumber: rawProduct.part_number,
    brand: rawProduct.brand,
    condition: rawProduct.condition,
    quantity,
    unitPrice: rawProduct.selling_price,
    district,
    deliveryCost,
    total: grandTotal,
    customerName: newOrder.customer_name,
    phone: phoneValidation.formattedLocal,
    address: newOrder.address,
    notes: newOrder.notes,
    productUrl,
    locale,
  });

  const whatsAppUrl = getWhatsAppUrl(whatsAppMessage);

  return {
    success: true,
    order: newOrder,
    orderCode,
    whatsAppUrl,
    whatsAppMessage,
  };
}
