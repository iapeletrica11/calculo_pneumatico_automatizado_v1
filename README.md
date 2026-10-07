# Consumo pneumático

A aplicação continua iniciando por `consumo_pneumatico_com_login_projetos.html`.

## Publicação na Vercel

### Banco PostgreSQL compartilhado

O script [`database/001-pneumo-postgres.sql`](database/001-pneumo-postgres.sql) cria as tabelas `pneumo_catalogos` e `pneumo_projetos` e carrega o cadastro base de `catalogos/catalogos-pneumatico.json` (cilindros, válvulas, mangueiras, bicos, sopradores e filtros). Ao reaplicar, mescla cada catálogo por código ERP (ou ID se não houver ERP), atualiza os itens coincidentes e preserva outros cadastros e projetos já salvos.

### Ativação do banco compartilhado

O app agora usa as funções serverless em `api/` para autenticar e sincronizar os catálogos e projetos com o Supabase. O navegador mantém `localStorage` como cache, mas os dados compartilhados são lidos e gravados no PostgreSQL após o login.

1. Na Vercel, instale a integração Supabase e conecte-a ao projeto. A integração fornece `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY` e `SUPABASE_SECRET_KEY` às funções.
2. No SQL Editor do Supabase, execute `database/001-pneumo-postgres.sql`. O script cria e popula as tabelas, ativa RLS e restringe o acesso direto; as chamadas passam pelas funções da Vercel.
3. Crie/invite as contas da equipe em **Supabase → Authentication → Users**. O login público não substitui esse controle.
4. Em **Vercel → Project → Settings → Environment Variables**, adicione `PNEUMO_ALLOWED_EMAILS` com os e-mails autorizados separados por vírgula, por exemplo `engenharia1@empresa.com,engenharia2@empresa.com`. Configure para Production (e Preview, se for usar).
5. Faça um novo deploy. Para desenvolver localmente com as funções e variáveis da Vercel, use `vercel dev` após vincular o projeto. O login em `file://` não acessa o banco.

Não coloque `SUPABASE_SECRET_KEY` no HTML, no JavaScript do navegador, nem em variáveis `NEXT_PUBLIC_*`. Ela é lida somente pelas funções serverless. A lista de e-mails permitidos é obrigatória; sem ela a API nega o acesso.

O `vercel.json` direciona a raiz do domínio (`/`) para a página principal, sem duplicar o HTML. Importe este repositório na Vercel uma vez, mantenha a pasta raiz como diretório do projeto e selecione **Other** como framework.

### Deploy automático pelo GitHub Actions

O workflow `.github/workflows/deploy-vercel.yml` publica na produção sempre que há push em `main`; também pode ser iniciado manualmente na aba **Actions** do GitHub. Ele aguarda as variáveis do projeto serem configuradas e informa erro se faltar o token. Para habilitá-lo:

1. Crie ou importe o projeto na Vercel, associado ao repositório, e confirme que ele publica corretamente.
2. Na Vercel, crie um token em **Account Settings → Tokens**.
3. No GitHub, abra **Settings → Secrets and variables → Actions**. Cadastre `VERCEL_TOKEN` como **secret** e `VERCEL_ORG_ID` e `VERCEL_PROJECT_ID` como **variables**.
4. Obtenha os IDs executando `vercel link` na pasta do projeto e lendo `orgId` e `projectId` do arquivo local `.vercel/project.json`. Não publique nem versione o token.
5. Faça push na branch `main`; acompanhe a execução em **Actions**.

Se o projeto Vercel também estiver configurado para publicar automaticamente cada push pelo Git Integration, desative um dos dois gatilhos para evitar deploys duplicados. O endereço antigo com `.html` continua disponível.

O login usa contas Supabase Auth e a API valida o usuário e o e-mail permitido antes de acessar o banco. Os catálogos e projetos salvos são compartilhados; outros dados de interface e rascunhos ainda usam o cache local do navegador. Ao publicar, confirme que a integração e as variáveis de ambiente estão configuradas e faça login com uma conta convidada.

## Organização MVC

- `models/PneumoStorage.js`: Model de persistência. Encapsula `localStorage` e permite trocar o adaptador sem alterar os consumidores.
- `catalogos/catalogos-pneumatico.json`: cópia exportada dos catálogos incluídos nesta publicação.
- `views/`: estilos da interface em `styles.css`; a estrutura HTML permanece no arquivo de entrada.
- `controllers/app.js`: inicialização, eventos e coordenação da interface com os dados. Também mantém as rotinas atuais de cálculo e renderização, que compartilham estado entre si.

Os catálogos de cilindros, válvulas, mangueiras, sopradores, bicos e filtros são persistidos separadamente dos projetos no navegador. Alterações são gravadas automaticamente e os projetos usam sempre os cadastros atuais. Na primeira abertura após esta atualização, os catálogos existentes no armazenamento anterior são migrados.

Para exportar os catálogos deste navegador sem usar o Console, abra **Gerenciar projetos** e clique em **Exportar catálogos (JSON)**. O arquivo baixado contém os cadastros locais do navegador.

As dependências de PDF e Excel seguem carregadas pelo HTML. Os caminhos dos arquivos são relativos, então mantenha a estrutura de pastas ao abrir ou publicar a aplicação.

Os projetos agora guardam uma lista de painéis independentes (conjuntos, pressão, pressão atmosférica, margem e filtros selecionados). Projetos legados são migrados para Painel 1 ao carregar. Catálogos permanecem compartilhados pela PV. Relatórios de consumo percorrem os painéis, e a lista Excel/PDF de materiais consolida toda a instalação.

No catálogo de mangueiras, informe o diâmetro interno real em milímetros. A tabela do projeto exibe esse diâmetro, a capacidade calculada e o limite efetivo da mangueira. O limite de vazão cadastrado é considerado como referência a 6 bar e ajustado proporcionalmente à pressão absoluta usada no cálculo. O consumo aplicado de cada linha de sopro/vácuo fica limitado pela capacidade efetiva da mangueira, pela quantidade e pelo tempo de acionamento; a demanda calculada acima do limite segue destacada em vermelho. Para calcular uma descarga livre, deixe o item do catálogo de sopradores vazio e selecione a mangueira; o consumo usa o diâmetro e a pressão do painel, com fluxo contínuo (60 s/min quando o tempo não é informado). O tempo de acionamento no projeto é limitado a 60 segundos por minuto.
