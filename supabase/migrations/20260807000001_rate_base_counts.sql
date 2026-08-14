-- Makes the "included in the base fee" employee/PC and CCTV counts
-- admin-configurable instead of hardcoded (20 and 4 respectively) in
-- src/lib/calc/quote-calc.ts.
alter table rates add column employee_base_count int not null default 20;
alter table rates add column cctv_base_count int not null default 4;
