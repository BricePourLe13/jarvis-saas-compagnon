/**
 * Custom Tools - Validators
 * Validation des tools avant création/mise à jour
 */

import type {
  CustomTool,
  CustomToolFormData,
  ToolValidationResult,
  ApiRestConfig,
  McpSupabaseConfig,
  WebhookConfig,
  ToolParameter
} from '@/types/custom-tools'
import { 
  validateToolName, 
  validateToolDescription,
  validateRateLimit
} from '@/types/custom-tools'

/**
 * Valide un custom tool complet
 */
export function validateCustomTool(tool: Partial<CustomToolFormData>): ToolValidationResult {
  const errors: string[] = []
  
  // Validation nom
  if (!tool.name) {
    errors.push('Le nom est requis')
  } else {
    const nameError = validateToolName(tool.name)
    if (nameError) errors.push(nameError)
  }
  
  // Validation display_name
  if (!tool.display_name || tool.display_name.length < 3) {
    errors.push('Le nom affiché doit contenir au moins 3 caractères')
  }
  
  // Validation description
  if (!tool.description) {
    errors.push('La description est requise')
  } else {
    const descError = validateToolDescription(tool.description)
    if (descError) errors.push(descError)
  }
  
  // Validation type
  if (!tool.type) {
    errors.push('Le type de tool est requis')
  }
  
  // Validation config selon le type
  if (tool.config && tool.type) {
    const configErrors = validateToolConfig(tool.type, tool.config)
    errors.push(...configErrors)
  }
  
  // Validation parameters
  if (tool.parameters && tool.parameters.length > 0) {
    const paramErrors = validateToolParameters(tool.parameters)
    errors.push(...paramErrors)
  }
  
  // Validation rate limits
  if (tool.rate_limit_per_member_per_day !== undefined) {
    const limitError = validateRateLimit(tool.rate_limit_per_member_per_day, 'member')
    if (limitError) errors.push(limitError)
  }
  
  if (tool.rate_limit_per_gym_per_hour !== undefined) {
    const limitError = validateRateLimit(tool.rate_limit_per_gym_per_hour, 'gym')
    if (limitError) errors.push(limitError)
  }
  
  return {
    valid: errors.length === 0,
    errors
  }
}

/**
 * Valide la config selon le type de tool
 */
function validateToolConfig(type: string, config: any): string[] {
  const errors: string[] = []
  
  switch (type) {
    case 'api_rest':
      errors.push(...validateApiRestConfig(config))
      break
    case 'mcp_supabase':
      errors.push(...validateMcpSupabaseConfig(config))
      break
    case 'webhook':
      errors.push(...validateWebhookConfig(config))
      break
  }
  
  return errors
}

/**
 * Valide config API REST
 */
function validateApiRestConfig(config: Partial<ApiRestConfig>): string[] {
  const errors: string[] = []
  
  // Endpoint requis
  if (!config.endpoint) {
    errors.push('URL endpoint est requise')
  } else {
    try {
      new URL(config.endpoint)
    } catch {
      // Si ça contient des {{templates}}, on vérifie juste le format de base
      if (!config.endpoint.includes('{{')) {
        errors.push('URL endpoint invalide')
      }
    }
  }
  
  // Method valide
  if (config.method && !['GET', 'POST', 'PUT', 'DELETE', 'PATCH'].includes(config.method)) {
    errors.push('Méthode HTTP invalide')
  }
  
  // Headers JSON valide
  if (config.headers && typeof config.headers !== 'object') {
    errors.push('Headers doit être un objet JSON')
  }
  
  // Timeout raisonnable
  if (config.timeout_ms !== undefined) {
    if (config.timeout_ms < 1000 || config.timeout_ms > 60000) {
      errors.push('Timeout doit être entre 1000ms et 60000ms')
    }
  }
  
  return errors
}

/**
 * Valide config MCP Supabase
 */
