export type SiteNiche = 'finance' | 'education' | 'career-business';

export type PlatformSiteConfig = {
  siteId: string;
  name: string;
  domain: string;
  niche: SiteNiche;
  country: string;
  defaultAiProvider: 'openai' | 'claude' | 'gemini' | 'deepseek';
  brandVoice: string;
  socialHandle?: string;
};

export const SITE_CONFIG: PlatformSiteConfig = {
  siteId: process.env.PLATFORM_SITE_ID || 'cashclimb',
  name: process.env.PLATFORM_SITE_NAME || 'CashClimb',
  domain: process.env.NEXT_PUBLIC_SITE_URL || 'https://cashclimb.com',
  niche: 'finance',
  country: process.env.PLATFORM_COUNTRY || 'US',
  defaultAiProvider: (process.env.DEFAULT_AI_PROVIDER as PlatformSiteConfig['defaultAiProvider']) || 'openai',
  brandVoice: 'Clear, practical personal-finance guidance with conservative claims, plain English, and strong factual caution.',
  socialHandle: process.env.X_HANDLE,
};
