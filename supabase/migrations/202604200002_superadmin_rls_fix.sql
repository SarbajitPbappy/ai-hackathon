-- Migration: Fix super_admin visibility for admin panel pages

-- 1. Drop the existing overly-restrictive users select policy
-- and replace it with one that allows super_admin to see all users.
drop policy if exists "users_select_own" on public.users;

create policy "users_select_own_or_admin"
  on public.users
  for select
  to authenticated
  using (
    id = auth.uid()
    or public.current_user_role() = 'super_admin'
    or public.current_user_role() = 'organizer'
  );

-- 2. Allow super_admin to update any user's role (needed for admin panel)
create policy "users_update_admin"
  on public.users
  for update
  to authenticated
  using (public.current_user_role() = 'super_admin')
  with check (public.current_user_role() = 'super_admin');
