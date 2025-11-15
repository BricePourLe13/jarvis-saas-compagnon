/**
 * Types pour le système Custom Tools (No-Code)
 * Permet aux gérants de créer des tools personnalisés pour JARVIS
 */

// ============================================
// ENUMS
// ============================================

export type ToolType = 
  | 'api_rest'        // Appel API externe (REST)
  | 'mcp_supabase'    // Query Supabase via MCP
  | 'webhook'         // POST vers webhook externe
  | 'javascript'      // Script JS sandboxé (futur)
  | 'graphql'         // Query GraphQL (futur)
  | 'database_query'  // Query SQL directe (futur)

export type ToolAuthType = 
  | 'none'
  | 'bearer_token'
  | 'api_key'
  | 'oauth2'
  | 'basic_auth'

export type ToolStatus = 
  | 'draft'           // En cours de création
  | 'active'          // Actif et utilisable par JARVIS
  | 'paused'          // Temporairement désactivé
  | 'deprecated'      // Obsolète (gardé pour historique)

export type ExecutionStatus = 'success' | 'error' | 'timeout'

export type ToolCategory = 
  | 'booking'         // Réservations
  | 'info'            // Informations
  | 'action'          // Actions (commander, activer)
  | 'analytics'       // Statistiques
  | 'communication'   // Messages, notifications
  | 'other'           // Autre

// ============================================
// CONFIG TYPES (par type de tool)
// ============================================

/**
 * Config pour API REST
 */
export interface ApiRestConfig {
  endpoint: string                        // URL de l'API
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
  headers?: Record<string, string>        // Headers HTTP (avec templating)
  body_template?: any                     // Body template (JSON avec templating)
  response_mapping?: Record<string, string> // Mapping réponse via JSONPath
  timeout_ms?: number                     // Timeout (default: 10000)
  retry_count?: number                    // Nombre de retries (default: 0)
}

/**
 * Config pour MCP Supabase
 */
export interface McpSupabaseConfig {
  query_template: string                  // Query SQL avec templating
  max_rows?: number                       // Limite résultats (default: 100)
}

/**
 * Config pour Webhook
 */
export interface WebhookConfig {
  url: string                             // URL du webhook
  method?: 'POST' | 'PUT'                 // Méthode (default: POST)
  headers?: Record<string, string>        // Headers HTTP
  payload_template: any                   // Payload template (JSON)
  timeout_ms?: number                     // Timeout (default: 10000)
}

/**
 * Config pour JavaScript (futur)
 */
export interface JavascriptConfig {
  code: string                            // Code JS à exécuter
  timeout_ms?: number                     // Timeout (default: 3000)
  max_memory_mb?: number                  // Limite mémoire (default: 10)
}

/**
 * Union type pour toutes les configs
 */
export type ToolConfig = 
  | ApiRestConfig 
  | McpSupabaseConfig 
  | WebhookConfig 
  | JavascriptConfig

// ============================================
// PARAMETER TYPES
// ============================================

/**
 * Définition d'un paramètre pour OpenAI function calling
 */
export interface ToolParameter {
  name: string                            // Nom du paramètre
  type: 'string' | 'number' | 'boolean' | 'object' | 'array'
  description: string                     // Description pour OpenAI
  required: boolean                       // Si requis
  enum?: string[]                         // Valeurs possibles (optionnel)
  default?: any                           // Valeur par défaut (optionnel)
  min?: number                            // Min (pour number)
  max?: number                            // Max (pour number)
  pattern?: string                        // Regex (pour string)
}

// ============================================
// AUTH CONFIG
// ============================================

export interface BearerTokenAuth {
  type: 'bearer_token'
  token: string                           // Token (chiffré dans DB)
}

export interface ApiKeyAuth {
  type: 'api_key'
  key: string                             // Clé API (chiffrée dans DB)
  header_name?: string                    // Nom du header (default: X-API-Key)
}

export interface BasicAuth {
  type: 'basic_auth'
  username: string
  password: string                        // Chiffré dans DB
}

export interface OAuth2Auth {
  type: 'oauth2'
  access_token: string                    // Token (chiffré dans DB)
  refresh_token?: string                  // Refresh token (optionnel)
  expires_at?: string                     // Date expiration
}

export type ToolAuthConfig = 
  | { type: 'none' }
  | BearerTokenAuth 
  | ApiKeyAuth 
  | BasicAuth 
  | OAuth2Auth

// ============================================
// TEST CASE
// ============================================

