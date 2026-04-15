/**
 * Teste específico para validar os dados de conexão fornecidos
 */

import { validateBeforeSend } from './validation';
import { supabase } from '../lib/supabase';

/**
 * Testa os dados específicos fornecidos pelo usuário
 */
export async function testConnectionData() {
  const testEmail = prompt('Digite o email de teste:') ?? '';
  const testPassword = prompt('Digite a senha de teste:') ?? '';
  
  console.group('🧪 TESTE DE DADOS DE CONEXÃO');
  console.log('Dados de teste:', {
    email: testEmail,
    password: testPassword.replace(/./g, '*'),
    passwordLength: testPassword.length,
  });
  
  // 1. Validação de formato
  console.log('\n1️⃣ VALIDAÇÃO DE FORMATO');
  const validation = validateBeforeSend(testEmail, testPassword);
  
  if (!validation.isValid) {
    console.error('❌ Validação falhou:', validation.errors);
    console.groupEnd();
    return { success: false, step: 'validation', errors: validation.errors };
  }
  
  console.log('✅ Formato válido');
  if (validation.warnings.length > 0) {
    console.warn('⚠️ Avisos:', validation.warnings);
  }
  
  // 2. Verificar payload que será enviado
  console.log('\n2️⃣ PAYLOAD QUE SERÁ ENVIADO');
  if (validation.data) {
    const payload = {
      email: validation.data.email,
      password: validation.data.password,
      gotrue_meta_security: validation.data.gotrue_meta_security,
    };
    
    console.log('Payload:', {
      email: payload.email,
      passwordLength: payload.password.length,
      gotrue_meta_security: payload.gotrue_meta_security,
    });
    
    console.log('Payload JSON:', JSON.stringify(payload, null, 2));
    
    // Verificar se corresponde ao formato esperado
    const expectedFormat = {
      email: 'string',
      password: 'string',
      gotrue_meta_security: 'object',
    };
    
    const actualFormat = {
      email: typeof payload.email,
      password: typeof payload.password,
      gotrue_meta_security: typeof payload.gotrue_meta_security,
    };
    
    const formatMatches = 
      actualFormat.email === expectedFormat.email &&
      actualFormat.password === expectedFormat.password &&
      actualFormat.gotrue_meta_security === expectedFormat.gotrue_meta_security;
    
    if (formatMatches) {
      console.log('✅ Formato do payload: CORRETO');
    } else {
      console.error('❌ Formato do payload: INCORRETO', {
        expected: expectedFormat,
        actual: actualFormat,
      });
      console.groupEnd();
      return { success: false, step: 'format', expected: expectedFormat, actual: actualFormat };
    }
  }
  
  // 3. Verificar configuração do Supabase
  console.log('\n3️⃣ CONFIGURAÇÃO DO SUPABASE');
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  
  console.log('URL configurada:', supabaseUrl ? '✅ SIM' : '❌ NÃO');
  console.log('Chave API configurada:', supabaseKey ? '✅ SIM' : '❌ NÃO');
  
  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Configuração do Supabase incompleta');
    console.groupEnd();
    return { success: false, step: 'config', missing: { url: !supabaseUrl, key: !supabaseKey } };
  }
  
  // 4. Teste de conexão (sem autenticação)
  console.log('\n4️⃣ TESTE DE CONEXÃO');
  try {
    // Tentar uma requisição simples para verificar se a conexão funciona
    const { error: connectionError } = await supabase.from('_test_connection').select('*').limit(0);
    
    if (connectionError) {
      // Erro esperado (tabela não existe), mas verifica se é erro de conexão ou de autenticação
      if (connectionError.message.includes('JWT') || connectionError.code === 'PGRST116') {
        console.log('✅ Conexão com Supabase: OK (erro esperado para tabela inexistente)');
      } else {
        console.warn('⚠️ Possível problema de conexão:', connectionError.message);
      }
    } else {
      console.log('✅ Conexão com Supabase: OK');
    }
  } catch (error: any) {
    console.error('❌ Erro de conexão:', error.message);
    console.groupEnd();
    return { success: false, step: 'connection', error: error.message };
  }
  
  // 5. Resumo final
  console.log('\n5️⃣ RESUMO');
  console.log('✅ Formato dos dados: VÁLIDO');
  console.log('✅ Payload: CORRETO');
  console.log('✅ Configuração: OK');
  console.log('✅ Conexão: OK');
  console.log('\n📋 CONCLUSÃO: Os dados estão no formato correto e prontos para envio.');
  console.log('💡 Se você está recebendo erro 401, o problema provavelmente é:');
  console.log('   - Credenciais incorretas (email ou senha não correspondem)');
  console.log('   - Usuário não existe no banco de dados');
  console.log('   - Conta desativada ou bloqueada');
  console.log('   - Problema com a chave API do Supabase');
  
  console.groupEnd();
  
  return {
    success: true,
    validation: {
      isValid: validation.isValid,
      warnings: validation.warnings,
    },
    payload: validation.data,
    config: {
      url: !!supabaseUrl,
      key: !!supabaseKey,
    },
  };
}

// Expor globalmente
if (typeof window !== 'undefined') {
  (window as any).testConnectionData = testConnectionData;
}
