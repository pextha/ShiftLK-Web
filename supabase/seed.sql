-- ==============================================================================
-- ShiftLK Spares - Complete Seed Data
-- 3 Categories, 25 Sri Lankan Districts, 12 Detailed Spare Parts (en, si, ta)
-- ==============================================================================

-- 1. Insert Categories
INSERT INTO categories (id, slug, icon, display_order, is_active) VALUES
('c1000000-0000-0000-0000-000000000001', 'indian-bike-spares', 'Wrench', 1, true),
('c1000000-0000-0000-0000-000000000002', 'modification-parts', 'Flame', 2, true),
('c1000000-0000-0000-0000-000000000003', 'body-stickers', 'Palette', 3, true),
('c1000000-0000-0000-0000-000000000004', 'helmets-riding-gear', 'Shield', 4, true)
ON CONFLICT (id) DO UPDATE SET slug = EXCLUDED.slug, icon = EXCLUDED.icon, display_order = EXCLUDED.display_order;

-- Category Translations (English)
INSERT INTO category_translations (category_id, language, name, description) VALUES
('c1000000-0000-0000-0000-000000000001', 'en', 'Indian Bike Spare Parts', 'Engine, transmission, cables, brake pads & genuine mechanical spares for Bajaj, Yamaha, TVS & Honda motorbikes'),
('c1000000-0000-0000-0000-000000000002', 'en', 'Modification & Performance', 'Custom exhausts, crash guards, handlebars, lever protectors, LED indicators & styling accessories'),
('c1000000-0000-0000-0000-000000000003', 'en', 'Body Stickers & Decals', 'Full bike sticker kits, tank pads, custom 3M graphics, rim tapes & waterproof vinyl wraps for all bikes'),
('c1000000-0000-0000-0000-000000000004', 'en', 'Helmets & Riding Gear', 'Full-face, modular & open-face certified helmets, smoke/iridium visors, riding gloves & safety accessories')
ON CONFLICT (category_id, language) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description;

-- Category Translations (Sinhala)
INSERT INTO category_translations (category_id, language, name, description) VALUES
('c1000000-0000-0000-0000-000000000001', 'si', 'ඉන්දියන් බයික් අමතර කොටස්', 'Bajaj (Pulsar, Discover, CT100), Yamaha (FZ, R15), TVS සහ Honda සඳහා එන්ජින්, කේබල්, බ්‍රේක් සහ අමතර කොටස්'),
('c1000000-0000-0000-0000-000000000002', 'si', 'මොඩිෆිකේෂන් සහ උපාංග', 'කස්ටම් සයිලන්සර්, ක්‍රෑෂ් ගාඩ්, හැන්ඩ්ල් බාර්, LED ලයිට් සහ බයික් මොඩිෆයි කොටස්'),
('c1000000-0000-0000-0000-000000000003', 'si', 'බොඩි ස්ටිකර් සහ ඩෙකල්ස්', 'ෆුල් බොඩි ස්ටිකර් කිට්ස්, 3M ග්‍රැෆික්ස්, ටෑන්ක් පෑඩ්, රිම් ටේප් සහ උසස් තත්වයේ මෝටර්බයික් ස්ටිකර්'),
('c1000000-0000-0000-0000-000000000004', 'si', 'හෙල්මට් සහ රයිඩින් ගියර්', 'ෆුල් ෆේස් සහ ඕපන් ෆේස් හෙල්මට්, වයිසර් (Visors), රයිඩින් අත්වැසුම් සහ ආරක්ෂිත ගියර්')
ON CONFLICT (category_id, language) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description;

-- Category Translations (Tamil)
INSERT INTO category_translations (category_id, language, name, description) VALUES
('c1000000-0000-0000-0000-000000000001', 'ta', 'இந்திய மோட்டார் பைக் உதிரிப்பாகங்கள்', 'Bajaj, Yamaha, TVS மோட்டார் பைக்குகளுக்கான ஒரிஜினல் என்ஜின், பிரேக், கேபிள் மற்றும் உதிரிப்பாகங்கள்'),
('c1000000-0000-0000-0000-000000000002', 'ta', 'மாடிஃபிகேஷன் மற்றும் பாகங்கள்', 'சைலன்சர்கள், கிராஷ் கார்டுகள், ஹேண்டில் பார்கள், எல்இடி விளக்குகள் மற்றும் மாடிஃபை பாகங்கள்'),
('c1000000-0000-0000-0000-000000000003', 'ta', 'பாடி ஸ்டிக்கர்கள் & டெக்கல்கள்', 'முழு பாடி ஸ்டிக்கர் கிட்கள், டேங்க் பேட்கள், 3M கிராபிக்ஸ் மற்றும் வாட்டர்ப்ரூப் ஸ்டிக்கர்கள்'),
('c1000000-0000-0000-0000-000000000004', 'ta', 'ஹெல்மெட்கள் & ரைடிங் கியர்', 'முழு முக ஹெல்மெட்டுகள், விஸர்கள், ரைடிங் கையுறைகள் மற்றும் பாதுகாப்பு உபகரணங்கள்')
ON CONFLICT (category_id, language) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description;

