-- Run this once in Supabase SQL Editor for CashClimb.
-- It replaces old editorial authors with person authors while keeping all rows valid.

update posts
set author = case
  when lower(coalesce(category, '')) like '%side hustle%' then 'Daniel Reeves'
  when lower(coalesce(category, '')) like '%make money%' then 'Daniel Reeves'
  when lower(coalesce(category, '')) like '%income%' then 'Daniel Reeves'
  when lower(coalesce(category, '')) like '%personal finance%' then 'Daniel Reeves'
  else 'Sophie Tran'
end
where author is null
   or author ilike '%editorial%';
