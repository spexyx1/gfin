# Project memory

## Product intent & audience

- Web app hosted at `ghetto.finance` with a mail/login route at `/mail`
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
- Authentication system uses named accounts (e.g., `sitemaster`) with password-based login
- Passwords are managed/verified server-side against stored account records

## Open questions & assumptions

- Full scope of the mail application beyond login is unclear
- Whether there are non-sitemaster accounts or roles is unknown
- Backend stack and auth implementation details not yet surfaced
- Domain/deployment target assumed to be `ghetto.finance`