-- 2. Insert All 25 Sri Lankan Districts into Delivery Zones
INSERT INTO delivery_zones (district, province, base_fee, extra_per_kg, estimated_days, is_active) VALUES
('Colombo', 'Western', 425.00, 100.00, '1-2 Days', true),
('Gampaha', 'Western', 425.00, 100.00, '1-2 Days', true),
('Kalutara', 'Western', 425.00, 100.00, '1-2 Days', true),
('Kandy', 'Central', 425.00, 100.00, '2-3 Days', true),
('Matale', 'Central', 425.00, 100.00, '2-3 Days', true),
('Nuwara Eliya', 'Central', 425.00, 100.00, '2-3 Days', true),
('Galle', 'Southern', 425.00, 100.00, '2-3 Days', true),
('Matara', 'Southern', 425.00, 100.00, '2-3 Days', true),
('Hambantota', 'Southern', 425.00, 100.00, '2-3 Days', true),
('Jaffna', 'Northern', 425.00, 100.00, '2-3 Days', true),
('Kilinochchi', 'Northern', 425.00, 100.00, '2-3 Days', true),
('Mannar', 'Northern', 425.00, 100.00, '2-3 Days', true),
('Vavuniya', 'Northern', 425.00, 100.00, '2-3 Days', true),
('Mullaitivu', 'Northern', 425.00, 100.00, '2-3 Days', true),
('Batticaloa', 'Eastern', 425.00, 100.00, '2-3 Days', true),
('Ampara', 'Eastern', 425.00, 100.00, '2-3 Days', true),
('Trincomalee', 'Eastern', 425.00, 100.00, '2-3 Days', true),
('Kurunegala', 'North Western', 425.00, 100.00, '2-3 Days', true),
('Puttalam', 'North Western', 425.00, 100.00, '2-3 Days', true),
('Anuradhapura', 'North Central', 425.00, 100.00, '2-3 Days', true),
('Polonnaruwa', 'North Central', 425.00, 100.00, '2-3 Days', true),
('Badulla', 'Uva', 425.00, 100.00, '2-3 Days', true),
('Monaragala', 'Uva', 425.00, 100.00, '2-3 Days', true),
('Ratnapura', 'Sabaragamuwa', 425.00, 100.00, '2-3 Days', true),
('Kegalle', 'Sabaragamuwa', 425.00, 100.00, '2-3 Days', true)
ON CONFLICT (district) DO UPDATE SET 
  base_fee = EXCLUDED.base_fee, 
  extra_per_kg = EXCLUDED.extra_per_kg,
  estimated_days = EXCLUDED.estimated_days;

