-- Add this to your Supabase SQL Editor after running 001_schema.sql
-- This creates the RPC function used by the analytics API

create or replace function increment_view(post_id uuid)
returns void as $$
  update posts set view_count = view_count + 1 where id = post_id;
$$ language sql;
