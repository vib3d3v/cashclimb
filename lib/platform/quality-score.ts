export type QualityInput = {
  title?: string | null;
  excerpt?: string | null;
  content?: string | null;
  primaryKeyword?: string | null;
  relatedKeywords?: string[] | null;
  internalLinkCount?: number | null;
  hasDisclosure?: boolean | null;
  hasFaq?: boolean | null;
  hasSchema?: boolean | null;
};

export type QualityScore = {
  overall: number;
  passed: boolean;
  checks: Record<string, number>;
  issues: string[];
};

const words = (value?: string | null) => (value || '').trim().split(/\s+/).filter(Boolean).length;
const contains = (haystack?: string | null, needle?: string | null) =>
  !!haystack && !!needle && haystack.toLowerCase().includes(needle.toLowerCase());

export function scoreArticleQuality(input: QualityInput): QualityScore {
  const contentWords = words(input.content);
  const titleWords = words(input.title);
  const excerptWords = words(input.excerpt);
  const keyword = input.primaryKeyword || input.relatedKeywords?.[0] || '';

  const checks = {
    title: titleWords >= 5 && titleWords <= 16 ? 100 : titleWords >= 3 ? 70 : 35,
    excerpt: excerptWords >= 18 && excerptWords <= 45 ? 100 : excerptWords >= 10 ? 75 : 35,
    depth: contentWords >= 1200 ? 100 : contentWords >= 800 ? 82 : contentWords >= 500 ? 60 : 25,
    intent: keyword && (contains(input.title, keyword) || contains(input.excerpt, keyword) || contains(input.content, keyword)) ? 100 : 65,
    internalLinks: (input.internalLinkCount || 0) >= 3 ? 100 : (input.internalLinkCount || 0) >= 1 ? 75 : 35,
    disclosure: input.hasDisclosure === false ? 45 : 100,
    faq: input.hasFaq ? 100 : 78,
    schema: input.hasSchema ? 100 : 82,
  };

  const issues: string[] = [];
  if (checks.title < 80) issues.push('Improve title length and clarity.');
  if (checks.excerpt < 80) issues.push('Improve excerpt length and search-intent summary.');
  if (checks.depth < 80) issues.push('Expand thin content before publishing.');
  if (checks.intent < 80) issues.push('Primary keyword or intent is not clearly represented.');
  if (checks.internalLinks < 80) issues.push('Add more contextual internal links.');
  if (checks.disclosure < 80) issues.push('Affiliate or commercial disclosure is missing.');
  if (checks.faq < 90) issues.push('Consider adding FAQ coverage.');
  if (checks.schema < 90) issues.push('Consider adding article/FAQ schema.');

  const overall = Math.round(Object.values(checks).reduce((sum, value) => sum + value, 0) / Object.values(checks).length);
  return { overall, passed: overall >= 90 && issues.length <= 2, checks, issues };
}
