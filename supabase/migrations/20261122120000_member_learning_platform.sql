CREATE TYPE public.member_approval_state AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE public.support_ticket_state AS ENUM ('open', 'awaiting_member', 'resolved');
CREATE TYPE public.support_sender_role AS ENUM ('member', 'admin');

CREATE TABLE public.member_profiles (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name text NOT NULL DEFAULT '',
  last_name text NOT NULL DEFAULT '',
  email text NOT NULL DEFAULT '',
  phone text NOT NULL DEFAULT '',
  country text NOT NULL DEFAULT '',
  age smallint,
  gender text NOT NULL DEFAULT 'prefer_not_to_say'
    CHECK (gender IN ('female', 'male', 'non_binary', 'other', 'prefer_not_to_say')),
  approval_status public.member_approval_state NOT NULL DEFAULT 'pending',
  email_verified_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT member_profile_name_length CHECK (
    char_length(first_name) <= 100 AND char_length(last_name) <= 100
  ),
  CONSTRAINT member_profile_contact_length CHECK (
    char_length(phone) <= 40 AND char_length(country) <= 100
  ),
  CONSTRAINT member_profile_age_range CHECK (age IS NULL OR age BETWEEN 1 AND 120)
);

CREATE TABLE public.member_approvals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  status public.member_approval_state NOT NULL DEFAULT 'pending',
  reviewed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.courses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL CHECK (char_length(btrim(title)) BETWEEN 1 AND 160),
  description text NOT NULL DEFAULT '' CHECK (char_length(description) <= 1200),
  price numeric(12,2) NOT NULL DEFAULT 0 CHECK (price >= 0),
  currency text NOT NULL DEFAULT 'UGX' CHECK (currency ~ '^[A-Z]{3}$'),
  is_active boolean NOT NULL DEFAULT true,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.course_enrollments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  enrolled_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, course_id)
);

CREATE TABLE public.quizzes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  title text NOT NULL CHECK (char_length(btrim(title)) BETWEEN 1 AND 160),
  description text NOT NULL DEFAULT '' CHECK (char_length(description) <= 1200),
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.quiz_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id uuid NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
  prompt text NOT NULL CHECK (char_length(btrim(prompt)) BETWEEN 1 AND 1000),
  choices jsonb NOT NULL CHECK (
    jsonb_typeof(choices) = 'array' AND jsonb_array_length(choices) BETWEEN 2 AND 8
  ),
  correct_index smallint NOT NULL CHECK (correct_index BETWEEN 0 AND 7),
  position integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.quiz_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  quiz_id uuid NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
  score integer NOT NULL CHECK (score >= 0),
  total integer NOT NULL CHECK (total > 0 AND score <= total),
  submitted_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.support_tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subject text NOT NULL CHECK (char_length(btrim(subject)) BETWEEN 1 AND 160),
  status public.support_ticket_state NOT NULL DEFAULT 'open',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.support_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id uuid NOT NULL REFERENCES public.support_tickets(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  sender_role public.support_sender_role NOT NULL,
  body text NOT NULL CHECK (char_length(btrim(body)) BETWEEN 1 AND 5000),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX member_approvals_status_created_idx
  ON public.member_approvals(status, created_at DESC);
CREATE INDEX course_enrollments_user_idx
  ON public.course_enrollments(user_id, enrolled_at DESC);
CREATE INDEX quizzes_course_active_idx
  ON public.quizzes(course_id, is_active);
CREATE INDEX quiz_questions_quiz_position_idx
  ON public.quiz_questions(quiz_id, position);
CREATE INDEX quiz_attempts_user_submitted_idx
  ON public.quiz_attempts(user_id, submitted_at DESC);
CREATE INDEX support_tickets_status_updated_idx
  ON public.support_tickets(status, updated_at DESC);
CREATE INDEX support_messages_ticket_created_idx
  ON public.support_messages(ticket_id, created_at);

ALTER TABLE public.member_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.member_approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_messages ENABLE ROW LEVEL SECURITY;

GRANT SELECT ON public.member_profiles, public.member_approvals TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.courses TO authenticated;
GRANT SELECT, INSERT ON public.course_enrollments TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.quizzes TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.quiz_questions TO authenticated;
GRANT SELECT ON public.quiz_attempts TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.support_tickets TO authenticated;
GRANT SELECT, INSERT ON public.support_messages TO authenticated;
GRANT ALL ON public.member_profiles, public.member_approvals, public.courses,
  public.course_enrollments, public.quizzes, public.quiz_questions,
  public.quiz_attempts, public.support_tickets, public.support_messages TO service_role;

CREATE FUNCTION public.member_has_approved_access()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.member_profiles
    WHERE user_id = auth.uid()
      AND approval_status = 'approved'
      AND email_verified_at IS NOT NULL
  );
