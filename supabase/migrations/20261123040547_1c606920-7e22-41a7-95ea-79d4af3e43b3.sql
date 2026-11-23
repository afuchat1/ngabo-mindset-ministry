CREATE TYPE public.member_approval_state AS ENUM ('pending','approved','rejected');
CREATE TYPE public.support_ticket_state AS ENUM ('open','awaiting_member','resolved');
CREATE TYPE public.support_sender_role AS ENUM ('member','admin');
CREATE TABLE public.member_profiles(user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE, first_name text NOT NULL DEFAULT '', last_name text NOT NULL DEFAULT '', email text NOT NULL DEFAULT '', phone text NOT NULL DEFAULT '', country text NOT NULL DEFAULT '', age smallint, gender text NOT NULL DEFAULT 'prefer_not_to_say', approval_status public.member_approval_state NOT NULL DEFAULT 'pending', email_verified_at timestamptz, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now());
GRANT SELECT ON public.member_profiles TO authenticated; GRANT ALL ON public.member_profiles TO service_role;
ALTER TABLE public.member_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY profile_read ON public.member_profiles FOR SELECT TO authenticated USING(user_id=(SELECT auth.uid()) OR public.has_role((SELECT auth.uid()),'admin'));
CREATE TABLE public.member_approvals(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),user_id uuid NOT NULL UNIQUE, status public.member_approval_state NOT NULL DEFAULT 'pending', reviewed_by uuid, reviewed_at timestamptz, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now());
GRANT SELECT,UPDATE ON public.member_approvals TO authenticated; GRANT ALL ON public.member_approvals TO service_role;
ALTER TABLE public.member_approvals ENABLE ROW LEVEL SECURITY;
CREATE POLICY approval_read ON public.member_approvals FOR SELECT TO authenticated USING(user_id=(SELECT auth.uid()) OR public.has_role((SELECT auth.uid()),'admin'));
CREATE POLICY approval_update ON public.member_approvals FOR UPDATE TO authenticated USING(public.has_role((SELECT auth.uid()),'admin')) WITH CHECK(public.has_role((SELECT auth.uid()),'admin'));
CREATE TABLE public.courses(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),title text NOT NULL,description text NOT NULL DEFAULT '',price numeric(12,2) NOT NULL DEFAULT 0,currency text NOT NULL DEFAULT 'UGX',is_active boolean NOT NULL DEFAULT true,created_by uuid,created_at timestamptz NOT NULL DEFAULT now(),updated_at timestamptz NOT NULL DEFAULT now());
GRANT SELECT,INSERT,UPDATE,DELETE ON public.courses TO authenticated; GRANT ALL ON public.courses TO service_role;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
CREATE TABLE public.course_enrollments(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),user_id uuid NOT NULL,course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,enrolled_at timestamptz NOT NULL DEFAULT now(),UNIQUE(user_id,course_id));
GRANT SELECT,INSERT ON public.course_enrollments TO authenticated; GRANT ALL ON public.course_enrollments TO service_role;
ALTER TABLE public.course_enrollments ENABLE ROW LEVEL SECURITY;
CREATE TABLE public.course_lessons(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,title text NOT NULL,body text NOT NULL DEFAULT '',resource_url text,position integer NOT NULL DEFAULT 0,created_at timestamptz NOT NULL DEFAULT now(),updated_at timestamptz NOT NULL DEFAULT now());
GRANT SELECT,INSERT,UPDATE,DELETE ON public.course_lessons TO authenticated; GRANT ALL ON public.course_lessons TO service_role;
ALTER TABLE public.course_lessons ENABLE ROW LEVEL SECURITY;
CREATE TABLE public.quizzes(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,title text NOT NULL,description text NOT NULL DEFAULT '',is_active boolean NOT NULL DEFAULT true,created_at timestamptz NOT NULL DEFAULT now(),updated_at timestamptz NOT NULL DEFAULT now());
GRANT SELECT,INSERT,UPDATE,DELETE ON public.quizzes TO authenticated; GRANT ALL ON public.quizzes TO service_role;
ALTER TABLE public.quizzes ENABLE ROW LEVEL SECURITY;
CREATE TABLE public.quiz_questions(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),quiz_id uuid NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,prompt text NOT NULL,choices jsonb NOT NULL,correct_index smallint NOT NULL,position integer NOT NULL DEFAULT 0,created_at timestamptz NOT NULL DEFAULT now());
GRANT SELECT,INSERT,UPDATE,DELETE ON public.quiz_questions TO authenticated; GRANT ALL ON public.quiz_questions TO service_role;
ALTER TABLE public.quiz_questions ENABLE ROW LEVEL SECURITY;
CREATE TABLE public.quiz_attempts(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),user_id uuid NOT NULL,quiz_id uuid NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,score integer NOT NULL,total integer NOT NULL,submitted_at timestamptz NOT NULL DEFAULT now());
GRANT SELECT ON public.quiz_attempts TO authenticated; GRANT ALL ON public.quiz_attempts TO service_role;
ALTER TABLE public.quiz_attempts ENABLE ROW LEVEL SECURITY;
CREATE TABLE public.support_tickets(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),user_id uuid NOT NULL,subject text NOT NULL,status public.support_ticket_state NOT NULL DEFAULT 'open',created_at timestamptz NOT NULL DEFAULT now(),updated_at timestamptz NOT NULL DEFAULT now());
GRANT SELECT,UPDATE ON public.support_tickets TO authenticated; GRANT ALL ON public.support_tickets TO service_role;
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;
CREATE TABLE public.support_messages(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),ticket_id uuid NOT NULL REFERENCES public.support_tickets(id) ON DELETE CASCADE,sender_id uuid NOT NULL,sender_role public.support_sender_role NOT NULL,body text NOT NULL,created_at timestamptz NOT NULL DEFAULT now());
GRANT SELECT ON public.support_messages TO authenticated; GRANT ALL ON public.support_messages TO service_role;
ALTER TABLE public.support_messages ENABLE ROW LEVEL SECURITY;
CREATE TABLE public.purchase_tickets(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),user_id uuid NOT NULL,course_id uuid REFERENCES public.courses(id),item_title text NOT NULL,amount numeric(12,2) NOT NULL,currency text NOT NULL,status text NOT NULL DEFAULT 'pending',created_at timestamptz NOT NULL DEFAULT now(),updated_at timestamptz NOT NULL DEFAULT now());
GRANT SELECT ON public.purchase_tickets TO authenticated; GRANT ALL ON public.purchase_tickets TO service_role;
ALTER TABLE public.purchase_tickets ENABLE ROW LEVEL SECURITY;
CREATE POLICY purchase_read ON public.purchase_tickets FOR SELECT TO authenticated USING(user_id=(SELECT auth.uid()) OR public.has_role((SELECT auth.uid()),'admin'));
CREATE FUNCTION public.member_has_approved_access() RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$ SELECT EXISTS(SELECT 1 FROM public.member_profiles WHERE user_id=auth.uid() AND approval_status='approved' AND email_verified_at IS NOT NULL) $$;
REVOKE ALL ON FUNCTION public.member_has_approved_access() FROM public; GRANT EXECUTE ON FUNCTION public.member_has_approved_access() TO authenticated;
CREATE POLICY courses_read ON public.courses FOR SELECT TO authenticated USING((is_active AND public.member_has_approved_access()) OR public.has_role((SELECT auth.uid()),'admin'));
CREATE POLICY courses_insert ON public.courses FOR INSERT TO authenticated WITH CHECK(public.has_role((SELECT auth.uid()),'admin'));
CREATE POLICY courses_update ON public.courses FOR UPDATE TO authenticated USING(public.has_role((SELECT auth.uid()),'admin')) WITH CHECK(public.has_role((SELECT auth.uid()),'admin'));
CREATE POLICY courses_delete ON public.courses FOR DELETE TO authenticated USING(public.has_role((SELECT auth.uid()),'admin'));
CREATE POLICY enrollment_read ON public.course_enrollments FOR SELECT TO authenticated USING(user_id=(SELECT auth.uid()) OR public.has_role((SELECT auth.uid()),'admin'));
CREATE POLICY enrollment_free_insert ON public.course_enrollments FOR INSERT TO authenticated WITH CHECK(user_id=(SELECT auth.uid()) AND public.member_has_approved_access() AND EXISTS(SELECT 1 FROM public.courses WHERE id=course_id AND is_active AND price=0));
CREATE POLICY lesson_read ON public.course_lessons FOR SELECT TO authenticated USING(public.has_role((SELECT auth.uid()),'admin') OR (public.member_has_approved_access() AND EXISTS(SELECT 1 FROM public.courses c JOIN public.course_enrollments e ON e.course_id=c.id WHERE c.id=course_lessons.course_id AND c.is_active AND e.user_id=auth.uid())));
CREATE POLICY lesson_insert ON public.course_lessons FOR INSERT TO authenticated WITH CHECK(public.has_role((SELECT auth.uid()),'admin'));
CREATE POLICY lesson_update ON public.course_lessons FOR UPDATE TO authenticated USING(public.has_role((SELECT auth.uid()),'admin')) WITH CHECK(public.has_role((SELECT auth.uid()),'admin'));
CREATE POLICY lesson_delete ON public.course_lessons FOR DELETE TO authenticated USING(public.has_role((SELECT auth.uid()),'admin'));
CREATE POLICY quizzes_read ON public.quizzes FOR SELECT TO authenticated USING(public.has_role((SELECT auth.uid()),'admin') OR (is_active AND public.member_has_approved_access() AND EXISTS(SELECT 1 FROM public.courses c WHERE c.id=course_id AND c.is_active AND (c.price=0 OR EXISTS(SELECT 1 FROM public.course_enrollments e WHERE e.course_id=c.id AND e.user_id=auth.uid())))));
CREATE POLICY quizzes_insert ON public.quizzes FOR INSERT TO authenticated WITH CHECK(public.has_role((SELECT auth.uid()),'admin'));
CREATE POLICY quizzes_update ON public.quizzes FOR UPDATE TO authenticated USING(public.has_role((SELECT auth.uid()),'admin')) WITH CHECK(public.has_role((SELECT auth.uid()),'admin'));
CREATE POLICY quizzes_delete ON public.quizzes FOR DELETE TO authenticated USING(public.has_role((SELECT auth.uid()),'admin'));
CREATE POLICY questions_admin ON public.quiz_questions FOR ALL TO authenticated USING(public.has_role((SELECT auth.uid()),'admin')) WITH CHECK(public.has_role((SELECT auth.uid()),'admin'));
CREATE POLICY attempts_read ON public.quiz_attempts FOR SELECT TO authenticated USING(user_id=(SELECT auth.uid()) OR public.has_role((SELECT auth.uid()),'admin'));
CREATE POLICY support_read ON public.support_tickets FOR SELECT TO authenticated USING(user_id=(SELECT auth.uid()) OR public.has_role((SELECT auth.uid()),'admin'));
CREATE POLICY support_admin_update ON public.support_tickets FOR UPDATE TO authenticated USING(public.has_role((SELECT auth.uid()),'admin')) WITH CHECK(public.has_role((SELECT auth.uid()),'admin'));
CREATE POLICY messages_read ON public.support_messages FOR SELECT TO authenticated USING(public.has_role((SELECT auth.uid()),'admin') OR EXISTS(SELECT 1 FROM public.support_tickets t WHERE t.id=ticket_id AND t.user_id=auth.uid()));
CREATE FUNCTION public.platform_validate() RETURNS trigger LANGUAGE plpgsql SET search_path=public AS $$ BEGIN
IF TG_TABLE_NAME='member_profiles' THEN
 IF length(trim(NEW.first_name)) NOT BETWEEN 1 AND 100 OR length(NEW.last_name)>100 OR length(NEW.phone)>40 OR length(NEW.country)>100 OR NEW.age IS NOT NULL AND NEW.age NOT BETWEEN 1 AND 120 OR NEW.gender NOT IN ('female','male','non_binary','other','prefer_not_to_say') THEN RAISE EXCEPTION 'Invalid member details'; END IF;
