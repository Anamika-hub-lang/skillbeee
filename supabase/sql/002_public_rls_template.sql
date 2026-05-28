-- Templates: enable RLS on Prisma-created tables when you expose them to PostgREST/Edge.
-- Policies depend on your auth model — edit before running.

-- alter table profiles enable row level security;
-- alter table gigs enable row level security;
-- alter table gig_skills enable row level security;
-- alter table gig_matches enable row level security;
-- alter table chat_messages enable row level security;
-- alter table notifications enable row level security;

-- Example (unsafe for production): public read on open gigs
-- create policy "gigs_select_open" on gigs for select using (status = 'open');
