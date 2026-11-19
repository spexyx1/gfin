/*
# Route inbound mail to any@ghetto.finance; block mail addressed to other domains

1. Purpose (revised behavior, replaces sender-based blocking)
- Previously inbound mail was judged by the SENDER's domain and non-ghetto.finance
  senders were dropped. That wrongly discarded mail sent TO @ghetto.finance
  addresses from outside senders.
- New rule: judge by the DELIVERED-TO address.
  - Inbound mail delivered to ANY @ghetto.finance address is accepted.
  - Inbound mail delivered to any other domain (e.g. hello@greyalpha.trading,
    which arrived because of catch-all routing) is silently dropped.

2. New Tables / Rows
- Adds one row to `email_mailboxes`: `any@ghetto.finance`
  - The dedicated catch-all inbox for all future inbound mail.
  - can_receive = true, is_catch_all = true, display_name 'Ghetto Finance'.
- Sets `info@ghetto.finance`.is_catch_all = false so new inbound mail is not
  attached to the info@ mailbox anymore (info@/yo@ remain available for sending).

3. Trigger change
- `email_messages_block_external_inbound()` (replaced):
  - direction = 'inbound' AND delivered_to domain <> 'ghetto.finance' -> drop.
  - direction = 'inbound' AND delivered_to domain = 'ghetto.finance' -> accept,
    and rewrite mailbox_id to the any@ghetto.finance mailbox so inbound lands in
    its own inbox regardless of how the receiving function picked the mailbox.
  - direction = 'outbound' -> unchanged.

4. Security
- No RLS changes. Rule is server-side on the messages table and cannot be
  bypassed from the client.

5. Notes
1. Nothing is deleted; previously trashed external mail stays in Trash.
2. Idempotent: mailbox insert is guarded, CREATE OR REPLACE FUNCTION, DROP
   TRIGGER IF EXISTS before CREATE.
*/

INSERT INTO public.email_mailboxes (address, display_name, is_catch_all, can_receive, active)
SELECT 'any@ghetto.finance', 'Ghetto Finance', true, true, true
WHERE NOT EXISTS (
  SELECT 1 FROM public.email_mailboxes WHERE address = 'any@ghetto.finance'
);

UPDATE public.email_mailboxes
SET is_catch_all = false, updated_at = now()
WHERE address = 'info@ghetto.finance' AND is_catch_all = true;

CREATE OR REPLACE FUNCTION public.email_messages_block_external_inbound()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'pg_catalog', 'public'
AS $function$
DECLARE
  delivered_domain text;
  catchall_mailbox uuid;
BEGIN
  IF NEW.direction <> 'inbound' THEN
    RETURN NEW;
  END IF;

  delivered_domain := lower(split_part(coalesce(NEW.delivered_to, ''), '@', 2));

  IF delivered_domain <> 'ghetto.finance' THEN
    RETURN NULL;
  END IF;

  SELECT id INTO catchall_mailbox
  FROM public.email_mailboxes
  WHERE address = 'any@ghetto.finance' AND active
  LIMIT 1;

  IF catchall_mailbox IS NOT NULL THEN
    NEW.mailbox_id := catchall_mailbox;
  END IF;

  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS email_messages_external_sender_block ON public.email_messages;

CREATE TRIGGER email_messages_external_sender_block
BEFORE INSERT ON public.email_messages
FOR EACH ROW
EXECUTE FUNCTION public.email_messages_block_external_inbound();
