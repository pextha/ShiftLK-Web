import { formatLKR } from './currency';

export const DEFAULT_WHATSAPP_NUMBER = '94770871018';

export interface WhatsAppOrderMessageParams {
  orderCode: string;
  productName: string;
  partNumber: string;
  brand: string;
  condition: string;
  quantity: number;
  unitPrice: number;
  subtotalOverride?: number;
  itemsSummary?: string;
  district: string;
  deliveryCost: number;
  total: number;
  customerName: string;
  phone: string;
  address: string;
  notes?: string;
  locale?: string;
  frontendUrl?: string;
}

export function sanitizeText(str: string): string {
  if (!str) return '';
  return str
    .replace(/[<>]/g, '')
    .replace(/\r\n|\r/g, '\n')
    .trim();
}

export function buildWhatsAppOrderMessage(params: WhatsAppOrderMessageParams): string {
  const {
    orderCode,
    productName,
    partNumber,
    brand,
    condition,
    quantity,
    unitPrice,
    subtotalOverride,
    itemsSummary,
    district,
    deliveryCost,
    total,
    customerName,
    phone,
    address,
    notes,
    locale = 'en',
    frontendUrl,
  } = params;

  const itemTotal = subtotalOverride !== undefined ? subtotalOverride : unitPrice * quantity;
  const safeCustomerName = sanitizeText(customerName);
  const safeAddress = sanitizeText(address);
  const safeNotes = notes ? sanitizeText(notes) : '';

  const deliveryMethodText =
    deliveryCost === 220
      ? locale === 'si'
        ? '(SL Speed Post - ස්ටිකර්)'
        : locale === 'ta'
        ? '(SL Speed Post - ஸ்டிக்கர்கள்)'
        : '(SL Speed Post - Stickers)'
      : locale === 'si'
      ? '(දිවයින පුරා කුරියර්)'
      : locale === 'ta'
      ? '(நாடு தழுவிய கூரியர்)'
      : '(Islandwide Courier)';

  if (locale === 'si') {
    return [
      `*🏍️ ShiftLK Spares - නව ඇණවුම*`,
      `━━━━━━━━━━━━━━━━━━━`,
      `📦 *ඇණවුම් අංකය:* #${orderCode}`,
      itemsSummary
        ? `🛒 *අයිතම ලැයිස්තුව:*\n${itemsSummary}`
        : [
            `🔧 *අමතර කොටස:* ${productName}`,
            `🔢 *OEM කොටස් අංකය:* ${partNumber}`,
            `🏷️ *සන්නාමය:* ${brand} (${condition.toUpperCase()})`,
            `🔢 *ප්‍රමාණය:* ${quantity}`,
            `💵 *ඒකකයක මිල:* ${formatLKR(unitPrice, 'si')}`,
          ].join('\n'),
      `💰 *අයිතම වටිනාකම:* ${formatLKR(itemTotal, 'si')}`,
      `━━━━━━━━━━━━━━━━━━━`,
      `📍 *බෙදාහරින දිස්ත්‍රික්කය:* ${district}`,
      `🚚 *ප්‍රවාහන ගාස්තුව:* ${formatLKR(deliveryCost, 'si')} ${deliveryMethodText}`,
      `💳 *ගෙවිය යුතු මුළු මුදල:* *${formatLKR(total, 'si')}*`,
      `━━━━━━━━━━━━━━━━━━━`,
      `👤 *පාරිභෝගිකයාගේ නම:* ${safeCustomerName}`,
      `📞 *දුරකථන අංකය:* ${phone}`,
      `🏠 *භාරදිය යුතු ලිපිනය:* ${safeAddress}`,
      safeNotes ? `📝 *අමතර සටහන්:* ${safeNotes}` : null,
      frontendUrl ? `━━━━━━━━━━━━━━━━━━━\n🔗 *අයිතමයේ වෙබ් පිටුව:* ${frontendUrl}` : null,
      ``,
      `කරුණාකර භාණ්ඩය තහවුරු කර ගෙවීම් විස්තර (බැංකු තැන්පතු හෝ COD) ලබාදෙන්න. ස්තූතියි!`,
    ]
      .filter(Boolean)
      .join('\n');
  }

  if (locale === 'ta') {
    return [
      `*🏍️ ShiftLK Spares - புதிய ஓடர்*`,
      `━━━━━━━━━━━━━━━━━━━`,
      `📦 *ஓடர் இலக்கம்:* #${orderCode}`,
      itemsSummary
        ? `🛒 *பொருட்கள் பட்டியல்:*\n${itemsSummary}`
        : [
            `🔧 *உதிரிப்பாகம்:* ${productName}`,
            `🔢 *OEM பாக இலக்கம்:* ${partNumber}`,
            `🏷️ *பிராண்ட்:* ${brand} (${condition.toUpperCase()})`,
            `🔢 *அளவு:* ${quantity}`,
            `💵 *அலகு விலை:* ${formatLKR(unitPrice, 'ta')}`,
          ].join('\n'),
      `💰 *பொருட்கள் மொத்தம்:* ${formatLKR(itemTotal, 'ta')}`,
      `━━━━━━━━━━━━━━━━━━━`,
      `📍 *விநியோக மாவட்டம்:* ${district}`,
      `🚚 *விநியோகக் கட்டணம்:* ${formatLKR(deliveryCost, 'ta')} ${deliveryMethodText}`,
      `💳 *செலுத்த வேண்டிய மொத்தத் தொகை:* *${formatLKR(total, 'ta')}*`,
      `━━━━━━━━━━━━━━━━━━━`,
      `👤 *வாடிக்கையாளர் பெயர்:* ${safeCustomerName}`,
      `📞 *தொலைபேசி:* ${phone}`,
      `🏠 *விநியோக முகவரி:* ${safeAddress}`,
      safeNotes ? `📝 *குறிப்புகள்:* ${safeNotes}` : null,
      frontendUrl ? `━━━━━━━━━━━━━━━━━━━\n🔗 *பொருளின் இணைப்பு:* ${frontendUrl}` : null,
      ``,
      `பொருளின் இருப்பு மற்றும் பணம் செலுத்தும் விபரங்களை (Bank Transfer / COD) உறுதிப்படுத்தவும். நன்றி!`,
    ]
      .filter(Boolean)
      .join('\n');
  }

  // Default: English
  return [
    `*🏍️ ShiftLK Spares - New Website Order*`,
    `━━━━━━━━━━━━━━━━━━━`,
    `📦 *Order Ref:* #${orderCode}`,
    itemsSummary
      ? `🛒 *Ordered Items:*\n${itemsSummary}`
      : [
          `🔧 *Item:* ${productName}`,
          `🔢 *OEM / Part No:* ${partNumber}`,
          `🏷️ *Brand:* ${brand} (${condition.toUpperCase()})`,
          `🔢 *Quantity:* ${quantity}`,
          `💵 *Unit Price:* ${formatLKR(unitPrice, 'en')}`,
        ].join('\n'),
    `💰 *Subtotal:* ${formatLKR(itemTotal, 'en')}`,
    `━━━━━━━━━━━━━━━━━━━`,
    `📍 *Delivery District:* ${district}`,
    `🚚 *Delivery Fee:* ${formatLKR(deliveryCost, 'en')} ${deliveryMethodText}`,
    `💳 *Grand Total:* *${formatLKR(total, 'en')}*`,
    `━━━━━━━━━━━━━━━━━━━`,
    `👤 *Customer Name:* ${safeCustomerName}`,
    `📞 *Contact:* ${phone}`,
    `🏠 *Delivery Address:* ${safeAddress}`,
    safeNotes ? `📝 *Notes / Chassis No:* ${safeNotes}` : null,
    frontendUrl ? `━━━━━━━━━━━━━━━━━━━\n🔗 *Product Link:* ${frontendUrl}` : null,
    ``,
    `Please confirm part availability and provide Bank Transfer / COD payment settlement instructions.`,
  ]
    .filter(Boolean)
    .join('\n');
}

export function buildGeneralEnquiryMessage(locale: string = 'en'): string {
  if (locale === 'si') {
    return 'ආයුබෝවන් ShiftLK Spares! මගේ වාහනයට අවශ්‍ය අමතර කොටසක් පිළිබඳව විමසීමට අවශ්‍යයි. උදව් කළ හැකිද?';
  }
  if (locale === 'ta') {
    return 'வணக்கம் ShiftLK Spares! எனது வாகனத்திற்கான உதிரிப்பாகம் பற்றி விசாரிக்க விரும்புகிறேன். உதவ முடியுமா?';
  }
  return 'Hello ShiftLK Spares! I am looking for auto spare parts for my vehicle. Can you assist me with availability and pricing?';
}

export function getWhatsAppUrl(message: string, whatsappNumber: string = DEFAULT_WHATSAPP_NUMBER): string {
  const cleanNumber = whatsappNumber.replace(/[^0-9]/g, '');
  const encodedMessage = encodeURIComponent(message);
  return `https://wa.me/${cleanNumber}?text=${encodedMessage}`;
}
