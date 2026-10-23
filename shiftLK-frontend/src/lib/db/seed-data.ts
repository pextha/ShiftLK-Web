import {
  Category,
  CategoryTranslation,
  DeliveryZone,
  LocalizedProduct,
  Product,
  ProductTranslation,
  VehicleCompatibility,
} from './schema.types';

export const SEED_CATEGORIES: (Category & {
  translations: Record<'en' | 'si' | 'ta', { name: string; description: string }>;
})[] = [
  {
    id: 'c1000000-0000-0000-0000-000000000001',
    slug: 'indian-bike-spares',
    icon: 'wrench',
    display_order: 1,
    is_active: true,
    created_at: new Date().toISOString(),
    translations: {
      en: {
        name: 'Indian Bike Spare Parts',
        description: 'Engine, transmission, cables, brake pads & genuine mechanical spares for Bajaj, Yamaha, TVS & Honda motorbikes',
      },
      si: {
        name: 'ඉන්දියන් බයික් අමතර කොටස්',
        description: 'Bajaj (Pulsar, Discover, CT100), Yamaha (FZ, R15), TVS සහ Honda සඳහා එන්ජින්, කේබල්, බ්‍රේක් සහ අමතර කොටස්',
      },
      ta: {
        name: 'இந்திய மோட்டார் பைக் உதிரிப்பாகங்கள்',
        description: 'Bajaj, Yamaha, TVS மோட்டார் பைக்குகளுக்கான ஒரிஜினல் என்ஜின், பிரேக், கேபிள் மற்றும் உதிரிப்பாகங்கள்',
      },
    },
  },
  {
    id: 'c1000000-0000-0000-0000-000000000002',
    slug: 'modification-parts',
    icon: 'flame',
    display_order: 2,
    is_active: true,
    created_at: new Date().toISOString(),
    translations: {
      en: {
        name: 'Modification & Performance',
        description: 'Custom exhausts, crash guards, handlebars, lever protectors, LED indicators & styling accessories',
      },
      si: {
        name: 'මොඩිෆිකේෂන් සහ උපාංග',
        description: 'කස්ටම් සයිලන්සර්, ක්‍රෑෂ් ගාඩ්, හැන්ඩ්ල් බාර්, LED ලයිට් සහ බයික් මොඩිෆයි කොටස්',
      },
      ta: {
        name: 'மாடிஃபிகேஷன் மற்றும் பாகங்கள்',
        description: 'சைலன்சர்கள், கிராஷ் கார்டுகள், ஹேண்டில் பார்கள், எல்இடி விளக்குகள் மற்றும் மாடிஃபை பாகங்கள்',
      },
    },
  },
  {
    id: 'c1000000-0000-0000-0000-000000000003',
    slug: 'body-stickers',
    icon: 'palette',
    display_order: 3,
    is_active: true,
    created_at: new Date().toISOString(),
    translations: {
      en: {
        name: 'Body Stickers & Decals',
        description: 'Full bike sticker kits, tank pads, custom 3M graphics, rim tapes & waterproof vinyl wraps for all bikes',
      },
      si: {
        name: 'බොඩි ස්ටිකර් සහ ඩෙකල්ස්',
        description: 'ෆුල් බොඩි ස්ටිකර් කිට්ස්, 3M ග්‍රැෆික්ස්, ටෑන්ක් පෑඩ්, රිම් ටේප් සහ උසස් තත්වයේ මෝටර්බයික් ස්ටිකර්',
      },
      ta: {
        name: 'பாடி ஸ்டிக்கர்கள் & டெக்கல்கள்',
        description: 'முழு பாடி ஸ்டிக்கர் கிட்கள், டேங்க் பேட்கள், 3M கிராபிக்ஸ் மற்றும் வாட்டர்ப்ரூப் ஸ்டிக்கர்கள்',
      },
    },
  },
  {
    id: 'c1000000-0000-0000-0000-000000000004',
    slug: 'helmets-riding-gear',
    icon: 'shield',
    display_order: 4,
    is_active: true,
    created_at: new Date().toISOString(),
    translations: {
      en: {
        name: 'Helmets & Riding Gear',
        description: 'Full-face, modular & open-face certified helmets, smoke/iridium visors, riding gloves & safety accessories',
      },
      si: {
        name: 'හෙල්මට් සහ රයිඩින් ගියර්',
        description: 'ෆුල් ෆේස් සහ ඕපන් ෆේස් හෙල්මට්, වයිසර් (Visors), රයිඩින් අත්වැසුම් සහ ආරක්ෂිත ගියර්',
      },
      ta: {
        name: 'ஹெல்மெட்கள் & ரைடிங் கியர்',
        description: 'முழு முக ஹெல்மெட்டுகள், விஸர்கள், ரைடிங் கையுறைகள் மற்றும் பாதுகாப்பு உபகரணங்கள்',
      },
    },
  },
];

