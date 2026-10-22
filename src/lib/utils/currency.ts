import { AppLocale } from '../db/schema.types';

export function formatLKR(amount: number, locale: AppLocale = 'en'): string {
  const formatted = new Intl.NumberFormat('en-LK', {
    maximumFractionDigits: 0,
    minimumFractionDigits: 0,
  }).format(amount);

  switch (locale) {
    case 'si':
      return `රු. ${formatted}`;
    case 'ta':
      return `ரூ. ${formatted}`;
    case 'en':
    default:
      return `Rs. ${formatted}`;
  }
}
