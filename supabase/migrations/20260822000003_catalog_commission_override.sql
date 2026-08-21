-- Lets master designate a specific equipment/service catalog item to earn
-- sales-agent commission at a different rate than the agent's own standard
-- rate — null means "use the agent's rate," matching today's behavior.
alter table equipment_catalog add column commission_rate_override numeric(5,2) null;
alter table service_catalog add column commission_rate_override numeric(5,2) null;
