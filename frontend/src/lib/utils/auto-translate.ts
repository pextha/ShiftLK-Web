/**
 * Smart Multilingual Auto-Translator for ShiftLK Motorbike Spares (EN -> SI & TA)
 * Combines a Sri Lankan Motorbike Spare Parts Glossary (instant, preserves model codes)
 * with neural translation fallback for longer descriptions.
 */

interface PhraseEntry {
  pattern: RegExp;
  si: string;
  ta: string;
}

// Multi-word & technical spare part phrases (ordered longest/most-specific first)
const SPARE_PARTS_GLOSSARY: Array<{ pattern: RegExp; si: string; ta: string }> = [
  // Genuine / Condition phrases
  { pattern: /\bgenuine\s+parts\b/gi, si: 'ඔරිජිනල් අමතර කොටස්', ta: 'அசல் உதிரிப் பாகங்கள்' },
  { pattern: /\bgenuine\s+part\b/gi, si: 'ඔරිජිනල් අමතර කොටස', ta: 'அசல் உதிரிப் பாகம்' },
  { pattern: /\boriginal\s+parts\b/gi, si: 'ඔරිජිනල් අමතර කොටස්', ta: 'அசல் உதிரிப் பாகங்கள்' },
  { pattern: /\bspare\s+parts\b/gi, si: 'අමතර කොටස්', ta: 'உதிரிப் பாகங்கள்' },
  { pattern: /\bhigh\s+quality\b/gi, si: 'උසස් තත්ත්වයේ', ta: 'உயர்தர' },
  { pattern: /\bbrand\s+new\b/gi, si: 'අලුත්ම (Brand New)', ta: 'புதிய (Brand New)' },
  { pattern: /\bheavy\s+duty\b/gi, si: 'හෙවි ඩියුටි (Heavy Duty)', ta: 'ஹெவி டியூட்டி (Heavy Duty)' },

  // Engine & Gasket parts
  { pattern: /\bgasket\s+cylinder\b/gi, si: 'සිලින්ඩර් ගෑස්කට්', ta: 'சிலிண்டர் கேஸ்கெட்' },
  { pattern: /\bcylinder\s+gasket\b/gi, si: 'සිලින්ඩර් ගෑස්කට්', ta: 'சிலிண்டர் கேஸ்கெட்' },
  { pattern: /\bhead\s+gasket\b/gi, si: 'හෙඩ් ගෑස්කට්', ta: 'ஹெட் கேஸ்கெட்' },
  { pattern: /\bfull\s+gasket\s+(kit|set)\b/gi, si: 'ෆුල් ගෑස්කට් කට්ටලය', ta: 'முழு கேஸ்கெட் கிட்' },
  { pattern: /\bgasket\s+(kit|set)\b/gi, si: 'ගෑස්කට් කට්ටලය', ta: 'கேஸ்கெட் கிட்' },
  { pattern: /\bclutch\s+cover\s+gasket\b/gi, si: 'ක්ලච් කවර ගෑස්කට්', ta: 'கிளட்ச் கவர் கேஸ்கெட்' },
  { pattern: /\bmagnet\s+cover\s+gasket\b/gi, si: 'මැග්නට් කවර ගෑස්කට්', ta: 'மேக்னட் கவர் கேஸ்கெட்' },
  { pattern: /\bcylinder\s+block\s+(kit|set)\b/gi, si: 'සිලින්ඩර් බ්ලොක් කට්ටලය', ta: 'சிலிண்டர் பிளாக் கிட்' },
  { pattern: /\bblock\s+piston\s+(kit|set)\b/gi, si: 'බ්ලොක් පිස්ටන් කට්ටලය', ta: 'பிளாக் பிஸ்டன் கிட்' },
  { pattern: /\bpiston\s+ring\s+(kit|set)\b/gi, si: 'පිස්ටන් රින්ග් කට්ටලය', ta: 'பிஸ்டன் ரிங் கிட்' },
  { pattern: /\bpiston\s+(kit|set)\b/gi, si: 'පිස්ටන් කට්ටලය', ta: 'பிஸ்டன் கிட்' },
  { pattern: /\bconnecting\s+rod\s+(kit|set)?\b/gi, si: 'කනෙක්ටින් රොඩ් (Con Rod)', ta: 'கனெக்டிங் ராட்' },
  { pattern: /\btiming\s+chain\b/gi, si: 'ටයිමින් චේන්', ta: 'டைமிங் செயின்' },
  { pattern: /\btiming\s+tensioner\b/gi, si: 'ටයිමින් ටෙන්ෂනර්', ta: 'டைமிங் டென்ஷனர்' },
  { pattern: /\bvalve\s+oil\s+seal\b/gi, si: 'වෑල් ඔයිල් සීල්', ta: 'வால்வு ஆயில் சீல்' },
  { pattern: /\bvalve\s+(set|kit)\b/gi, si: 'වෑල් කට්ටලය', ta: 'வால்வு செட்' },
  { pattern: /\brocker\s+arm\b/gi, si: 'රොකර් ආම්', ta: 'ராக்கர் ஆர்ம்' },
  { pattern: /\bcam\s*shaft\b/gi, si: 'කෑම් ෂාෆ්ට්', ta: 'கேம் ஷாஃப்ட்' },
  { pattern: /\bcrank\s*shaft\b/gi, si: 'ක්‍රෑන්ක් ෂාෆ්ට්', ta: 'கிராங்க் ஷாஃப்ட்' },

  // Clutch & Transmission
  { pattern: /\bclutch\s+plate\s+(set|kit)\b/gi, si: 'ක්ලච් ප්ලේට් කට්ටලය', ta: 'கிளட்ச் பிளேட் செட்' },
  { pattern: /\bclutch\s+plate\b/gi, si: 'ක්ලච් ප්ලේට්', ta: 'கிளட்ச் பிளேட்' },
  { pattern: /\bpressure\s+plate\b/gi, si: 'ප්‍රෙෂර් ප්ලේට්', ta: 'பிரஷர் பிளேட்' },
  { pattern: /\bclutch\s+hub\b/gi, si: 'ක්ලච් හබ්', ta: 'கிளட்ச் ஹப்' },
  { pattern: /\bclutch\s+center\b/gi, si: 'ක්ලච් සෙන්ටර්', ta: 'கிளட்ச் சென்டர்' },
  { pattern: /\bclutch\s+cable\b/gi, si: 'ක්ලච් කේබල්', ta: 'கிளட்ச் கேபிள்' },
  { pattern: /\bchain\s+sprocket\s+(kit|set)\b/gi, si: 'චේන් ස්ප්‍රොකට් කට්ටලය', ta: 'செயின் ஸ்பிராக்கெட் கிட்' },
  { pattern: /\bchain\s+sprocket\b/gi, si: 'චේන් ස්ප්‍රොකට්', ta: 'செயின் ஸ்பிராக்கெட்' },
  { pattern: /\bdrive\s+chain\b/gi, si: 'ඩ්‍රයිව් චේන්', ta: 'டிரைவ் செயின்' },

  // Brakes & Suspension
  { pattern: /\bfront\s+disc\s+brake\s+pad\s*(set)?\b/gi, si: 'ඉදිරිපස ඩිස්ක් බ්‍රේක් පෑඩ් කට්ටලය', ta: 'முன் டிஸ்க் பிரேக் பேட் செட்' },
  { pattern: /\brear\s+disc\s+brake\s+pad\s*(set)?\b/gi, si: 'පසුපස ඩිස්ක් බ්‍රේක් පෑඩ් කට්ටලය', ta: 'பின் டிஸ்க் பிரேக் பேட் செட்' },
  { pattern: /\bdisc\s+brake\s+pad\s*(set)?\b/gi, si: 'ඩිස්ක් බ්‍රේක් පෑඩ් කට්ටලය', ta: 'டிஸ்க் பிரேக் பேட் செட்' },
  { pattern: /\bbrake\s+pad\s*(set)?\b/gi, si: 'බ්‍රේක් පෑඩ්', ta: 'பிரேக் பேட்' },
  { pattern: /\bbrake\s+shoe\s*(set)?\b/gi, si: 'බ්‍රේක් ෂූ කට්ටලය', ta: 'பிரேக் ஷூ செட்' },
  { pattern: /\bdisc\s+plate\b/gi, si: 'ඩිස්ක් ප්ලේට්', ta: 'டிஸ்க் பிளேட்' },
  { pattern: /\bdisc\s+rotor\b/gi, si: 'ඩිස්ක් රෝටර්', ta: 'டிஸ்க் ரோட்டர்' },
  { pattern: /\bmaster\s+cylinder\b/gi, si: 'මාස්ටර් සිලින්ඩර්', ta: 'மாஸ்டர் சிலிண்டர்' },
  { pattern: /\bbrake\s+caliper\b/gi, si: 'බ්‍රේක් කැලිපර්', ta: 'பிரேக் காலிபர்' },
  { pattern: /\bbrake\s+cable\b/gi, si: 'බ්‍රේක් කේබල්', ta: 'பிரேக் கேபிள்' },
  { pattern: /\bfork\s+oil\s+seal\b/gi, si: 'ෆෝක් ඔයිල් සීල්', ta: 'ஃபோர்க் ஆயில் சீல்' },
  { pattern: /\bfork\s+pipe\b/gi, si: 'ෆෝක් බටය (Fork Pipe)', ta: 'ஃபோர்க் பைப்' },
  { pattern: /\bshock\s+absorber\b/gi, si: 'ෂොක් ඇබ්සෝබර්', ta: 'ஷாக் அப்சார்பர்' },
  { pattern: /\bmono\s+shock\b/gi, si: 'මොනෝ ෂොක්', ta: 'மோனோ ஷாக்' },

  // Filters, Fuel & Air
  { pattern: /\bair\s+filter\b/gi, si: 'එයාර් ෆිල්ටර්', ta: 'ஏர் ஃபில்டர்' },
  { pattern: /\boil\s+filter\b/gi, si: 'ඔයිල් ෆිල්ටර්', ta: 'ஆயில் ஃபில்டர்' },
  { pattern: /\bfuel\s+filter\b/gi, si: 'පෙට්‍රල් ෆිල්ටර්', ta: 'பெட்ரோல் ஃபில்டர்' },
  { pattern: /\bfuel\s+cock\b/gi, si: 'පෙට්‍රල් ටැප් (Fuel Cock)', ta: 'பெட்ரோல் டேப்' },
  { pattern: /\bfuel\s+pump\b/gi, si: 'ෆුවල් පම්ප් (Fuel Pump)', ta: 'ஃபியூவல் பம்ப்' },
  { pattern: /\bfuel\s+injector\b/gi, si: 'ෆුවල් ඉන්ජෙක්ටර්', ta: 'ஃபியூவல் இன்ஜெக்டர்' },
  { pattern: /\bcarburetor\b/gi, si: 'කාබියුරේටරය', ta: 'கார்புரேட்டர்' },
  { pattern: /\baccelerator\s+cable\b/gi, si: 'ඇක්සලරේටර් කේබල්', ta: 'ஆக்சிலரேட்டர் கேபிள்' },
  { pattern: /\bthrottle\s+cable\b/gi, si: 'ත්‍රොටල් කේබල්', ta: 'த்ரோட்டில் கேபிள்' },

  // Electrical & Lighting
  { pattern: /\bspark\s+plug\b/gi, si: 'ස්පාක් ප්ලග්', ta: 'ஸ்பார்க் பிளக்' },
  { pattern: /\bcdi\s+unit\b/gi, si: 'CDI යුනිට්', ta: 'CDI யூனிட்' },
  { pattern: /\bstarter\s+motor\b/gi, si: 'ස්ටාටර් මෝටර්', ta: 'ஸ்டார்ட்டர் மோட்டார்' },
  { pattern: /\bstarter\s+relay\b/gi, si: 'ස්ටාටර් රිලේ', ta: 'ஸ்டார்ட்டர் ரிலே' },
  { pattern: /\bmagnet\s+coil\b/gi, si: 'මැග්නට් කොයිල්', ta: 'மேக்னட் காயில்' },
  { pattern: /\bstator\s+coil\b/gi, si: 'ස්ටේටර් කොයිල්', ta: 'ஸ்டேட்டர் காயில்' },
  { pattern: /\brectifier\b/gi, si: 'රෙක්ටිෆයර් (Rectifier)', ta: 'ரெக்டிஃபையர்' },
  { pattern: /\bregulator\b/gi, si: 'රෙගියුලේටර්', ta: 'ரெகுலேட்டர்' },
  { pattern: /\bhead\s*light\s+assembly\b/gi, si: 'හෙඩ්ලයිට් කට්ටලය', ta: 'ஹெட்லைட் செட்' },
  { pattern: /\bhead\s*light\b/gi, si: 'හෙඩ්ලයිට්', ta: 'ஹெட்லைட்' },
  { pattern: /\btail\s*light\b/gi, si: 'ටේල් ලයිට්', ta: 'டெயில் லைட்' },
  { pattern: /\bsignal\s*light\b/gi, si: 'සිග්නල් ලයිට්', ta: 'சிக்னல் லைட்' },
  { pattern: /\bindicator\b/gi, si: 'සිග්නල් ලයිට් (Indicator)', ta: 'இண்டிகேட்டர்' },
  { pattern: /\bspeedometer\b/gi, si: 'මීටර් කට්ටලය (Speedometer)', ta: 'ஸ்பீடோமீட்டர்' },
  { pattern: /\bignition\s+switch\b/gi, si: 'යතුරු කට (Ignition Switch)', ta: 'இக்னிஷன் சுவிட்ச்' },
  { pattern: /\bwiring\s+harness\b/gi, si: 'වයර් හානස් (Wiring Harness)', ta: 'வயரிங் ஹார்னஸ்' },

  // Body, Mirrors, Stickers & Helmets
  { pattern: /\bside\s+mirror\s*(set|pair)?\b/gi, si: 'සයිඩ් කණ්ණාඩි යුගලය', ta: 'சைடு மிரர் ஜோடி' },
  { pattern: /\bmirror\b/gi, si: 'කණ්ණාඩි', ta: 'கண்ணாடி' },
  { pattern: /\bbody\s+sticker\s*(kit|set)?\b/gi, si: 'බොඩි ස්ටිකර් කට්ටලය', ta: 'பாடி ஸ்டிக்கர் கிட்' },
  { pattern: /\bsticker\s*(kit|set)?\b/gi, si: 'ස්ටිකර් කට්ටලය', ta: 'ஸ்டிக்கர் கிட்' },
  { pattern: /\bdecal\s*(kit|set)?\b/gi, si: 'ඩිකල් ස්ටිකර් කට්ටලය', ta: 'டீக்கால் ஸ்டிக்கர் கிட்' },
  { pattern: /\bfront\s+fender\b/gi, si: 'ඉදිරිපස මඩ්ගාඩ් (Front Fender)', ta: 'முன் மட்கார்ட்' },
  { pattern: /\bmudguard\b/gi, si: 'මඩ්ගාඩ්', ta: 'மட்கார்ட்' },
  { pattern: /\bfuel\s+tank\b/gi, si: 'පෙට්‍රල් ටැංකිය', ta: 'பெட்ரோல் டேங்க்' },
  { pattern: /\bside\s+cover\b/gi, si: 'සයිඩ් කවරය', ta: 'சைடு கவர்' },
  { pattern: /\bvisor\b/gi, si: 'වයිසරය (Visor)', ta: 'வைசர்' },
  { pattern: /\bfull\s+face\s+helmet\b/gi, si: 'ෆුල් ෆේස් හෙල්මට්', ta: 'ஃபுல் ஃபேஸ் ஹெல்மெட்' },
  { pattern: /\bhelmet\b/gi, si: 'හෙල්මට්', ta: 'ஹெல்மெட்' },

  // Single words fallback
  { pattern: /\bgasket\b/gi, si: 'ගෑස්කට්', ta: 'கேஸ்கெட்' },
  { pattern: /\bcylinder\b/gi, si: 'සිලින්ඩර්', ta: 'சிலிண்டர்' },
  { pattern: /\bpiston\b/gi, si: 'පිස්ටන්', ta: 'பிஸ்டன்' },
  { pattern: /\bclutch\b/gi, si: 'ක්ලච්', ta: 'கிளட்ச்' },
  { pattern: /\bbrake\b/gi, si: 'බ්‍රේක්', ta: 'பிரேக்' },
  { pattern: /\bcable\b/gi, si: 'කේබල්', ta: 'கேபிள்' },
  { pattern: /\bfilter\b/gi, si: 'ෆිල්ටර්', ta: 'ஃபில்டர்' },
  { pattern: /\bbearing\b/gi, si: 'බෙයාරින්', ta: 'பேரிங்' },
  { pattern: /\boil\s+seal\b/gi, si: 'ඔයිල් සීල්', ta: 'ஆயில் சீல்' },
  { pattern: /\bfront\b/gi, si: 'ඉදිරිපස', ta: 'முன்' },
  { pattern: /\brear\b/gi, si: 'පසුපස', ta: 'பின்' },
  { pattern: /\bset\b/gi, si: 'කට්ටලය', ta: 'செட்' },
  { pattern: /\bkit\b/gi, si: 'කිට්', ta: 'கிட்' },
  { pattern: /\bgenuine\b/gi, si: 'ඔරිජිනල්', ta: 'அசல்' },
  { pattern: /\boriginal\b/gi, si: 'ඔරිජිනල්', ta: 'அசல்' },
  { pattern: /\bparts\b/gi, si: 'අමතර කොටස්', ta: 'உதிரிப் பாகங்கள்' },
  { pattern: /\bpart\b/gi, si: 'අමතර කොටස', ta: 'உதிரிப் பாகம்' },

  // Brands
  { pattern: /\byamaha\b/gi, si: 'යමහා (Yamaha)', ta: 'யமஹா (Yamaha)' },
  { pattern: /\bbajaj\b/gi, si: 'බජාජ් (Bajaj)', ta: 'பஜாஜ் (Bajaj)' },
  { pattern: /\bhonda\b/gi, si: 'හොන්ඩා (Honda)', ta: 'ஹோண்டா (Honda)' },
  { pattern: /\bsuzuki\b/gi, si: 'සුසුකි (Suzuki)', ta: 'சுசுகி (Suzuki)' },
  { pattern: /\bhero\b/gi, si: 'හීරෝ (Hero)', ta: 'ஹீரோ (Hero)' },
];

