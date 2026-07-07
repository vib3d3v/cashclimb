-- Cleans old geo suffix artifacts such as usukcaau / US/UK/CA/AU from existing CashClimb posts.
-- Safe to run more than once.

update posts
set
  title = nullif(trim(regexp_replace(regexp_replace(coalesce(title, ''), '(\(|\[)?\s*(us\s*/\s*uk\s*/\s*ca\s*/\s*au|u\.s\.\s*/\s*u\.k\.\s*/\s*ca\s*/\s*au|us\s+uk\s+ca\s+au|usukcaau)\s*(\)|\])?', ' ', 'gi'), '\s+', ' ', 'g')), ''),
  excerpt = nullif(trim(regexp_replace(regexp_replace(coalesce(excerpt, ''), '(\(|\[)?\s*(us\s*/\s*uk\s*/\s*ca\s*/\s*au|u\.s\.\s*/\s*u\.k\.\s*/\s*ca\s*/\s*au|us\s+uk\s+ca\s+au|usukcaau)\s*(\)|\])?', ' ', 'gi'), '\s+', ' ', 'g')), ''),
  primary_keyword = nullif(trim(regexp_replace(regexp_replace(coalesce(primary_keyword, ''), '(\(|\[)?\s*(us\s*/\s*uk\s*/\s*ca\s*/\s*au|u\.s\.\s*/\s*u\.k\.\s*/\s*ca\s*/\s*au|us\s+uk\s+ca\s+au|usukcaau)\s*(\)|\])?', ' ', 'gi'), '\s+', ' ', 'g')), ''),
  related_keywords = nullif(trim(regexp_replace(regexp_replace(coalesce(related_keywords, ''), '(\(|\[)?\s*(us\s*/\s*uk\s*/\s*ca\s*/\s*au|u\.s\.\s*/\s*u\.k\.\s*/\s*ca\s*/\s*au|us\s+uk\s+ca\s+au|usukcaau)\s*(\)|\])?', ' ', 'gi'), '\s+', ' ', 'g')), ''),
  seo_title = nullif(trim(regexp_replace(regexp_replace(coalesce(seo_title, ''), '(\(|\[)?\s*(us\s*/\s*uk\s*/\s*ca\s*/\s*au|u\.s\.\s*/\s*u\.k\.\s*/\s*ca\s*/\s*au|us\s+uk\s+ca\s+au|usukcaau)\s*(\)|\])?', ' ', 'gi'), '\s+', ' ', 'g')), ''),
  seo_description = nullif(trim(regexp_replace(regexp_replace(coalesce(seo_description, ''), '(\(|\[)?\s*(us\s*/\s*uk\s*/\s*ca\s*/\s*au|u\.s\.\s*/\s*u\.k\.\s*/\s*ca\s*/\s*au|us\s+uk\s+ca\s+au|usukcaau)\s*(\)|\])?', ' ', 'gi'), '\s+', ' ', 'g')), ''),
  body = nullif(trim(regexp_replace(regexp_replace(coalesce(body, ''), '(\(|\[)?\s*(us\s*/\s*uk\s*/\s*ca\s*/\s*au|u\.s\.\s*/\s*u\.k\.\s*/\s*ca\s*/\s*au|us\s+uk\s+ca\s+au|usukcaau)\s*(\)|\])?', ' ', 'gi'), '\s+', ' ', 'g')), ''),
  slug = lower(trim(both '-' from regexp_replace(regexp_replace(coalesce(slug, ''), '(-|_)?(usukcaau|us-uk-ca-au|us_uk_ca_au)(-|_)?', '-', 'gi'), '-+', '-', 'g')))
where
  title ~* 'usukcaau|us\s*/\s*uk\s*/\s*ca\s*/\s*au'
  or excerpt ~* 'usukcaau|us\s*/\s*uk\s*/\s*ca\s*/\s*au'
  or primary_keyword ~* 'usukcaau|us\s*/\s*uk\s*/\s*ca\s*/\s*au'
  or related_keywords ~* 'usukcaau|us\s*/\s*uk\s*/\s*ca\s*/\s*au'
  or seo_title ~* 'usukcaau|us\s*/\s*uk\s*/\s*ca\s*/\s*au'
  or seo_description ~* 'usukcaau|us\s*/\s*uk\s*/\s*ca\s*/\s*au'
  or body ~* 'usukcaau|us\s*/\s*uk\s*/\s*ca\s*/\s*au'
  or slug ~* 'usukcaau|us-uk-ca-au|us_uk_ca_au';
