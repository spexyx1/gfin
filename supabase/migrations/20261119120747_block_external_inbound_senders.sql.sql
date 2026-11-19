/*
# Block inbound mail from non-ghetto.finance senders

1. Purpose
- The mail system's catch-all inbox has been receiving marketing and spam mail
  from outside senders (e.g. hello@greyalpha.trading routed mail, Apollo
  marketing, Stripe receipts). The user wants ONLY mail originating from
  @ghetto.finance addresses to be accepted as inbound.

2. Changes
- New function `email_messages_block_external_inbound()` (plpgsql): returns a
  trigger that silently drops (skips) any INSERT into `email_messages` where
  direction = 'inbound' and from_address is not a @ghetto.finance address.
  Outbound mail and mail from @ghetto.finance senders pass through unchanged.
- New trigger `email_messages_external_sender_block` on `email_messages`,
  BEFORE INSERT, for each row.

3. Security
- No RLS changes. This is a server-side data rule; it cannot be bypassed by
  the client, because all inbound mail writes land in this table.

4. Notes
1. Blocking is silent: the sender gets no bounce from our side.
2. Existing junk rows already in the database are handled separately
   (moved to trash), not by this trigger.
3. Idempotent: CREATE OR REPLACE FUNCTION + DROP TRIGGER IF EXISTS.
*/

CREATE OR REPLACE FUNCTION public.email_messages_block_external_inbound()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'pg_catalog', 'public'
AS $function$
BEGIN
  IF NEW.direction = 'inbound'
     AND lower(split_part(NEW.from_address, '@', 2)) <> 'ghetto.finance' THEN
    RETURN NULL;
  END IF;
  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS email_messages_external_sender_block ON public.email_messages;

CREATE TRIGGER email_messages_external_sender_block
BEFORE INSERT ON public.email_messages
FOR EACH ROW
EXECUTE FUNCTION public.email_messages_block_external_inbound();