function validateMcpSupabaseConfig(config: Partial<McpSupabaseConfig>): string[] {
  const errors: string[] = []
  
  // Query template requis
  if (!config.query_template) {
    errors.push('Query template est requise')
  } else {
    // Vérifier que c'est un SELECT (sécurité)
    const upperQuery = config.query_template.toUpperCase().trim()
    
    if (!upperQuery.startsWith('SELECT')) {
      errors.push('Seules les requêtes SELECT sont autorisées')
    }
    
    // Interdire keywords dangereux
    const dangerousKeywords = ['DROP', 'DELETE', 'UPDATE', 'TRUNCATE', 'ALTER', 'INSERT', 'GRANT', 'REVOKE']
    for (const keyword of dangerousKeywords) {
      if (upperQuery.includes(keyword)) {
        errors.push(`Keyword interdit détecté: ${keyword}`)
      }
    }
  }
  
  // Max rows raisonnable
  if (config.max_rows !== undefined) {
    if (config.max_rows < 1 || config.max_rows > 1000) {
      errors.push('Max rows doit être entre 1 et 1000')
    }
  }
  
  return errors
}

/**
 * Valide config Webhook
 */
function validateWebhookConfig(config: Partial<WebhookConfig>): string[] {
  const errors: string[] = []
  
  // URL requise
  if (!config.url) {
    errors.push('URL webhook est requise')
  } else {
    try {
      new URL(config.url)
    } catch {
      if (!config.url.includes('{{')) {
        errors.push('URL webhook invalide')
      }
    }
  }
  
  // Method valide
  if (config.method && !['POST', 'PUT'].includes(config.method)) {
    errors.push('Méthode webhook doit être POST ou PUT')
  }
  
  // Payload template requis
  if (!config.payload_template) {
    errors.push('Payload template est requis')
  }
  
  // Timeout raisonnable
  if (config.timeout_ms !== undefined) {
    if (config.timeout_ms < 1000 || config.timeout_ms > 60000) {
      errors.push('Timeout doit être entre 1000ms et 60000ms')
    }
  }
  
  return errors
}

/**
 * Valide les paramètres du tool
 */
function validateToolParameters(parameters: ToolParameter[]): string[] {
  const errors: string[] = []
  
  // Vérifier noms uniques
  const names = parameters.map(p => p.name)
  const duplicates = names.filter((n, i) => names.indexOf(n) !== i)
  if (duplicates.length > 0) {
    errors.push(`Noms de paramètres dupliqués: ${duplicates.join(', ')}`)
  }
  
  // Valider chaque paramètre
  parameters.forEach((param, index) => {
    const prefix = `Paramètre ${index + 1}`
    
    // Nom requis et valide
    if (!param.name) {
      errors.push(`${prefix}: nom requis`)
    } else if (!/^[a-z_][a-z0-9_]*$/.test(param.name)) {
      errors.push(`${prefix}: nom doit être en snake_case`)
    }
    
    // Description requise
    if (!param.description || param.description.length < 5) {
      errors.push(`${prefix}: description doit contenir au moins 5 caractères`)
    }
    
    // Type valide
    if (!['string', 'number', 'boolean', 'object', 'array'].includes(param.type)) {
      errors.push(`${prefix}: type invalide`)
    }
    
    // Enum valide si présent
    if (param.enum && param.enum.length === 0) {
      errors.push(`${prefix}: enum ne peut pas être vide`)
    }
    
    // Min/max pour numbers
    if (param.type === 'number') {
      if (param.min !== undefined && param.max !== undefined && param.min > param.max) {
        errors.push(`${prefix}: min ne peut pas être supérieur à max`)
      }
    }
  })
  
  return errors
}

/**
 * Valide qu'un template ne contient que des variables autorisées
 */
export function validateTemplate(template: string): ToolValidationResult {
  const errors: string[] = []
  
  // Extraire toutes les variables {{xxx}}
  const variableRegex = /\{\{([^}]+)\}\}/g
  const matches = template.matchAll(variableRegex)
  
  const allowedPrefixes = ['member.', 'gym.', 'args.', 'session.']
  
  for (const match of matches) {
    const variable = match[1].trim()
    
    // Vérifier que la variable commence par un préfixe autorisé
    const hasValidPrefix = allowedPrefixes.some(prefix => variable.startsWith(prefix))
    
    if (!hasValidPrefix) {
      errors.push(`Variable non autorisée: {{${variable}}}. Préfixes valides: ${allowedPrefixes.join(', ')}`)
    }
  }
  
  return {
    valid: errors.length === 0,
    errors
  }
}

/**
 * Valide un test case
 */
