-- Cleans old geo suffix artifacts such as usukcaau / US/UK/CA/AU from existing CashClimb posts.
-- Safe to run more than once.

update posts
set
  title = nullif(trim(regexp_replace(regexp_replace(regexp_replace(coalesce(title, ''), '\(?\s*us\s*/\s*uk\s*/\s*ca\s*/\s*au\s*\)?', '', 'gi'), 'usukcaau', '', 'gi'), '\s+', ' ', 'g')), ''),
  excerpt = nullif(trim(regexp_replace(regexp_replace(regexp_replace(coalesce(excerpt, ''), '\(?\s*us\s*/\s*uk\s*/\s*ca\s*/\s*au\s*\)?', '', 'gi'), 'usukcaau', '', 'gi'), '\s+', ' ', 'g')), ''),
  primary_keyword = nullif(trim(regexp_replace(regexp_replace(regexp_replace(coalesce(primary_keyword, ''), '\(?\s*us\s*/\s*uk\s*/\s*ca\s*/\s*au\s*\)?', '', 'gi'), 'usukcaau', '', 'gi'), '\s+', ' ', 'g')), ''),
  seo_title = nullif(trim(regexp_replace(regexp_replace(regexp_replace(coalesce(seo_title, ''), '\(?\s*us\s*/\s*uk\s*/\s*ca\s*/\s*au\s*\)?', '', 'gi'), 'usukcaau', '', 'gi'), '\s+', ' ', 'g')), ''),
  seo_description = nullif(trim(regexp_replace(regexp_replace(regexp_replace(coalesce(seo_description, ''), '\(?\s*us\s*/\s*uk\s*/\s*ca\s*/\s*au\s*\)?', '', 'gi'), 'usukcaau', '', 'gi'), '\s+', ' ', 'g')), ''),
  body = nullif(trim(regexp_replace(regexp_replace(regexp_replace(coalesce(body, ''), '\(?\s*us\s*/\s*uk\s*/\s*ca\s*/\s*au\s*\)?', '', 'gi'), 'usukcaau', '', 'gi'), '\s+', ' ', 'g')), ''),
  slug = trim(both '-' from regexp_replace(regexp_replace(regexp_replace(coalesce(slug, ''), 'usukcaau', '', 'gi'), 'us-uk-ca-au|us_uk_ca_au', '', 'gi'), '-+', '-', 'g'))
where
  title ~* 'usukcaau|us\s*/\s*uk\s*/\s*ca\s*/\s*au'
  or excerpt ~* 'usukcaau|us\s*/\s*uk\s*/\s*ca\s*/\s*au'
  or primary_keyword ~* 'usukcaau|us\s*/\s*uk\s*/\s*ca\s*/\s*au'
  or related_keywords::text ~* 'usukcaau|us\s*/\s*uk\s*/\s*ca\s*/\s*au'
  or seo_title ~* 'usukcaau|us\s*/\s*uk\s*/\s*ca\s*/\s*au'
  or seo_description ~* 'usukcaau|us\s*/\s*uk\s*/\s*ca\s*/\s*au'
  or body ~* 'usukcaau|us\s*/\s*uk\s*/\s*ca\s*/\s*au'
  or slug ~* 'usukcaau|us-uk-ca-au|us_uk_ca_au';