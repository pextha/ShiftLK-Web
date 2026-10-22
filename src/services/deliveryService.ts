import { DeliveryZone } from '@/lib/db/schema.types';
import { SEED_DELIVERY_ZONES } from '@/lib/db/seed-data';
import { apiClient } from '@/lib/api/client';

export async function getDeliveryZones(): Promise<DeliveryZone[]> {
  try {
    const zones = await apiClient.getDeliveryZones();
    if (zones && zones.length > 0) {
      return zones.map((z) => ({
        id: z.id,
        district: z.district,
        province: z.province,
        base_fee: z.base_fee,
        extra_per_kg: z.extra_per_kg,
        estimated_days: z.estimated_days,
        is_active: true,
      }));
    }
  } catch (err) {
    console.warn('ShiftLK API getDeliveryZones failed, falling back to local seed data:', err);
  }

  return SEED_DELIVERY_ZONES;
}

export async function getDeliveryZoneByDistrict(
  districtName: string
): Promise<DeliveryZone | null> {
  const zones = await getDeliveryZones();
  return (
    zones.find(
      (z) => z.district.toLowerCase() === districtName.toLowerCase()
    ) || null
  );
}

export interface DeliveryFeeDetails {
  fee: number;
  isStickerSpeedPost: boolean;
  baseFee: number;
  extraKg: number;
  extraFee: number;
  deliveryMethod: string;
}

export function getDeliveryFeeDetails(
  zone: DeliveryZone | null,
  totalWeightKg: number = 1.0,
  categorySlug?: string
): DeliveryFeeDetails {
  // Special Stickers Courier: Under 250g (0.25 kg) sent via SL Speed Post (Post Office) for Rs. 220
  const isSticker = categorySlug === 'body-stickers';
  if (isSticker && totalWeightKg <= 0.25) {
    return {
      fee: 220,
      isStickerSpeedPost: true,
      baseFee: 220,
      extraKg: 0,
      extraFee: 0,
      deliveryMethod: 'SL Speed Post (Stickers < 250g)',
    };
  }

  // Standard Islandwide Courier: First 1 kg is Rs. 425, then +Rs. 100 for every additional kg
  const base = zone ? zone.base_fee : 425;
  const extraKgRate = zone ? zone.extra_per_kg : 100;
  const extraKg = Math.max(0, Math.ceil(totalWeightKg - 1.0));
  const extraFee = extraKg * extraKgRate;

  return {
    fee: base + extraFee,
    isStickerSpeedPost: false,
    baseFee: base,
    extraKg,
    extraFee,
    deliveryMethod: 'Standard Islandwide Courier',
  };
}

export function calculateDeliveryFee(
  zone: DeliveryZone | null,
  totalWeightKg: number = 1.0,
  options?: {
    categorySlug?: string;
  }
): number {
  return getDeliveryFeeDetails(zone, totalWeightKg, options?.categorySlug).fee;
}