-- 3. Insert 12 Products
-- (cost_price is stored for admin profit margins, never exposed to customer API)
INSERT INTO products (id, slug, part_number, brand, category_id, condition, selling_price, cost_price, stock_qty, weight_kg, is_active, images) VALUES
(
  'p1000000-0000-0000-0000-000000000001',
  'toyota-genuine-front-brake-pads-prius-aqua',
  '04465-47070',
  'Toyota Genuine',
  'c1000000-0000-0000-0000-000000000001',
  'new',
  14500.00,
  10200.00,
  12,
  1.8,
  true,
  ARRAY[
    'https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&w=800&q=80'
  ]
),
(
  'p1000000-0000-0000-0000-000000000002',
  'denso-iridium-spark-plugs-wagon-r-alto-set4',
  'IXUH22I',
  'Denso Japan',
  'c1000000-0000-0000-0000-000000000002',
  'new',
  11800.00,
  8200.00,
  24,
  0.4,
  true,
  ARRAY[
    'https://images.unsplash.com/photo-1588702547919-26089e690ecc?auto=format&fit=crop&w=800&q=80'
  ]
),
(
  'p1000000-0000-0000-0000-000000000003',
  'kyb-excel-g-front-shock-absorber-wagon-r-stingray',
  '333410',
  'KYB Japan',
  'c1000000-0000-0000-0000-000000000001',
  'new',
  23500.00,
  17500.00,
  6,
  3.9,
  true,
  ARRAY[
    'https://images.unsplash.com/photo-1486006920555-c77dce18193b?auto=format&fit=crop&w=800&q=80'
  ]
),
(
  'p1000000-0000-0000-0000-000000000004',
  'bosch-premium-engine-oil-filter-corolla-premio',
  '0986AF0059',
  'Bosch Germany',
  'c1000000-0000-0000-0000-000000000002',
  'new',
  2650.00,
  1700.00,
  38,
  0.35,
  true,
  ARRAY[
    'https://images.unsplash.com/photo-1615906655593-ad0386982a0f?auto=format&fit=crop&w=800&q=80'
  ]
),
(
  'p1000000-0000-0000-0000-000000000005',
  'valeo-heavy-duty-clutch-kit-suzuki-alto-800',
  '826553',
  'Valeo',
  'c1000000-0000-0000-0000-000000000002',
  'new',
  21000.00,
  15800.00,
  8,
  4.5,
  true,
  ARRAY[
    'https://images.unsplash.com/photo-1580273916550-e323be2ae537?auto=format&fit=crop&w=800&q=80'
  ]
),
(
  'p1000000-0000-0000-0000-000000000006',
  'denso-high-output-alternator-toyota-hiace-kdh200',
  '27060-30120',
  'Denso Japan',
  'c1000000-0000-0000-0000-000000000003',
  'reconditioned',
  38500.00,
  27000.00,
  3,
  5.8,
  true,
  ARRAY[
    'https://images.unsplash.com/photo-1541348263662-e0c8de4259ba?auto=format&fit=crop&w=800&q=80'
  ]
),
(
  'p1000000-0000-0000-0000-000000000007',
  'koito-led-headlight-assembly-right-prius-zvw30',
  '81110-47220',
  'Koito Japan',
  'c1000000-0000-0000-0000-000000000003',
  'reconditioned',
  46000.00,
  33000.00,
  2,
  3.2,
  true,
  ARRAY[
    'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=800&q=80'
  ]
),
(
  'p1000000-0000-0000-0000-000000000008',
  'gates-powergrip-timing-belt-kit-mitsubishi-l200-4d56',
  'K015509XS',
  'Gates Europe',
  'c1000000-0000-0000-0000-000000000002',
  'new',
  34500.00,
  25500.00,
  5,
  2.1,
  true,
  ARRAY[
    'https://images.unsplash.com/photo-1530046339160-ce3e530c7d2f?auto=format&fit=crop&w=800&q=80'
  ]
),
(
  'p1000000-0000-0000-0000-000000000009',
  'kn-high-flow-engine-air-filter-honda-vezel-fit-gp5',
  '33-5006',
  'K&N Engineering',
  'c1000000-0000-0000-0000-000000000002',
  'new',
  16500.00,
  11500.00,
  14,
  0.6,
  true,
  ARRAY[
    'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=800&q=80'
  ]
),
(
  'p1000000-0000-0000-0000-000000000010',
  'brembo-front-vented-brake-discs-pair-nissan-x-trail',
  '09.A716.21',
  'Brembo Italy',
  'c1000000-0000-0000-0000-000000000001',
  'new',
  39500.00,
  29000.00,
  4,
  8.2,
  true,
  ARRAY[
    'https://images.unsplash.com/photo-1600793575654-910699b5e4d4?auto=format&fit=crop&w=800&q=80'
  ]
),
(
  'p1000000-0000-0000-0000-000000000011',
  'aisin-electric-inverter-water-pump-toyota-aqua-prius-c',
  'WPT-190',
  'Aisin Japan',
  'c1000000-0000-0000-0000-000000000002',
  'new',
  28000.00,
  20000.00,
  7,
  1.4,
  true,
  ARRAY[
    'https://images.unsplash.com/photo-1517524008697-84bbe3c3fd98?auto=format&fit=crop&w=800&q=80'
  ]
),
(
  'p1000000-0000-0000-0000-000000000012',
  'denso-fuel-pump-in-tank-assembly-nissan-sunny-tiida',
  '17040-ED000',
  'Denso Japan',
  'c1000000-0000-0000-0000-000000000003',
  'used',
  19500.00,
  12500.00,
  2,
  1.1,
  true,
  ARRAY[
    'https://images.unsplash.com/photo-1563720223185-11003d516935?auto=format&fit=crop&w=800&q=80'
  ]
)
ON CONFLICT (id) DO UPDATE SET
  selling_price = EXCLUDED.selling_price,
  cost_price = EXCLUDED.cost_price,
  stock_qty = EXCLUDED.stock_qty;

