/*
# Prepare mailboxes for future personal handles

1. Modified Tables
- `email_mailboxes`
  - `owner_id` (uuid, nullable, references profiles) - the user who owns a personal
    @ghetto.finance handle. NULL means a shared site mailbox (info@, yo@) managed by sitemasters.

2. Security
- No policy changes. Mailboxes remain sitemaster-only. Owner-based access will be added
  when personal handles are launched.

3. Notes
1. Column is nullable so existing shared mailboxes are unaffected.
2. Index added for future owner lookups.
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'email_mailboxes' AND column_name = 'owner_id'
  ) THEN
    ALTER TABLE email_mailboxes ADD COLUMN owner_id uuid REFERENCES profiles(id) ON DELETE SET NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_email_mailboxes_owner_id ON email_mailboxes(owner_id);
