-- Give every member registration a stable, human-readable sequential ticket number.
CREATE SEQUENCE IF NOT EXISTS public.member_registration_number_seq;

ALTER TABLE public.member_approvals
  ADD COLUMN IF NOT EXISTS registration_number bigint;

WITH numbered AS (
  SELECT id, row_number() OVER (ORDER BY created_at ASC, id ASC) AS ticket_number
  FROM public.member_approvals
  WHERE registration_number IS NULL
)
UPDATE public.member_approvals AS approvals
SET registration_number = numbered.ticket_number
FROM numbered
WHERE approvals.id = numbered.id;

SELECT setval(
  'public.member_registration_number_seq',
  GREATEST(COALESCE((SELECT MAX(registration_number) FROM public.member_approvals), 0), 1),
  COALESCE((SELECT MAX(registration_number) FROM public.member_approvals), 0) > 0
);

ALTER TABLE public.member_approvals
  ALTER COLUMN registration_number
  SET DEFAULT nextval('public.member_registration_number_seq');

ALTER TABLE public.member_approvals
  ALTER COLUMN registration_number SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS member_approvals_registration_number_key
  ON public.member_approvals (registration_number);

ALTER SEQUENCE public.member_registration_number_seq
  OWNED BY public.member_approvals.registration_number;