export interface ToolTestCase {
  name: string                            // Nom du test
  description?: string                    // Description
  input_args: Record<string, any>         // Arguments à tester
  expected_output?: any                   // Résultat attendu (optionnel)
  expected_status?: ExecutionStatus       // Status attendu (optionnel)
}

export interface ToolTestResult {
  test_case_name: string
  status: ExecutionStatus
  execution_time_ms: number
  output: any
  error_message?: string
  passed: boolean
}

// ============================================
// MAIN TYPES
// ============================================

/**
 * Custom Tool (structure DB)
 */
export interface CustomTool {
  // Identification
  id: string
  gym_id: string
  
  // Metadata
  name: string
  display_name: string
  description: string
  category?: ToolCategory
  icon?: string
  
  // Configuration technique
  type: ToolType
  status: ToolStatus
  config: ToolConfig
  parameters: ToolParameter[]
  
  // Authentification
  auth_type: ToolAuthType
  auth_config: ToolAuthConfig
  
  // Rate limiting
  rate_limit_per_member_per_day: number
  rate_limit_per_gym_per_hour: number
  
  // Analytics
  usage_count: number
  last_used_at: string | null
  avg_execution_time_ms: number
  success_rate: number
  
  // Tests
  test_cases: ToolTestCase[]
  last_test_result: ToolTestResult | null
  last_test_at: string | null
  
  // Metadata
  created_by: string | null
  created_at: string
  updated_at: string
}

/**
 * Custom Tool Execution (log)
 */
export interface CustomToolExecution {
  id: string
  tool_id: string
  gym_id: string
  member_id: string | null
  session_id: string | null
  
  input_args: Record<string, any>
  output_result: any
  
  execution_time_ms: number | null
  status: ExecutionStatus
  error_message: string | null
  http_status_code: number | null
  
  executed_at: string
}

// ============================================
// CONTEXT TYPE (pour exécution)
// ============================================

/**
 * Contexte d'exécution d'un tool
 * Contient les données du membre, gym, session
 */
export interface ToolExecutionContext {
  member: {
    id: string
    email: string
    first_name: string
    last_name: string
    badge_id: string
    membership_type?: string
  }
  gym: {
    id: string
    name: string
    api_keys?: Record<string, string>     // Secrets chiffrés
    opening_hours?: any
    features?: string[]
  }
  session_id: string
  timestamp: string
}

/**
 * Variables disponibles pour templating
 */
export interface ToolTemplateVariables {
  member: ToolExecutionContext['member']
  gym: ToolExecutionContext['gym']
  args: Record<string, any>
  session: {
    id: string
    timestamp: string
  }
}

// ============================================
// RESULT TYPES
// ============================================

export interface ToolExecutionResult {
  success: boolean
  data?: any
  error?: string
  execution_time_ms: number
  http_status_code?: number
}

export interface ToolValidationResult {
  valid: boolean
  errors: string[]
}

// ============================================
// FORM TYPES (pour UI)
// ============================================

/**
 * Données du formulaire de création/édition
 */
export interface CustomToolFormData {
  // Step 1: Basic info
  name: string
  display_name: string
  description: string
  category?: ToolCategory
  icon?: string
  type: ToolType
  
  // Step 2: Config
  config: Partial<ToolConfig>
  parameters: ToolParameter[]
  auth_type: ToolAuthType
  auth_config: Partial<ToolAuthConfig>
  
  // Step 3: Limits & Tests
  rate_limit_per_member_per_day: number
  rate_limit_per_gym_per_hour: number
  test_cases: ToolTestCase[]
}

/**
 * Template pré-configuré
 */
export interface ToolTemplate {
  id: string
  name: string
  display_name: string
  description: string
  category: ToolCategory
  icon: string
  type: ToolType
  config: ToolConfig
  parameters: ToolParameter[]
  use_cases: string[]
}

// ============================================
// ANALYTICS TYPES
// ============================================

export interface ToolAnalytics {
  tool_id: string
  tool_name: string
  total_executions: number
  successful_executions: number
  failed_executions: number
  timeout_executions: number
  success_rate: number
  avg_execution_time_ms: number
  last_used_at: string | null
  most_active_hours: number[]
  top_users: Array<{
    member_id: string
    member_name: string
    execution_count: number
  }>
}

export interface GymToolsStats {
  total_tools: number
  active_tools: number
  draft_tools: number
  paused_tools: number
  total_executions_today: number
  total_executions_week: number
  avg_success_rate: number
  most_used_tool: {
    id: string
    name: string
    usage_count: number
  } | null
}

