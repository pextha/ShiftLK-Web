import { describe, it, expect } from 'vitest';
import { DeliveryService } from '../../src/modules/delivery/delivery.service';

describe('DeliveryService.calculateShipping', () => {
  const service = new DeliveryService();

  const colomboZone = {
    baseFee: 350,
    extraPerKg: 80,
  };

  const kandyZone = {
    baseFee: 400,
    extraPerKg: 100,
  };

  it('should apply Rs. 220 SL Speed Post rate for body sticker items under 250g', () => {
    const fee = service.calculateShipping(colomboZone, 0.15, true);
    expect(fee).toBe(220);
  });

  it('should revert to standard zone rate if body sticker exceeds 250g', () => {
    const fee = service.calculateShipping(colomboZone, 0.5, true);
    expect(fee).toBe(350);
  });

  it('should charge base fee for weight up to 1.0 kg', () => {
    expect(service.calculateShipping(colomboZone, 0.8)).toBe(350);
    expect(service.calculateShipping(colomboZone, 1.0)).toBe(350);
    expect(service.calculateShipping(kandyZone, 1.0)).toBe(400);
  });

  it('should correctly calculate extra per kg fee for weight over 1.0 kg', () => {
    // 2.2 kg -> extra kg = ceil(2.2 - 1.0) = 2 kg
    // Colombo: 350 + 2 * 80 = 510
    expect(service.calculateShipping(colomboZone, 2.2)).toBe(510);

    // 1.1 kg -> extra kg = ceil(1.1 - 1.0) = 1 kg
    // Kandy: 400 + 1 * 100 = 500
    expect(service.calculateShipping(kandyZone, 1.1)).toBe(500);
  });

  it('should fallback to default rates when zone is null', () => {
    // default base: 425, extra: 100
    expect(service.calculateShipping(null, 1.0)).toBe(425);
    expect(service.calculateShipping(null, 3.0)).toBe(425 + 2 * 100);
  });
});