ELSIF TG_TABLE_NAME='courses' THEN
 IF length(trim(NEW.title)) NOT BETWEEN 1 AND 160 OR length(NEW.description)>1200 OR NEW.price<0 OR NEW.currency !~ '^[A-Z]{3}$' THEN RAISE EXCEPTION 'Invalid course details'; END IF;
ELSIF TG_TABLE_NAME='course_lessons' THEN
 IF length(trim(NEW.title)) NOT BETWEEN 1 AND 160 OR length(NEW.body)>50000 OR NEW.resource_url IS NOT NULL AND NEW.resource_url !~* '^https://[^/?#[:space:]@]+([/?#][^[:space:]]*)?$' THEN RAISE EXCEPTION 'Invalid lesson details'; END IF;
ELSIF TG_TABLE_NAME='quizzes' THEN
 IF length(trim(NEW.title)) NOT BETWEEN 1 AND 160 OR length(NEW.description)>1200 THEN RAISE EXCEPTION 'Invalid quiz details'; END IF;
ELSIF TG_TABLE_NAME='quiz_questions' THEN
 IF length(trim(NEW.prompt)) NOT BETWEEN 1 AND 1000 OR jsonb_typeof(NEW.choices)<>'array' OR jsonb_array_length(NEW.choices) NOT BETWEEN 2 AND 8 OR NEW.correct_index<0 OR NEW.correct_index>=jsonb_array_length(NEW.choices) THEN RAISE EXCEPTION 'Invalid question'; END IF;