export function validateTestCase(testCase: any): ToolValidationResult {
  const errors: string[] = []
  
  if (!testCase.name || testCase.name.length < 3) {
    errors.push('Le nom du test doit contenir au moins 3 caractères')
  }
  
  if (!testCase.input_args || typeof testCase.input_args !== 'object') {
    errors.push('Les arguments du test sont requis')
  }
  
  return {
    valid: errors.length === 0,
    errors
  }
}

/**
 * Sanitize SQL query (protection injection)
 */
export function sanitizeSqlQuery(query: string): string {
  // Supprimer commentaires SQL
  let sanitized = query.replace(/--[^\n]*/g, '')
  sanitized = sanitized.replace(/\/\*[\s\S]*?\*\//g, '')
  
  // Supprimer multiples espaces
  sanitized = sanitized.replace(/\s+/g, ' ')
  
  return sanitized.trim()
}

/**
 * Vérifie si un nom de tool est unique dans une gym
 */
export async function isToolNameUnique(
  gymId: string,
  name: string,
  excludeToolId?: string
): Promise<boolean> {
  const { createClient } = await import('@supabase/supabase-js')
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
  
  let query = supabase
    .from('custom_tools')
    .select('id')
    .eq('gym_id', gymId)
    .eq('name', name)
  
  if (excludeToolId) {
    query = query.neq('id', excludeToolId)
  }
  
  const { data } = await query
  
  return !data || data.length === 0
}

/**
 * Valide les credentials d'authentification
 */
export function validateAuthConfig(authType: string, authConfig: any): ToolValidationResult {
  const errors: string[] = []
  
  switch (authType) {
    case 'bearer_token':
      if (!authConfig.token) {
        errors.push('Token est requis pour Bearer Token')
      }
      break
    
    case 'api_key':
      if (!authConfig.key) {
        errors.push('Clé API est requise')
      }
      break
    
    case 'basic_auth':
      if (!authConfig.username || !authConfig.password) {
        errors.push('Username et password sont requis pour Basic Auth')
      }
      break
    
    case 'oauth2':
      if (!authConfig.access_token) {
        errors.push('Access token est requis pour OAuth2')
      }
      break
  }
  
  return {
    valid: errors.length === 0,
    errors
  }
}



 * Custom Tools - Validators
 * Validation des tools avant création/mise à jour
 */

import type {
  CustomTool,
  CustomToolFormData,
  ToolValidationResult,
  ApiRestConfig,
  McpSupabaseConfig,
  WebhookConfig,
  ToolParameter
} from '@/types/custom-tools'
import { 
  validateToolName, 
  validateToolDescription,
  validateRateLimit
} from '@/types/custom-tools'

/**
 * Valide un custom tool complet
 */
export function validateCustomTool(tool: Partial<CustomToolFormData>): ToolValidationResult {
  const errors: string[] = []
  
  // Validation nom
  if (!tool.name) {
    errors.push('Le nom est requis')
  } else {
    const nameError = validateToolName(tool.name)
    if (nameError) errors.push(nameError)
  }
  
  // Validation display_name
  if (!tool.display_name || tool.display_name.length < 3) {
    errors.push('Le nom affiché doit contenir au moins 3 caractères')
  }
  
  // Validation description
  if (!tool.description) {
    errors.push('La description est requise')
  } else {
    const descError = validateToolDescription(tool.description)
    if (descError) errors.push(descError)
  }
  
  // Validation type
  if (!tool.type) {
    errors.push('Le type de tool est requis')
  }
  
  // Validation config selon le type
  if (tool.config && tool.type) {
    const configErrors = validateToolConfig(tool.type, tool.config)
    errors.push(...configErrors)
  }
  
  // Validation parameters
  if (tool.parameters && tool.parameters.length > 0) {
    const paramErrors = validateToolParameters(tool.parameters)
    errors.push(...paramErrors)
  }
  
  // Validation rate limits
  if (tool.rate_limit_per_member_per_day !== undefined) {
    const limitError = validateRateLimit(tool.rate_limit_per_member_per_day, 'member')
    if (limitError) errors.push(limitError)
  }
  
  if (tool.rate_limit_per_gym_per_hour !== undefined) {
    const limitError = validateRateLimit(tool.rate_limit_per_gym_per_hour, 'gym')
    if (limitError) errors.push(limitError)
  }
  
  return {
    valid: errors.length === 0,
    errors
  }
}

/**
 * Valide la config selon le type de tool
 */
function validateToolConfig(type: string, config: any): string[] {
  const errors: string[] = []
  
  switch (type) {
    case 'api_rest':
      errors.push(...validateApiRestConfig(config))
      break
    case 'mcp_supabase':
      errors.push(...validateMcpSupabaseConfig(config))
      break
    case 'webhook':
      errors.push(...validateWebhookConfig(config))
      break
  }
  
  return errors
}

/**
 * Valide config API REST
 */
function validateApiRestConfig(config: Partial<ApiRestConfig>): string[] {
  const errors: string[] = []
  
  // Endpoint requis
  if (!config.endpoint) {
    errors.push('URL endpoint est requise')
  } else {
    try {
      new URL(config.endpoint)
    } catch {
      // Si ça contient des {{templates}}, on vérifie juste le format de base
      if (!config.endpoint.includes('{{')) {
        errors.push('URL endpoint invalide')
      }
    }
  }
  
  // Method valide
  if (config.method && !['GET', 'POST', 'PUT', 'DELETE', 'PATCH'].includes(config.method)) {
    errors.push('Méthode HTTP invalide')
  }
  
  // Headers JSON valide
  if (config.headers && typeof config.headers !== 'object') {
    errors.push('Headers doit être un objet JSON')
  }
  
  // Timeout raisonnable
  if (config.timeout_ms !== undefined) {
    if (config.timeout_ms < 1000 || config.timeout_ms > 60000) {
      errors.push('Timeout doit être entre 1000ms et 60000ms')
    }
  }
  
  return errors
}

/**
 * Valide config MCP Supabase
 */
function validateMcpSupabaseConfig(config: Partial<McpSupabaseConfig>): string[] {
  const errors: string[] = []
  
  // Query template requis
  if (!config.query_template) {
    errors.push('Query template est requise')
  } else {
    // Vérifier que c'est un SELECT (sécurité)
    const upperQuery = config.query_template.toUpperCase().trim()
    
    if (!upperQuery.startsWith('SELECT')) {
      errors.push('Seules les requêtes SELECT sont autorisées')
    }
    
    // Interdire keywords dangereux
    const dangerousKeywords = ['DROP', 'DELETE', 'UPDATE', 'TRUNCATE', 'ALTER', 'INSERT', 'GRANT', 'REVOKE']
    for (const keyword of dangerousKeywords) {
      if (upperQuery.includes(keyword)) {
        errors.push(`Keyword interdit détecté: ${keyword}`)
      }
    }
  }
  
  // Max rows raisonnable
  if (config.max_rows !== undefined) {
    if (config.max_rows < 1 || config.max_rows > 1000) {
      errors.push('Max rows doit être entre 1 et 1000')
    }
  }
  
  return errors
}

/**
 * Valide config Webhook
 */
function validateWebhookConfig(config: Partial<WebhookConfig>): string[] {
  const errors: string[] = []
  
  // URL requise
  if (!config.url) {
    errors.push('URL webhook est requise')
  } else {
    try {
      new URL(config.url)
    } catch {
      if (!config.url.includes('{{')) {
        errors.push('URL webhook invalide')
      }
    }
  }
  
  // Method valide
  if (config.method && !['POST', 'PUT'].includes(config.method)) {
    errors.push('Méthode webhook doit être POST ou PUT')
  }
  
  // Payload template requis
  if (!config.payload_template) {
    errors.push('Payload template est requis')
  }
  
  // Timeout raisonnable
  if (config.timeout_ms !== undefined) {
    if (config.timeout_ms < 1000 || config.timeout_ms > 60000) {
      errors.push('Timeout doit être entre 1000ms et 60000ms')
    }
  }
  
  return errors
}

/**
 * Valide les paramètres du tool
 */
function validateToolParameters(parameters: ToolParameter[]): string[] {
  const errors: string[] = []
  
  // Vérifier noms uniques
  const names = parameters.map(p => p.name)
  const duplicates = names.filter((n, i) => names.indexOf(n) !== i)
  if (duplicates.length > 0) {
    errors.push(`Noms de paramètres dupliqués: ${duplicates.join(', ')}`)
  }
  
  // Valider chaque paramètre
  parameters.forEach((param, index) => {
    const prefix = `Paramètre ${index + 1}`
    
    // Nom requis et valide
    if (!param.name) {
      errors.push(`${prefix}: nom requis`)
    } else if (!/^[a-z_][a-z0-9_]*$/.test(param.name)) {
      errors.push(`${prefix}: nom doit être en snake_case`)
    }
    
    // Description requise
    if (!param.description || param.description.length < 5) {
      errors.push(`${prefix}: description doit contenir au moins 5 caractères`)
    }
    
    // Type valide
    if (!['string', 'number', 'boolean', 'object', 'array'].includes(param.type)) {
      errors.push(`${prefix}: type invalide`)
    }
    
    // Enum valide si présent
    if (param.enum && param.enum.length === 0) {
      errors.push(`${prefix}: enum ne peut pas être vide`)
    }
    
    // Min/max pour numbers
    if (param.type === 'number') {
      if (param.min !== undefined && param.max !== undefined && param.min > param.max) {
        errors.push(`${prefix}: min ne peut pas être supérieur à max`)
      }
    }
  })
  
  return errors
}

/**
 * Valide qu'un template ne contient que des variables autorisées
 */
export function validateTemplate(template: string): ToolValidationResult {
  const errors: string[] = []
  
  // Extraire toutes les variables {{xxx}}
  const variableRegex = /\{\{([^}]+)\}\}/g
  const matches = template.matchAll(variableRegex)
  
  const allowedPrefixes = ['member.', 'gym.', 'args.', 'session.']
  
  for (const match of matches) {
    const variable = match[1].trim()
    
    // Vérifier que la variable commence par un préfixe autorisé
    const hasValidPrefix = allowedPrefixes.some(prefix => variable.startsWith(prefix))
    
    if (!hasValidPrefix) {
      errors.push(`Variable non autorisée: {{${variable}}}. Préfixes valides: ${allowedPrefixes.join(', ')}`)
    }
  }
  
  return {
    valid: errors.length === 0,
    errors
  }
}

