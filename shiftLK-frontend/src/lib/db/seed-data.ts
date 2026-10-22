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
})[] = [
  {
    id: 'p1000000-0000-0000-0000-000000000001',
    slug: 'toyota-genuine-front-brake-pads-prius-aqua',
    part_number: '04465-47070',
    brand: 'Toyota Genuine',
    category_id: 'c1000000-0000-0000-0000-000000000001',
    condition: 'new',
    selling_price: 14500,
    cost_price: 10200,
    stock_qty: 12,
    weight_kg: 1.8,
    is_active: true,
    images: [
      'https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&w=800&q=80',
    ],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    translations: {
      en: {
        name: 'Toyota Genuine Front Brake Pads (Prius / Aqua / Axio)',
        description: 'Genuine Toyota OEM ceramic front brake pads. Specially formulated for hybrid regenerative braking systems to prevent rotor wear, brake dust, and low-speed squeal. 100% Japanese factory spec.',
      },
      si: {
        name: 'ටොයෝටා ඔරිජිනල් ඉදිරිපස බ්‍රේක් පෑඩ් (Prius / Aqua / Axio)',
        description: 'ටොයෝටා සමාගමේ මුල් සෙරමික් ඉදිරිපස බ්‍රේක් පෑඩ්. හයිබ්‍රිඩ් වාහනවල රීජෙනරේටිව් බ්‍රේකින් පද්ධතියට විශේෂයෙන් සකස් කර ඇති අතර ශබ්ද හා ඩිස්ක් ගෙවීම් වළක්වයි. 100% ජපන් ප්‍රමිතිය.',
      },
      ta: {
        name: 'டொயோட்டா அசல் முன் பிரேக் பேட்கள் (Prius / Aqua / Axio)',
        description: 'டொயோட்டா அசல் செராமிக் முன் பிரேக் பேட்கள். ஹைப்ரிட் வாகனங்களின் பிரேக்கிங் அமைப்பிற்காக விசேடமாக வடிவமைக்கப்பட்டுள்ளது. 100% ஜப்பானிய தொழிற்சாலை தரம்.',
      },
    },
    compatibility: [
      { make: 'Bajaj', model: 'Pulsar 150', year_from: 2010, year_to: 2024, chassis_code: 'UG4 / Twin Disc' },
      { make: 'Bajaj', model: 'Pulsar 200 NS', year_from: 2012, year_to: 2024, chassis_code: 'NS200' },
      { make: 'Honda', model: 'CB Hornet 160R', year_from: 2015, year_to: 2022, chassis_code: 'CBS / ABS' },
      { make: 'Yamaha', model: 'FZ16 / FZ-S (V1/V2/V3)', year_from: 2012, year_to: 2024, chassis_code: 'B97' },
    ],
  },
  {
    id: 'p1000000-0000-0000-0000-000000000002',
    slug: 'denso-iridium-spark-plugs-wagon-r-alto-set4',
    part_number: 'IXUH22I',
    brand: 'Denso Japan',
    category_id: 'c1000000-0000-0000-0000-000000000002',
    condition: 'new',
    selling_price: 11800,
    cost_price: 8200,
    stock_qty: 24,
    weight_kg: 0.4,
    is_active: true,
    images: [
      'https://images.unsplash.com/photo-1588702547919-26089e690ecc?auto=format&fit=crop&w=800&q=80',
    ],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    translations: {
      en: {
        name: 'Denso Iridium Spark Plugs Set of 4 (Suzuki Wagon R / Alto / Hustler)',
        description: 'Ultra-fine 0.4mm laser iridium center electrode. Enhances cold starting, maximizes fuel economy, and guarantees smooth idle for Suzuki 660cc and 800cc R06A / K10B engines.',
      },
      si: {
        name: 'ඩෙන්සෝ ඉරිඩියම් ස්පාර්ක් ප්ලග් කට්ටලය (Suzuki Wagon R / Alto / Hustler)',
        description: 'අතිශය සියුම් 0.4mm ලේසර් ඉරිඩියම් තාක්ෂණය. ඉන්ධන කාර්යක්ෂමතාව ඉහළ නංවන අතර සුසුකි 660cc සහ 800cc R06A එන්ජින් සඳහා වඩාත් සුදුසුය.',
      },
      ta: {
        name: 'டென்சோ இரிடியம் ஸ்பார்க் பிளக் செட் 4 (Suzuki Wagon R / Alto / Hustler)',
        description: '0.4mm லேசர் இரிடியம் தொழில்நுட்பம். எஞ்சின் சீரான இயக்கம் மற்றும் எரிபொருள் சிக்கனத்தை சுசுகி 660cc/800cc எஞ்சின்களுக்கு வழங்குகிறது.',
      },
    },
    compatibility: [
      { make: 'Bajaj', model: 'Discover 125', year_from: 2011, year_to: 2022, chassis_code: 'DTS-i' },
      { make: 'Bajaj', model: 'CT 100', year_from: 2005, year_to: 2024, chassis_code: 'ES / Alloy' },
      { make: 'Honda', model: 'Dio 110', year_from: 2012, year_to: 2024, chassis_code: 'HET / Deluxe' },
      { make: 'Yamaha', model: 'RayZR 125 Fi', year_from: 2019, year_to: 2024, chassis_code: 'Hybrid' },
    ],
  },
  {
    id: 'p1000000-0000-0000-0000-000000000003',
    slug: 'kyb-excel-g-front-shock-absorber-wagon-r-stingray',
    part_number: '333410',
    brand: 'KYB Japan',
    category_id: 'c1000000-0000-0000-0000-000000000001',
    condition: 'new',
    selling_price: 23500,
    cost_price: 17500,
    stock_qty: 6,
    weight_kg: 3.9,
    is_active: true,
    images: [
      'https://images.unsplash.com/photo-1486006920555-c77dce18193b?auto=format&fit=crop&w=800&q=80',
    ],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    translations: {
      en: {
        name: 'KYB Excel-G Front Shock Absorber (Suzuki Wagon R / Stingray MH34S/MH44S)',
        description: 'Twin-tube nitrogen gas charged shock absorber engineered to restore original handling stability and eliminate body roll on rough Sri Lankan road conditions. Sold per piece.',
      },
      si: {
        name: 'KYB එක්සෙල්-ජී ඉදිරිපස ශොක් ඇබ්සෝබර් (Suzuki Wagon R / Stingray MH34S/44S)',
        description: 'නයිට්‍රජන් ගෑස් සහිත උසස් තත්ත්වයේ ජපන් ශොක් ඇබ්සෝබර්. ශ්‍රී ලංකාවේ මාර්ගවල ධාවනය පහසු කරවන අතර වාහනයේ පාලනය උපරිම කරයි. (තනි ඒකකයක්).',
      },
      ta: {
        name: 'KYB எக்செல்-ஜி முன் ஷாக் அப்சார்பர் (Suzuki Wagon R / Stingray MH34S/MH44S)',
        description: 'நைட்ரஜன் வாயு நிரப்பப்பட்ட ஜப்பானிய ஷாக் அப்சார்பர். இலங்கை வீதிகளில் அதிர்வுகளைக் குறைத்து வாகனத்தின் சமநிலையைப் பாதுகாக்கிறது.',
      },
    },
    compatibility: [
      { make: 'Bajaj', model: 'Pulsar 150', year_from: 2010, year_to: 2024, chassis_code: 'Twin Shock Nitrox' },
      { make: 'Yamaha', model: 'FZ16 / FZ-S (V1/V2/V3)', year_from: 2012, year_to: 2024, chassis_code: 'Monoshock' },
      { make: 'Honda', model: 'CB Trigger 150', year_from: 2013, year_to: 2018, chassis_code: 'Mono' },
    ],
  },
  {
    id: 'p1000000-0000-0000-0000-000000000004',
    slug: 'bosch-premium-engine-oil-filter-corolla-premio',
    part_number: '0986AF0059',
    brand: 'Bosch Germany',
    category_id: 'c1000000-0000-0000-0000-000000000002',
    condition: 'new',
    selling_price: 2650,
    cost_price: 1700,
    stock_qty: 38,
    weight_kg: 0.35,
    is_active: true,
    images: [
      'https://images.unsplash.com/photo-1615906655593-ad0386982a0f?auto=format&fit=crop&w=800&q=80',
    ],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    translations: {
      en: {
        name: 'Bosch Premium Spin-On Engine Oil Filter (Toyota Corolla / Premio / Allion / Vitz)',
        description: 'High-efficiency micro-glass filtration medium with anti-drainback silicone valve. Protects 1NZ-FE and 2ZR-FE engines from particulate wear between 5,000km to 10,000km oil change intervals.',
      },
      si: {
        name: 'බොෂ් ප්‍රිමියම් එන්ජින් ඔයිල් ෆිල්ටර් (Toyota Corolla / Premio / Allion / Vitz)',
        description: 'අධි කාර්යක්ෂම ක්ෂුද්‍ර වීදුරු පෙරහන් මාධ්‍යයක් සහිත එන්ජින් ඔයිල් ෆිල්ටරය. 1NZ-FE හා 2ZR-FE එන්ජින්වල දීර්ඝ ආයු කාලය තහවුරු කරයි.',
      },
      ta: {
        name: 'போஷ் பிரீமியம் ஆயில் பில்டர் (Toyota Corolla / Premio / Allion / Vitz)',
        description: 'உயர் திறன் கொண்ட மைக்ரோ கிளாஸ் வடிகட்டி. 1NZ-FE மற்றும் 2ZR-FE எஞ்சின்களுக்கு நீண்ட ஆயுளை வழங்குகிறது.',
      },
    },
    compatibility: [
      { make: 'Bajaj', model: 'Pulsar 200 NS', year_from: 2012, year_to: 2024, chassis_code: 'NS200 Oil Filter' },
      { make: 'Bajaj', model: 'Pulsar 220F', year_from: 2011, year_to: 2023, chassis_code: 'DTS-i' },
      { make: 'Yamaha', model: 'YZF R15 (V2/V3/V4)', year_from: 2012, year_to: 2024, chassis_code: 'V3 / V4' },
      { make: 'Honda', model: 'CB Hornet 160R', year_from: 2015, year_to: 2022, chassis_code: '160R' },
    ],
  },
  {
    id: 'p1000000-0000-0000-0000-000000000005',
    slug: 'valeo-heavy-duty-clutch-kit-suzuki-alto-800',
    part_number: '826553',
    brand: 'Valeo',
    category_id: 'c1000000-0000-0000-0000-000000000002',
    condition: 'new',
    selling_price: 21000,
    cost_price: 15800,
    stock_qty: 8,
    weight_kg: 4.5,
    is_active: true,
    images: [
      'https://images.unsplash.com/photo-1580273916550-e323be2ae537?auto=format&fit=crop&w=800&q=80',
    ],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    translations: {
      en: {
        name: 'Valeo Heavy Duty Clutch Kit (Suzuki Alto 800 / K10 / Wagon R)',
        description: 'Complete 3-piece clutch replacement kit containing clutch disc, pressure plate, and release bearing. Smooth engagement with zero judder in stop-and-go Colombo traffic.',
      },
      si: {
        name: 'වැලිඕ හෙවි ඩියුටි ක්ලච් කට්ටලය (Suzuki Alto 800 / K10 / Wagon R)',
        description: 'ක්ලච් ප්ලේට්, ප්‍රෙෂර් ප්ලේට් සහ බෙයාරින් ඇතුළත් සම්පූර්ණ කට්ටලය. අධික රථවාහන තදබදය සහිත නගරවලදී පවා සුමට ක්ලච් ක්‍රියාකාරිත්වයක් ලබාදෙයි.',
      },
      ta: {
        name: 'வாலியோ கிளட்ச் கிட் (Suzuki Alto 800 / K10 / Wagon R)',
        description: 'கிளட்ச் பிளேட், பிரஷர் பிளேட் மற்றும் பேரிங் அடங்கிய முழுமையான கிட். கொழும்பு நெரிசலான போக்குவரத்திலும் மென்மையான கிளட்ச் அனுபவம்.',
      },
    },
    compatibility: [
      { make: 'Bajaj', model: 'Pulsar 150', year_from: 2005, year_to: 2024, chassis_code: 'UG3 / UG4' },
      { make: 'Bajaj', model: 'Platina 100', year_from: 2010, year_to: 2024, chassis_code: 'Comfortec' },
      { make: 'Honda', model: 'CB Shine 125', year_from: 2012, year_to: 2024, chassis_code: 'SP 125' },
      { make: 'Yamaha', model: 'FZ16 / FZ-S (V1/V2/V3)', year_from: 2010, year_to: 2024, chassis_code: 'Clutch Kit' },
    ],
  },
  {
    id: 'p1000000-0000-0000-0000-000000000006',
    slug: 'denso-high-output-alternator-toyota-hiace-kdh200',
    part_number: '27060-30120',
    brand: 'Denso Japan',
    category_id: 'c1000000-0000-0000-0000-000000000003',
    condition: 'reconditioned',
    selling_price: 38500,
    cost_price: 27000,
    stock_qty: 3,
    weight_kg: 5.8,
    is_active: true,
    images: [
      'https://images.unsplash.com/photo-1541348263662-e0c8de4259ba?auto=format&fit=crop&w=800&q=80',
    ],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    translations: {
      en: {
        name: 'Denso 12V 80A High-Output Alternator (Toyota HiAce KDH200 / KDH201 / Regius)',
        description: 'Japanese imported reconditioned high-output alternator tested under 80 Amp full load. Ideal for 1KD-FTV and 2KD-FTV turbodiesel engines with dual A/C setups.',
      },
      si: {
        name: 'ඩෙන්සෝ 12V 80A ඇල්ටනේටර් (Toyota HiAce KDH200 / KDH201 / Regius)',
        description: 'ජපානයෙන් ආනයනය කළ උසස් තත්ත්වයේ රිකන්ඩිෂන් ඇල්ටනේටරය. 80A ධාරිතාව සම්පූර්ණයෙන් පරීක්ෂා කර ඇත. KDH ඩීසල් වෑන් සඳහා විශේෂයෙන් සුදුසුයි.',
      },
      ta: {
        name: 'டென்சோ 12V 80A ஆல்டர்னேட்டர் (Toyota HiAce KDH200 / KDH201)',
        description: 'ஜப்பானில் இருந்து இறக்குமதி செய்யப்பட்ட உயர்தர ரீகண்டிஷன் ஆல்டர்னேட்டர். KDH டீசல் வாகனங்களுக்கு விசேடமானது.',
      },
    },
    compatibility: [
      { make: 'Bajaj', model: 'Pulsar 150', year_from: 2008, year_to: 2024, chassis_code: 'Stator Coil 12V' },
      { make: 'Honda', model: 'Dio 110', year_from: 2012, year_to: 2024, chassis_code: 'Magneto Coil' },
      { make: 'Yamaha', model: 'RayZR 125 Fi', year_from: 2018, year_to: 2024, chassis_code: 'Smart Motor' },
    ],
  },
  {
    id: 'p1000000-0000-0000-0000-000000000007',
    slug: 'koito-led-headlight-assembly-right-prius-zvw30',
    part_number: '81110-47220',
    brand: 'Koito Japan',
    category_id: 'c1000000-0000-0000-0000-000000000003',
    condition: 'reconditioned',
    selling_price: 46000,
    cost_price: 33000,
    stock_qty: 2,
    weight_kg: 3.2,
    is_active: true,
    images: [
      'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=800&q=80',
    ],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    translations: {
      en: {
        name: 'Koito LED Right Headlight Assembly (Toyota Prius ZVW30 2011-2015 Facelift)',
        description: 'Original Japan reconditioned Koito triple LED projector headlight (driver side / right). Crystal clear UV coated lens with intact mounting brackets and ballast.',
      },
      si: {
        name: 'කොයිටෝ LED දකුණුපස හෙඩ්ලයිට් එකලස් (Toyota Prius ZVW30 2011-2015)',
        description: 'ජපන් රිකන්ඩිෂන් මුල් Koito ත්‍රිත්ව LED ප්‍රොජෙක්ටර් හෙඩ්ලයිට් එක. පැහැදිලි UV ආලේපිත වීදුරුව සහ සියලුම ක්ලිප් බිඳී නොමැත.',
      },
      ta: {
        name: 'கோயிட்டோ LED வலதுபுற ஹெட்லைட் (Toyota Prius ZVW30 2011-2015)',
        description: 'ஜப்பான் ரீகண்டிஷன் அசல் Koito LED புரொஜெக்டர் ஹெட்லைட். தெளிவான UV லென்ஸ் மற்றும் உடைகல் இல்லாத பிராக்கெட்டுகள்.',
      },
    },
    compatibility: [
      { make: 'Bajaj', model: 'Pulsar 200 NS', year_from: 2012, year_to: 2024, chassis_code: 'LED Headlamp' },
      { make: 'Honda', model: 'Dio 110', year_from: 2018, year_to: 2024, chassis_code: 'LED Deluxe' },
      { make: 'Yamaha', model: 'MT-15', year_from: 2019, year_to: 2024, chassis_code: 'Projector Eye' },
    ],
  },
  {
    id: 'p1000000-0000-0000-0000-000000000008',
    slug: 'gates-powergrip-timing-belt-kit-mitsubishi-l200-4d56',
    part_number: 'K015509XS',
    brand: 'Gates Europe',
    category_id: 'c1000000-0000-0000-0000-000000000002',
    condition: 'new',
    selling_price: 34500,
    cost_price: 25500,
    stock_qty: 5,
    weight_kg: 2.1,
    is_active: true,
    images: [
      'https://images.unsplash.com/photo-1530046339160-ce3e530c7d2f?auto=format&fit=crop&w=800&q=80',
    ],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    translations: {
      en: {
        name: 'Gates PowerGrip Timing Belt & Tensioner Kit (Mitsubishi L200 / Pajero Sport 4D56)',
        description: 'Complete heavy-duty timing kit including reinforced HNBR timing belt, balance shaft belt, and hydraulic tensioner pulleys. Rated for 100,000km service life.',
      },
      si: {
        name: 'ගේට්ස් ටයිමින් බෙල්ට් සහ ටෙන්ෂනර් කට්ටලය (Mitsubishi L200 / Pajero 4D56)',
        description: 'ශක්තිමත් HNBR ටයිමින් බෙල්ට්, බැලන්ස් බෙල්ට් සහ ටෙන්ෂනර් පුලි ඇතුළත් සම්පූර්ණ කට්ටලය. කිලෝමීටර් 100,000 ක ධාවන කාලයක් සහතික කෙරේ.',
      },
      ta: {
        name: 'கேட்ஸ் டைமிங் பெல்ட் கிட் (Mitsubishi L200 / Pajero 4D56)',
        description: 'உறுதியான HNBR டைமிங் பெல்ட், பேலன்ஸ் பெல்ட் மற்றும் டென்ஷனர்கள் அடங்கிய தொகுப்பு. 100,000 கி.மீ உழைக்கும் உத்தரவாதம்.',
      },
    },
    compatibility: [
      { make: 'Bajaj', model: 'Pulsar 150', year_from: 2010, year_to: 2024, chassis_code: '428H Chain Kit' },
      { make: 'Yamaha', model: 'FZ16 / FZ-S (V1/V2/V3)', year_from: 2012, year_to: 2024, chassis_code: 'Sprocket Set' },
      { make: 'Honda', model: 'CB Hornet 160R', year_from: 2015, year_to: 2022, chassis_code: 'Drive Kit' },
    ],
  },
  {
    id: 'p1000000-0000-0000-0000-000000000009',
    slug: 'kn-high-flow-engine-air-filter-honda-vezel-fit-gp5',
    part_number: '33-5006',
    brand: 'K&N Engineering',
    category_id: 'c1000000-0000-0000-0000-000000000002',
    condition: 'new',
    selling_price: 16500,
    cost_price: 11500,
    stock_qty: 14,
    weight_kg: 0.6,
    is_active: true,
    images: [
      'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=800&q=80',
    ],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    translations: {
      en: {
        name: 'K&N High Flow Washable Engine Air Filter (Honda Vezel Hybrid RU3 / Fit GP5 / Grace)',
        description: 'Washable, reusable drop-in performance air filter. Delivers up to 50% more airflow compared to standard paper filters, improving acceleration and fuel efficiency for Earth Dreams i-DCD hybrids.',
      },
      si: {
        name: 'K&N එන්ජින් එයාර් ෆිල්ටර් (Honda Vezel Hybrid RU3 / Fit GP5 / Grace)',
        description: 'නැවත සෝදා භාවිතා කළ හැකි හයි-ෆ්ලෝ එයාර් ෆිල්ටරය. සාමාන්‍ය ෆිල්ටර් වලට වඩා 50% කින් වායු සංසරණය ඉහළ නංවා ඉන්ධන පිරිමැස්ම වැඩි කරයි.',
      },
      ta: {
        name: 'K&N எஞ்சின் ஏர் பில்டர் (Honda Vezel Hybrid RU3 / Fit GP5 / Grace)',
        description: 'கழுவி மீண்டும் பயன்படுத்தக்கூடிய ஏர் பில்டர். காற்று ஓட்டத்தை 50% அதிகரித்து எஞ்சின் திறனை மேம்படுத்துகிறது.',
      },
    },
    compatibility: [
      { make: 'Honda', model: 'Dio 110', year_from: 2013, year_to: 2024, chassis_code: 'High Flow Air' },
      { make: 'Honda', model: 'Activa 125', year_from: 2014, year_to: 2024, chassis_code: '125 Fi' },
      { make: 'Bajaj', model: 'Pulsar 200 NS', year_from: 2012, year_to: 2024, chassis_code: 'Air Filter' },
      { make: 'Yamaha', model: 'YZF R15 (V2/V3/V4)', year_from: 2012, year_to: 2024, chassis_code: 'V3 / V4' },
    ],
  },
  {
    id: 'p1000000-0000-0000-0000-000000000010',
    slug: 'brembo-front-vented-brake-discs-pair-nissan-x-trail',
    part_number: '09.A716.21',
    brand: 'Brembo Italy',
    category_id: 'c1000000-0000-0000-0000-000000000004',
    condition: 'new',
    selling_price: 39500,
    cost_price: 29000,
    stock_qty: 4,
    weight_kg: 8.2,
    is_active: true,
    images: [
      'https://images.unsplash.com/photo-1600793575654-910699b5e4d4?auto=format&fit=crop&w=800&q=80',
    ],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    translations: {
      en: {
        name: 'Brembo Front Vented Brake Discs Pair (Nissan X-Trail T31 / T32 / Rogue)',
        description: 'Pair of high-carbon vented front brake rotors treated with anti-corrosion UV coating. Engineered for superior heat dissipation during heavy braking and mountain driving.',
      },
      si: {
        name: 'බ්‍රෙම්බෝ ඉදිරිපස වෙන්ටඩ් බ්‍රේක් ඩිස්ක් ජෝඩුව (Nissan X-Trail T31 / T32)',
        description: 'කාබන් මිශ්‍රිත උසස් වෙන්ටඩ් බ්‍රේක් ඩිස්ක් යුගලය. කඳුකර මාර්ගවල සහ දැඩි තිරිංග යෙදීමේදී උෂ්ණත්වය පාලනය කර ආරක්ෂාව තහවුරු කරයි.',
      },
      ta: {
        name: 'பிரெம்போ முன் பிரேக் டிஸ்க்குகள் ஜோடி (Nissan X-Trail T31 / T32)',
        description: 'கார்பன் கலந்த முன் பிரேக் டிஸ்க்குகள். மலைப் பாதைகளிலும் பிரேக் வெப்பத்தைக் கட்டுப்படுத்தி பாதுகாப்பை வழங்குகிறது.',
      },
    },
    compatibility: [
      { make: 'Bajaj', model: 'Pulsar 200 NS', year_from: 2012, year_to: 2024, chassis_code: '300mm Front Rotor' },
      { make: 'Yamaha', model: 'YZF R15 (V2/V3/V4)', year_from: 2015, year_to: 2024, chassis_code: 'Racing Caliper' },
      { make: 'Honda', model: 'CB Hornet 160R', year_from: 2016, year_to: 2022, chassis_code: 'Petal Disc' },
    ],
  },
  {
    id: 'p1000000-0000-0000-0000-000000000011',
    slug: 'aisin-electric-inverter-water-pump-toyota-aqua-prius-c',
    part_number: 'WPT-190',
    brand: 'Aisin Japan',
    category_id: 'c1000000-0000-0000-0000-000000000004',
    condition: 'new',
    selling_price: 28000,
    cost_price: 20000,
    stock_qty: 7,
    weight_kg: 1.4,
    is_active: true,
    images: [
      'https://images.unsplash.com/photo-1517524008697-84bbe3c3fd98?auto=format&fit=crop&w=800&q=80',
    ],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    translations: {
      en: {
        name: 'Aisin Electric Hybrid Inverter Water Pump (Toyota Aqua NHP10 / Prius C)',
        description: 'Original Aisin electric inverter coolant circulation pump. Critical component to prevent hybrid inverter overheating and warning lights in tropical climate conditions.',
      },
      si: {
        name: 'අයිසින් විදුලි ඉන්වර්ටර් වෝටර් පොම්පය (Toyota Aqua NHP10 / Prius C)',
        description: 'ඔරිජිනල් Aisin ඉන්වර්ටර් කූලන්ට් සංසරණ පොම්පය. ලංකාවේ උණුසුම් කාලගුණයේදී හයිබ්‍රිඩ් ඉන්වර්ටරය රත්වීම වළක්වන අත්‍යවශ්‍ය කොටසකි.',
      },
      ta: {
        name: 'ஐசின் எலக்ட்ரிக் இன்வெர்ட்டர் வாட்டர் பம்ப் (Toyota Aqua NHP10 / Prius C)',
        description: 'அசல் Aisin இன்வெர்ட்டர் கூலண்ட் பம்ப். வெப்பமான காலநிலையில் ஹைப்ரிட் இன்வெர்ட்டர் சூடாவதைத் தடுக்கும் முக்கிய பாகம்.',
      },
    },
    compatibility: [
      { make: 'Bajaj', model: 'CT 100', year_from: 2005, year_to: 2024, chassis_code: 'Ignition Coil' },
      { make: 'Bajaj', model: 'Pulsar 150', year_from: 2010, year_to: 2024, chassis_code: 'DTS-i CDI' },
      { make: 'Honda', model: 'Dio 110', year_from: 2012, year_to: 2024, chassis_code: 'CDI Spark' },
      { make: 'Yamaha', model: 'FZ16 / FZ-S (V1/V2/V3)', year_from: 2010, year_to: 2024, chassis_code: 'TCI Unit' },
    ],
  },
  {
    id: 'p1000000-0000-0000-0000-000000000012',
    slug: 'denso-fuel-pump-in-tank-assembly-nissan-sunny-tiida',
    part_number: '17040-ED000',
    brand: 'Denso Japan',
    category_id: 'c1000000-0000-0000-0000-000000000004',
    condition: 'used',
    selling_price: 19500,
    cost_price: 12500,
    stock_qty: 2,
    weight_kg: 1.1,
    is_active: true,
    images: [
      'https://images.unsplash.com/photo-1563720223185-11003d516935?auto=format&fit=crop&w=800&q=80',
    ],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    translations: {
      en: {
        name: 'Denso In-Tank Electric Fuel Pump Assembly (Nissan Sunny N16 / Tiida / Sylphy)',
        description: 'Original used Japan tested fuel pump assembly with integrated level sender and filter. Tested for consistent 3.5 bar fuel rail pressure under working temperature.',
      },
      si: {
        name: 'ඩෙන්සෝ ටැංකි තුළ ඉන්ධන පොම්පය (Nissan Sunny N16 / Tiida / Sylphy)',
        description: 'ජපානයෙන් ගෙන්වූ පරීක්ෂා කළ පෙට්‍රල් පොම්ප එකලස්කිරීම. 3.5 bar නිවැරදි ඉන්ධන පීඩනය ලබාදෙන බවට තහවුරු කර ඇත.',
      },
      ta: {
        name: 'டென்சோ எரிபொருள் பம்ப் அசெம்பிளி (Nissan Sunny N16 / Tiida / Sylphy)',
        description: 'ஜப்பானில் பரிசோதிக்கப்பட்ட பெட்ரோல் பம்ப் அசெம்பிளி. சரியான 3.5 bar எரிபொருள் அழுத்தத்தை வழங்குகிறது.',
      },
    },
    compatibility: [
      { make: 'Bajaj', model: 'Pulsar 150', year_from: 2008, year_to: 2024, chassis_code: 'Carb Kit' },
      { make: 'Bajaj', model: 'Discover 125', year_from: 2011, year_to: 2022, chassis_code: 'Carb Jet' },
      { make: 'Honda', model: 'Dio 110', year_from: 2012, year_to: 2024, chassis_code: 'Fuel Pump' },
      { make: 'Yamaha', model: 'RayZR 125 Fi', year_from: 2019, year_to: 2024, chassis_code: 'Fi Injector' },
    ],
  },
];
