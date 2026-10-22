import { AppLocale, Order } from '@/lib/db/schema.types';
import { SEED_CATEGORIES, SEED_RAW_PRODUCTS } from '@/lib/db/seed-data';
import { isSupabaseConfigured, supabase } from '@/lib/db/supabase';
import { validateSriLankanPhone } from '@/lib/utils/phone-validator';
import {
  buildWhatsAppOrderMessage,
  getWhatsAppUrl,
} from '@/lib/utils/whatsapp';
import { calculateDeliveryFee, getDeliveryZoneByDistrict } from './deliveryService';

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

// In-memory orders store for development when Supabase credentials are not connected
const inMemoryOrders: Order[] = [];
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

  // 1. Validate inputs
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

  // 2. Validate Sri Lankan phone number
  const phoneValidation = validateSriLankanPhone(phone);
  if (!phoneValidation.isValid) {
    return {
      success: false,
      error: phoneValidation.error || 'Invalid Sri Lankan phone number',
    };
  }

  // 3. Find product
  const rawProduct = SEED_RAW_PRODUCTS.find((p) => p.id === productId);
  if (!rawProduct) {
    return { success: false, error: 'Product not found' };
  }

  // Stock check: Stock is NOT reduced now, but we verify it's available
  if (rawProduct.stock_qty < quantity) {
    return {
      success: false,
      error: `Only ${rawProduct.stock_qty} units available in stock`,
    };
  }

  // 4. Calculate delivery cost
  const cat = SEED_CATEGORIES.find((c) => c.id === rawProduct.category_id);
  const zone = await getDeliveryZoneByDistrict(district);
  const deliveryCost = calculateDeliveryFee(
    zone,
    (rawProduct.weight_kg || 1) * quantity,
    { categorySlug: cat?.slug }
  );
  const itemTotal = rawProduct.selling_price * quantity;
  const grandTotal = itemTotal + deliveryCost;

  // 5. Generate Order Code (SLK-000123 format)
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

  // 6. Persist order
  if (isSupabaseConfigured && supabase) {
    try {
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .insert({
          order_code: orderCode,
          customer_name: newOrder.customer_name,
          phone: newOrder.phone,
          address: newOrder.address,
          district: newOrder.district,
          delivery_cost: newOrder.delivery_cost,
          total: newOrder.total,
          status: 'pending',
          customer_language: locale,
          notes: newOrder.notes,
        })
        .select()
        .single();

      if (!orderError && orderData) {
        // Insert order item with unit_cost snapshot
        await supabase.from('order_items').insert({
          order_id: orderData.id,
          product_id: rawProduct.id,
          qty: quantity,
          unit_price: rawProduct.selling_price,
          unit_cost: rawProduct.cost_price, // Saved for admin profit reporting
        });
      }
    } catch (e) {
      console.warn('Could not insert to Supabase, saved to local session', e);
    }
  }

  // Always keep in memory store
  inMemoryOrders.unshift(newOrder);

  // 7. Generate localized WhatsApp message
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
