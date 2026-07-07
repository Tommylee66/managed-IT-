-- The source app's service_logs.type is nominally driven by a dropdown, but
-- multiple code paths push free-text values outside that list (e.g.
-- '계약생성', '청구서발행', '개통완료' don't appear in the dropdown's option
-- set, which uses '계약확정', '청구서이메일발송', etc.). A strict Postgres
-- enum would reject those writes at runtime. Relax to text to match the
-- source app's actual (loosely-typed) behavior.
alter table service_logs alter column type type text using type::text;