// ============================================
// API TYPES
// ============================================

export interface CreateToolRequest {
  gym_id: string
  tool_data: CustomToolFormData
}

export interface CreateToolResponse {
  success: boolean
  tool?: CustomTool
  error?: string
}

export interface ExecuteToolRequest {
  gym_id: string
  tool_name: string
  args: Record<string, any>
  context: ToolExecutionContext
}

export interface ExecuteToolResponse {
  success: boolean
  result?: any
  error?: string
  execution_time_ms: number
}

export interface TestToolRequest {
  tool_id: string
  test_case: ToolTestCase
}

export interface TestToolResponse {
  success: boolean
  result?: ToolTestResult
  error?: string
}

// ============================================
// HELPERS
// ============================================

/**
 * Type guards
 */
export function isApiRestConfig(config: any): config is ApiRestConfig {
  return config && typeof config.endpoint === 'string'
}

export function isMcpSupabaseConfig(config: any): config is McpSupabaseConfig {
  return config && typeof config.query_template === 'string'
}

export function isWebhookConfig(config: any): config is WebhookConfig {
  return config && typeof config.url === 'string'
}

export function isJavascriptConfig(config: any): config is JavascriptConfig {
  return config && typeof config.code === 'string'
}

/**
 * Validation helpers
 */
export function validateToolName(name: string): string | null {
  if (!name || name.length < 3) {
    return 'Le nom doit contenir au moins 3 caractères'
  }
  if (name.length > 50) {
    return 'Le nom ne peut pas dépasser 50 caractères'
  }
  if (!/^[a-z0-9_]+$/.test(name)) {
    return 'Le nom doit être en snake_case (lettres minuscules, chiffres et underscores uniquement)'
  }
  return null
}

export function validateToolDescription(description: string): string | null {
  if (!description || description.length < 10) {
    return 'La description doit contenir au moins 10 caractères'
  }
  if (description.length > 500) {
    return 'La description ne peut pas dépasser 500 caractères'
  }
  return null
}

export function validateRateLimit(value: number, type: 'member' | 'gym'): string | null {
  const min = 1
  const max = type === 'member' ? 100 : 10000
  
  if (value < min || value > max) {
    return `La valeur doit être entre ${min} et ${max}`
  }
  return null
}



 * Types pour le système Custom Tools (No-Code)
 * Permet aux gérants de créer des tools personnalisés pour JARVIS
 */

// ============================================
// ENUMS
// ============================================

export type ToolType = 
  | 'api_rest'        // Appel API externe (REST)
  | 'mcp_supabase'    // Query Supabase via MCP
  | 'webhook'         // POST vers webhook externe
  | 'javascript'      // Script JS sandboxé (futur)
  | 'graphql'         // Query GraphQL (futur)
  | 'database_query'  // Query SQL directe (futur)

export type ToolAuthType = 
  | 'none'
  | 'bearer_token'
  | 'api_key'
  | 'oauth2'
  | 'basic_auth'

export type ToolStatus = 
  | 'draft'           // En cours de création
  | 'active'          // Actif et utilisable par JARVIS
  | 'paused'          // Temporairement désactivé
  | 'deprecated'      // Obsolète (gardé pour historique)

export type ExecutionStatus = 'success' | 'error' | 'timeout'

export type ToolCategory = 
  | 'booking'         // Réservations
  | 'info'            // Informations
  | 'action'          // Actions (commander, activer)
  | 'analytics'       // Statistiques
  | 'communication'   // Messages, notifications
  | 'other'           // Autre

// ============================================
// CONFIG TYPES (par type de tool)
// ============================================

/**
 * Config pour API REST
 */
export interface ApiRestConfig {
  endpoint: string                        // URL de l'API
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
  headers?: Record<string, string>        // Headers HTTP (avec templating)
  body_template?: any                     // Body template (JSON avec templating)
  response_mapping?: Record<string, string> // Mapping réponse via JSONPath
  timeout_ms?: number                     // Timeout (default: 10000)
  retry_count?: number                    // Nombre de retries (default: 0)
}

/**
 * Config pour MCP Supabase
 */
export interface McpSupabaseConfig {
  query_template: string                  // Query SQL avec templating
  max_rows?: number                       // Limite résultats (default: 100)
}

/**
 * Config pour Webhook
 */
export interface WebhookConfig {
  url: string                             // URL du webhook
  method?: 'POST' | 'PUT'                 // Méthode (default: POST)
  headers?: Record<string, string>        // Headers HTTP
  payload_template: any                   // Payload template (JSON)
  timeout_ms?: number                     // Timeout (default: 10000)
}