/**
 * Valide un test case
 */
export function validateTestCase(testCase: any): ToolValidationResult {
  const errors: string[] = []
  
  if (!testCase.name || testCase.name.length < 3) {
    errors.push('Le nom du test doit contenir au moins 3 caractères')
  }
  
  if (!testCase.input_args || typeof testCase.input_args !== 'object') {
    errors.push('Les arguments du test sont requis')
  }
  
  return {
    valid: errors.length === 0,
    errors
  }
}

/**
 * Sanitize SQL query (protection injection)
 */
export function sanitizeSqlQuery(query: string): string {
  // Supprimer commentaires SQL
  let sanitized = query.replace(/--[^\n]*/g, '')
  sanitized = sanitized.replace(/\/\*[\s\S]*?\*\//g, '')
  
  // Supprimer multiples espaces
  sanitized = sanitized.replace(/\s+/g, ' ')
  
  return sanitized.trim()
}

/**
 * Vérifie si un nom de tool est unique dans une gym
 */
export async function isToolNameUnique(
  gymId: string,
  name: string,
  excludeToolId?: string
): Promise<boolean> {
  const { createClient } = await import('@supabase/supabase-js')
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
  
  let query = supabase
    .from('custom_tools')
    .select('id')
    .eq('gym_id', gymId)
    .eq('name', name)
  
  if (excludeToolId) {
    query = query.neq('id', excludeToolId)
  }
  
  const { data } = await query
  
  return !data || data.length === 0
}

/**
 * Valide les credentials d'authentification
 */
export function validateAuthConfig(authType: string, authConfig: any): ToolValidationResult {
  const errors: string[] = []
  
  switch (authType) {
    case 'bearer_token':
      if (!authConfig.token) {
        errors.push('Token est requis pour Bearer Token')
      }
      break
    
    case 'api_key':
      if (!authConfig.key) {
        errors.push('Clé API est requise')
      }
      break
    
    case 'basic_auth':
      if (!authConfig.username || !authConfig.password) {
        errors.push('Username et password sont requis pour Basic Auth')
      }
      break
    
    case 'oauth2':
      if (!authConfig.access_token) {
        errors.push('Access token est requis pour OAuth2')
      }
      break
  }
  
  return {
    valid: errors.length === 0,
    errors
  }
}



