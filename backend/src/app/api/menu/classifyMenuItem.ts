export type Classification = 'menu' | 'not_menu' | 'maybe';

export interface ClassifiedItem {
  text: string;
  confidence: number;
  classification: Classification;
}

const blacklist = [
  'home', 'about', 'location', 'press', 'careers', 'contact', 'privacy',
  'instagram', 'facebook', 'linkedin', 'terms', 'hours', 'reservation',
  'gift card', 'event', 'newsletter', 'our story', 'follow us', 'shop',
  'accessibility', 'error', 'sign up', 'login'
];

export function classifyMenuItem(text: string): ClassifiedItem {
  const cleaned = text.trim();
  const lower = cleaned.toLowerCase();

  const hasPrice = /\$\s?\d{1,3}(\.\d{2})?/.test(cleaned);
  const lengthValid = cleaned.length >= 5 && cleaned.length <= 100;
  const wordCount = cleaned.split(/\s+/).length;
  const isBlacklisted = blacklist.some((b) => lower.includes(b));

  let confidence = 0;

  if (hasPrice) confidence += 0.5;
  if (lengthValid) confidence += 0.2;
  if (wordCount >= 2) confidence += 0.2;
  if (isBlacklisted) confidence -= 0.7;

  confidence = Math.min(1, Math.max(0, confidence));

  let classification: Classification = 'maybe';
  if (confidence >= 0.75) classification = 'menu';
  else if (confidence < 0.3) classification = 'not_menu';

  return {
    text: cleaned,
    confidence: parseFloat(confidence.toFixed(2)),
    classification,
  };
}
