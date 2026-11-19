# Project memory

## Product intent & audience

- Web app hosted at `ghetto.finance` with a mail/login route at `/mail`
- Mail application for `@ghetto.finance` users only; inbound mail from external domains is blocked
- Includes authentication with privileged `sitemaster` account
- Starter project built on Node.js (V8 runtime) using Vite + React

## Brand personality & voice

- Not yet inferred from user-facing copy

## Visual design & UX direction

- JSX with Tailwind CSS classes (supported by template)
- Lucide React icons used for logos/icons
- React hooks available

## Decisions, constraints & rationale

- Template restricts UI packages: avoid installing extra UI themes/icon libraries unless absolutely necessary
- Authentication system uses named accounts (e.g., `sitemaster`) with password-based login; passwords verified server-side against stored account records
- Inbound mail filtering enforced at the database level (triggers/rules on mail storage): silently drops any incoming message whose sender domain is not `@ghetto.finance`; external senders do not receive a bounce
- Known internal mail addresses: `info@`, `yo@` (outbound works normally); replies from `@ghetto.finance` addresses are accepted
- Mail app has folders including Inbox and Trash; Trash retains items ~30 days and is user-emptiable
- Pre-existing external messages (22) were moved to Trash rather than hard-deleted
- Bounce/rejection at mail provider level is possible but not yet implemented; silent drop is current behavior

## Open questions & assumptions

- Whether non-sitemaster accounts or roles exist beyond the known mail addresses
- Whether additional sender domains should be allowlisted in future
- Whether a proper bounce for external senders is desired (currently silent drop)
- Full scope of the mail application beyond login, inbox, and trash is unclear
- Backend stack, database engine, and auth/mail implementation details not fully surfaced
- Domain/deployment target assumed to be `ghetto.finance`