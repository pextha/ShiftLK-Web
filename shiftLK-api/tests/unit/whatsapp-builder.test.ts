import { describe, it, expect } from 'vitest';
import {
  buildWhatsAppOrderMessage,
  getWhatsAppUrl,
  sanitizeText,
  buildGeneralEnquiryMessage,
} from '../../src/utils/whatsapp';

describe('WhatsApp Builder', () => {
  const sampleParams = {
    orderCode: 'SLK-20261022-0123',
    productName: 'Yamaha FZ-S V2 Cylinder Kit (OEM)',
    partNumber: '21C-E1311-00',
    brand: 'Yamaha Genuine',
    condition: 'new',
    quantity: 1,
    unitPrice: 18500,
    district: 'Colombo',
    deliveryCost: 350,
    total: 18850,
    customerName: 'Kasun Perera',
    phone: '077 123 4567',
    address: 'No 45, High Level Road, Maharagama',
  };

  it('should build formatted English order message with order code and price breakdown', () => {
    const msg = buildWhatsAppOrderMessage({ ...sampleParams, locale: 'en' });
    expect(msg).toContain('SLK-20261022-0123');
    expect(msg).toContain('Yamaha FZ-S V2 Cylinder Kit');
    expect(msg).toContain('21C-E1311-00');
    expect(msg).toContain('Rs. 18,500');
    expect(msg).toContain('Rs. 350');
    expect(msg).toContain('Rs. 18,850');
    expect(msg).toContain('Kasun Perera');
    expect(msg).toContain('077 123 4567');
    expect(msg).toContain('Maharagama');
  });

  it('should build Sinhala order message with Sinhala headers and labels', () => {
    const msg = buildWhatsAppOrderMessage({ ...sampleParams, locale: 'si' });
    expect(msg).toContain('ඇණවුම් අංකය');
    expect(msg).toContain('SLK-20261022-0123');
    expect(msg).toContain('බෙදාහරින දිස්ත්‍රික්කය');
    expect(msg).toContain('Colombo');
  });

  it('should build Tamil order message with Tamil headers and labels', () => {
    const msg = buildWhatsAppOrderMessage({ ...sampleParams, locale: 'ta' });
    expect(msg).toContain('ஓடர் இலக்கம்');
    expect(msg).toContain('SLK-20261022-0123');
    expect(msg).toContain('விநியோக மாவட்டம்');
  });

  it('should sanitize HTML / dangerous characters from user input', () => {
    const sanitized = sanitizeText('<script>alert("hack")</script> Kasun');
    expect(sanitized).toBe('scriptalert("hack")/script Kasun');
  });

  it('should generate valid WhatsApp URL with encoded message', () => {
    const msg = 'Order #123';
    const url = getWhatsAppUrl(msg, '94770871018');
    expect(url).toBe('https://wa.me/94770871018?text=Order%20%23123');
  });

  it('should provide localized general enquiry messages', () => {
    expect(buildGeneralEnquiryMessage('si')).toContain('ShiftLK Spares');
    expect(buildGeneralEnquiryMessage('ta')).toContain('ShiftLK Spares');
    expect(buildGeneralEnquiryMessage('en')).toContain('auto spare parts');
  });
});
