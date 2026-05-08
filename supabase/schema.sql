create extension if not exists pgcrypto;

drop index if exists public.treinos_usuario_data_idx;
drop index if exists public.peso_usuario_data_idx;
drop index if exists public.metas_usuario_exercicio_idx;
drop index if exists public.dieta_usuario_data_idx;
drop index if exists public.treino_semana_usuario_dia_idx;
drop index if exists public.treino_semana_usuario_dia_uidx;
drop index if exists public.exercicios_nome_grupo_criador_uidx;

create table if not exists public.treinos (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null,
  sessao_id uuid null,
  nome_treino text null,
  exercicio text not null,
  grupo text null,
  categoria text null,
  series integer null,
  carga numeric not null,
  repeticoes integer not null,
  observacao text null,
  duracao_segundos integer null,
  data date not null default current_date,
  created_at timestamptz not null default now()
);

alter table public.treinos
add column if not exists sessao_id uuid null;

alter table public.treinos
add column if not exists nome_treino text null;

alter table public.treinos
add column if not exists grupo text null;

alter table public.treinos
add column if not exists categoria text null;

alter table public.treinos
add column if not exists series integer null;

alter table public.treinos
add column if not exists observacao text null;

alter table public.treinos
add column if not exists duracao_segundos integer null;

alter table public.treinos
add column if not exists created_at timestamptz not null default now();

update public.treinos
set series = 10
where series is not null
  and series > 10;

update public.treinos
set series = 1
where series is not null
  and series < 1;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'treinos_series_range_check'
      and conrelid = 'public.treinos'::regclass
  ) then
    alter table public.treinos
    add constraint treinos_series_range_check
    check (series is null or (series >= 1 and series <= 10));
  end if;
end $$;

create table if not exists public.peso (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null,
  peso numeric not null,
  data date not null default current_date,
  created_at timestamptz not null default now()
);

alter table public.peso
add column if not exists created_at timestamptz not null default now();

create table if not exists public.metas (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null,
  exercicio text not null,
  meta_carga numeric not null,
  meta_repeticoes integer null,
  concluida boolean not null default false,
  concluida_em timestamptz null,
  created_at timestamptz not null default now()
);

alter table public.metas
add column if not exists meta_repeticoes integer null;

alter table public.metas
add column if not exists concluida boolean not null default false;

alter table public.metas
add column if not exists concluida_em timestamptz null;

alter table public.metas
add column if not exists created_at timestamptz not null default now();

create table if not exists public.dieta (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null,
  refeicao text not null default 'Refeição livre',
  descricao text null,
  calorias integer not null,
  proteina integer not null,
  data date not null default current_date,
  created_at timestamptz not null default now()
);

alter table public.dieta
add column if not exists created_at timestamptz not null default now();

alter table public.dieta
add column if not exists refeicao text not null default 'Refeição livre';

alter table public.dieta
add column if not exists descricao text null;

create table if not exists public.treino_semana (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null,
  dia_semana text not null,
  nome_treino text not null,
  exercicios jsonb not null default '[]'::jsonb,
  status text not null default 'agendado',
  concluido_em timestamptz null,
  created_at timestamptz not null default now()
);

alter table public.treino_semana
add column if not exists created_at timestamptz not null default now();

alter table public.treino_semana
add column if not exists status text not null default 'agendado';

alter table public.treino_semana
add column if not exists concluido_em timestamptz null;

create table if not exists public.exercicios (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  grupo text not null,
  categoria text not null,
  criado_por uuid null,
  created_at timestamptz not null default now()
);

alter table public.exercicios
add column if not exists created_at timestamptz not null default now();