ELSIF TG_TABLE_NAME='support_tickets' THEN
 IF length(trim(NEW.subject)) NOT BETWEEN 1 AND 160 THEN RAISE EXCEPTION 'Invalid ticket subject'; END IF;
ELSIF TG_TABLE_NAME='support_messages' THEN
 IF length(trim(NEW.body)) NOT BETWEEN 1 AND 5000 THEN RAISE EXCEPTION 'Invalid message'; END IF;
END IF;
IF TG_TABLE_NAME NOT IN ('quiz_questions','support_messages') THEN NEW.updated_at=now(); END IF; RETURN NEW; END $$;
CREATE TRIGGER profile_validate BEFORE INSERT OR UPDATE ON public.member_profiles FOR EACH ROW EXECUTE FUNCTION public.platform_validate();
CREATE TRIGGER course_validate BEFORE INSERT OR UPDATE ON public.courses FOR EACH ROW EXECUTE FUNCTION public.platform_validate();
CREATE TRIGGER lesson_validate BEFORE INSERT OR UPDATE ON public.course_lessons FOR EACH ROW EXECUTE FUNCTION public.platform_validate();
CREATE TRIGGER quiz_validate BEFORE INSERT OR UPDATE ON public.quizzes FOR EACH ROW EXECUTE FUNCTION public.platform_validate();
CREATE TRIGGER question_validate BEFORE INSERT OR UPDATE ON public.quiz_questions FOR EACH ROW EXECUTE FUNCTION public.platform_validate();
CREATE TRIGGER support_validate BEFORE INSERT OR UPDATE ON public.support_tickets FOR EACH ROW EXECUTE FUNCTION public.platform_validate();
CREATE TRIGGER message_validate BEFORE INSERT OR UPDATE ON public.support_messages FOR EACH ROW EXECUTE FUNCTION public.platform_validate();
CREATE FUNCTION public.create_member_profile_for_auth_user() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$ BEGIN
INSERT INTO public.member_profiles(user_id,first_name,last_name,email,phone,country,age,gender,email_verified_at) VALUES(NEW.id,coalesce(nullif(trim(NEW.raw_user_meta_data->>'first_name'),''),'Member'),coalesce(NEW.raw_user_meta_data->>'last_name',''),coalesce(NEW.email,''),coalesce(NEW.raw_user_meta_data->>'phone',''),coalesce(NEW.raw_user_meta_data->>'country',''),CASE WHEN NEW.raw_user_meta_data->>'age' ~ '^[0-9]{1,3}$' THEN (NEW.raw_user_meta_data->>'age')::smallint ELSE NULL END,coalesce(NEW.raw_user_meta_data->>'gender','prefer_not_to_say'),NEW.email_confirmed_at);
INSERT INTO public.user_roles(user_id,role) VALUES(NEW.id,'user') ON CONFLICT(user_id,role) DO NOTHING;
INSERT INTO public.member_approvals(user_id) VALUES(NEW.id); RETURN NEW; END $$;
REVOKE ALL ON FUNCTION public.create_member_profile_for_auth_user() FROM public,anon,authenticated;
CREATE TRIGGER create_member_profile_after_auth_signup AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.create_member_profile_for_auth_user();
CREATE FUNCTION public.sync_member_email_verification() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$ BEGIN UPDATE public.member_profiles SET email=coalesce(NEW.email,''),email_verified_at=NEW.email_confirmed_at,updated_at=now() WHERE user_id=NEW.id; RETURN NEW; END $$;
REVOKE ALL ON FUNCTION public.sync_member_email_verification() FROM public,anon,authenticated;
CREATE TRIGGER sync_member_email_verification_after_auth_update AFTER UPDATE OF email_confirmed_at,email ON auth.users FOR EACH ROW EXECUTE FUNCTION public.sync_member_email_verification();
CREATE FUNCTION public.sync_member_approval_state() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$ BEGIN
IF NEW.user_id<>OLD.user_id THEN RAISE EXCEPTION 'Member cannot be changed'; END IF;
IF NEW.status='approved' AND NOT EXISTS(SELECT 1 FROM public.member_profiles WHERE user_id=NEW.user_id AND email_verified_at IS NOT NULL) THEN RAISE EXCEPTION 'Member email must be verified before approval'; END IF;
NEW.reviewed_at=now(); NEW.updated_at=now(); UPDATE public.member_profiles SET approval_status=NEW.status WHERE user_id=NEW.user_id; RETURN NEW; END $$;
REVOKE ALL ON FUNCTION public.sync_member_approval_state() FROM public,anon,authenticated;
CREATE TRIGGER sync_member_approval_state_before_update BEFORE UPDATE ON public.member_approvals FOR EACH ROW EXECUTE FUNCTION public.sync_member_approval_state();
CREATE FUNCTION public.update_member_profile(p_first_name text,p_last_name text,p_phone text,p_country text,p_age smallint,p_gender text) RETURNS public.member_profiles LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$ DECLARE result public.member_profiles; BEGIN
IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Authentication required'; END IF;
IF length(trim(p_first_name))<1 OR length(trim(p_last_name))<1 OR p_phone !~ '^\+?[0-9 ()-]{5,40}$' OR length(trim(p_country))<2 OR p_age NOT BETWEEN 1 AND 120 THEN RAISE EXCEPTION 'Check your profile details'; END IF;
UPDATE public.member_profiles SET first_name=trim(p_first_name),last_name=trim(p_last_name),phone=trim(p_phone),country=trim(p_country),age=p_age,gender=p_gender WHERE user_id=auth.uid() RETURNING * INTO result; IF NOT FOUND THEN RAISE EXCEPTION 'Profile not found'; END IF; RETURN result; END $$;
REVOKE ALL ON FUNCTION public.update_member_profile(text,text,text,text,smallint,text) FROM public; GRANT EXECUTE ON FUNCTION public.update_member_profile(text,text,text,text,smallint,text) TO authenticated;
CREATE FUNCTION public.create_member_support_ticket(p_subject text,p_message text) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$ DECLARE ticket uuid; BEGIN
IF NOT public.member_has_approved_access() THEN RAISE EXCEPTION 'Approved access required'; END IF;
INSERT INTO public.support_tickets(user_id,subject) VALUES(auth.uid(),trim(p_subject)) RETURNING id INTO ticket;
INSERT INTO public.support_messages(ticket_id,sender_id,sender_role,body) VALUES(ticket,auth.uid(),'member',trim(p_message)); RETURN ticket; END $$;
REVOKE ALL ON FUNCTION public.create_member_support_ticket(text,text) FROM public; GRANT EXECUTE ON FUNCTION public.create_member_support_ticket(text,text) TO authenticated;
CREATE FUNCTION public.reply_to_member_support_ticket(p_ticket_id uuid,p_message text) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$ DECLARE message_id uuid; BEGIN
IF NOT public.member_has_approved_access() THEN RAISE EXCEPTION 'Approved access required'; END IF;
UPDATE public.support_tickets SET status='open',updated_at=now() WHERE id=p_ticket_id AND user_id=auth.uid() AND status<>'resolved'; IF NOT FOUND THEN RAISE EXCEPTION 'Ticket not found or closed'; END IF;
INSERT INTO public.support_messages(ticket_id,sender_id,sender_role,body) VALUES(p_ticket_id,auth.uid(),'member',trim(p_message)) RETURNING id INTO message_id; RETURN message_id; END $$;
REVOKE ALL ON FUNCTION public.reply_to_member_support_ticket(uuid,text) FROM public; GRANT EXECUTE ON FUNCTION public.reply_to_member_support_ticket(uuid,text) TO authenticated;
CREATE FUNCTION public.admin_reply_to_support_ticket(p_ticket_id uuid,p_message text,p_resolve boolean DEFAULT false) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$ DECLARE message_id uuid; BEGIN
IF NOT public.has_role(auth.uid(),'admin') THEN RAISE EXCEPTION 'Admin required'; END IF;
UPDATE public.support_tickets SET status=CASE WHEN p_resolve THEN 'resolved'::public.support_ticket_state ELSE 'awaiting_member'::public.support_ticket_state END,updated_at=now() WHERE id=p_ticket_id; IF NOT FOUND THEN RAISE EXCEPTION 'Ticket not found'; END IF;
INSERT INTO public.support_messages(ticket_id,sender_id,sender_role,body) VALUES(p_ticket_id,auth.uid(),'admin',trim(p_message)) RETURNING id INTO message_id; RETURN message_id; END $$;
REVOKE ALL ON FUNCTION public.admin_reply_to_support_ticket(uuid,text,boolean) FROM public; GRANT EXECUTE ON FUNCTION public.admin_reply_to_support_ticket(uuid,text,boolean) TO authenticated;
CREATE FUNCTION public.member_quiz_questions(p_quiz_id uuid) RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public AS $$ DECLARE result jsonb; BEGIN
IF NOT public.member_has_approved_access() THEN RAISE EXCEPTION 'Approved access required'; END IF;
SELECT jsonb_build_object('id',q.id,'title',q.title,'description',q.description,'questions',coalesce((SELECT jsonb_agg(jsonb_build_object('id',x.id,'prompt',x.prompt,'choices',x.choices,'position',x.position) ORDER BY x.position,x.id) FROM public.quiz_questions x WHERE x.quiz_id=q.id),'[]'::jsonb)) INTO result FROM public.quizzes q JOIN public.courses c ON c.id=q.course_id WHERE q.id=p_quiz_id AND q.is_active AND c.is_active AND (c.price=0 OR EXISTS(SELECT 1 FROM public.course_enrollments e WHERE e.course_id=c.id AND e.user_id=auth.uid()));
IF result IS NULL THEN RAISE EXCEPTION 'Quiz unavailable'; END IF; RETURN result; END $$;
REVOKE ALL ON FUNCTION public.member_quiz_questions(uuid) FROM public; GRANT EXECUTE ON FUNCTION public.member_quiz_questions(uuid) TO authenticated;
CREATE FUNCTION public.submit_member_quiz(p_quiz_id uuid,p_answers jsonb) RETURNS TABLE(attempt_id uuid,score integer,total integer) LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$ DECLARE n integer; correct integer; attempt uuid; BEGIN
PERFORM public.member_quiz_questions(p_quiz_id);
IF jsonb_typeof(p_answers)<>'object' THEN RAISE EXCEPTION 'Invalid answers'; END IF;
SELECT count(*)::integer,count(*) FILTER(WHERE p_answers->>id::text=correct_index::text)::integer INTO n,correct FROM public.quiz_questions WHERE quiz_id=p_quiz_id;
IF n=0 OR (SELECT count(*) FROM jsonb_object_keys(p_answers))<>n OR EXISTS(SELECT 1 FROM public.quiz_questions x WHERE x.quiz_id=p_quiz_id AND (NOT p_answers ? x.id::text OR p_answers->>x.id::text !~ '^[0-7]$' OR (p_answers->>x.id::text)::integer>=jsonb_array_length(x.choices))) THEN RAISE EXCEPTION 'Answer each question'; END IF;
INSERT INTO public.quiz_attempts(user_id,quiz_id,score,total) VALUES(auth.uid(),p_quiz_id,correct,n) RETURNING id INTO attempt; RETURN QUERY SELECT attempt,correct,n; END $$;
REVOKE ALL ON FUNCTION public.submit_member_quiz(uuid,jsonb) FROM public; GRANT EXECUTE ON FUNCTION public.submit_member_quiz(uuid,jsonb) TO authenticated;
CREATE FUNCTION public.admin_save_quiz(p_id uuid,p_course_id uuid,p_title text,p_description text,p_is_active boolean,p_questions jsonb) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$ DECLARE quiz uuid; item jsonb; pos integer=0; BEGIN
IF NOT public.has_role(auth.uid(),'admin') THEN RAISE EXCEPTION 'Admin required'; END IF;
IF jsonb_typeof(p_questions)<>'array' OR jsonb_array_length(p_questions) NOT BETWEEN 1 AND 100 THEN RAISE EXCEPTION 'Invalid questions'; END IF;
IF p_id IS NULL THEN INSERT INTO public.quizzes(course_id,title,description,is_active) VALUES(p_course_id,trim(p_title),trim(p_description),p_is_active) RETURNING id INTO quiz;
ELSE UPDATE public.quizzes SET course_id=p_course_id,title=trim(p_title),description=trim(p_description),is_active=p_is_active WHERE id=p_id RETURNING id INTO quiz; IF NOT FOUND THEN RAISE EXCEPTION 'Quiz not found'; END IF; END IF;
DELETE FROM public.quiz_questions WHERE quiz_id=quiz;
FOR item IN SELECT value FROM jsonb_array_elements(p_questions) LOOP INSERT INTO public.quiz_questions(quiz_id,prompt,choices,correct_index,position) VALUES(quiz,item->>'prompt',item->'choices',(item->>'correct_index')::smallint,pos); pos=pos+1; END LOOP; RETURN quiz; END $$;
REVOKE ALL ON FUNCTION public.admin_save_quiz(uuid,uuid,text,text,boolean,jsonb) FROM public; GRANT EXECUTE ON FUNCTION public.admin_save_quiz(uuid,uuid,text,text,boolean,jsonb) TO authenticated;
CREATE INDEX approvals_state ON public.member_approvals(status,created_at);
CREATE INDEX enrollments_user ON public.course_enrollments(user_id); CREATE INDEX enrollments_course ON public.course_enrollments(course_id);
CREATE INDEX lessons_course ON public.course_lessons(course_id,position);
CREATE INDEX quizzes_course ON public.quizzes(course_id); CREATE INDEX questions_quiz ON public.quiz_questions(quiz_id,position);
CREATE INDEX attempts_user ON public.quiz_attempts(user_id); CREATE INDEX attempts_quiz ON public.quiz_attempts(quiz_id);
CREATE INDEX support_user ON public.support_tickets(user_id); CREATE INDEX messages_ticket ON public.support_messages(ticket_id); CREATE INDEX purchase_user ON public.purchase_tickets(user_id); CREATE INDEX purchase_course ON public.purchase_tickets(course_id);
INSERT INTO public.member_profiles(user_id,first_name,email,email_verified_at,approval_status) SELECT id,'Member',coalesce(email,''),email_confirmed_at,CASE WHEN public.has_role(id,'admin') THEN 'approved'::public.member_approval_state ELSE 'pending'::public.member_approval_state END FROM auth.users;
INSERT INTO public.member_approvals(user_id,status) SELECT user_id,approval_status FROM public.member_profiles;