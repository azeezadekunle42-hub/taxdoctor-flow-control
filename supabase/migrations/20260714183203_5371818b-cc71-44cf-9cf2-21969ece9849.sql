ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS subtotal_kobo bigint,
  ADD COLUMN IF NOT EXISTS tax_kobo bigint;