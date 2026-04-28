-- CashClimb author assignment cleanup.
-- Run in Supabase SQL editor after deploying if the database still has old/blank authors.

update posts
set author = case
  when lower(coalesce(title, '') || ' ' || coalesce(category, '')) like '%pension%' then 'Jordan Lee'
  when lower(coalesce(title, '') || ' ' || coalesce(category, '')) like '%superannuation%' then 'Jordan Lee'
  when lower(coalesce(title, '') || ' ' || coalesce(category, '')) like '%retirement%' then 'Jordan Lee'
  when lower(coalesce(title, '') || ' ' || coalesce(category, '')) like '%ira%' then 'Jordan Lee'
  when lower(coalesce(title, '') || ' ' || coalesce(category, '')) like '%index fund%' then 'Jordan Lee'
  when lower(coalesce(title, '') || ' ' || coalesce(category, '')) like '%invest%' then 'Jordan Lee'
  when lower(coalesce(title, '') || ' ' || coalesce(category, '')) like '%real estate%' then 'Jordan Lee'
  when lower(coalesce(title, '') || ' ' || coalesce(category, '')) like '%property%' then 'Jordan Lee'

  when lower(coalesce(title, '') || ' ' || coalesce(category, '')) like '%tax%' then 'Sophie Tran'
  when lower(coalesce(title, '') || ' ' || coalesce(category, '')) like '%credit%' then 'Sophie Tran'
  when lower(coalesce(title, '') || ' ' || coalesce(category, '')) like '%bank%' then 'Sophie Tran'
  when lower(coalesce(title, '') || ' ' || coalesce(category, '')) like '%scam%' then 'Sophie Tran'
  when lower(coalesce(title, '') || ' ' || coalesce(category, '')) like '%payment app%' then 'Sophie Tran'
  when lower(coalesce(title, '') || ' ' || coalesce(category, '')) like '%checking account%' then 'Sophie Tran'

  when lower(coalesce(title, '') || ' ' || coalesce(category, '')) like '%budget%' then 'Daniel Reeves'
  when lower(coalesce(title, '') || ' ' || coalesce(category, '')) like '%debt%' then 'Daniel Reeves'
  when lower(coalesce(title, '') || ' ' || coalesce(category, '')) like '%saving%' then 'Daniel Reeves'
  when lower(coalesce(title, '') || ' ' || coalesce(category, '')) like '%save%' then 'Daniel Reeves'
  when lower(coalesce(title, '') || ' ' || coalesce(category, '')) like '%cash%' then 'Daniel Reeves'
  when lower(coalesce(title, '') || ' ' || coalesce(category, '')) like '%paycheck%' then 'Daniel Reeves'
  when lower(coalesce(title, '') || ' ' || coalesce(category, '')) like '%side hustle%' then 'Daniel Reeves'
  when lower(coalesce(title, '') || ' ' || coalesce(category, '')) like '%income%' then 'Daniel Reeves'

  else 'Daniel Reeves'
end
where author is null
   or lower(author) like '%editorial%'
   or lower(author) = 'cashclimb';

select author, count(*)
from posts
group by author
order by count(*) desc;