$$;
REVOKE ALL ON FUNCTION public.member_has_approved_access() FROM public;
GRANT EXECUTE ON FUNCTION public.member_has_approved_access() TO authenticated;

CREATE FUNCTION public.create_member_profile_for_auth_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  metadata jsonb := COALESCE(NEW.raw_user_meta_data, '{}'::jsonb);
  parsed_age smallint;
BEGIN
  IF COALESCE(metadata->>'age', '') ~ '^[0-9]{1,3}$' THEN
    parsed_age := (metadata->>'age')::smallint;
    IF parsed_age NOT BETWEEN 1 AND 120 THEN parsed_age := NULL; END IF;
  END IF;

  INSERT INTO public.member_profiles (
    user_id, first_name, last_name, email, phone, country, age, gender, email_verified_at
  ) VALUES (
    NEW.id,
    COALESCE(NULLIF(btrim(metadata->>'first_name'), ''), 'Member'),
    COALESCE(NULLIF(btrim(metadata->>'last_name'), ''), ''),
    COALESCE(NEW.email, ''),
    COALESCE(metadata->>'phone', ''),
    COALESCE(metadata->>'country', ''),
    parsed_age,
    CASE
      WHEN metadata->>'gender' IN ('female', 'male', 'non_binary', 'other', 'prefer_not_to_say')
      THEN metadata->>'gender'
      ELSE 'prefer_not_to_say'
    END,
    NEW.email_confirmed_at
  );

  INSERT INTO public.user_roles(user_id, role)
  VALUES (NEW.id, 'user')
  ON CONFLICT (user_id, role) DO NOTHING;

  INSERT INTO public.member_approvals(user_id, status)
  VALUES (NEW.id, 'pending')
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$;

CREATE TRIGGER create_member_profile_after_auth_signup
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.create_member_profile_for_auth_user();

CREATE FUNCTION public.sync_member_email_verification()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.email_confirmed_at IS NOT NULL THEN
    UPDATE public.member_profiles
    SET email = COALESCE(NEW.email, email),
        email_verified_at = NEW.email_confirmed_at,
        updated_at = now()
    WHERE user_id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER sync_member_email_verification_after_auth_update
AFTER UPDATE OF email_confirmed_at, email ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.sync_member_email_verification();

CREATE FUNCTION public.sync_member_approval_state()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'approved' AND NOT EXISTS (
    SELECT 1 FROM public.member_profiles
    WHERE user_id = NEW.user_id AND email_verified_at IS NOT NULL
  ) THEN
    RAISE EXCEPTION 'Member email must be verified before approval';
  END IF;

  NEW.updated_at := now();
  IF NEW.status <> OLD.status THEN
    NEW.reviewed_at := now();
  END IF;
  UPDATE public.member_profiles
  SET approval_status = NEW.status, updated_at = now()
  WHERE user_id = NEW.user_id;
  RETURN NEW;
END;
$$;

CREATE TRIGGER sync_member_approval_state_before_update
BEFORE UPDATE OF status ON public.member_approvals
FOR EACH ROW EXECUTE FUNCTION public.sync_member_approval_state();

