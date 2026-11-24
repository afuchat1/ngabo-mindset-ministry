-- Give every membership registration a human-readable, sequential reference.
-- The UUID remains the internal primary key; this number is safe to show to members.
ALTER TABLE public.member_approvals
  ADD COLUMN ticket_number bigint GENERATED ALWAYS AS IDENTITY;

CREATE UNIQUE INDEX member_approvals_ticket_number_unique
  ON public.member_approvals (ticket_number);

COMMENT ON COLUMN public.member_approvals.ticket_number IS
  'Sequential human-readable registration reference displayed to the member.';
