import { describe, it, expect } from 'vitest';
import { validateSriLankanPhone } from '../../src/utils/phoneValidator';

describe('validateSriLankanPhone', () => {
  it('should validate and normalize standard 10-digit local format (07X XXX XXXX)', () => {
    const result = validateSriLankanPhone('0771234567');
    expect(result.isValid).toBe(true);
    expect(result.cleanNumber).toBe('94771234567');
    expect(result.formattedInternational).toBe('+94771234567');
    expect(result.formattedLocal).toBe('077 123 4567');
  });

  it('should accept numbers with spaces and dashes', () => {
    const result = validateSriLankanPhone('071-987-6543');
    expect(result.isValid).toBe(true);
    expect(result.cleanNumber).toBe('94719876543');
    expect(result.formattedInternational).toBe('+94719876543');
  });

  it('should validate international format starting with +94 or 94', () => {
    const resPlus = validateSriLankanPhone('+94761234567');
    expect(resPlus.isValid).toBe(true);
    expect(resPlus.cleanNumber).toBe('94761234567');

    const resNoPlus = validateSriLankanPhone('94701234567');
    expect(resNoPlus.isValid).toBe(true);
    expect(resNoPlus.cleanNumber).toBe('94701234567');
  });

  it('should validate 9-digit format starting with 7 (e.g. 771234567)', () => {
    const result = validateSriLankanPhone('771234567');
    expect(result.isValid).toBe(true);
    expect(result.cleanNumber).toBe('94771234567');
    expect(result.formattedInternational).toBe('+94771234567');
  });

  it('should support all active Sri Lankan mobile operators (70, 71, 72, 74, 75, 76, 77, 78)', () => {
    const operators = ['70', '71', '72', '74', '75', '76', '77', '78'];
    for (const op of operators) {
      const res = validateSriLankanPhone(`0${op}1234567`);
      expect(res.isValid).toBe(true);
    }
  });

  it('should reject invalid mobile operator prefix (e.g. 73 or landlines 011)', () => {
    const resInvalidPrefix = validateSriLankanPhone('0731234567');
    expect(resInvalidPrefix.isValid).toBe(false);
    expect(resInvalidPrefix.error).toContain('Invalid mobile operator prefix');

    const resLandline = validateSriLankanPhone('0112345678');
    expect(resLandline.isValid).toBe(false);
  });

  it('should reject empty or missing phone numbers', () => {
    const resEmpty = validateSriLankanPhone('');
    expect(resEmpty.isValid).toBe(false);

    // @ts-expect-error test invalid type
    const resNull = validateSriLankanPhone(null);
    expect(resNull.isValid).toBe(false);
  });

  it('should reject numbers that are too short or too long', () => {
    expect(validateSriLankanPhone('07712345').isValid).toBe(false);
    expect(validateSriLankanPhone('077123456789').isValid).toBe(false);
  });
});