create table if not exists public.favoritos_exercicios (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null,
  exercicio_id uuid not null references public.exercicios(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (usuario_id, exercicio_id)
);

alter table public.favoritos_exercicios
add column if not exists created_at timestamptz not null default now();

create index if not exists treinos_usuario_data_idx
on public.treinos (usuario_id, data desc, created_at desc);

create index if not exists peso_usuario_data_idx
on public.peso (usuario_id, data desc);

create index if not exists metas_usuario_exercicio_idx
on public.metas (usuario_id, exercicio);

create index if not exists dieta_usuario_data_idx
on public.dieta (usuario_id, data desc);

delete from public.treino_semana base
using (
  select id
  from (
    select
      id,
      row_number() over (
        partition by usuario_id, lower(dia_semana)
        order by created_at desc, id desc
      ) as row_number
    from public.treino_semana
  ) ranked
  where ranked.row_number > 1
) duplicates
where base.id = duplicates.id;

create unique index if not exists treino_semana_usuario_dia_uidx
on public.treino_semana (usuario_id, lower(dia_semana));

create unique index if not exists exercicios_nome_grupo_criador_uidx
on public.exercicios (
  lower(nome),
  grupo,
  coalesce(criado_por, '00000000-0000-0000-0000-000000000000'::uuid)
);

alter table public.treinos enable row level security;
alter table public.peso enable row level security;
alter table public.metas enable row level security;
alter table public.dieta enable row level security;
alter table public.treino_semana enable row level security;
alter table public.exercicios enable row level security;
alter table public.favoritos_exercicios enable row level security;

grant usage on schema public to authenticated;
grant select, insert, update, delete on table public.treinos to authenticated;
grant select, insert, update, delete on table public.peso to authenticated;
grant select, insert, update, delete on table public.metas to authenticated;
grant select, insert, update, delete on table public.dieta to authenticated;
grant select, insert, update, delete on table public.treino_semana to authenticated;
grant select, insert, update, delete on table public.exercicios to authenticated;
grant select, insert, delete on table public.favoritos_exercicios to authenticated;

drop policy if exists "Usuarios podem listar seus treinos" on public.treinos;
drop policy if exists "Usuarios podem criar seus treinos" on public.treinos;
drop policy if exists "Usuarios podem atualizar seus treinos" on public.treinos;
drop policy if exists "Usuarios podem deletar seus treinos" on public.treinos;

create policy "Usuarios podem listar seus treinos"
on public.treinos for select to authenticated
using (usuario_id = auth.uid());

create policy "Usuarios podem criar seus treinos"
on public.treinos for insert to authenticated
with check (usuario_id = auth.uid());

create policy "Usuarios podem atualizar seus treinos"
on public.treinos for update to authenticated
using (usuario_id = auth.uid())
with check (usuario_id = auth.uid());

create policy "Usuarios podem deletar seus treinos"
on public.treinos for delete to authenticated
using (usuario_id = auth.uid());

drop policy if exists "Usuarios podem listar seus pesos" on public.peso;
drop policy if exists "Usuarios podem criar seus pesos" on public.peso;
drop policy if exists "Usuarios podem atualizar seus pesos" on public.peso;
drop policy if exists "Usuarios podem deletar seus pesos" on public.peso;

create policy "Usuarios podem listar seus pesos"
on public.peso for select to authenticated
using (usuario_id = auth.uid());

create policy "Usuarios podem criar seus pesos"
on public.peso for insert to authenticated
with check (usuario_id = auth.uid());

create policy "Usuarios podem atualizar seus pesos"
on public.peso for update to authenticated
using (usuario_id = auth.uid())
with check (usuario_id = auth.uid());

create policy "Usuarios podem deletar seus pesos"
on public.peso for delete to authenticated
using (usuario_id = auth.uid());

drop policy if exists "Usuarios podem listar suas metas" on public.metas;
drop policy if exists "Usuarios podem criar suas metas" on public.metas;
drop policy if exists "Usuarios podem atualizar suas metas" on public.metas;
drop policy if exists "Usuarios podem deletar suas metas" on public.metas;

create policy "Usuarios podem listar suas metas"
on public.metas for select to authenticated
using (usuario_id = auth.uid());

create policy "Usuarios podem criar suas metas"
on public.metas for insert to authenticated
with check (usuario_id = auth.uid());

create policy "Usuarios podem atualizar suas metas"
on public.metas for update to authenticated
using (usuario_id = auth.uid())
with check (usuario_id = auth.uid());

create policy "Usuarios podem deletar suas metas"
on public.metas for delete to authenticated
using (usuario_id = auth.uid());

drop policy if exists "Usuarios podem listar sua dieta" on public.dieta;
drop policy if exists "Usuarios podem criar sua dieta" on public.dieta;
drop policy if exists "Usuarios podem atualizar sua dieta" on public.dieta;
drop policy if exists "Usuarios podem deletar sua dieta" on public.dieta;

create policy "Usuarios podem listar sua dieta"
on public.dieta for select to authenticated
using (usuario_id = auth.uid());

create policy "Usuarios podem criar sua dieta"
on public.dieta for insert to authenticated
with check (usuario_id = auth.uid());

create policy "Usuarios podem atualizar sua dieta"
on public.dieta for update to authenticated
using (usuario_id = auth.uid())
with check (usuario_id = auth.uid());

create policy "Usuarios podem deletar sua dieta"
on public.dieta for delete to authenticated
using (usuario_id = auth.uid());

drop policy if exists "Usuarios podem listar seus treinos semanais" on public.treino_semana;
drop policy if exists "Usuarios podem criar seus treinos semanais" on public.treino_semana;
drop policy if exists "Usuarios podem atualizar seus treinos semanais" on public.treino_semana;
drop policy if exists "Usuarios podem deletar seus treinos semanais" on public.treino_semana;

create policy "Usuarios podem listar seus treinos semanais"
on public.treino_semana for select to authenticated
using (usuario_id = auth.uid());

create policy "Usuarios podem criar seus treinos semanais"
on public.treino_semana for insert to authenticated
with check (usuario_id = auth.uid());

create policy "Usuarios podem atualizar seus treinos semanais"
on public.treino_semana for update to authenticated
using (usuario_id = auth.uid())
with check (usuario_id = auth.uid());

create policy "Usuarios podem deletar seus treinos semanais"
on public.treino_semana for delete to authenticated
using (usuario_id = auth.uid());

drop policy if exists "Usuarios podem listar exercicios disponiveis" on public.exercicios;
drop policy if exists "Usuarios podem criar exercicios proprios" on public.exercicios;
drop policy if exists "Usuarios podem atualizar exercicios proprios" on public.exercicios;
drop policy if exists "Usuarios podem deletar exercicios proprios" on public.exercicios;

create policy "Usuarios podem listar exercicios disponiveis"
on public.exercicios for select to authenticated
using (criado_por is null or criado_por = auth.uid());

create policy "Usuarios podem criar exercicios proprios"
on public.exercicios for insert to authenticated
with check (criado_por = auth.uid());

create policy "Usuarios podem atualizar exercicios proprios"
on public.exercicios for update to authenticated
using (criado_por = auth.uid())
with check (criado_por = auth.uid());

create policy "Usuarios podem deletar exercicios proprios"
on public.exercicios for delete to authenticated
using (criado_por = auth.uid());

drop policy if exists "Usuarios podem listar seus favoritos" on public.favoritos_exercicios;
drop policy if exists "Usuarios podem criar seus favoritos" on public.favoritos_exercicios;
drop policy if exists "Usuarios podem deletar seus favoritos" on public.favoritos_exercicios;

create policy "Usuarios podem listar seus favoritos"
on public.favoritos_exercicios for select to authenticated
using (usuario_id = auth.uid());

create policy "Usuarios podem criar seus favoritos"
on public.favoritos_exercicios for insert to authenticated
with check (usuario_id = auth.uid());

create policy "Usuarios podem deletar seus favoritos"
on public.favoritos_exercicios for delete to authenticated
using (usuario_id = auth.uid());

insert into public.exercicios (nome, grupo, categoria, criado_por)
values
  ('Supino reto', 'Peito', 'halter', null),
  ('Supino inclinado', 'Peito', 'halter', null),
  ('Supino declinado', 'Peito', 'halter', null),
  ('Crucifixo reto', 'Peito', 'halter', null),
  ('Crucifixo inclinado', 'Peito', 'halter', null),
  ('Crucifixo máquina', 'Peito', 'máquina', null),
  ('Crossover polia', 'Peito', 'máquina', null),
  ('Peck deck', 'Peito', 'máquina', null),
  ('Flexão de braço', 'Peito', 'peso corporal', null),
  ('Flexão inclinada', 'Peito', 'peso corporal', null),
  ('Puxada frente', 'Costas', 'máquina', null),
  ('Puxada atrás', 'Costas', 'máquina', null),
  ('Remada curvada', 'Costas', 'halter', null),
  ('Remada unilateral', 'Costas', 'halter', null),
  ('Remada baixa', 'Costas', 'máquina', null),
  ('Remada cavalinho', 'Costas', 'halter', null),
  ('Pulldown', 'Costas', 'máquina', null),
  ('Pull up', 'Costas', 'peso corporal', null),
  ('Chin up', 'Costas', 'peso corporal', null),
  ('Pullover', 'Costas', 'halter', null),
  ('Agachamento livre', 'Perna', 'halter', null),
  ('Agachamento guiado', 'Perna', 'máquina', null),
  ('Leg press', 'Perna', 'máquina', null),
  ('Cadeira extensora', 'Perna', 'máquina', null),
  ('Mesa flexora', 'Perna', 'máquina', null),
  ('Afundo', 'Perna', 'halter', null),
  ('Passada', 'Perna', 'halter', null),
  ('Hack machine', 'Perna', 'máquina', null),
  ('Agachamento sumô', 'Perna', 'halter', null),
  ('Step up', 'Perna', 'peso corporal', null),
  ('Stiff', 'Posterior', 'halter', null),
  ('Levantamento terra', 'Posterior', 'halter', null),
  ('Mesa flexora unilateral', 'Posterior', 'máquina', null),
  ('Glute bridge', 'Posterior', 'peso corporal', null),
  ('Hip thrust', 'Posterior', 'halter', null),
  ('Good morning', 'Posterior', 'halter', null),
  ('Deadlift romeno', 'Posterior', 'halter', null),
  ('Pull through', 'Posterior', 'máquina', null),
  ('Elevação de quadril', 'Glúteo', 'halter', null),
  ('Coice no cabo', 'Glúteo', 'máquina', null),
  ('Abdução máquina', 'Glúteo', 'máquina', null),
  ('Agachamento búlgaro', 'Glúteo', 'halter', null),
  ('Kickback', 'Glúteo', 'máquina', null),
  ('Desenvolvimento halter', 'Ombro', 'halter', null),
  ('Desenvolvimento barra', 'Ombro', 'halter', null),
  ('Elevação lateral', 'Ombro', 'halter', null),
  ('Elevação frontal', 'Ombro', 'halter', null),
  ('Crucifixo inverso', 'Ombro', 'halter', null),
  ('Face pull', 'Ombro', 'máquina', null),
  ('Arnold press', 'Ombro', 'halter', null),
  ('Elevação lateral cabo', 'Ombro', 'máquina', null),
  ('Rosca direta', 'Bíceps', 'halter', null),
  ('Rosca alternada', 'Bíceps', 'halter', null),
  ('Rosca martelo', 'Bíceps', 'halter', null),
  ('Rosca concentrada', 'Bíceps', 'halter', null),
  ('Rosca banco scott', 'Bíceps', 'máquina', null),
  ('Rosca 21', 'Bíceps', 'halter', null),
  ('Rosca inversa', 'Bíceps', 'halter', null),
  ('Tríceps pulley', 'Tríceps', 'máquina', null),
  ('Tríceps testa', 'Tríceps', 'halter', null),
  ('Tríceps francês', 'Tríceps', 'halter', null),
  ('Tríceps corda', 'Tríceps', 'máquina', null),
  ('Mergulho', 'Tríceps', 'peso corporal', null),
  ('Tríceps banco', 'Tríceps', 'peso corporal', null),
  ('Kickback tríceps', 'Tríceps', 'halter', null),
  ('Abdominal reto', 'Abdômen', 'peso corporal', null),
  ('Abdominal infra', 'Abdômen', 'peso corporal', null),
  ('Abdominal oblíquo', 'Abdômen', 'peso corporal', null),
  ('Prancha', 'Abdômen', 'peso corporal', null),
  ('Prancha lateral', 'Abdômen', 'peso corporal', null),
  ('Crunch', 'Abdômen', 'peso corporal', null),
  ('Bicicleta no ar', 'Abdômen', 'peso corporal', null),
  ('Panturrilha em pé', 'Panturrilha', 'máquina', null),
  ('Panturrilha sentado', 'Panturrilha', 'máquina', null),
  ('Panturrilha leg press', 'Panturrilha', 'máquina', null),
  ('Panturrilha unilateral', 'Panturrilha', 'peso corporal', null),
  ('Esteira corrida', 'Cardio', 'máquina', null),
  ('Caminhada', 'Cardio', 'peso corporal', null),
  ('Bicicleta', 'Cardio', 'máquina', null),
  ('Elíptico', 'Cardio', 'máquina', null),
  ('Pular corda', 'Cardio', 'peso corporal', null),
  ('Escada', 'Cardio', 'máquina', null),
  ('HIIT', 'Cardio', 'peso corporal', null),
  ('Burpee', 'Funcional', 'peso corporal', null),
  ('Mountain climber', 'Funcional', 'peso corporal', null),
  ('Kettlebell swing', 'Funcional', 'halter', null),
  ('Box jump', 'Funcional', 'peso corporal', null),
  ('Battle rope', 'Funcional', 'máquina', null),
  ('Farmer walk', 'Funcional', 'halter', null),
  ('Clean', 'Avançado', 'halter', null),
  ('Snatch', 'Avançado', 'halter', null),
  ('Thruster', 'Avançado', 'halter', null),
  ('Deadlift sumô', 'Avançado', 'halter', null),
  ('Overhead squat', 'Avançado', 'halter', null),
  ('Front squat', 'Avançado', 'halter', null)
on conflict do nothing;
