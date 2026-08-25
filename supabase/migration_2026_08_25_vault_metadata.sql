-- Vault metadata for secure, user-owned document records.
create table if not exists public.documents_vault (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  document_type text not null default 'CNI',
  document_name text not null,
  file_url text not null,
  file_size bigint,
  mime_type text,
  tags text[] not null default '{}',
  description text not null default '',
  metadata jsonb not null default '{}'::jsonb,
  is_verified boolean not null default false,
  verified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.declarations
  add column if not exists vault_document_id uuid references public.documents_vault(id) on delete set null;

create index if not exists idx_documents_vault_user_type
  on public.documents_vault (user_id, document_type, created_at desc);

grant select, insert, update, delete on public.documents_vault to authenticated;
alter table public.documents_vault enable row level security;

drop policy if exists "vault lisible par le proprietaire" on public.documents_vault;
create policy "vault lisible par le proprietaire" on public.documents_vault
  for select to authenticated using (auth.uid() = user_id);
drop policy if exists "vault creable par le proprietaire" on public.documents_vault;
create policy "vault creable par le proprietaire" on public.documents_vault
  for insert to authenticated with check (auth.uid() = user_id);
drop policy if exists "vault modifiable par le proprietaire" on public.documents_vault;
create policy "vault modifiable par le proprietaire" on public.documents_vault
  for update to authenticated using (auth.uid() = user_id);
drop policy if exists "vault supprimable par le proprietaire" on public.documents_vault;
create policy "vault supprimable par le proprietaire" on public.documents_vault
  for delete to authenticated using (auth.uid() = user_id);

alter table storage.objects enable row level security;
drop policy if exists "documents vault upload proprietaire" on storage.objects;
create policy "documents vault upload proprietaire" on storage.objects
  for insert to authenticated with check (bucket_id = 'documents' and (storage.foldername(name))[1] = 'vault' and (storage.foldername(name))[2] = auth.uid()::text);
drop policy if exists "documents vault lecture proprietaire" on storage.objects;
create policy "documents vault lecture proprietaire" on storage.objects
  for select to authenticated using (bucket_id = 'documents' and (storage.foldername(name))[1] = 'vault' and (storage.foldername(name))[2] = auth.uid()::text);
drop policy if exists "documents vault suppression proprietaire" on storage.objects;
create policy "documents vault suppression proprietaire" on storage.objects
  for delete to authenticated using (bucket_id = 'documents' and (storage.foldername(name))[1] = 'vault' and (storage.foldername(name))[2] = auth.uid()::text);