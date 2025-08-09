insert into public.user_roles (user_id, role)
values ('fab0adc6-6274-40e8-ba9d-b25a651c117e', 'admin')
on conflict (user_id, role) do nothing;