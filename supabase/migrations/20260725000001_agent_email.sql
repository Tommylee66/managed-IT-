-- Sales agent contact info shown on customer-facing quote/contract
-- documents (name + phone were already there) needs an email address too.
alter table agents add column email text;
