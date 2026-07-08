-- Restores the standard Supabase default grants for the public schema.
--
-- These are normally set up once, automatically, when a Supabase project is
-- first created. They were lost the one time this schema was fully dropped
-- and recreated (DROP SCHEMA public CASCADE) during a botched migration
-- replay, which silently broke every authenticated read/write until now —
-- RLS policies were correct throughout, but Postgres denies access before
-- RLS is even consulted if the base GRANT is missing.
grant usage on schema public to anon, authenticated, service_role;
grant all on all tables in schema public to anon, authenticated, service_role;
grant all on all routines in schema public to anon, authenticated, service_role;
grant all on all sequences in schema public to anon, authenticated, service_role;
alter default privileges in schema public grant all on tables to anon, authenticated, service_role;
alter default privileges in schema public grant all on routines to anon, authenticated, service_role;
alter default privileges in schema public grant all on sequences to anon, authenticated, service_role;
