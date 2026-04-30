-- CashClimb author repair and future-safe assignment.
-- Run this in the CashClimb Supabase SQL editor after deploying the patched code.

update posts
set author = case
  when lower(coalesce(title, '') || ' ' || coalesce(category, '')) ~ '(pension|pensions|superannuation|retirement|ira|index fund|index funds|investing|investment|investor|real estate|property|mortgage|wealth|long-term|long term)'
    then 'Jordan Lee'
  when lower(coalesce(title, '') || ' ' || coalesce(category, '')) ~ '(tax|taxes|freelancer tax|credit|bank|banking|scam|scams|payment app|online bank|checking account|tools|app|apps)'
    then 'Sophie Tran'
  when lower(coalesce(title, '') || ' ' || coalesce(category, '')) ~ '(budget|budgeting|debt|saving|savings|save|cash|emergency fund|paycheck|holiday spending|house deposit|side hustle|side hustles|income|money habits|money management)'
    then 'Daniel Reeves'
  else 'Daniel Reeves'
end;

select author, count(*)
from posts
group by author
order by author;
