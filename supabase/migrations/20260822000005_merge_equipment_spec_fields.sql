-- spec_id/spec_ko were meant to be an Indonesian/Korean translation pair
-- (matching this app's bilingual convention elsewhere), but in practice
-- staff just used them as two free-text boxes for different pieces of spec
-- info (e.g. printers: type/speed in one, paper size/consumables in the
-- other) — often both in Korean, never real translations of each other.
-- Merging into one plain spec field, joining any existing content from both.
alter table equipment_catalog add column spec text;

update equipment_catalog
set spec = nullif(trim(concat_ws(', ', nullif(trim(spec_id), ''), nullif(trim(spec_ko), ''))), '');

alter table equipment_catalog drop column spec_id;
alter table equipment_catalog drop column spec_ko;
