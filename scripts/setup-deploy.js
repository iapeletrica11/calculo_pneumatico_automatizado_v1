#!/usr/bin/env node
/**
 * Script de setup para deploy em Vercel
 * Use: node scripts/setup-deploy.js
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (prompt) => new Promise(resolve => rl.question(prompt, resolve));

async function setupDeploy() {
  console.log('\n🚀 Setup de Deploy - Consumo Pneumático Automatizado\n');
  
  const envPath = path.join(__dirname, '..', '.env');
  const envExamplePath = path.join(__dirname, '..', '.env.example');
  
  // Verificar se .env existe
  if (!fs.existsSync(envPath)) {
    console.log('❌ Arquivo .env não encontrado!');
    console.log('📝 Copiando .env.example para .env...\n');
    
    if (fs.existsSync(envExamplePath)) {
      fs.copyFileSync(envExamplePath, envPath);
      console.log('✅ Arquivo .env criado!\n');
    } else {
      console.log('❌ .env.example não encontrado!\n');
      process.exit(1);
    }
  }
  
  console.log('Você precisa configurar as variáveis de ambiente.\n');
  
  const supabaseUrl = await question('SUPABASE_URL (https://...supabase.co): ');
  const supabaseKey = await question('SUPABASE_PUBLISHABLE_KEY: ');
  const supabaseSecret = await question('SUPABASE_SECRET_KEY: ');
  const allowedEmails = await question('PNEUMO_ALLOWED_EMAILS (separadas por vírgula): ');
  
  // Ler .env atual
  let envContent = fs.readFileSync(envPath, 'utf-8');
  
  // Atualizar valores
  envContent = envContent.replace(
    /SUPABASE_URL=/,
    `SUPABASE_URL=${supabaseUrl}`
  );
  envContent = envContent.replace(
    /SUPABASE_PUBLISHABLE_KEY=/,
    `SUPABASE_PUBLISHABLE_KEY=${supabaseKey}`
  );
  envContent = envContent.replace(
    /SUPABASE_SECRET_KEY=/,
    `SUPABASE_SECRET_KEY=${supabaseSecret}`
  );
  envContent = envContent.replace(
    /PNEUMO_ALLOWED_EMAILS=/,
    `PNEUMO_ALLOWED_EMAILS=${allowedEmails}`
  );
  
  // Escrever .env
  fs.writeFileSync(envPath, envContent);
  
  console.log('\n✅ .env configurado com sucesso!\n');
  
  // Dicas finais
  console.log('📋 Próximos passos:\n');
  console.log('1. Fazer push do projeto para GitHub:');
  console.log('   git add .');
  console.log('   git commit -m "Add environment configuration"');
  console.log('   git push origin main\n');
  
  console.log('2. Conectar Vercel em: https://vercel.com/new');
  console.log('   → Selecione o repositório');
  console.log('   → Adicione as mesmas variáveis de ambiente\n');
  
  console.log('3. Verificar banco de dados:');
  console.log('   → Execute database/001-pneumo-postgres.sql no Supabase\n');
  
  rl.close();
}

// Executar
setupDeploy().catch(err => {
  console.error('❌ Erro:', err);
  process.exit(1);
});
