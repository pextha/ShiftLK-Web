import { AppLocale, ConditionType } from '../db/schema.types';
import { formatLKR } from './currency';

export interface WhatsAppOrderDetails {
  orderCode: string;
  productName: string;
  partNumber: string;
  brand: string;
  condition: ConditionType;
  quantity: number;
  unitPrice: number;
  district: string;
  deliveryCost: number;
  total: number;
  customerName: string;
  phone: string;
  address: string;
  notes?: string;
  productUrl: string;
  locale: AppLocale;
}

const CONDITION_LABELS: Record<AppLocale, Record<ConditionType, string>> = {
  en: {
    new: 'Brand New (OEM)',
    reconditioned: 'Reconditioned (Japan)',
    used: 'Used Original',
  },
  si: {
    new: 'අලුත්ම (OEM)',
    reconditioned: 'රිකන්ඩිෂන් (ජපන්)',
    used: 'භාවිතා කළ මුල් කොටස්',
  },
  ta: {
    new: 'புத்தம் புதியது (OEM)',
    reconditioned: 'ரீகண்டிஷன் (ஜப்பான்)',
    used: 'பயன்படுத்திய அசல்',
  },
};

export function buildWhatsAppOrderMessage(details: WhatsAppOrderDetails): string {
  const {
    orderCode,
    productName,
    partNumber,
    brand,
    condition,
    quantity,
    unitPrice,
    district,
    deliveryCost,
    total,
    customerName,
    phone,
    address,
    notes,
    productUrl,
    locale,
  } = details;

  const condText = CONDITION_LABELS[locale]?.[condition] || condition;
  const subtotal = unitPrice * quantity;

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
      `📦 *ඇණවුම් අංකය:* ${orderCode}`,
      `🔧 *අමතර කොටස:* ${productName}`,
      `🔢 *OEM කොටස් අංකය:* ${partNumber}`,
      `🏷️ *සන්නාමය:* ${brand} (${condText})`,
      `🔢 *ප්‍රමාණය:* ${quantity}`,
      `💵 *ඒකකයක මිල:* ${formatLKR(unitPrice, 'si')}`,
      `💰 *අයිතම වටිනාකම:* ${formatLKR(subtotal, 'si')}`,
      `━━━━━━━━━━━━━━━━━━━`,
      `📍 *බෙදාහරින දිස්ත්‍රික්කය:* ${district}`,
      `🚚 *ප්‍රවාහන ගාස්තුව:* ${formatLKR(deliveryCost, 'si')} ${deliveryMethodText}`,
      `💳 *ගෙවිය යුතු මුළු මුදල:* *${formatLKR(total, 'si')}*`,
      `━━━━━━━━━━━━━━━━━━━`,
      `👤 *පාරිභෝගිකයාගේ නම:* ${customerName}`,
      `📞 *දුරකථන අංකය:* ${phone}`,
      `🏠 *භාරදිය යුතු ලිපිනය:* ${address}`,
      notes ? `📝 *අමතර සටහන්:* ${notes}` : null,
      `━━━━━━━━━━━━━━━━━━━`,
      `🔗 *අයිතමයේ වෙබ් පිටුව:* ${productUrl}`,
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
      `📦 *ஓடர் இலக்கம்:* ${orderCode}`,
      `🔧 *உதிரிப்பாகம்:* ${productName}`,
      `🔢 *OEM பாக இலக்கம்:* ${partNumber}`,
      `🏷️ *பிராண்ட்:* ${brand} (${condText})`,
      `🔢 *அளவு:* ${quantity}`,
      `💵 *அலகு விலை:* ${formatLKR(unitPrice, 'ta')}`,
      `💰 *பொருட்கள் மொத்தம்:* ${formatLKR(subtotal, 'ta')}`,
      `━━━━━━━━━━━━━━━━━━━`,
      `📍 *விநியோக மாவட்டம்:* ${district}`,
      `🚚 *விநியோகக் கட்டணம்:* ${formatLKR(deliveryCost, 'ta')} ${deliveryMethodText}`,
      `💳 *செலுத்த வேண்டிய மொத்தத் தொகை:* *${formatLKR(total, 'ta')}*`,
      `━━━━━━━━━━━━━━━━━━━`,
      `👤 *வாடிக்கையாளர் பெயர்:* ${customerName}`,
      `📞 *தொலைபேசி:* ${phone}`,
      `🏠 *விநியோக முகவரி:* ${address}`,
      notes ? `📝 *குறிப்புகள்:* ${notes}` : null,
      `━━━━━━━━━━━━━━━━━━━`,
      `🔗 *பொருளின் இணைப்பு:* ${productUrl}`,
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
    `📦 *Order Ref:* ${orderCode}`,
    `🔧 *Item:* ${productName}`,
    `🔢 *OEM / Part No:* ${partNumber}`,
    `🏷️ *Brand:* ${brand} (${condText})`,
    `🔢 *Quantity:* ${quantity}`,
    `💵 *Unit Price:* ${formatLKR(unitPrice, 'en')}`,
    `💰 *Subtotal:* ${formatLKR(subtotal, 'en')}`,
    `━━━━━━━━━━━━━━━━━━━`,
    `📍 *Delivery District:* ${district}`,
    `🚚 *Delivery Fee:* ${formatLKR(deliveryCost, 'en')} ${deliveryMethodText}`,
    `💳 *Estimated Grand Total:* *${formatLKR(total, 'en')}*`,
    `━━━━━━━━━━━━━━━━━━━`,
    `👤 *Customer Name:* ${customerName}`,
    `📞 *Phone Number:* ${phone}`,
    `🏠 *Delivery Address:* ${address}`,
    notes ? `📝 *Notes / Chassis No:* ${notes}` : null,
    `━━━━━━━━━━━━━━━━━━━`,
    `🔗 *Product Link:* ${productUrl}`,
    ``,
    `Please confirm stock availability and share payment instructions (Bank Transfer / COD). Thank you!`,
  ]
    .filter(Boolean)
    .join('\n');
}

export function buildGeneralEnquiryMessage(locale: AppLocale = 'en'): string {
  if (locale === 'si') {
    return `ආයුබෝවන් ShiftLK Spares! මගේ වාහනයට අවශ්‍ය අමතර කොටසක් පිළිබඳව විමසීමට අවශ්‍යයි. උදව් කළ හැකිද?`;
  }
  if (locale === 'ta') {
    return `வணக்கம் ShiftLK Spares! எனது வாகனத்திற்கான உதிரிப்பாகம் பற்றி விசாரிக்க விரும்புகிறேன். உதவ முடியுமா?`;
  }
  return `Hello ShiftLK Spares! I am looking for auto spare parts for my vehicle. Can you assist me with availability and pricing?`;
}

export const DEFAULT_WHATSAPP_NUMBER = '94770871018';
export const DEFAULT_PHONE_DISPLAY = '077 087 1018';

export function getWhatsAppUrl(message: string): string {
  const whatsappNumber =
    process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || DEFAULT_WHATSAPP_NUMBER;
  const cleanNumber = whatsappNumber.replace(/[^0-9]/g, '');
  const encoded = encodeURIComponent(message);
  return `https://wa.me/${cleanNumber}?text=${encoded}`;
}