/**
 * Config pour JavaScript (futur)
 */
export interface JavascriptConfig {
  code: string                            // Code JS à exécuter
  timeout_ms?: number                     // Timeout (default: 3000)
  max_memory_mb?: number                  // Limite mémoire (default: 10)
}

/**
 * Union type pour toutes les configs
 */
export type ToolConfig = 
  | ApiRestConfig 
  | McpSupabaseConfig 
  | WebhookConfig 
  | JavascriptConfig

// ============================================
// PARAMETER TYPES
// ============================================

/**
 * Définition d'un paramètre pour OpenAI function calling
 */
export interface ToolParameter {
  name: string                            // Nom du paramètre
  type: 'string' | 'number' | 'boolean' | 'object' | 'array'
  description: string                     // Description pour OpenAI
  required: boolean                       // Si requis
  enum?: string[]                         // Valeurs possibles (optionnel)
  default?: any                           // Valeur par défaut (optionnel)
  min?: number                            // Min (pour number)
  max?: number                            // Max (pour number)
  pattern?: string                        // Regex (pour string)
}

// ============================================
// AUTH CONFIG
// ============================================

export interface BearerTokenAuth {
  type: 'bearer_token'
  token: string                           // Token (chiffré dans DB)
}

export interface ApiKeyAuth {
  type: 'api_key'
  key: string                             // Clé API (chiffrée dans DB)
  header_name?: string                    // Nom du header (default: X-API-Key)
}

export interface BasicAuth {
  type: 'basic_auth'
  username: string
  password: string                        // Chiffré dans DB
}

export interface OAuth2Auth {
  type: 'oauth2'
  access_token: string                    // Token (chiffré dans DB)
  refresh_token?: string                  // Refresh token (optionnel)
  expires_at?: string                     // Date expiration
}

export type ToolAuthConfig = 
  | { type: 'none' }
  | BearerTokenAuth 
  | ApiKeyAuth 
  | BasicAuth 
  | OAuth2Auth

// ============================================
// TEST CASE
// ============================================

export interface ToolTestCase {
  name: string                            // Nom du test
  description?: string                    // Description
  input_args: Record<string, any>         // Arguments à tester
  expected_output?: any                   // Résultat attendu (optionnel)
  expected_status?: ExecutionStatus       // Status attendu (optionnel)
}

export interface ToolTestResult {
  test_case_name: string
  status: ExecutionStatus
  execution_time_ms: number
  output: any
  error_message?: string
  passed: boolean
}

// ============================================
// MAIN TYPES
// ============================================

/**
 * Custom Tool (structure DB)
 */
export interface CustomTool {
  // Identification
  id: string
  gym_id: string
  
  // Metadata
  name: string
  display_name: string
  description: string
  category?: ToolCategory
  icon?: string
  
  // Configuration technique
  type: ToolType
  status: ToolStatus
  config: ToolConfig
  parameters: ToolParameter[]
  
  // Authentification
  auth_type: ToolAuthType
  auth_config: ToolAuthConfig
  
  // Rate limiting
  rate_limit_per_member_per_day: number
  rate_limit_per_gym_per_hour: number
  
  // Analytics
  usage_count: number
  last_used_at: string | null
  avg_execution_time_ms: number
  success_rate: number
  
  // Tests
  test_cases: ToolTestCase[]
  last_test_result: ToolTestResult | null
  last_test_at: string | null
  
  // Metadata
  created_by: string | null
  created_at: string
  updated_at: string
}

/**
 * Custom Tool Execution (log)
 */
export interface CustomToolExecution {
  id: string
  tool_id: string
  gym_id: string
  member_id: string | null
  session_id: string | null
  
  input_args: Record<string, any>
  output_result: any
  
  execution_time_ms: number | null
  status: ExecutionStatus
  error_message: string | null
  http_status_code: number | null
  
  executed_at: string
}

// ============================================
// CONTEXT TYPE (pour exécution)
// ============================================

/**
 * Contexte d'exécution d'un tool
 * Contient les données du membre, gym, session
 */
export interface ToolExecutionContext {
  member: {
    id: string
    email: string
    first_name: string
    last_name: string
    badge_id: string
    membership_type?: string
  }
  gym: {
    id: string
    name: string
    api_keys?: Record<string, string>     // Secrets chiffrés
    opening_hours?: any
    features?: string[]
  }
  session_id: string
  timestamp: string
}

