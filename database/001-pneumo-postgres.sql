-- Banco compartilhado para o app de consumo pneumático (Supabase PostgreSQL).
-- Execute no SQL Editor do Supabase. O upsert atualiza o cadastro base sem apagar
-- projetos nem outros dados existentes.

create table if not exists public.pneumo_catalogos (
  id text primary key,
  dados jsonb not null,
  atualizado_em timestamptz not null default now()
);

create table if not exists public.pneumo_projetos (
  id text primary key,
  dados jsonb not null,
  atualizado_em timestamptz not null default now()
);

create index if not exists pneumo_projetos_atualizado_em_idx
  on public.pneumo_projetos (atualizado_em desc);

-- Faz merge por código ERP (ou id quando não há ERP), preservando cadastros
-- adicionais que já existam no banco e substituindo somente itens coincidentes.
create or replace function public.pneumo_merge_catalog_array(atual jsonb, base jsonb)
returns jsonb
language sql
immutable
as $$
  select coalesce(jsonb_agg(item order by chave), '[]'::jsonb)
  from (
    select distinct on (coalesce(nullif(item->>'erp', ''), item->>'id'))
      item,
      coalesce(nullif(item->>'erp', ''), item->>'id') as chave
    from (
      select value as item, 0 as origem
      from jsonb_array_elements(coalesce(atual, '[]'::jsonb))
      union all
      select value as item, 1 as origem
      from jsonb_array_elements(coalesce(base, '[]'::jsonb))
    ) itens
    order by coalesce(nullif(item->>'erp', ''), item->>'id'), origem desc
  ) unicos
$$;