-- 4. Product Translations (English)
INSERT INTO product_translations (product_id, language, name, description) VALUES
('p1000000-0000-0000-0000-000000000001', 'en', 'Toyota Genuine Front Brake Pads (Prius / Aqua / Axio)', 'Genuine Toyota OEM ceramic front brake pads. Specially formulated for hybrid regenerative braking systems to prevent rotor wear, brake dust, and low-speed squeal. 100% Japanese factory spec.'),
('p1000000-0000-0000-0000-000000000002', 'en', 'Denso Iridium Spark Plugs Set of 4 (Suzuki Wagon R / Alto / Hustler)', 'Ultra-fine 0.4mm laser iridium center electrode. Enhances cold starting, maximizes fuel economy, and guarantees smooth idle for Suzuki 660cc and 800cc R06A / K10B engines.'),
('p1000000-0000-0000-0000-000000000003', 'en', 'KYB Excel-G Front Shock Absorber (Suzuki Wagon R / Stingray MH34S/MH44S)', 'Twin-tube nitrogen gas charged shock absorber engineered to restore original handling stability and eliminate body roll on rough Sri Lankan road conditions. Sold per piece.'),
('p1000000-0000-0000-0000-000000000004', 'en', 'Bosch Premium Spin-On Engine Oil Filter (Toyota Corolla / Premio / Allion / Vitz)', 'High-efficiency micro-glass filtration medium with anti-drainback silicone valve. Protects 1NZ-FE and 2ZR-FE engines from particulate wear between 5,000km to 10,000km oil change intervals.'),
('p1000000-0000-0000-0000-000000000005', 'en', 'Valeo Heavy Duty Clutch Kit (Suzuki Alto 800 / K10 / Wagon R)', 'Complete 3-piece clutch replacement kit containing clutch disc, pressure plate, and release bearing. Smooth engagement with zero judder in stop-and-go Colombo traffic.'),
('p1000000-0000-0000-0000-000000000006', 'en', 'Denso 12V 80A High-Output Alternator (Toyota HiAce KDH200 / KDH201 / Regius)', 'Japanese imported reconditioned high-output alternator tested under 80 Amp full load. Ideal for 1KD-FTV and 2KD-FTV turbodiesel engines with dual A/C setups.'),
('p1000000-0000-0000-0000-000000000007', 'en', 'Koito LED Right Headlight Assembly (Toyota Prius ZVW30 2011-2015 Facelift)', 'Original Japan reconditioned Koito triple LED projector headlight (driver side / right). Crystal clear UV coated lens with intact mounting brackets and ballast.'),
('p1000000-0000-0000-0000-000000000008', 'en', 'Gates PowerGrip Timing Belt & Tensioner Kit (Mitsubishi L200 / Pajero Sport 4D56)', 'Complete heavy-duty timing kit including reinforced HNBR timing belt, balance shaft belt, and hydraulic tensioner pulleys. Rated for 100,000km service life.'),
('p1000000-0000-0000-0000-000000000009', 'en', 'K&N High Flow Washable Engine Air Filter (Honda Vezel Hybrid RU3 / Fit GP5 / Grace)', 'Washable, reusable drop-in performance air filter. Delivers up to 50% more airflow compared to standard paper filters, improving acceleration and fuel efficiency for Earth Dreams i-DCD hybrids.'),
('p1000000-0000-0000-0000-000000000010', 'en', 'Brembo Front Vented Brake Discs Pair (Nissan X-Trail T31 / T32 / Rogue)', 'Pair of high-carbon vented front brake rotors treated with anti-corrosion UV coating. Engineered for superior heat dissipation during heavy braking and mountain driving.'),
('p1000000-0000-0000-0000-000000000011', 'en', 'Aisin Electric Hybrid Inverter Water Pump (Toyota Aqua NHP10 / Prius C)', 'Original Aisin electric inverter coolant circulation pump. Critical component to prevent hybrid inverter overheating and warning lights in tropical climate conditions.'),
('p1000000-0000-0000-0000-000000000012', 'en', 'Denso In-Tank Electric Fuel Pump Assembly (Nissan Sunny N16 / Tiida / Sylphy)', 'Original used Japan tested fuel pump assembly with integrated level sender and filter. Tested for consistent 3.5 bar fuel rail pressure under working temperature.')
ON CONFLICT (product_id, language) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description;