CREATE FUNCTION public.update_member_profile(
  p_first_name text,
  p_last_name text,
  p_phone text,
  p_country text,
  p_age smallint,
  p_gender text
)
RETURNS public.member_profiles
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  updated_profile public.member_profiles;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Authentication required'; END IF;

  UPDATE public.member_profiles
  SET first_name = btrim(p_first_name),
      last_name = btrim(p_last_name),
      phone = btrim(p_phone),
      country = btrim(p_country),
      age = p_age,
      gender = p_gender,
      updated_at = now()
  WHERE user_id = auth.uid()
  RETURNING * INTO updated_profile;

  IF NOT FOUND THEN RAISE EXCEPTION 'Member profile not found'; END IF;
  RETURN updated_profile;
END;
$$;
REVOKE ALL ON FUNCTION public.update_member_profile(text, text, text, text, smallint, text) FROM public;
GRANT EXECUTE ON FUNCTION public.update_member_profile(text, text, text, text, smallint, text) TO authenticated;

CREATE POLICY member_profiles_read_self_or_admin ON public.member_profiles
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY member_approvals_read_self_or_admin ON public.member_approvals
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY member_approvals_admin_update ON public.member_approvals
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY courses_active_approved_read ON public.courses
  FOR SELECT TO authenticated
  USING ((is_active AND public.member_has_approved_access()) OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY courses_admin_insert ON public.courses
  FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY courses_admin_update ON public.courses
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY courses_admin_delete ON public.courses
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY course_enrollments_read_self_or_admin ON public.course_enrollments
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY course_enrollments_free_insert ON public.course_enrollments
  FOR INSERT TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND public.member_has_approved_access()
    AND EXISTS (
      SELECT 1 FROM public.courses
      WHERE id = course_id AND is_active AND price = 0
    )
  );

CREATE POLICY quizzes_approved_read ON public.quizzes
  FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin')
    OR (
      is_active
      AND public.member_has_approved_access()
      AND EXISTS (
        SELECT 1 FROM public.courses c
        WHERE c.id = course_id AND c.is_active
          AND (c.price = 0 OR EXISTS (
            SELECT 1 FROM public.course_enrollments e
            WHERE e.course_id = c.id AND e.user_id = auth.uid()
          ))
      )
    )
  );
CREATE POLICY quizzes_admin_insert ON public.quizzes
  FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY quizzes_admin_update ON public.quizzes
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY quizzes_admin_delete ON public.quizzes
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY quiz_questions_admin_all ON public.quiz_questions
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY quiz_attempts_read_self_or_admin ON public.quiz_attempts
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY support_tickets_read_self_or_admin ON public.support_tickets
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY support_tickets_admin_update ON public.support_tickets
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY support_messages_read_ticket_owner_or_admin ON public.support_messages
  FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin')
    OR EXISTS (
      SELECT 1 FROM public.support_tickets t
      WHERE t.id = ticket_id AND t.user_id = auth.uid()
    )
  );
CREATE POLICY support_messages_member_insert ON public.support_messages
  FOR INSERT TO authenticated
  WITH CHECK (
    sender_id = auth.uid()
    AND sender_role = 'member'
    AND public.member_has_approved_access()
    AND EXISTS (
      SELECT 1 FROM public.support_tickets t
      WHERE t.id = ticket_id AND t.user_id = auth.uid()
    )
  );
CREATE POLICY support_messages_admin_insert ON public.support_messages
  FOR INSERT TO authenticated
  WITH CHECK (
    sender_id = auth.uid()
    AND sender_role = 'admin'
    AND public.has_role(auth.uid(), 'admin')
  );

