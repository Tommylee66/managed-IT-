-- The retention periods the company decided on: contract-linked records ten
-- years, quotes two, everything else three.
--
-- 20260920000003 seeded figures lifted from the draft privacy policy, which
-- were a starting point for this decision rather than the decision. These
-- are the agreed ones. Still editable per category in /admin/retention —
-- this only moves the starting value, it does not freeze it.
--
-- Left disabled, as seeded. The periods being settled does not make the
-- first purge safe to run unseen: it would delete years of accumulated rows
-- in one go, and nobody has looked at the counts yet. A master enables each
-- category from the page, with its affected count in view.

update retention_policies set months = 24,  updated_at = now() where key = 'quotes_unconverted';
update retention_policies set months = 36,  updated_at = now() where key = 'customer_contacts';
update retention_policies set months = 36,  updated_at = now() where key = 'service_logs';
update retention_policies set months = 36,  updated_at = now() where key = 'incident_logs';
update retention_policies set months = 36,  updated_at = now() where key = 'audit_log';

-- Ten years, with the contract-linked records rather than the three-year
-- group. An agent's NPWP and KTP are the evidence behind PPh 21 withheld on
-- their commission, so they share the retention of the tax documents that
-- cite them — anonymising after three years would destroy the paperwork
-- while the obligation to hold it was still running.
update retention_policies set months = 120, updated_at = now() where key = 'agent_records';