-- Product Translations (Sinhala)
INSERT INTO product_translations (product_id, language, name, description) VALUES
('p1000000-0000-0000-0000-000000000001', 'si', 'ටොයෝටා ඔරිජිනල් ඉදිරිපස බ්‍රේක් පෑඩ් (Prius / Aqua / Axio)', 'ටොයෝටා සමාගමේ මුල් සෙරමික් ඉදිරිපස බ්‍රේක් පෑඩ්. හයිබ්‍රිඩ් වාහනවල රීජෙනරේටිව් බ්‍රේකින් පද්ධතියට විශේෂයෙන් සකස් කර ඇති අතර ශබ්ද හා ඩිස්ක් ගෙවීම් වළක්වයි. 100% ජපන් ප්‍රමිතිය.'),
('p1000000-0000-0000-0000-000000000002', 'si', 'ඩෙන්සෝ ඉරිඩියම් ස්පාර්ක් ප්ලග් කට්ටලය (Suzuki Wagon R / Alto / Hustler)', 'අතිශය සියුම් 0.4mm ලේසර් ඉරිඩියම් තාක්ෂණය. ඉන්ධන කාර්යක්ෂමතාව ඉහළ නංවන අතර සුසුකි 660cc සහ 800cc R06A එන්ජින් සඳහා වඩාත් සුදුසුය.'),
('p1000000-0000-0000-0000-000000000003', 'si', 'KYB එක්සෙල්-ජී ඉදිරිපස ශොක් ඇබ්සෝබර් (Suzuki Wagon R / Stingray MH34S/44S)', 'නයිට්‍රජන් ගෑස් සහිත උසස් තත්ත්වයේ ජපන් ශොක් ඇබ්සෝබර්. ශ්‍රී ලංකාවේ මාර්ගවල ධාවනය පහසු කරවන අතර වාහනයේ පාලනය උපරිම කරයි. (තනි ඒකකයක්).'),
('p1000000-0000-0000-0000-000000000004', 'si', 'බොෂ් ප්‍රිමියම් එන්ජින් ඔයිල් ෆිල්ටර් (Toyota Corolla / Premio / Allion / Vitz)', 'අධි කාර්යක්ෂම ක්ෂුද්‍ර වීදුරු පෙරහන් මාධ්‍යයක් සහිත එන්ජින් ඔයිල් ෆිල්ටරය. 1NZ-FE හා 2ZR-FE එන්ජින්වල දීර්ඝ ආයු කාලය තහවුරු කරයි.'),
('p1000000-0000-0000-0000-000000000005', 'si', 'වැලිඕ හෙවි ඩියුටි ක්ලච් කට්ටලය (Suzuki Alto 800 / K10 / Wagon R)', 'ක්ලච් ප්ලේට්, ප්‍රෙෂර් ප්ලේට් සහ බෙයාරින් ඇතුළත් සම්පූර්ණ කට්ටලය. අධික රථවාහන තදබදය සහිත නගරවලදී පවා සුමට ක්ලච් ක්‍රියාකාරිත්වයක් ලබාදෙයි.'),
('p1000000-0000-0000-0000-000000000006', 'si', 'ඩෙන්සෝ 12V 80A ඇල්ටනේටර් (Toyota HiAce KDH200 / KDH201 / Regius)', 'ජපානයෙන් ආනයනය කළ උසස් තත්ත්වයේ රිකන්ඩිෂන් ඇල්ටනේටරය. 80A ධාරිතාව සම්පූර්ණයෙන් පරීක්ෂා කර ඇත. KDH ඩීසල් වෑන් සඳහා විශේෂයෙන් සුදුසුයි.'),
('p1000000-0000-0000-0000-000000000007', 'si', 'කොයිටෝ LED දකුණුපස හෙඩ්ලයිට් එකලස් (Toyota Prius ZVW30 2011-2015)', 'ජපන් රිකන්ඩිෂන් මුල් Koito ත්‍රිත්ව LED ප්‍රොජෙක්ටර් හෙඩ්ලයිට් එක. පැහැදිලි UV ආලේපිත වීදුරුව සහ සියලුම ක්ලිප් බිඳී නොමැත.'),
('p1000000-0000-0000-0000-000000000008', 'si', 'ගේට්ස් ටයිමින් බෙල්ට් සහ ටෙන්ෂනර් කට්ටලය (Mitsubishi L200 / Pajero 4D56)', 'ශක්තිමත් HNBR ටයිමින් බෙල්ට්, බැලන්ස් බෙල්ට් සහ ටෙන්ෂනර් පුලි ඇතුළත් සම්පූර්ණ කට්ටලය. කිලෝමීටර් 100,000 ක ධාවන කාලයක් සහතික කෙරේ.'),
('p1000000-0000-0000-0000-000000000009', 'si', 'K&N එන්ජින් එයාර් ෆිල්ටර් (Honda Vezel Hybrid RU3 / Fit GP5 / Grace)', 'නැවත සෝදා භාවිතා කළ හැකි හයි-ෆ්ලෝ එයාර් ෆිල්ටරය. සාමාන්‍ය ෆිල්ටර් වලට වඩා 50% කින් වායු සංසරණය ඉහළ නංවා ඉන්ධන පිරිමැස්ම වැඩි කරයි.'),
('p1000000-0000-0000-0000-000000000010', 'si', 'බ්‍රෙම්බෝ ඉදිරිපස වෙන්ටඩ් බ්‍රේක් ඩිස්ක් ජෝඩුව (Nissan X-Trail T31 / T32)', 'කාබන් මිශ්‍රිත උසස් වෙන්ටඩ් බ්‍රේක් ඩිස්ක් යුගලය. කඳුකර මාර්ගවල සහ දැඩි තිරිංග යෙදීමේදී උෂ්ණත්වය පාලනය කර ආරක්ෂාව තහවුරු කරයි.'),
('p1000000-0000-0000-0000-000000000011', 'si', 'අයිසින් විදුලි ඉන්වර්ටර් වෝටර් පොම්පය (Toyota Aqua NHP10 / Prius C)', 'ඔරිජිනල් Aisin ඉන්වර්ටර් කූලන්ට් සංසරණ පොම්පය. ලංකාවේ උණුසුම් කාලගුණයේදී හයිබ්‍රිඩ් ඉන්වර්ටරය රත්වීම වළක්වන අත්‍යවශ්‍ය කොටසකි.'),
('p1000000-0000-0000-0000-000000000012', 'si', 'ඩෙන්සෝ ටැංකි තුළ ඉන්ධන පොම්පය (Nissan Sunny N16 / Tiida / Sylphy)', 'ජපානයෙන් ගෙන්වූ පරීක්ෂා කළ පෙට්‍රල් පොම්ප එකලස්කිරීම. 3.5 bar නිවැරදි ඉන්ධන පීඩනය ලබාදෙන බවට තහවුරු කර ඇත.')
ON CONFLICT (product_id, language) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description;

