-- DevFlow: acesso basico para app desktop sem autenticacao de utilizador.
-- Execute este ficheiro no SQL Editor do Supabase.
-- AVISO: isto abre acesso total a estas tabelas para a publishable key do projeto.
-- Use apenas se este projeto for privado e controlado por si.

grant usage on schema public to anon, authenticated;
grant all on all tables in schema public to anon, authenticated;
grant usage, select on all sequences in schema public to anon, authenticated;

alter default privileges in schema public
grant all on tables to anon, authenticated;

alter default privileges in schema public
grant usage, select on sequences to anon, authenticated;

alter table public.clientes enable row level security;
alter table public.projetos enable row level security;
alter table public.pagamentos enable row level security;
alter table public.gastos enable row level security;
alter table public.receitas enable row level security;
alter table public.investimentos enable row level security;
alter table public.aportes enable row level security;
alter table public.tempo_projeto enable row level security;
alter table public.configuracoes enable row level security;

drop policy if exists "devflow_full_access_clientes" on public.clientes;
create policy "devflow_full_access_clientes"
on public.clientes
for all
to anon, authenticated
using (true)
with check (true);

drop policy if exists "devflow_full_access_projetos" on public.projetos;
create policy "devflow_full_access_projetos"
on public.projetos
for all
to anon, authenticated
using (true)
with check (true);

drop policy if exists "devflow_full_access_pagamentos" on public.pagamentos;
create policy "devflow_full_access_pagamentos"
on public.pagamentos
for all
to anon, authenticated
using (true)
with check (true);

drop policy if exists "devflow_full_access_gastos" on public.gastos;
create policy "devflow_full_access_gastos"
on public.gastos
for all
to anon, authenticated
using (true)
with check (true);

drop policy if exists "devflow_full_access_receitas" on public.receitas;
create policy "devflow_full_access_receitas"
on public.receitas
for all
to anon, authenticated
using (true)
with check (true);

drop policy if exists "devflow_full_access_investimentos" on public.investimentos;
create policy "devflow_full_access_investimentos"
on public.investimentos
for all
to anon, authenticated
using (true)
with check (true);

drop policy if exists "devflow_full_access_aportes" on public.aportes;
create policy "devflow_full_access_aportes"
on public.aportes
for all
to anon, authenticated
using (true)
with check (true);

drop policy if exists "devflow_full_access_tempo_projeto" on public.tempo_projeto;
create policy "devflow_full_access_tempo_projeto"
on public.tempo_projeto
for all
to anon, authenticated
using (true)
with check (true);

drop policy if exists "devflow_full_access_configuracoes" on public.configuracoes;
create policy "devflow_full_access_configuracoes"
on public.configuracoes
for all
to anon, authenticated
using (true)
with check (true);