export const SEED_DELIVERY_ZONES: DeliveryZone[] = [
  { id: 'dz-1', district: 'Colombo', province: 'Western', base_fee: 425, extra_per_kg: 100, estimated_days: '1-2 Days', is_active: true },
  { id: 'dz-2', district: 'Gampaha', province: 'Western', base_fee: 425, extra_per_kg: 100, estimated_days: '1-2 Days', is_active: true },
  { id: 'dz-3', district: 'Kalutara', province: 'Western', base_fee: 425, extra_per_kg: 100, estimated_days: '1-2 Days', is_active: true },
  { id: 'dz-4', district: 'Kandy', province: 'Central', base_fee: 425, extra_per_kg: 100, estimated_days: '2-3 Days', is_active: true },
  { id: 'dz-5', district: 'Matale', province: 'Central', base_fee: 425, extra_per_kg: 100, estimated_days: '2-3 Days', is_active: true },
  { id: 'dz-6', district: 'Nuwara Eliya', province: 'Central', base_fee: 425, extra_per_kg: 100, estimated_days: '2-3 Days', is_active: true },
  { id: 'dz-7', district: 'Galle', province: 'Southern', base_fee: 425, extra_per_kg: 100, estimated_days: '2-3 Days', is_active: true },
  { id: 'dz-8', district: 'Matara', province: 'Southern', base_fee: 425, extra_per_kg: 100, estimated_days: '2-3 Days', is_active: true },
  { id: 'dz-9', district: 'Hambantota', province: 'Southern', base_fee: 425, extra_per_kg: 100, estimated_days: '2-3 Days', is_active: true },
  { id: 'dz-10', district: 'Jaffna', province: 'Northern', base_fee: 425, extra_per_kg: 100, estimated_days: '2-3 Days', is_active: true },
  { id: 'dz-11', district: 'Kilinochchi', province: 'Northern', base_fee: 425, extra_per_kg: 100, estimated_days: '2-3 Days', is_active: true },
  { id: 'dz-12', district: 'Mannar', province: 'Northern', base_fee: 425, extra_per_kg: 100, estimated_days: '2-3 Days', is_active: true },
  { id: 'dz-13', district: 'Vavuniya', province: 'Northern', base_fee: 425, extra_per_kg: 100, estimated_days: '2-3 Days', is_active: true },
  { id: 'dz-14', district: 'Mullaitivu', province: 'Northern', base_fee: 425, extra_per_kg: 100, estimated_days: '2-3 Days', is_active: true },
  { id: 'dz-15', district: 'Batticaloa', province: 'Eastern', base_fee: 425, extra_per_kg: 100, estimated_days: '2-3 Days', is_active: true },
  { id: 'dz-16', district: 'Ampara', province: 'Eastern', base_fee: 425, extra_per_kg: 100, estimated_days: '2-3 Days', is_active: true },
  { id: 'dz-17', district: 'Trincomalee', province: 'Eastern', base_fee: 425, extra_per_kg: 100, estimated_days: '2-3 Days', is_active: true },
  { id: 'dz-18', district: 'Kurunegala', province: 'North Western', base_fee: 425, extra_per_kg: 100, estimated_days: '2-3 Days', is_active: true },
  { id: 'dz-19', district: 'Puttalam', province: 'North Western', base_fee: 425, extra_per_kg: 100, estimated_days: '2-3 Days', is_active: true },
  { id: 'dz-20', district: 'Anuradhapura', province: 'North Central', base_fee: 425, extra_per_kg: 100, estimated_days: '2-3 Days', is_active: true },
  { id: 'dz-21', district: 'Polonnaruwa', province: 'North Central', base_fee: 425, extra_per_kg: 100, estimated_days: '2-3 Days', is_active: true },
  { id: 'dz-22', district: 'Badulla', province: 'Uva', base_fee: 425, extra_per_kg: 100, estimated_days: '2-3 Days', is_active: true },
  { id: 'dz-23', district: 'Monaragala', province: 'Uva', base_fee: 425, extra_per_kg: 100, estimated_days: '2-3 Days', is_active: true },
  { id: 'dz-24', district: 'Ratnapura', province: 'Sabaragamuwa', base_fee: 425, extra_per_kg: 100, estimated_days: '2-3 Days', is_active: true },
  { id: 'dz-25', district: 'Kegalle', province: 'Sabaragamuwa', base_fee: 425, extra_per_kg: 100, estimated_days: '2-3 Days', is_active: true },
];

export const SEED_RAW_PRODUCTS: (Product & {
  cost_price: number;
  translations: Record<'en' | 'si' | 'ta', { name: string; description: string }>;
  compatibility: Omit<VehicleCompatibility, 'id' | 'product_id'>[];
})[] = [];