-- Product Translations (Tamil)
INSERT INTO product_translations (product_id, language, name, description) VALUES
('p1000000-0000-0000-0000-000000000001', 'ta', 'டொயோட்டா அசல் முன் பிரேக் பேட்கள் (Prius / Aqua / Axio)', 'டொயோட்டா அசல் செராமிக் முன் பிரேக் பேட்கள். ஹைப்ரிட் வாகனங்களின் பிரேக்கிங் அமைப்பிற்காக விசேடமாக வடிவமைக்கப்பட்டுள்ளது. 100% ஜப்பானிய தொழிற்சாலை தரம்.'),
('p1000000-0000-0000-0000-000000000002', 'ta', 'டென்சோ இரிடியம் ஸ்பார்க் பிளக் செட் 4 (Suzuki Wagon R / Alto / Hustler)', '0.4mm லேசர் இரிடியம் தொழில்நுட்பம். எஞ்சின் சீரான இயக்கம் மற்றும் எரிபொருள் சிக்கனத்தை சுசுகி 660cc/800cc எஞ்சின்களுக்கு வழங்குகிறது.'),
('p1000000-0000-0000-0000-000000000003', 'ta', 'KYB எக்செல்-ஜி முன் ஷாக் அப்சார்பர் (Suzuki Wagon R / Stingray MH34S/MH44S)', 'நைட்ரஜன் வாயு நிரப்பப்பட்ட ஜப்பானிய ஷாக் அப்சார்பர். இலங்கை வீதிகளில் அதிர்வுகளைக் குறைத்து வாகனத்தின் சமநிலையைப் பாதுகாக்கிறது.'),
('p1000000-0000-0000-0000-000000000004', 'ta', 'போஷ் பிரீமியம் ஆயில் பில்டர் (Toyota Corolla / Premio / Allion / Vitz)', 'உயர் திறன் கொண்ட மைக்ரோ கிளாஸ் வடிகட்டி. 1NZ-FE மற்றும் 2ZR-FE எஞ்சின்களுக்கு நீண்ட ஆயுளை வழங்குகிறது.'),
('p1000000-0000-0000-0000-000000000005', 'ta', 'வாலியோ கிளட்ச் கிட் (Suzuki Alto 800 / K10 / Wagon R)', 'கிளட்ச் பிளேட், பிரஷர் பிளேட் மற்றும் பேரிங் அடங்கிய முழுமையான கிட். கொழும்பு நெரிசலான போக்குவரத்திலும் மென்மையான கிளட்ச் அனுபவம்.'),
('p1000000-0000-0000-0000-000000000006', 'ta', 'டென்சோ 12V 80A ஆல்டர்னேட்டர் (Toyota HiAce KDH200 / KDH201)', 'ஜப்பானில் இருந்து இறக்குமதி செய்யப்பட்ட உயர்தர ரீகண்டிஷன் ஆல்டர்னேட்டர். KDH டீசல் வாகனங்களுக்கு விசேடமானது.'),
('p1000000-0000-0000-0000-000000000007', 'ta', 'கோயிட்டோ LED வலதுபுற ஹெட்லைட் (Toyota Prius ZVW30 2011-2015)', 'ஜப்பான் ரீகண்டிஷன் அசல் Koito LED புரொஜெக்டர் ஹெட்லைட். தெளிவான UV லென்ஸ் மற்றும் உடைகல் இல்லாத பிராக்கெட்டுகள்.'),
('p1000000-0000-0000-0000-000000000008', 'ta', 'கேட்ஸ் டைமிங் பெல்ட் கிட் (Mitsubishi L200 / Pajero 4D56)', 'உறுதியான HNBR டைமிங் பெல்ட், பேலன்ஸ் பெல்ட் மற்றும் டென்ஷனர்கள் அடங்கிய தொகுப்பு. 100,000 கி.மீ உழைக்கும் உத்தரவாதம்.'),
('p1000000-0000-0000-0000-000000000009', 'ta', 'K&N எஞ்சின் ஏர் பில்டர் (Honda Vezel Hybrid RU3 / Fit GP5 / Grace)', 'கழுவி மீண்டும் பயன்படுத்தக்கூடிய ஏர் பில்டர். காற்று ஓட்டத்தை 50% அதிகரித்து எஞ்சின் திறனை மேம்படுத்துகிறது.'),
('p1000000-0000-0000-0000-000000000010', 'ta', 'பிரெம்போ முன் பிரேக் டிஸ்க்குகள் ஜோடி (Nissan X-Trail T31 / T32)', 'கார்பன் கலந்த முன் பிரேக் டிஸ்க்குகள். மலைப் பாதைகளிலும் பிரேக் வெப்பத்தைக் கட்டுப்படுத்தி பாதுகாப்பை வழங்குகிறது.'),
('p1000000-0000-0000-0000-000000000011', 'ta', 'ஐசின் எலக்ட்ரிக் இன்வெர்ட்டர் வாட்டர் பம்ப் (Toyota Aqua NHP10 / Prius C)', 'அசல் Aisin இன்வெர்ட்டர் கூலண்ட் பம்ப். வெப்பமான காலநிலையில் ஹைப்ரிட் இன்வெர்ட்டர் சூடாவதைத் தடுக்கும் முக்கிய பாகம்.'),
('p1000000-0000-0000-0000-000000000012', 'ta', 'டென்சோ எரிபொருள் பம்ப் அசெம்பிளி (Nissan Sunny N16 / Tiida / Sylphy)', 'ஜப்பானில் பரிசோதிக்கப்பட்ட பெட்ரோல் பம்ப் அசெம்பிளி. சரியான 3.5 bar எரிபொருள் அழுத்தத்தை வழங்குகிறது.')
ON CONFLICT (product_id, language) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description;

