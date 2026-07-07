import { SITE_CONFIG } from './site-config';

export type SocialPostInput = {
  title: string;
  excerpt?: string | null;
  url: string;
  primaryKeyword?: string | null;
};

const maxTweetLength = 260;

function cleanLine(value: string) {
  return value.replace(/\s+/g, ' ').trim();
}

function clip(value: string, max = maxTweetLength) {
  const clean = cleanLine(value);
  return clean.length <= max ? clean : `${clean.slice(0, max - 1).trim()}…`;
}

export function generateXPost(input: SocialPostInput) {
  const hook = input.primaryKeyword
    ? `New guide on ${input.primaryKeyword}: ${input.title}`
    : `New guide: ${input.title}`;

  return clip(`${hook}\n\n${input.excerpt || 'Read the full breakdown here.'}\n\n${input.url}`);
}

export function generateXThread(input: SocialPostInput) {
  const intro = clip(`I published a new ${SITE_CONFIG.niche.replace('-', ' ')} guide:\n\n${input.title}`);
  const context = clip(input.excerpt || 'Here are the key ideas and practical takeaways from the full article.');
  const takeaway = clip(
    input.primaryKeyword
      ? `Main topic: ${input.primaryKeyword}. The goal is to answer the real search intent clearly, not just chase a keyword.`
      : 'The goal is to answer the real search intent clearly, not just publish another generic article.',
  );
  const cta = clip(`Full guide here:\n${input.url}`);

  return [intro, context, takeaway, cta];
}
