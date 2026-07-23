-- Withholding-tax (PPh) compliance on agent commission payouts requires the
-- recipient's NPWP (tax ID) and, for individuals without one, KTP (national
-- ID) plus a registered address for the tax filing/payment paperwork.
alter table agents add column npwp text;
alter table agents add column ktp text;
alter table agents add column address text;