-- 5. Vehicle Compatibility Records
INSERT INTO vehicle_compatibility (product_id, make, model, year_from, year_to, chassis_code) VALUES
-- Toyota Brake Pads
('p1000000-0000-0000-0000-000000000001', 'Toyota', 'Prius', 2009, 2015, 'ZVW30'),
('p1000000-0000-0000-0000-000000000001', 'Toyota', 'Aqua', 2011, 2021, 'NHP10'),
('p1000000-0000-0000-0000-000000000001', 'Toyota', 'Corolla Axio Hybrid', 2013, 2020, 'NKE165'),
('p1000000-0000-0000-0000-000000000001', 'Toyota', 'Corolla Fielder Hybrid', 2013, 2020, 'NKE165G'),

-- Denso Spark Plugs
('p1000000-0000-0000-0000-000000000002', 'Suzuki', 'Wagon R', 2012, 2017, 'MH34S / MH44S'),
('p1000000-0000-0000-0000-000000000002', 'Suzuki', 'Alto 800', 2012, 2022, 'HA36S / HA25S'),
('p1000000-0000-0000-0000-000000000002', 'Suzuki', 'Hustler', 2014, 2020, 'MR31S / MR41S'),
('p1000000-0000-0000-0000-000000000002', 'Suzuki', 'Spacia', 2013, 2018, 'MK32S / MK42S'),

