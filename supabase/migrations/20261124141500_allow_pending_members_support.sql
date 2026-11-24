CREATE OR REPLACE FUNCTION public.create_member_support_ticket(p_subject text, p_message text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  ticket uuid;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM public.member_profiles WHERE user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Member profile not found';
  END IF;

  INSERT INTO public.support_tickets(user_id, subject)
  VALUES (auth.uid(), trim(p_subject))
  RETURNING id INTO ticket;

  INSERT INTO public.support_messages(ticket_id, sender_id, sender_role, body)
  VALUES (ticket, auth.uid(), 'member', trim(p_message));

  RETURN ticket;
END
$function$;

CREATE OR REPLACE FUNCTION public.reply_to_member_support_ticket(p_ticket_id uuid, p_message text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  message_id uuid;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM public.member_profiles WHERE user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Member profile not found';
  END IF;

  UPDATE public.support_tickets
  SET status = 'open', updated_at = now()
  WHERE id = p_ticket_id
    AND user_id = auth.uid()
    AND status <> 'resolved';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Ticket not found or closed';
  END IF;

  INSERT INTO public.support_messages(ticket_id, sender_id, sender_role, body)
  VALUES (p_ticket_id, auth.uid(), 'member', trim(p_message))
  RETURNING id INTO message_id;

  RETURN message_id;
END
$function$;
