-- Give every support conversation a stable, human-readable reference.
CREATE SEQUENCE IF NOT EXISTS public.support_ticket_number_seq;

ALTER TABLE public.support_tickets
  ADD COLUMN IF NOT EXISTS ticket_number bigint;

WITH numbered AS (
  SELECT id, row_number() OVER (ORDER BY created_at ASC, id ASC) AS ticket_number
  FROM public.support_tickets
  WHERE ticket_number IS NULL
)
UPDATE public.support_tickets AS tickets
SET ticket_number = numbered.ticket_number
FROM numbered
WHERE tickets.id = numbered.id;

SELECT setval(
  'public.support_ticket_number_seq',
  GREATEST(COALESCE((SELECT MAX(ticket_number) FROM public.support_tickets), 0), 1),
  COALESCE((SELECT MAX(ticket_number) FROM public.support_tickets), 0) > 0
);

ALTER TABLE public.support_tickets
  ALTER COLUMN ticket_number
  SET DEFAULT nextval('public.support_ticket_number_seq');

ALTER TABLE public.support_tickets
  ALTER COLUMN ticket_number SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS support_tickets_ticket_number_key
  ON public.support_tickets (ticket_number);

ALTER SEQUENCE public.support_ticket_number_seq
  OWNED BY public.support_tickets.ticket_number;
