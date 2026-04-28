update posts
set author = case
  when lower(coalesce(category, '')) like '%side hustle%' then 'Alex Rivera'
  when lower(coalesce(category, '')) like '%make money%' then 'Alex Rivera'
  when lower(coalesce(category, '')) like '%online income%' then 'Alex Rivera'
  else 'Jordan Lee'
end
where author ilike '%editorial%';