insert into public.pneumo_catalogos (id, dados, atualizado_em)
values ('principal', '{"cilindros":[{"id":"c1","nome":"CILINDRO LIMITADOR TUBETE","diam":20,"curso":50,"rosca":"1/8","acao":"Dupla ação","erp":"","erpdesc":"","obs":"","tipoHaste":"Simples","diamHaste":""},{"id":"c2","nome":"EMPURADOR TECIDO","diam":50,"curso":700,"rosca":"1/4","acao":"Dupla ação","erp":"","erpdesc":"","obs":"","tipoHaste":"Simples","diamHaste":""},{"id":"c3","nome":"APLICADOR DE FITA","diam":32,"curso":320,"rosca":"1/8","acao":"Dupla ação","erp":"","erpdesc":"","obs":"","tipoHaste":"Simples","diamHaste":""},{"id":"c4","nome":"CORTADOR DE FITAS","diam":20,"curso":40,"rosca":"1/8","acao":"Dupla ação","erp":"","erpdesc":"","obs":"","tipoHaste":"Simples","diamHaste":""},{"id":"c5","nome":"EXPULSA ROLO DO APLICADOR DE FITAS","diam":63,"curso":160,"rosca":"3/8","acao":"Dupla ação","erp":"","erpdesc":"","obs":"","tipoHaste":"Simples","diamHaste":""},{"id":"c6","nome":"PEGADOR DE TUBETE VERTICAL","diam":32,"curso":500,"rosca":"1/8","acao":"Dupla ação","erp":"","erpdesc":"","obs":"","tipoHaste":"Simples","diamHaste":""},{"id":"c7","nome":"PEGADOR DE TUBETE HORIZONTAL","diam":20,"curso":120,"rosca":"1/8","acao":"Dupla ação","erp":"","erpdesc":"","obs":"","tipoHaste":"Simples","diamHaste":""},{"id":"c8","nome":"PEGADOR DE TUBETE LATERAL","diam":20,"curso":50,"rosca":"1/8","acao":"Dupla ação","erp":"","erpdesc":"","obs":"","tipoHaste":"Simples","diamHaste":""},{"id":"c9","nome":"JOGO DE TECIDO","diam":32,"curso":80,"rosca":"1/8","acao":"Dupla ação","erp":"","erpdesc":"","obs":"","tipoHaste":"Simples","diamHaste":""},{"id":"c10","nome":"JOGO DE TUBETE AO BOBINADOR","diam":32,"curso":80,"rosca":"1/8","acao":"Dupla ação","erp":"","erpdesc":"","obs":"","tipoHaste":"Simples","diamHaste":""},{"id":"c11","nome":"BATENTE DA BALANÇA","diam":50,"curso":50,"rosca":"1/4","acao":"Dupla ação","erp":"","erpdesc":"","obs":"","tipoHaste":"Simples","diamHaste":""},{"id":"c12","nome":"TOMBADOR DA BALANÇA","diam":50,"curso":200,"rosca":"1/4","acao":"Dupla ação","erp":"","erpdesc":"","obs":"","tipoHaste":"Simples","diamHaste":""},{"id":"c13","nome":"CP96SDB63-100C","diam":63,"curso":100,"rosca":"3/8","acao":"Dupla ação","erp":"2.000001054","erpdesc":"CIL PNEUM. ISO15552 Ø63 C100 D.ACAO C/MAG","obs":"","tipoHaste":"Simples","diamHaste":20},{"id":"c14","nome":"CP96SDB63-125C","diam":63,"curso":125,"rosca":"3/8","acao":"Dupla ação","erp":"2.000000173","erpdesc":"CIL PNEUM. ISO15552 Ø63 C125 D.ACAO C/MAG","obs":"","tipoHaste":"Simples","diamHaste":20},{"id":"c15","nome":"CP96SDB32-100C","diam":32,"curso":100,"rosca":"1/8","acao":"Dupla ação","erp":"2.000004870","erpdesc":"CIL PNEUM. ISO15552 Ø32 C100 D.ACAO C/MAG","obs":"","tipoHaste":"Simples","diamHaste":12},{"id":"c16","nome":"CP96SDB50-900C*BR","diam":50,"curso":900,"rosca":"1/4","acao":"Dupla ação","erp":"2.000004300","erpdesc":"CIL PNEUM. ISO15552 Ø50 C900 D.ACAO C/MAG","obs":"","tipoHaste":"Simples","diamHaste":20},{"id":"c17","nome":"CD85N25-75C-B","diam":25,"curso":75,"rosca":"1/8","acao":"Dupla ação","erp":"2.000000773","erpdesc":"CIL PNEUM. ISO6432 Ø25 C75 D.ACAO C/MAG","obs":"","tipoHaste":"Simples","diamHaste":10},{"id":"c18","nome":"CP96SDB63-250C","diam":63,"curso":250,"rosca":"3/8","acao":"Dupla ação","erp":"2.000000161","erpdesc":"CIL PNEUM. ISO15552 Ø63 C250 D.ACAO C/MAG","obs":"","tipoHaste":"Simples","diamHaste":20},{"id":"c19","nome":"CP96SDB63-160C","diam":63,"curso":160,"rosca":"3/8","acao":"Dupla ação","erp":"2.000000163","erpdesc":"CIL PNEUM. ISO15552 Ø63 C160 D.ACAO C/MAG","obs":"","tipoHaste":"Simples","diamHaste":20},{"id":"c20","nome":"CP96SDB32-160C","diam":32,"curso":160,"rosca":"1/8","acao":"Dupla ação","erp":"2.000000032","erpdesc":"CIL PNEUM. ISO15552 Ø32 C160 D.ACAO C/MAG","obs":"","tipoHaste":"Simples","diamHaste":12},{"id":"c21","nome":"CP96SDB40-1300C","diam":40,"curso":1300,"rosca":"1/4","acao":"Dupla ação","erp":"2.000005091","erpdesc":"CIL PNEUM. ISO15552 Ø40 C1300 D.ACAO C/MAG","obs":"","tipoHaste":"Simples","diamHaste":16},{"id":"c22","nome":"CP96SDB50-50C","diam":50,"curso":50,"rosca":"1/4","acao":"Dupla ação","erp":"2.000000306","erpdesc":"CIL PNEUM. ISO15552 Ø50 C50 D.ACAO C/MAG","obs":"","tipoHaste":"Simples","diamHaste":20},{"id":"c23","nome":"CP96SDB50-0200","diam":50,"curso":200,"rosca":"1/4","acao":"Dupla ação","erp":"2.000000307","erpdesc":"CIL PNEUM. ISO15552 Ø50 C200 D.ACAO C/MAG","obs":"","tipoHaste":"Simples","diamHaste":20},{"id":"c24","nome":"CP96SDB63-400C","diam":63,"curso":400,"rosca":"3/8","acao":"Dupla ação","erp":"2.000002701","erpdesc":"CIL PNEUM. ISO15552 Ø63 C400 D.ACAO C/MAG","obs":"","tipoHaste":"Simples","diamHaste":20},{"id":"c25","nome":"CP96SB32-125","diam":32,"curso":125,"rosca":"1/8","acao":"Dupla ação","erp":"2.000000495","erpdesc":"CIL PNEUM. ISO15552 Ø32 C125 D.ACAO C/MAG","obs":"","tipoHaste":"Simples","diamHaste":12},{"id":"c26","nome":"CP96SDB40-300C","diam":40,"curso":300,"rosca":"1/4","acao":"Dupla ação","erp":"2.000003341","erpdesc":"CIL PNEUM. ISO15552 Ø40 C300 D.ACAO C/MAG","obs":"","tipoHaste":"Simples","diamHaste":16}],"valvulas":[{"id":"v1","modelo":"SY7120-5DZ-02","vias":"5/2","acionamento":"Solenóide","tensao":"24 VCC","vazao":854,"rosca":"1/4","erp":"2.000000241","erpdesc":"VALV. SOLE. 5/2VIAS 1/4\" 24VCC SY7120-5DZ-02","obs":""},{"id":"v2","modelo":"SY7320-5DZ-02B","vias":"5/3","acionamento":"Solenóide","tensao":"24 VCC","vazao":1000,"rosca":"1/4","erp":"2.000000242","erpdesc":"VALV. SOLENO. 5/3VIAS 1/4\" CF 24VCC SY7320-5DZ-02B","obs":""},{"id":"v3","modelo":"SY7420-5DZ-02","vias":"5/3","acionamento":"Solenóide","tensao":"24VCC","vazao":912,"rosca":"1/4","erp":"2.000000927","erpdesc":"VALV. SOLENO. 5/3VIAS 1/4\" CAN 24VCC SY7420-5DZ-02","obs":"CENTRO ABERTO NEGATIVO"}],"mangueiras":[{"id":"h1","nome":"MANGUEIRA 6","vazao":47.35,"dmax":5,"erp":"","erpdesc":"MANGUEIRA 6"},{"id":"h2","nome":"MANGUEIRA 8","vazao":84.74,"dmax":10,"erp":"","erpdesc":"MANGUEIRA 8"},{"id":"h3","nome":"MANGUEIRA 10","vazao":167.61,"dmax":20,"erp":"","erpdesc":"MANGUEIRA 10"}],"bicos":[],"sopradores":[{"id":"s-base-kn-r02-200","tipo":"Bico soprador","nome":"BICO DE AR","modelo":"KN-R02-200","erp":"2.000001333","erpdesc":"CONEXAO BICO DE AR FIXO Ø2 MODELO KN-R02-200","nfuros":1,"dfuro":2,"pressaoMax":10,"vazao":"","obs":""},{"id":"s-base-haste-sopro","tipo":"Haste com furos","nome":"HASTE SOPRO","modelo":"FABRICADO","erp":"4.000038291","erpdesc":"HASTE SOPRO INFERIOR IMPRESSORA HORIZONTAL","nfuros":3,"dfuro":2,"pressaoMax":10,"vazao":"","obs":""},{"id":"s-base-zh15dsa-02-03-03","tipo":"Gerador de vácuo","nome":"GERADORA DE VACUO","modelo":"ZH15DSA-02-03-03","erp":"2.000001421","erpdesc":"VALVULA GERADORA DE VACUO ZH15DSA-02-03-03 SMC","nfuros":1,"dfuro":1.5,"pressaoMax":10,"vazao":"","obs":""}],"filtros":[{"id":"f-base-2000000608","tipo":"Separador de condensado","nome":"AMG350C-F04BD","erp":"2.000000608","erpdesc":"FILTRO AR SEPARADOR CONDENSADO 1/2\" AMG350C-F04BD","rosca":"ROSCA +ENCAIXE: AMG + AW + ISE10","largura":59,"altura":207,"profund":59,"vazao":1500,"pressaoMax":10,"faixaReg":"","filtragem":5,"dreno":"Automático","obs":""},{"id":"f-base-2000000605","tipo":"Filtro regulador","nome":"AW40-F04BDE-B","erp":"2.000000605","erpdesc":"FILTRO REGULADOR C/ DRENO AUTO. 1/2\" AW40-F04BDE-B","rosca":"ENCAIXE: AMG + AW + ISE10","largura":91,"altura":149,"profund":70,"vazao":1500,"pressaoMax":10,"faixaReg":"0,5-8,5","filtragem":5,"dreno":"Automático","obs":""},{"id":"f-base-2000000602","tipo":"Pressostato","nome":"IS10E-40F04-6L-A","erp":"2.000000602","erpdesc":"PRESSOSTATO PNEUMA 1NA/NF 1-6BAR 1/2\" IS10E-4004-6","rosca":"ENCAIXE: AMG + AW + ISE10 + ROSCA","largura":37,"altura":82,"profund":32,"vazao":1500,"pressaoMax":10,"faixaReg":"1-10","filtragem":"","dreno":"Não se aplica","obs":""},{"id":"f-base-2000000606","tipo":"Separador de condensado","nome":"AMG150C-F02BD","erp":"2.000000606","erpdesc":"FILTRO AR SEPARADOR CONDENSADO 1/4\" AMG150C-F02BD","rosca":"ROSCA 1/4 +ENCAIXE MODULAR","largura":63,"altura":99,"profund":63,"vazao":1000,"pressaoMax":10,"faixaReg":"","filtragem":"0,3","dreno":"Automático","obs":""},{"id":"f-base-2000000603","tipo":"Filtro regulador","nome":"AW20-F02BDE-B","erp":"2.000000603","erpdesc":"FILTRO REGULADOR C/ DRENO AUTO. 1/4\" AW20-F02BDE-B","rosca":"ENCAIXE MODULAR","largura":54,"altura":136,"profund":45,"vazao":750,"pressaoMax":10,"faixaReg":"0,05-8,85","filtragem":5,"dreno":"Automático","obs":"MANOMET"},{"id":"f-base-2000000246","tipo":"Pressostato","nome":"IS10E-2002-6","erp":"2.000000246","erpdesc":"PRESSOSTATO PNEUM 1NA/NF 1-6BAR 1/4\" IS10E-2002-6","rosca":"ENCAIXE MODULAR + ROSCA 1/4","largura":18,"altura":50,"profund":18,"vazao":"","pressaoMax":10,"faixaReg":"1-6","filtragem":"","dreno":"Não se aplica","obs":"CABO 2m"}]}'::jsonb, now())
on conflict (id) do update
set dados = jsonb_build_object(
      'cilindros', public.pneumo_merge_catalog_array(pneumo_catalogos.dados->'cilindros', excluded.dados->'cilindros'),
      'valvulas', public.pneumo_merge_catalog_array(pneumo_catalogos.dados->'valvulas', excluded.dados->'valvulas'),
      'mangueiras', public.pneumo_merge_catalog_array(pneumo_catalogos.dados->'mangueiras', excluded.dados->'mangueiras'),
      'bicos', public.pneumo_merge_catalog_array(pneumo_catalogos.dados->'bicos', excluded.dados->'bicos'),
      'sopradores', public.pneumo_merge_catalog_array(pneumo_catalogos.dados->'sopradores', excluded.dados->'sopradores'),
      'filtros', public.pneumo_merge_catalog_array(pneumo_catalogos.dados->'filtros', excluded.dados->'filtros')
    ),
    atualizado_em = now();

