/**
 * Utilitários de validação para formulários
 */

/**
 * Valida formato de email
 */
export function isValidEmail(email: string): boolean {
  if (!email || typeof email !== 'string') return false;
  
  // Regex básico para validação de email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
}

/**
 * Valida senha (comprimento mínimo)
 */
export function isValidPassword(password: string, minLength: number = 6): boolean {
  if (!password || typeof password !== 'string') return false;
  return password.length >= minLength;
}

/**
 * Sanitiza email (remove espaços, converte para lowercase)
 */
export function sanitizeEmail(email: string): string {
  if (!email || typeof email !== 'string') return '';
  return email.trim().toLowerCase();
}

/**
 * Valida e sanitiza dados de login
 */
export interface LoginData {
  email: string;
  password: string;
}

export interface LoginValidationResult {
  valid: boolean;
  errors: string[];
  sanitizedData?: LoginData;
}

export function validateLoginData(email: string, password: string): LoginValidationResult {
  const errors: string[] = [];
  const sanitizedEmail = sanitizeEmail(email);
  
  // Validar email
  if (!email || !email.trim()) {
    errors.push('O email é obrigatório.');
  } else if (!isValidEmail(sanitizedEmail)) {
    errors.push('Formato de email inválido. Use um email válido (ex: usuario@exemplo.com).');
  }
  
  // Validar senha
  if (!password || !password.trim()) {
    errors.push('A senha é obrigatória.');
  } else if (!isValidPassword(password)) {
    errors.push('A senha deve ter pelo menos 6 caracteres.');
  }
  
  // Se houver erros, retornar sem dados sanitizados
  if (errors.length > 0) {
    return {
      valid: false,
      errors,
    };
  }
  
  // Retornar dados validados e sanitizados
  return {
    valid: true,
    errors: [],
    sanitizedData: {
      email: sanitizedEmail,
      password: password, // Senha não é sanitizada (pode conter espaços intencionais)
    },
  };
}

/**
 * Valida os dados antes de enviar para o Supabase
 * Retorna informações detalhadas sobre a validação
 */
export function validateBeforeSend(email: string, password: string): {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  data: {
    email: string;
    password: string;
    gotrue_meta_security: {};
  } | null;
} {
  const validation = validateLoginData(email, password);
  const warnings: string[] = [];
  
  if (!validation.valid) {
    return {
      isValid: false,
      errors: validation.errors,
      warnings: [],
      data: null,
    };
  }
  
  const sanitizedData = validation.sanitizedData!;
  
  // Avisos (não bloqueiam o envio)
  if (password.length < 8) {
    warnings.push('Senha curta. Recomendamos usar pelo menos 8 caracteres para maior segurança.');
  }
  
  if (password.length > 72) {
    warnings.push('Senha muito longa. O Supabase limita senhas a 72 caracteres.');
  }
  
  // Verificar caracteres especiais na senha (opcional - apenas aviso)
  const hasSpecialChars = /[!@#$%^&*(),.?":{}|<>]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasLetters = /[a-zA-Z]/.test(password);
  
  if (!hasSpecialChars && !hasNumbers) {
    warnings.push('Recomendamos usar senhas com letras, números e caracteres especiais.');
  } else if (!hasNumbers || !hasLetters) {
    warnings.push('Recomendamos usar senhas com letras e números.');
  }
  
  // Preparar dados no formato esperado pelo Supabase
  const data = {
    email: sanitizedData.email,
    password: sanitizedData.password,
    gotrue_meta_security: {}, // Metadados de segurança (usado pelo Supabase)
  };
  
  return {
    isValid: true,
    errors: [],
    warnings,
    data,
  };
}
