-- service_catalog had a single name/description field with no language
-- split, unlike equipment_catalog (spec_id/spec_ko) — so a service item's
-- name/description only ever existed in whatever language it was typed in,
-- and always showed that way regardless of the viewer's locale. Bring it in
-- line with equipment_catalog's id/ko convention.
alter table service_catalog add column name_id text;
alter table service_catalog add column name_ko text;
alter table service_catalog add column description_id text;
alter table service_catalog add column description_ko text;

-- Existing rows only had one language of text; duplicate it into both
-- columns so nothing goes blank — master can go back and correct each
-- language via the admin UI afterward.
update service_catalog set name_id = name, name_ko = name;
update service_catalog set description_id = description, description_ko = description;

alter table service_catalog alter column name_id set not null;
alter table service_catalog alter column name_ko set not null;

alter table service_catalog drop column name;
alter table service_catalog drop column description;

-- Snapshotted selections on quotes/change_requests stored {name, description}
-- per the old shape — reshape to {nameId, nameKo, descriptionId,
-- descriptionKo} so historical quotes still render correctly.
update quotes
set service_selections = (
  select coalesce(jsonb_agg(
    (elem - 'name' - 'description') || jsonb_build_object(
      'nameId', elem->>'name',
      'nameKo', elem->>'name',
      'descriptionId', elem->>'description',
      'descriptionKo', elem->>'description'
    )
  ), '[]'::jsonb)
  from jsonb_array_elements(service_selections) elem
)
where jsonb_array_length(service_selections) > 0;

update change_requests
set old_service_selections = (
  select coalesce(jsonb_agg(
    (elem - 'name' - 'description') || jsonb_build_object(
      'nameId', elem->>'name',
      'nameKo', elem->>'name',
      'descriptionId', elem->>'description',
      'descriptionKo', elem->>'description'
    )
  ), '[]'::jsonb)
  from jsonb_array_elements(old_service_selections) elem
)
where jsonb_array_length(old_service_selections) > 0;

update change_requests
set new_service_selections = (
  select coalesce(jsonb_agg(
    (elem - 'name' - 'description') || jsonb_build_object(
      'nameId', elem->>'name',
      'nameKo', elem->>'name',
      'descriptionId', elem->>'description',
      'descriptionKo', elem->>'description'
    )
  ), '[]'::jsonb)
  from jsonb_array_elements(new_service_selections) elem
)
where jsonb_array_length(new_service_selections) > 0;
