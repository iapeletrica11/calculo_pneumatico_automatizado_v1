#!/bin/bash
# Script de Setup para Deploy em Vercel
# Linux / Mac

echo ""
echo "===================================="
echo "Consumo Pneumatico - Setup Deploy"
echo "===================================="
echo ""

# Verificar se está na pasta correta
if [ ! -f ".env.example" ]; then
    echo "Erro: Execute este script na pasta raiz do projeto"
    exit 1
fi

# Copiar .env.example se nao existir
if [ ! -f ".env" ]; then
    echo "Criando .env a partir de .env.example..."
    cp .env.example .env
    echo "Arquivo .env criado com sucesso!"
    echo ""
fi

# Dicas para setup
echo ""
echo "1. CONFIGURE AS VARIAVEIS DE AMBIENTE"
echo "   - Abra o arquivo .env"
echo "   - Preencha: SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, etc"
echo ""

echo "2. FAZER PUSH PARA GITHUB"
echo "   $ git init"
echo "   $ git add ."
echo '   $ git commit -m "Initial commit"'
echo "   $ git remote add origin https://github.com/seu-usuario/consumo-pneumatico.git"
echo "   $ git push -u origin main"
echo ""

echo "3. DEPLOY EM VERCEL"
echo "   - Acesse https://vercel.com/new"
echo "   - Importe seu repositorio GitHub"
echo "   - Configure as mesmas variaveis de ambiente"
echo ""

echo "4. BANCO DE DADOS"
echo "   - Use Supabase https://supabase.com"
echo "   - Execute database/001-pneumo-postgres.sql no SQL Editor"
echo ""

echo "✅ Configure os valores de .env e execute:"
echo "   git add ."
echo '   git commit -m "Add environment configuration"'
echo "   git push origin main"
echo ""