/**
 * Variables disponibles pour templating
 */
export interface ToolTemplateVariables {
  member: ToolExecutionContext['member']
  gym: ToolExecutionContext['gym']
  args: Record<string, any>
  session: {
    id: string
    timestamp: string
  }
}

// ============================================
// RESULT TYPES
// ============================================

export interface ToolExecutionResult {
  success: boolean
  data?: any
  error?: string
  execution_time_ms: number
  http_status_code?: number
}

export interface ToolValidationResult {
  valid: boolean
  errors: string[]
}

// ============================================
// FORM TYPES (pour UI)
// ============================================

/**
 * Données du formulaire de création/édition
 */
export interface CustomToolFormData {
  // Step 1: Basic info
  name: string
  display_name: string
  description: string
  category?: ToolCategory
  icon?: string
  type: ToolType
  
  // Step 2: Config
  config: Partial<ToolConfig>
  parameters: ToolParameter[]
  auth_type: ToolAuthType
  auth_config: Partial<ToolAuthConfig>
  
  // Step 3: Limits & Tests
  rate_limit_per_member_per_day: number
  rate_limit_per_gym_per_hour: number
  test_cases: ToolTestCase[]
}

/**
 * Template pré-configuré
 */
export interface ToolTemplate {
  id: string
  name: string
  display_name: string
  description: string
  category: ToolCategory
  icon: string
  type: ToolType
  config: ToolConfig
  parameters: ToolParameter[]
  use_cases: string[]
}

// ============================================
// ANALYTICS TYPES
// ============================================

export interface ToolAnalytics {
  tool_id: string
  tool_name: string
  total_executions: number
  successful_executions: number
  failed_executions: number
  timeout_executions: number
  success_rate: number
  avg_execution_time_ms: number
  last_used_at: string | null
  most_active_hours: number[]
  top_users: Array<{
    member_id: string
    member_name: string
    execution_count: number
  }>
}

export interface GymToolsStats {
  total_tools: number
  active_tools: number
  draft_tools: number
  paused_tools: number
  total_executions_today: number
  total_executions_week: number
  avg_success_rate: number
  most_used_tool: {
    id: string
    name: string
    usage_count: number
  } | null
}

// ============================================
// API TYPES
// ============================================

export interface CreateToolRequest {
  gym_id: string
  tool_data: CustomToolFormData
}

export interface CreateToolResponse {
  success: boolean
  tool?: CustomTool
  error?: string
}

export interface ExecuteToolRequest {
  gym_id: string
  tool_name: string
  args: Record<string, any>
  context: ToolExecutionContext
}

export interface ExecuteToolResponse {
  success: boolean
  result?: any
  error?: string
  execution_time_ms: number
}

export interface TestToolRequest {
  tool_id: string
  test_case: ToolTestCase
}

export interface TestToolResponse {
  success: boolean
  result?: ToolTestResult
  error?: string
}

// ============================================
// HELPERS
// ============================================

/**
 * Type guards
 */
export function isApiRestConfig(config: any): config is ApiRestConfig {
  return config && typeof config.endpoint === 'string'
}

export function isMcpSupabaseConfig(config: any): config is McpSupabaseConfig {
  return config && typeof config.query_template === 'string'
}

export function isWebhookConfig(config: any): config is WebhookConfig {
  return config && typeof config.url === 'string'
}

export function isJavascriptConfig(config: any): config is JavascriptConfig {
  return config && typeof config.code === 'string'
}

/**
 * Validation helpers
 */
export function validateToolName(name: string): string | null {
  if (!name || name.length < 3) {
    return 'Le nom doit contenir au moins 3 caractères'
  }
  if (name.length > 50) {
    return 'Le nom ne peut pas dépasser 50 caractères'
  }
  if (!/^[a-z0-9_]+$/.test(name)) {
    return 'Le nom doit être en snake_case (lettres minuscules, chiffres et underscores uniquement)'
  }
  return null
}

export function validateToolDescription(description: string): string | null {
  if (!description || description.length < 10) {
    return 'La description doit contenir au moins 10 caractères'
  }
  if (description.length > 500) {
    return 'La description ne peut pas dépasser 500 caractères'
  }
  return null
}

export function validateRateLimit(value: number, type: 'member' | 'gym'): string | null {
  const min = 1
  const max = type === 'member' ? 100 : 10000
  
  if (value < min || value > max) {
    return `La valeur doit être entre ${min} et ${max}`
  }
  return null
}



