/**
 * Utilitário para validar os dados de conexão que estão sendo enviados ao Supabase
 * Use no console: validateConnectionData(email, password)
 */

import { validateBeforeSend } from './validation';

/**
 * Valida e exibe relatório detalhado dos dados de conexão
 */
export function validateConnectionData(email: string, password: string) {
  console.group('🔍 Validação de Dados de Conexão');
  
  // Validar dados
  const validation = validateBeforeSend(email, password);
  
  // Exibir dados de entrada (sem mostrar senha completa)
  console.log('📥 Dados de Entrada:', {
    email: email,
    emailLength: email.length,
    passwordLength: password.length,
    passwordPreview: password.length > 0 ? `${password.substring(0, 2)}${'*'.repeat(Math.max(0, password.length - 2))}` : '(vazia)',
  });
  
  // Exibir resultado da validação
  if (validation.isValid) {
    console.log('✅ Validação: APROVADA');
    
    if (validation.data) {
      console.log('📤 Dados que serão enviados:', {
        email: validation.data.email,
        emailSanitized: validation.data.email !== email ? 'SIM (convertido para lowercase)' : 'NÃO',
        passwordLength: validation.data.password.length,
        gotrue_meta_security: validation.data.gotrue_meta_security,
        payloadFormat: {
          email: 'string (sanitizado)',
          password: 'string',
          gotrue_meta_security: 'object (vazio)',
        },
      });
    }
    
    // Exibir avisos se houver
    if (validation.warnings.length > 0) {
      console.warn('⚠️ Avisos (não bloqueiam o envio):', validation.warnings);
    }
    
    // Verificar formato do payload
    const expectedPayload = {
      email: validation.data!.email,
      password: validation.data!.password,
      gotrue_meta_security: {},
    };
    
    console.log('📋 Formato do Payload:', JSON.stringify(expectedPayload, null, 2));
    
    // Verificar se o formato está correto para Supabase
    const isCorrectFormat = 
      typeof expectedPayload.email === 'string' &&
      typeof expectedPayload.password === 'string' &&
      typeof expectedPayload.gotrue_meta_security === 'object';
    
    if (isCorrectFormat) {
      console.log('✅ Formato do payload: CORRETO para Supabase');
    } else {
      console.error('❌ Formato do payload: INCORRETO');
    }
    
  } else {
    console.error('❌ Validação: REJEITADA');
    console.error('Erros encontrados:', validation.errors);
  }
  
  console.groupEnd();
  
  return validation;
}

/**
 * Valida os dados específicos fornecidos pelo usuário
 */
export function validateProvidedData() {
  const testData = {
    email: prompt('Digite o email de teste:') ?? '',
    password: prompt('Digite a senha de teste:') ?? '',
    gotrue_meta_security: {},
  };
  
  console.group('🔍 Validação dos Dados Fornecidos');
  console.log('Dados originais:', {
    email: testData.email,
    password: testData.password,
    gotrue_meta_security: testData.gotrue_meta_security,
  });
  
  const validation = validateConnectionData(testData.email, testData.password);
  
  // Verificar formato exato
  if (validation.isValid && validation.data) {
    const payload = {
      email: validation.data.email,
      password: validation.data.password,
      gotrue_meta_security: validation.data.gotrue_meta_security,
    };
    
    console.log('📦 Payload final que será enviado:', payload);
    
    // Comparar com o formato esperado
    const matchesExpected = 
      payload.email === testData.email.trim().toLowerCase() &&
      payload.password === testData.password &&
      JSON.stringify(payload.gotrue_meta_security) === '{}';
    
    if (matchesExpected) {
      console.log('✅ Dados correspondem ao formato esperado');
    } else {
      console.warn('⚠️ Dados foram modificados durante a validação:', {
        emailChanged: payload.email !== testData.email,
        passwordChanged: payload.password !== testData.password,
      });
    }
  }
  
  console.groupEnd();
  
  return validation;
}

// Expor globalmente para uso no console
if (typeof window !== 'undefined') {
  (window as any).validateConnectionData = validateConnectionData;
  (window as any).validateProvidedData = validateProvidedData;
}