CREATE FUNCTION public.create_member_support_ticket(p_subject text, p_message text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_ticket_id uuid;
BEGIN
  IF auth.uid() IS NULL OR NOT public.member_has_approved_access() THEN
    RAISE EXCEPTION 'Approved member access required';
  END IF;

  INSERT INTO public.support_tickets(user_id, subject)
  VALUES (auth.uid(), btrim(p_subject))
  RETURNING id INTO new_ticket_id;

  INSERT INTO public.support_messages(ticket_id, sender_id, sender_role, body)
  VALUES (new_ticket_id, auth.uid(), 'member', btrim(p_message));

  RETURN new_ticket_id;
END;
$$;
REVOKE ALL ON FUNCTION public.create_member_support_ticket(text, text) FROM public;
GRANT EXECUTE ON FUNCTION public.create_member_support_ticket(text, text) TO authenticated;

CREATE FUNCTION public.reply_to_member_support_ticket(p_ticket_id uuid, p_message text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_message_id uuid;
BEGIN
  IF auth.uid() IS NULL OR NOT public.member_has_approved_access() THEN
    RAISE EXCEPTION 'Approved member access required';
  END IF;

  UPDATE public.support_tickets
  SET status = 'open', updated_at = now()
  WHERE id = p_ticket_id AND user_id = auth.uid() AND status <> 'resolved';
  IF NOT FOUND THEN RAISE EXCEPTION 'Support ticket not found or closed'; END IF;

  INSERT INTO public.support_messages(ticket_id, sender_id, sender_role, body)
  VALUES (p_ticket_id, auth.uid(), 'member', btrim(p_message))
  RETURNING id INTO new_message_id;
  RETURN new_message_id;
END;
$$;
REVOKE ALL ON FUNCTION public.reply_to_member_support_ticket(uuid, text) FROM public;
GRANT EXECUTE ON FUNCTION public.reply_to_member_support_ticket(uuid, text) TO authenticated;

CREATE FUNCTION public.admin_reply_to_support_ticket(
  p_ticket_id uuid,
  p_message text,
  p_resolve boolean DEFAULT false
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_message_id uuid;
BEGIN
  IF auth.uid() IS NULL OR NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Administrator access required';
  END IF;

  UPDATE public.support_tickets
  SET status = CASE WHEN p_resolve THEN 'resolved'::public.support_ticket_state
                    ELSE 'awaiting_member'::public.support_ticket_state END,
      updated_at = now()
  WHERE id = p_ticket_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Support ticket not found'; END IF;

  INSERT INTO public.support_messages(ticket_id, sender_id, sender_role, body)
  VALUES (p_ticket_id, auth.uid(), 'admin', btrim(p_message))
  RETURNING id INTO new_message_id;
  RETURN new_message_id;
END;
$$;
REVOKE ALL ON FUNCTION public.admin_reply_to_support_ticket(uuid, text, boolean) FROM public;
GRANT EXECUTE ON FUNCTION public.admin_reply_to_support_ticket(uuid, text, boolean) TO authenticated;

CREATE FUNCTION public.member_quiz_questions(p_quiz_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result jsonb;
BEGIN
  IF auth.uid() IS NULL OR NOT public.member_has_approved_access() THEN
    RAISE EXCEPTION 'Approved member access required';
  END IF;

  SELECT jsonb_build_object(
    'id', q.id,
    'title', q.title,
    'description', q.description,
    'questions', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'id', question.id,
        'prompt', question.prompt,
        'choices', question.choices,
        'position', question.position
      ) ORDER BY question.position, question.id)
      FROM public.quiz_questions question
      WHERE question.quiz_id = q.id
    ), '[]'::jsonb)
  )
  INTO result
  FROM public.quizzes q
  JOIN public.courses c ON c.id = q.course_id
  WHERE q.id = p_quiz_id
    AND q.is_active AND c.is_active
    AND (
      c.price = 0 OR EXISTS (
        SELECT 1 FROM public.course_enrollments e
        WHERE e.course_id = c.id AND e.user_id = auth.uid()
      )
    );

  IF result IS NULL THEN RAISE EXCEPTION 'Quiz is not available'; END IF;
  RETURN result;
END;
$$;
REVOKE ALL ON FUNCTION public.member_quiz_questions(uuid) FROM public;
GRANT EXECUTE ON FUNCTION public.member_quiz_questions(uuid) TO authenticated;

CREATE FUNCTION public.submit_member_quiz(p_quiz_id uuid, p_answers jsonb)
RETURNS TABLE(attempt_id uuid, score integer, total integer)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  question_total integer;
  correct_total integer;
  new_attempt_id uuid;
