-- Final cleanup for old generated records before the production-quality generator.
-- This removes geo-market noise, fixes known incomplete titles, cleans slugs, and disables manual cover-image usage.

update posts
set
  title = 'How to Set Up Bill Pay Without Overdraft Fees',
  slug = 'how-to-set-up-bill-pay-without-overdraft-fees',
  primary_keyword = 'how to set up bill pay without overdraft fees',
  seo_title = 'How to Set Up Bill Pay Without Overdraft Fees',
  excerpt = 'Learn how to set up bill pay without overdraft fees, including timing, balance checks, common mistakes, and safer account habits.',
  seo_description = 'Learn how to set up bill pay without overdraft fees, including timing, balance checks, common mistakes, and safer account habits.',
  cover_url = null
where title ~* 'bill pay' and (title ~* 'overdraft' or primary_keyword ~* 'overdraft');

update posts
set
  title = 'Tax-Loss Harvesting Guide for Taxable Accounts',
  slug = 'tax-loss-harvesting-guide-for-taxable-accounts',
  primary_keyword = 'tax loss harvesting guide for taxable accounts',
  seo_title = 'Tax-Loss Harvesting Guide for Taxable Accounts',
  excerpt = 'Learn how tax-loss harvesting works in taxable accounts, including wash-sale risks, recordkeeping, timing, and common mistakes.',
  seo_description = 'Learn how tax-loss harvesting works in taxable accounts, including wash-sale risks, recordkeeping, timing, and common mistakes.',
  cover_url = null
where title ~* 'tax.loss harvesting' and (title ~* 'taxable' or primary_keyword ~* 'taxable');

update posts
set
  title = 'Co-Ownership Agreement Checklist for Buying a Home With Friends',
  slug = 'co-ownership-agreement-checklist-for-buying-a-home-with-friends',
  primary_keyword = 'co ownership agreement checklist for buying a home with friends',
  seo_title = 'Co-Ownership Agreement Checklist for Friends',
  excerpt = 'Use this co-ownership agreement checklist before buying a home with friends, including costs, exits, repairs, and legal questions.',
  seo_description = 'Use this co-ownership agreement checklist before buying a home with friends, including costs, exits, repairs, and legal questions.',
  cover_url = null
where title ~* 'co.ownership' and title ~* 'home' and title ~* 'friends';

update posts
set
  title = regexp_replace(regexp_replace(regexp_replace(coalesce(title, ''), '\\(?\\s*us\\s*/\\s*uk\\s*/\\s*ca\\s*/\\s*au\\s*\\)?', '', 'gi'), 'usukcaau', '', 'gi'), '\\s+', ' ', 'g'),
  excerpt = regexp_replace(regexp_replace(regexp_replace(coalesce(excerpt, ''), '\\(?\\s*us\\s*/\\s*uk\\s*/\\s*ca\\s*/\\s*au\\s*\\)?', '', 'gi'), 'usukcaau', '', 'gi'), '\\s+', ' ', 'g'),
  primary_keyword = lower(trim(regexp_replace(regexp_replace(regexp_replace(coalesce(primary_keyword, ''), '\\(?\\s*us\\s*/\\s*uk\\s*/\\s*ca\\s*/\\s*au\\s*\\)?', '', 'gi'), 'usukcaau', '', 'gi'), '\\s+', ' ', 'g'))),
  seo_title = regexp_replace(regexp_replace(regexp_replace(coalesce(seo_title, ''), '\\(?\\s*us\\s*/\\s*uk\\s*/\\s*ca\\s*/\\s*au\\s*\\)?', '', 'gi'), 'usukcaau', '', 'gi'), '\\s+', ' ', 'g'),
  seo_description = regexp_replace(regexp_replace(regexp_replace(coalesce(seo_description, ''), '\\(?\\s*us\\s*/\\s*uk\\s*/\\s*ca\\s*/\\s*au\\s*\\)?', '', 'gi'), 'usukcaau', '', 'gi'), '\\s+', ' ', 'g'),
  slug = trim(both '-' from regexp_replace(regexp_replace(regexp_replace(coalesce(slug, ''), 'usukcaau', '', 'gi'), 'us-uk-ca-au|us_uk_ca_au', '', 'gi'), '-+', '-', 'g')),
  cover_url = null
where
  title ~* 'usukcaau|us\\s*/\\s*uk\\s*/\\s*ca\\s*/\\s*au'
  or excerpt ~* 'usukcaau|us\\s*/\\s*uk\\s*/\\s*ca\\s*/\\s*au'
  or primary_keyword ~* 'usukcaau|us\\s*/\\s*uk\\s*/\\s*ca\\s*/\\s*au'
  or related_keywords::text ~* 'usukcaau|us\\s*/\\s*uk\\s*/\\s*ca\\s*/\\s*au'
  or seo_title ~* 'usukcaau|us\\s*/\\s*uk\\s*/\\s*ca\\s*/\\s*au'
  or seo_description ~* 'usukcaau|us\\s*/\\s*uk\\s*/\\s*ca\\s*/\\s*au'
  or slug ~* 'usukcaau|us-uk-ca-au|us_uk_ca_au';
