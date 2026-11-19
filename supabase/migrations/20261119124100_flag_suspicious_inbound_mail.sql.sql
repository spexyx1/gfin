/*
# Flag suspicious inbound mail

1. Purpose
- Automatically flag inbound emails that show common phishing / scam patterns so
  the mail app can warn the sitemaster before they interact with the message.

2. Modified Tables
- `email_messages`:
  - `is_suspicious` (boolean, not null, default false): true when at least one
    suspicion reason matched.
  - `suspicion_reasons` (text array, not null, default empty): human-readable
    reasons, e.g. 'Reply-To address differs from the sender address'.

3. New Functions
- `email_suspicion_reasons(p_from_address, p_from_name, p_reply_to, p_subject, p_body)`
  returns text[]: pure helper that evaluates the heuristics:
  - Reply-To domain differs from the sender's domain (classic phishing redirect).
  - Subject or body matches common phishing patterns (account verification,
    suspended accounts, seed / recovery phrases, gift cards, wire transfers,
    urgent payment demands, crypto investment pitches).
  - Display name appears to impersonate ghetto.finance or staff roles while the
    actual sender domain is not ghetto.finance.
- Trigger `email_messages_flag_suspicious` (BEFORE INSERT): evaluates the helper
  for inbound rows only and fills the two new columns. Outbound mail is never
  flagged.

4. Backfill
- All existing inbound rows are re-scored once with the same helper so old
  messages get flags too.

5. Security
- Columns are filled server-side by the trigger; clients only read them.
- No RLS changes; SELECT is already gated to the sitemaster.
- No destructive operations; nothing is deleted or moved.
*/

CREATE OR REPLACE FUNCTION public.email_suspicion_reasons(
  p_from_address text,
  p_from_name text,
  p_reply_to text,
  p_subject text,
  p_body text
)
RETURNS text[]
LANGUAGE plpgsql
IMMUTABLE
SET search_path TO 'pg_catalog', 'public'
AS $function$
DECLARE
  reasons text[] := '{}';
  from_domain text := lower(split_part(coalesce(p_from_address, ''), '@', 2));
  reply_domain text;
  subj text := lower(coalesce(p_subject, ''));
  body text := lower(coalesce(p_body, ''));
BEGIN
  IF coalesce(p_reply_to, '') <> '' THEN
    reply_domain := lower(split_part(p_reply_to, '@', 2));
    IF reply_domain IS DISTINCT FROM from_domain AND position('.' in reply_domain) > 0 THEN
      reasons := reasons || 'Reply-To address differs from the sender address'::text;
    END IF;
  END IF;

  IF subj ~ '(verify your account|confirm your identity|account.{0,12}(suspended|locked|disabled|on hold)|unusual (sign|login)|security alert|seed phrase|recovery phrase|wire transfer|gift card|lottery|prize|inheritance|urgent action|immediate (action|payment)|crypto investment|double your)' THEN
    reasons := reasons || 'Subject matches common phishing patterns'::text;
  END IF;

  IF body ~ '(seed phrase|recovery phrase|private key|gift card|wire transfer|western union|verify your account|confirm your identity|login to your account|log in to your account|click the link below to (verify|confirm|unlock|restore)|your account (will be|has been) (suspended|locked|closed)|act now|limited time only)' THEN
    reasons := reasons || 'Message body matches common phishing patterns'::text;
  END IF;

  IF from_domain <> 'ghetto.finance'
     AND coalesce(p_from_name, '') ~* '(ghetto\.?finance|sitemaster|security team|account (support|services)|admin)' THEN
    reasons := reasons || 'Sender name may be impersonating ghetto.finance'::text;
  END IF;

  RETURN reasons;
END;
$function$;

CREATE OR REPLACE FUNCTION public.email_messages_flag_suspicious()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'pg_catalog', 'public'
AS $function$
BEGIN
  IF NEW.direction = 'inbound' THEN
    NEW.suspicion_reasons := public.email_suspicion_reasons(
      NEW.from_address, NEW.from_name, NEW.reply_to, NEW.subject,
      coalesce(NEW.body_text, '') || ' ' || coalesce(NEW.body_html, '')
    );
    NEW.is_suspicious := array_length(NEW.suspicion_reasons, 1) IS NOT NULL;
  END IF;
  RETURN NEW;
END;
$function$;

ALTER TABLE public.email_messages ADD COLUMN IF NOT EXISTS is_suspicious boolean NOT NULL DEFAULT false;
ALTER TABLE public.email_messages ADD COLUMN IF NOT EXISTS suspicion_reasons text[] NOT NULL DEFAULT '{}';

DROP TRIGGER IF EXISTS email_messages_flag_suspicious ON public.email_messages;
CREATE TRIGGER email_messages_flag_suspicious
BEFORE INSERT ON public.email_messages
FOR EACH ROW EXECUTE FUNCTION public.email_messages_flag_suspicious();

UPDATE public.email_messages m
SET suspicion_reasons = r.reasons,
    is_suspicious = array_length(r.reasons, 1) IS NOT NULL
FROM (
  SELECT id,
         public.email_suspicion_reasons(from_address, from_name, reply_to, subject,
           coalesce(body_text, '') || ' ' || coalesce(body_html, '')) AS reasons
  FROM public.email_messages
  WHERE direction = 'inbound'
) r
WHERE m.id = r.id;