/**
 * Instant synchronous translation using the ShiftLK Motorbike Spare Parts Glossary.
 * Keeps model numbers (e.g., FZ V1/V2/V3, Pulsar 150, CT100) intact.
 */
export function translateSparePartInstant(text: string): { si: string; ta: string } {
  const trimmed = text.trim();
  if (!trimmed) return { si: '', ta: '' };

  let siText = trimmed;
  let taText = trimmed;

  for (const item of SPARE_PARTS_GLOSSARY) {
    siText = siText.replace(item.pattern, item.si);
    taText = taText.replace(item.pattern, item.ta);
  }

  return {
    si: siText.replace(/\s{2,}/g, ' ').trim(),
    ta: taText.replace(/\s{2,}/g, ' ').trim(),
  };
}

/**
 * Asynchronous translation that combines our Spare Parts Glossary for technical terms
 * with the server-side `/api/translate` endpoint for general sentences/descriptions.
 */
export async function translateSparePartSmart(
  text: string,
  fieldType: 'title' | 'description' = 'title'
): Promise<{ si: string; ta: string }> {
  const trimmed = text.trim();
  if (!trimmed) return { si: '', ta: '' };

  const instant = translateSparePartInstant(trimmed);

  // For product titles or short spare part names where our glossary matched terms,
  // check if any glossary terms were applied or if we should enhance with API translation.
  try {
    const res = await fetch('/api/translate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: trimmed }),
    });

    if (res.ok) {
      const data = await res.json();
      if (fieldType === 'description' && data?.si && data?.ta) {
        // For descriptions, if the text is a short known phrase like "Yamaha Genuine Parts",
        // prefer the natural motorbike glossary if it translated the core words; otherwise use neural output.
        const hasRemainingEnglishWords = /[a-zA-Z]{4,}/.test(
          instant.si.replace(/\([A-Za-z0-9\s/-]+\)/g, '')
        );
        return {
          si: hasRemainingEnglishWords ? data.si : instant.si,
          ta: hasRemainingEnglishWords ? data.ta : instant.ta,
        };
      }

      if (fieldType === 'title') {
        // For titles, our glossary keeps bike model codes (FZ V1/V2/V3, Pulsar 150) clean
        // and uses authentic Sri Lankan mechanic terms ("සිලින්ඩර් ගෑස්කට්", "බ්‍රේක් පෑඩ්").
        // If there are still untranslated English words (excluding model codes/brands in parens),
        // fall back to neural translation.
        const strippedInstant = instant.si
          .replace(/\([^)]*\)/g, '')
          .replace(/\b(FZ|R15|MT15|V1|V2|V3|V4|NS200|RS200|CT100|DIO|NTORQ|TVS|KTM|ABS|BS4|BS6|OEM|LED|[A-Z0-9/-]*\d+[A-Z0-9/-]*)\b/gi, '');
        const hasUntranslatedWords = /[a-zA-Z]{4,}/.test(strippedInstant);

        return {
          si: hasUntranslatedWords && data?.si ? data.si : instant.si,
          ta: hasUntranslatedWords && data?.ta ? data.ta : instant.ta,
        };
      }
    }
  } catch {
    // Offline or network error — return instant glossary result
  }

  return instant;
}
