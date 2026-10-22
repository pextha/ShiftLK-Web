import { prisma } from '../../lib/prisma';

export class DeliveryService {
  async getAllDeliveryZones() {
    const zones = await prisma.deliveryZone.findMany({
      where: { isActive: true },
      orderBy: [{ province: 'asc' }, { district: 'asc' }],
    });

    return zones.map((z) => ({
      id: z.id,
      district: z.district,
      province: z.province,
      base_fee: Number(z.baseFee),
      extra_per_kg: Number(z.extraPerKg),
      estimated_days: z.estimatedDays,
    }));
  }

  calculateShipping(
    zone: { baseFee: any; extraPerKg: any } | null,
    totalWeightKg: number,
    isBodyStickerCategory: boolean = false
  ): number {
    // Special Stickers Courier: Under 250g (0.25 kg) sent via SL Speed Post (Post Office) for Rs. 220
    if (isBodyStickerCategory && totalWeightKg <= 0.25) {
      return 220;
    }

    const base = zone ? Number(zone.baseFee) : 425;
    const extraRate = zone ? Number(zone.extraPerKg) : 100;
    const extraKg = Math.max(0, Math.ceil(totalWeightKg - 1.0));

    return base + extraKg * extraRate;
  }
}

export const deliveryService = new DeliveryService();
