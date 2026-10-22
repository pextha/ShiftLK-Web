export interface PublicProductDto {
  id: string;
  slug: string;
  part_number: string;
  brand: string;
  brand_id: string;
  category_id: string;
  category_slug?: string;
  category_name: string;
  condition: string;
  selling_price: number;
  stock_qty: number;
  weight_kg: number;
  is_active: boolean;
  images: string[];
  name: string;
  description: string;
  compatibility: Array<{
    id: string;
    make: string;
    model: string;
    year_from: number;
    year_to: number | null;
    chassis_code: string | null;
  }>;
  translations: {
    en: { name: string; description: string };
    si: { name: string; description: string };
    ta: { name: string; description: string };
  };
}

export function toPublicProductDto(product: any, locale: string = 'en'): PublicProductDto {
  const transMap: Record<string, { name: string; description: string }> = {
    en: { name: '', description: '' },
    si: { name: '', description: '' },
    ta: { name: '', description: '' },
  };

  if (Array.isArray(product.translations)) {
    product.translations.forEach((t: any) => {
      transMap[t.language] = {
        name: t.name || '',
        description: t.description || '',
      };
    });
  }

  // Selected locale translation with English fallback
  const activeTrans = transMap[locale] || transMap.en;
  const displayName = activeTrans.name || transMap.en.name || product.slug;
  const displayDesc = activeTrans.description || transMap.en.description || '';

  // Category name localization
  let catName = 'Spare Parts';
  if (product.category) {
    if (Array.isArray(product.category.translations)) {
      const catTrans =
        product.category.translations.find((t: any) => t.language === locale) ||
        product.category.translations.find((t: any) => t.language === 'en');
      if (catTrans && catTrans.name) {
        catName = catTrans.name;
      }
    }
  }

  // Sorted product images
  const images = Array.isArray(product.images)
    ? [...product.images]
        .sort((a: any, b: any) => (a.displayOrder || 0) - (b.displayOrder || 0))
        .map((img: any) => img.imageUrl)
    : [];

  // Compatibility array
  const compatibility = Array.isArray(product.compatibilities)
    ? product.compatibilities.map((c: any) => ({
        id: c.id,
        make: c.make,
        model: c.model,
        year_from: c.yearFrom,
        year_to: c.yearTo,
        chassis_code: c.chassisCode,
      }))
    : [];

  // NOTICE: cost_price and internal fields are completely excluded!
  return {
    id: product.id,
    slug: product.slug,
    part_number: product.partNumber,
    brand: product.brand ? product.brand.name : '',
    brand_id: product.brandId,
    category_id: product.categoryId,
    category_slug: product.category ? product.category.slug : undefined,
    category_name: catName,
    condition: product.condition ? product.condition.toLowerCase() : 'new',
    selling_price: Number(product.sellingPrice),
    stock_qty: product.stockQty,
    weight_kg: Number(product.weightKg),
    is_active: product.isActive,
    images,
    name: displayName,
    description: displayDesc,
    compatibility,
    translations: {
      en: transMap.en,
      si: transMap.si,
      ta: transMap.ta,
    },
  };
}

export function toPublicOrderDto(order: any) {
  return {
    orderCode: order.orderCode,
    customerName: order.customerName,
    phone: order.phone,
    address: order.address,
    district: order.district,
    deliveryCost: Number(order.deliveryCost),
    subtotal: Number(order.subtotal),
    total: Number(order.total),
    status: order.status,
    customerLanguage: order.customerLanguage,
    notes: order.notes,
    createdAt: order.createdAt,
    items: Array.isArray(order.items)
      ? order.items.map((item: any) => ({
          productId: item.productId,
          qty: item.qty,
          unitPrice: Number(item.unitPrice),
          productName: item.product?.translations?.[0]?.name || item.product?.slug || '',
        }))
      : [],
  };
}
