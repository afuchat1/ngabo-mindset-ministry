-- Expand the existing application role model and expose a guarded admin assignment RPC.
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'staff';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'support';
ALTER TYPE public.support_sender_role ADD VALUE IF NOT EXISTS 'staff';
ALTER TYPE public.support_sender_role ADD VALUE IF NOT EXISTS 'support';
