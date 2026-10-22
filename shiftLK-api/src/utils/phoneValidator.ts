export interface PhoneValidationResult {
  isValid: boolean;
  cleanNumber: string;
  formattedInternational: string; // +94771234567
  formattedLocal: string;         // 077 123 4567
  error?: string;
}

export function validateSriLankanPhone(phone: string): PhoneValidationResult {
  if (!phone || typeof phone !== 'string') {
    return {
      isValid: false,
      cleanNumber: '',
      formattedInternational: '',
      formattedLocal: '',
      error: 'Phone number is required',
    };
  }

  // Remove whitespace, dashes, parens, plus signs
  const cleaned = phone.replace(/[^0-9]/g, '');

  let subscriberNumber = '';

  // Case 1: Local 10 digits starting with 0 (e.g. 0771234567)
  if (cleaned.length === 10 && cleaned.startsWith('0')) {
    subscriberNumber = cleaned.substring(1);
  }
  // Case 2: International with 94 prefix (e.g. 94771234567)
  else if (cleaned.length === 11 && cleaned.startsWith('94')) {
    subscriberNumber = cleaned.substring(2);
  }
  // Case 3: 9 digits starting with 7 (e.g. 771234567)
  else if (cleaned.length === 9 && cleaned.startsWith('7')) {
    subscriberNumber = cleaned;
  } else {
    return {
      isValid: false,
      cleanNumber: cleaned,
      formattedInternational: '',
      formattedLocal: '',
      error: 'Invalid Sri Lankan mobile number format (must be 07X XXX XXXX or +947XXXXXXXX)',
    };
  }

  // Verify second digit is a valid Sri Lankan mobile prefix: 0, 1, 2, 4, 5, 6, 7, 8
  const validPrefixes = ['70', '71', '72', '74', '75', '76', '77', '78'];
  const prefix = subscriberNumber.substring(0, 2);

  if (!validPrefixes.includes(prefix)) {
    return {
      isValid: false,
      cleanNumber: cleaned,
      formattedInternational: '',
      formattedLocal: '',
      error: `Invalid mobile operator prefix "0${prefix}". Supported: Dialog, Mobitel, Airtel, Hutch`,
    };
  }

  const formattedInternational = `+94${subscriberNumber}`;
  const formattedLocal = `0${subscriberNumber.substring(0, 2)} ${subscriberNumber.substring(2, 5)} ${subscriberNumber.substring(5)}`;

  return {
    isValid: true,
    cleanNumber: `94${subscriberNumber}`,
    formattedInternational,
    formattedLocal,
  };
}