-- Aplica somente os projetos alterados/removidos pelo navegador, para que uma
-- gravação concorrente em outro projeto não apague alterações de um colega.
create or replace function public.pneumo_apply_project_changes(p_upserts jsonb, p_deletes text[])
returns void
language plpgsql
as $$
begin
  delete from public.pneumo_projetos p
  where p.id = any(coalesce(p_deletes, array[]::text[]));

  insert into public.pneumo_projetos (id, dados, atualizado_em)
  select item->>'id', item, now()
  from jsonb_array_elements(coalesce(p_upserts, '[]'::jsonb)) as items(item)
  where nullif(item->>'id', '') is not null
  on conflict (id) do update
    set dados = excluded.dados,
        atualizado_em = now();
end;
$$;

-- O app acessa as tabelas exclusivamente pelas funções serverless da Vercel.
-- Nenhuma chave administrativa é entregue ao navegador.
alter table public.pneumo_catalogos enable row level security;
alter table public.pneumo_projetos enable row level security;
revoke all on public.pneumo_catalogos, public.pneumo_projetos from public, anon, authenticated;
grant select, insert, update, delete on public.pneumo_catalogos, public.pneumo_projetos to service_role;
revoke execute on function public.pneumo_merge_catalog_array(jsonb, jsonb) from public, anon, authenticated;
grant execute on function public.pneumo_merge_catalog_array(jsonb, jsonb) to service_role;
revoke execute on function public.pneumo_apply_project_changes(jsonb, text[]) from public, anon, authenticated;
grant execute on function public.pneumo_apply_project_changes(jsonb, text[]) to service_role;

