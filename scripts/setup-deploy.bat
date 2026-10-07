@echo off
REM Script de Setup para Deploy em Vercel
REM Windows PowerShell / Batch script

echo.
echo ====================================
echo Consumo Pneumatico - Setup Deploy
echo ====================================
echo.

REM Verificar se está na pasta correta
if not exist ".env.example" (
    echo Erro: Execute este script na pasta raiz do projeto
    pause
    exit /b 1
)

REM Copiar .env.example se nao existir
if not exist ".env" (
    echo Criando .env a partir de .env.example...
    copy .env.example .env
    echo Arquivo .env criado com sucesso!
    echo.
)

REM Dicas para setup
echo.
echo 1. CONFIGURE AS VARIAVEIS DE AMBIENTE
echo    - Abra o arquivo .env
echo    - Preencha: SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, etc
echo.

echo 2. FAZER PUSH PARA GITHUB
echo    Nos powershell/cmd:
echo    $ git init
echo    $ git add .
echo    $ git commit -m "Initial commit"
echo    $ git remote add origin https://github.com/seu-usuario/consumo-pneumatico.git
echo    $ git push -u origin main
echo.

echo 3. DEPLOY EM VERCEL
echo    - Acesse https://vercel.com/new
echo    - Importe seu repositorio GitHub
echo    - Configure as mesmas variaveis de ambiente
echo.

echo 4. BANCO DE DADOS
echo    - Use Supabase https://supabase.com
echo    - Execute database/001-pneumo-postgres.sql no SQL Editor
echo.

pause
