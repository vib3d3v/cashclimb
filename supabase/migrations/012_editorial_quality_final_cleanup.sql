-- Final cleanup for CashClimb editorial quality hardening.
-- Keeps the manual cover-image workflow disabled and removes old noisy fields.

update posts
set
  cover_url = null,
  title = nullif(trim(regexp_replace(regexp_replace(regexp_replace(coalesce(title, ''), 'usukcaau', '', 'gi'), '\\(US/UK/CA/AU\\)', '', 'gi'), '\\s+', ' ', 'g')), ''),
  excerpt = nullif(trim(regexp_replace(regexp_replace(regexp_replace(coalesce(excerpt, ''), 'usukcaau', '', 'gi'), '\\(US/UK/CA/AU\\)', '', 'gi'), '\\s+', ' ', 'g')), ''),
  primary_keyword = nullif(trim(regexp_replace(regexp_replace(regexp_replace(coalesce(primary_keyword, ''), 'usukcaau', '', 'gi'), '\\(US/UK/CA/AU\\)', '', 'gi'), '\\s+', ' ', 'g')), ''),
  seo_title = nullif(trim(regexp_replace(regexp_replace(regexp_replace(regexp_replace(coalesce(seo_title, ''), '\\s*\\|\\s*CashClimb\\s*$', '', 'gi'), 'usukcaau', '', 'gi'), '\\(US/UK/CA/AU\\)', '', 'gi'), '\\s+', ' ', 'g')), ''),
  seo_description = nullif(trim(regexp_replace(regexp_replace(regexp_replace(coalesce(seo_description, ''), 'usukcaau', '', 'gi'), '\\(US/UK/CA/AU\\)', '', 'gi'), '\\s+', ' ', 'g')), ''),
  slug = trim(both '-' from regexp_replace(regexp_replace(regexp_replace(coalesce(slug, ''), 'usukcaau', '', 'gi'), 'us-uk-ca-au|us_uk_ca_au|cashclimb', '', 'gi'), '-+', '-', 'g'))
where
  cover_url is not null
  or title ilike '%usukcaau%'
  or excerpt ilike '%usukcaau%'
  or primary_keyword ilike '%usukcaau%'
  or seo_title ilike '%usukcaau%'
  or seo_title ilike '%| CashClimb%'
  or seo_description ilike '%usukcaau%'
  or slug ilike '%usukcaau%'
  or slug ilike '%us-uk-ca-au%'
  or slug ilike '%us_uk_ca_au%'
  or slug ilike '%cashclimb%';