BEGIN
  IF auth.uid() IS NULL OR NOT public.member_has_approved_access() THEN
    RAISE EXCEPTION 'Approved member access required';
  END IF;
  IF jsonb_typeof(p_answers) <> 'object' THEN RAISE EXCEPTION 'Answers must be an object'; END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.quizzes q
    JOIN public.courses c ON c.id = q.course_id
    WHERE q.id = p_quiz_id AND q.is_active AND c.is_active
      AND (c.price = 0 OR EXISTS (
        SELECT 1 FROM public.course_enrollments e
        WHERE e.course_id = c.id AND e.user_id = auth.uid()
      ))
  ) THEN
    RAISE EXCEPTION 'Quiz is not available';
  END IF;

  SELECT count(*)::integer,
         count(*) FILTER (
           WHERE p_answers ? question.id::text
             AND p_answers->>question.id::text ~ '^[0-7]$'
             AND (p_answers->>question.id::text)::integer = question.correct_index
         )::integer
  INTO question_total, correct_total
  FROM public.quiz_questions question
  WHERE question.quiz_id = p_quiz_id;

  IF question_total = 0 THEN RAISE EXCEPTION 'Quiz has no questions'; END IF;

  INSERT INTO public.quiz_attempts(user_id, quiz_id, score, total)
  VALUES (auth.uid(), p_quiz_id, correct_total, question_total)
  RETURNING id INTO new_attempt_id;

  RETURN QUERY SELECT new_attempt_id, correct_total, question_total;
END;
$$;
REVOKE ALL ON FUNCTION public.submit_member_quiz(uuid, jsonb) FROM public;
GRANT EXECUTE ON FUNCTION public.submit_member_quiz(uuid, jsonb) TO authenticated;

CREATE FUNCTION public.admin_save_quiz(
  p_id uuid,
  p_course_id uuid,
  p_title text,
  p_description text,
  p_is_active boolean,
  p_questions jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  saved_quiz_id uuid;
  question jsonb;
BEGIN
  IF auth.uid() IS NULL OR NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Administrator access required';
  END IF;
  IF jsonb_typeof(p_questions) <> 'array' OR jsonb_array_length(p_questions) < 1 THEN
    RAISE EXCEPTION 'A quiz needs at least one question';
  END IF;

  IF p_id IS NULL THEN
    INSERT INTO public.quizzes(course_id, title, description, is_active)
    VALUES (p_course_id, btrim(p_title), btrim(p_description), p_is_active)
    RETURNING id INTO saved_quiz_id;
  ELSE
    UPDATE public.quizzes
    SET course_id = p_course_id, title = btrim(p_title),
        description = btrim(p_description), is_active = p_is_active,
        updated_at = now()
    WHERE id = p_id
    RETURNING id INTO saved_quiz_id;
    IF NOT FOUND THEN RAISE EXCEPTION 'Quiz not found'; END IF;
  END IF;

  DELETE FROM public.quiz_questions WHERE quiz_id = saved_quiz_id;
  FOR question IN SELECT value FROM jsonb_array_elements(p_questions)
  LOOP
    IF jsonb_typeof(question->'choices') <> 'array'
      OR jsonb_array_length(question->'choices') NOT BETWEEN 2 AND 8
      OR COALESCE((question->>'correct_index')::integer, -1) < 0
      OR COALESCE((question->>'correct_index')::integer, 99) >= jsonb_array_length(question->'choices')
    THEN
      RAISE EXCEPTION 'Each question needs 2-8 choices and a valid correct answer';
    END IF;

    INSERT INTO public.quiz_questions(quiz_id, prompt, choices, correct_index, position)
    VALUES (
      saved_quiz_id,
      btrim(question->>'prompt'),
      question->'choices',
      (question->>'correct_index')::smallint,
      COALESCE((question->>'position')::integer, 0)
    );
  END LOOP;

  RETURN saved_quiz_id;
END;
$$;
REVOKE ALL ON FUNCTION public.admin_save_quiz(uuid, uuid, text, text, boolean, jsonb) FROM public;
GRANT EXECUTE ON FUNCTION public.admin_save_quiz(uuid, uuid, text, text, boolean, jsonb) TO authenticated;
