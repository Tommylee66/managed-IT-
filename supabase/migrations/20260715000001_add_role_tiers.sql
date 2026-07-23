-- Expands the 2-tier role system (master/staff) into 4 tiers matching real
-- department boundaries: master (full access, max 2 accounts — enforced in
-- the application layer, not here), admin_dept (day-to-day operations minus
-- rates/activations/incident-logs), activation_dept (활동/개통 +
-- 장애처리 및 정기점검 only), sales_agent (customer/quote/contract/change-request
-- only — for outside sales partners who need system access).
--
-- Postgres requires ALTER TYPE ... ADD VALUE to commit before the new value
-- can be referenced elsewhere — that's why this is its own migration file,
-- run and committed before 20260715000002 (which uses these values).
alter type staff_role add value if not exists 'admin_dept';
alter type staff_role add value if not exists 'activation_dept';
alter type staff_role add value if not exists 'sales_agent';