-- KYB Shock Absorber
('p1000000-0000-0000-0000-000000000003', 'Suzuki', 'Wagon R Stingray', 2012, 2017, 'MH34S / MH44S'),
('p1000000-0000-0000-0000-000000000003', 'Suzuki', 'Wagon R FX/FZ', 2014, 2017, 'MH44S'),

-- Bosch Oil Filter
('p1000000-0000-0000-0000-000000000004', 'Toyota', 'Premio', 2007, 2020, 'NZT260 / ZRT260'),
('p1000000-0000-0000-0000-000000000004', 'Toyota', 'Allion', 2007, 2020, 'NZT260 / ZRT260'),
('p1000000-0000-0000-0000-000000000004', 'Toyota', 'Corolla 141', 2007, 2013, 'ZRE141 / ZRE142'),
('p1000000-0000-0000-0000-000000000004', 'Toyota', 'Vitz', 2005, 2019, 'KSP90 / KSP130'),

-- Valeo Clutch Kit
('p1000000-0000-0000-0000-000000000005', 'Suzuki', 'Alto 800', 2005, 2022, 'HA12 / HA25 / HA36'),
('p1000000-0000-0000-0000-000000000005', 'Suzuki', 'Alto K10', 2010, 2018, 'K10B'),

-- Denso Alternator
('p1000000-0000-0000-0000-000000000006', 'Toyota', 'HiAce KDH', 2005, 2019, 'KDH200 / KDH201 / KDH206'),
('p1000000-0000-0000-0000-000000000006', 'Toyota', 'RegiusAce', 2005, 2018, 'KDH200V'),

-- Koito Headlight
('p1000000-0000-0000-0000-000000000007', 'Toyota', 'Prius', 2011, 2015, 'ZVW30 Facelift'),

-- Gates Timing Belt
('p1000000-0000-0000-0000-000000000008', 'Mitsubishi', 'L200 Sportero', 2006, 2015, 'KB4T 4D56 DI-D'),
('p1000000-0000-0000-0000-000000000008', 'Mitsubishi', 'Pajero Sport', 2008, 2015, 'KH4W 4D56 DI-D'),

-- K&N Air Filter
('p1000000-0000-0000-0000-000000000009', 'Honda', 'Vezel Hybrid', 2013, 2020, 'RU3 / RU4'),
('p1000000-0000-0000-0000-000000000009', 'Honda', 'Fit Hybrid', 2013, 2020, 'GP5 / GP6'),
('p1000000-0000-0000-0000-000000000009', 'Honda', 'Grace Hybrid', 2014, 2020, 'GM4 / GM5'),

-- Brembo Brake Discs
('p1000000-0000-0000-0000-000000000010', 'Nissan', 'X-Trail', 2007, 2019, 'T31 / T32'),
('p1000000-0000-0000-0000-000000000010', 'Nissan', 'Qashqai / Dualis', 2008, 2016, 'J10 / J11'),

-- Aisin Inverter Water Pump
('p1000000-0000-0000-0000-000000000011', 'Toyota', 'Aqua', 2011, 2020, 'NHP10'),
('p1000000-0000-0000-0000-000000000011', 'Toyota', 'Prius C', 2012, 2019, 'NHP10'),
('p1000000-0000-0000-0000-000000000011', 'Toyota', 'Yaris Hybrid', 2012, 2020, 'NHP130'),

-- Denso Fuel Pump
('p1000000-0000-0000-0000-000000000012', 'Nissan', 'Sunny', 2002, 2010, 'N16 / B15'),
('p1000000-0000-0000-0000-000000000012', 'Nissan', 'Tiida', 2004, 2012, 'C11'),
('p1000000-0000-0000-0000-000000000012', 'Nissan', 'Sylphy', 2005, 2012, 'G11');
