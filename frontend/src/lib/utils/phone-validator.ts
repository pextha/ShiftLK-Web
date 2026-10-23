/**
 * Validates and formats Sri Lankan mobile numbers
 * Accepts:
 *  - 07X XXXXXXX (e.g. 077 087 1018, 0770871018, 077-0871018)
 *  - +94 7X XXXXXXX (e.g. +94 77 087 1018, +94770871018)
 *  - 0094 7X XXXXXXX
 *  - 94 7X XXXXXXX
 */

export interface PhoneValidationResult {
  isValid: boolean;
  cleanNumber: string;
  formattedInternational: string;
  formattedLocal: string;
  operator?: string;
  error?: string;
}

const OPERATOR_PREFIXES: Record<string, string> = {
  '70': 'Mobitel',
  '71': 'Mobitel',
  '72': 'Hutch',
  '74': 'Dialog',
  '75': 'Airtel',
  '76': 'Dialog',
  '77': 'Dialog',
  '78': 'Hutch',
};

export function validateSriLankanPhone(input: string): PhoneValidationResult {
  if (!input || typeof input !== 'string') {
    return {
      isValid: false,
      cleanNumber: '',
      formattedInternational: '',
      formattedLocal: '',
      error: 'Phone number is required',
    };
  }

  // Remove spaces, hyphens, brackets, dots
  let cleaned = input.replace(/[\s\-\(\)\.]/g, '').trim();

  // Strip leading '+' or '00'
  if (cleaned.startsWith('+')) {
    cleaned = cleaned.substring(1);
  } else if (cleaned.startsWith('00')) {
    cleaned = cleaned.substring(2);
  }

  // Check if international format with 94
  let standard10Digits = '';

  if (cleaned.startsWith('94')) {
    standard10Digits = '0' + cleaned.substring(2);
  } else if (cleaned.startsWith('0')) {
    standard10Digits = cleaned;
  } else if (cleaned.startsWith('7') && cleaned.length === 9) {
    standard10Digits = '0' + cleaned;
  } else {
    return {
      isValid: false,
      cleanNumber: cleaned,
      formattedInternational: '',
      formattedLocal: '',
      error: 'Please enter a valid Sri Lankan phone number starting with 07X or +947X',
    };
  }

  // Must match Sri Lankan mobile regex: 07[01245678]\d{7}
  const mobileRegex = /^0(7[01245678])(\d{7})$/;
  const match = standard10Digits.match(mobileRegex);

  if (!match) {
    return {
      isValid: false,
      cleanNumber: standard10Digits,
      formattedInternational: '',
      formattedLocal: '',
      error: 'Invalid Sri Lankan mobile format. Expected 07X XXXXXXX (e.g. 077 087 1018)',
    };
  }

  const prefix = match[1]; // e.g. 77
  const suffix = match[2]; // e.g. 1234567
  const operator = OPERATOR_PREFIXES[prefix.replace('0', '')] || 'Mobile';

  const formattedLocal = `0${prefix.slice(-2)} ${suffix.slice(0, 3)} ${suffix.slice(3)}`;
  const formattedInternational = `+94 ${prefix.slice(-2)} ${suffix.slice(0, 3)} ${suffix.slice(3)}`;
  const cleanNumber = `94${prefix.slice(-2)}${suffix}`;

  return {
    isValid: true,
    cleanNumber,
    formattedInternational,
    formattedLocal,
    operator,
  };
}
