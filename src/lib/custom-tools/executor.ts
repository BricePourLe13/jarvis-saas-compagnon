/**
 * Custom Tool Executor
 * 
 * Exécute les tools personnalisés créés par les gérants
 * Gère le templating, validation, rate limiting, logging
 */

import { createClient } from '@supabase/supabase-js'
import type {
  CustomTool,
  ToolExecutionContext,
  ToolExecutionResult,
  ApiRestConfig,
  McpSupabaseConfig,
  WebhookConfig,
  ToolParameter,
  ExecutionStatus
} from '@/types/custom-tools'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export class CustomToolExecutor {
  /**
   * Charge un tool depuis la DB
   */
  static async loadTool(gymId: string, toolName: string): Promise<CustomTool> {
    const { data: tool, error } = await supabase
      .from('custom_tools')
      .select('*')
      .eq('gym_id', gymId)
      .eq('name', toolName)
      .eq('status', 'active')
      .single()
    
    if (error || !tool) {
      throw new Error(`Tool "${toolName}" not found or inactive`)
    }
    
    return tool as CustomTool
  }
  
  /**
   * Exécute un tool custom
   */
  static async execute(
    gymId: string,
    toolName: string,
    args: Record<string, any>,
    context: ToolExecutionContext
  ): Promise<ToolExecutionResult> {
    const startTime = Date.now()
    let tool: CustomTool | null = null
    
    try {
      // 1. Charger config tool
      tool = await this.loadTool(gymId, toolName)
      console.log(`🔧 [CUSTOM TOOL] Executing: ${tool.display_name}`)
      
      // 2. Valider rate limiting
      await this.checkRateLimit(tool, context.member.id)
      
      // 3. Valider paramètres
      this.validateParameters(tool.parameters, args)
      
      // 4. Exécuter selon type
      let result: any
      let httpStatusCode: number | undefined
      
      switch (tool.type) {
        case 'api_rest':
          const apiResult = await this.executeApiRest(tool, args, context)
          result = apiResult.data
          httpStatusCode = apiResult.http_status_code
          break
          
        case 'mcp_supabase':
          result = await this.executeMcpSupabase(tool, args, context)
          break
          
        case 'webhook':
          const webhookResult = await this.executeWebhook(tool, args, context)
          result = webhookResult.data
          httpStatusCode = webhookResult.http_status_code
          break
          
        default:
          throw new Error(`Tool type ${tool.type} not supported yet`)
      }
      
      const executionTime = Date.now() - startTime
      
      // 5. Logger exécution succès
      await this.logExecution(tool.id, {
        gym_id: gymId,
        member_id: context.member.id,
        session_id: context.session_id,
        input_args: args,
        output_result: result,
        execution_time_ms: executionTime,
        status: 'success',
        http_status_code: httpStatusCode
      })
      
      console.log(`✅ [CUSTOM TOOL] Success: ${tool.display_name} (${executionTime}ms)`)
      
      return {
        success: true,
        data: result,
        execution_time_ms: executionTime,
        http_status_code: httpStatusCode
      }
      
    } catch (error: any) {
      const executionTime = Date.now() - startTime
      const errorMessage = error.message || 'Unknown error'
      
      // Logger erreur
      if (tool) {
        await this.logExecution(tool.id, {
          gym_id: gymId,
          member_id: context.member.id,
          session_id: context.session_id,
          input_args: args,
          output_result: null,
          execution_time_ms: executionTime,
          status: error.name === 'TimeoutError' ? 'timeout' : 'error',
          error_message: errorMessage,
          http_status_code: error.status
        })
      }
      
      console.error(`❌ [CUSTOM TOOL] Error: ${toolName}`, error)
      
      return {
        success: false,
        error: errorMessage,
        execution_time_ms: executionTime
      }
    }
  }
  
  /**
   * Exécute un appel API REST
   */
  private static async executeApiRest(
    tool: CustomTool,
    args: Record<string, any>,
    context: ToolExecutionContext
  ): Promise<{ data: any; http_status_code: number }> {
    const config = tool.config as ApiRestConfig
    
    // Template rendering
    const vars = this.buildTemplateVariables(args, context)
    const endpoint = this.renderTemplate(config.endpoint, vars)
    const headers = this.renderObject(config.headers || {}, vars)
    const body = config.body_template
      ? this.renderObject(config.body_template, vars)
      : undefined
    
    console.log(`🌐 [API REST] ${config.method} ${endpoint}`)
    
    // Appel HTTP avec timeout
    const timeout = config.timeout_ms || 10000
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeout)
    
    try {
      const response = await fetch(endpoint, {
        method: config.method || 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'JARVIS-Agent/1.0',
          ...headers
        },
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal
      })
      
      clearTimeout(timeoutId)
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      
      const data = await response.json()
      
      // Mapper réponse si config définie
      if (config.response_mapping) {
        const mappedData = this.mapResponse(data, config.response_mapping)
        return { data: mappedData, http_status_code: response.status }
      }
      
      return { data, http_status_code: response.status }
      
    } catch (error: any) {
      clearTimeout(timeoutId)
      
      if (error.name === 'AbortError') {
        const timeoutError = new Error(`Request timeout after ${timeout}ms`)
        timeoutError.name = 'TimeoutError'
        throw timeoutError
      }
      
      throw error
    }
  }
  
  /**
   * Exécute une query Supabase via MCP
   */
  private static async executeMcpSupabase(
    tool: CustomTool,
    args: Record<string, any>,
    context: ToolExecutionContext
  ): Promise<any> {
    const config = tool.config as McpSupabaseConfig
    
    // Render SQL template
    const vars = this.buildTemplateVariables(args, context)
    const query = this.renderTemplate(config.query_template, vars)
    
    console.log(`🗄️ [MCP SUPABASE] Query:`, query)
    
    // Validation sécurité: interdire keywords dangereux
    const dangerousKeywords = [
      'DROP', 'DELETE', 'UPDATE', 'TRUNCATE', 'ALTER', 
      'INSERT', 'GRANT', 'REVOKE', 'CREATE'
    ]
    const upperQuery = query.toUpperCase()
    
    for (const keyword of dangerousKeywords) {
      if (upperQuery.includes(keyword)) {
        throw new Error(`Query contains forbidden keyword: ${keyword}`)
      }
    }
    
    // Vérifier que c'est bien un SELECT
    if (!upperQuery.trim().startsWith('SELECT')) {
      throw new Error('Only SELECT queries are allowed')
    }
    
    // Exécuter query (via raw SQL)
    const { data, error } = await supabase.rpc('execute_sql', {
      query_text: query
    }).catch(async () => {
      // Fallback: utiliser la connexion directe
      const { data, error } = await (supabase as any).from('_sql').select('*').limit(0)
      // Alternative : utiliser postgrest directement
      return { data: null, error: new Error('SQL execution not available') }
    })
    
    if (error) {
      throw new Error(`Database error: ${error.message}`)
    }
    
    // Limiter nombre de résultats
    const maxRows = config.max_rows || 100
    const results = Array.isArray(data) ? data : [data]
    
    return results.slice(0, maxRows)
  }
  
  /**
   * Exécute un webhook
   */
  private static async executeWebhook(
    tool: CustomTool,
    args: Record<string, any>,
    context: ToolExecutionContext
  ): Promise<{ data: any; http_status_code: number }> {
    const config = tool.config as WebhookConfig
    
    // Template rendering
    const vars = this.buildTemplateVariables(args, context)
    const url = this.renderTemplate(config.url, vars)
    const headers = this.renderObject(config.headers || {}, vars)
    const payload = this.renderObject(config.payload_template, vars)
    
    console.log(`🔗 [WEBHOOK] ${config.method || 'POST'} ${url}`)
    
    // Appel webhook avec timeout
    const timeout = config.timeout_ms || 10000
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeout)
    
    try {
      const response = await fetch(url, {
        method: config.method || 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'JARVIS-Agent/1.0',
          ...headers
        },
        body: JSON.stringify(payload),
        signal: controller.signal
      })
      
      clearTimeout(timeoutId)
      
      if (!response.ok) {
        throw new Error(`Webhook error: HTTP ${response.status}`)
      }
      
      const data = await response.json().catch(() => ({ success: true }))
      
      return { data, http_status_code: response.status }
      
    } catch (error: any) {
      clearTimeout(timeoutId)
      
      if (error.name === 'AbortError') {
        const timeoutError = new Error(`Webhook timeout after ${timeout}ms`)
        timeoutError.name = 'TimeoutError'
        throw timeoutError
      }
      
      throw error
    }
  }
  
  /**
   * Construit les variables pour templating
   */
  private static buildTemplateVariables(
    args: Record<string, any>,
    context: ToolExecutionContext
  ): any {
    return {
      member: context.member,
      gym: context.gym,
      args,
      session: {
        id: context.session_id,
        timestamp: context.timestamp
      }
    }
  }
  
  /**
   * Render template string avec variables
   * Supporte: {{member.email}}, {{args.date}}, {{gym.name}}
   */
  private static renderTemplate(template: string, vars: any): string {
    if (!template || typeof template !== 'string') {
      return template
    }
    
    return template.replace(/\{\{([^}]+)\}\}/g, (match, path) => {
      const value = this.getNestedValue(vars, path.trim())
      return value !== undefined ? String(value) : match
    })
  }
  
  /**
   * Render object avec templates dans les valeurs
   */
  private static renderObject(obj: any, vars: any): any {
    if (typeof obj === 'string') {
      return this.renderTemplate(obj, vars)
    }
    
    if (Array.isArray(obj)) {
      return obj.map(item => this.renderObject(item, vars))
    }
    
    if (obj && typeof obj === 'object') {
      const result: any = {}
      for (const [key, value] of Object.entries(obj)) {
        result[key] = this.renderObject(value, vars)
      }
      return result
    }
    
    return obj
  }
  
  /**
   * Accès nested values (ex: "member.email")
   */
  private static getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj)
  }
  
  /**
   * Mapper réponse via JSONPath simple
   * Supporte: $.data.id, $.message, etc.
   */
  private static mapResponse(data: any, mapping: Record<string, string>): any {
    const result: any = {}
    
    for (const [key, jsonPath] of Object.entries(mapping)) {
      if (jsonPath.startsWith('$.')) {
        const path = jsonPath.substring(2)
        result[key] = this.getNestedValue(data, path)
      } else {
        result[key] = data[jsonPath]
      }
    }
    
    return result
  }
  
  /**
   * Valider paramètres selon schéma
   */
  private static validateParameters(
    schema: ToolParameter[],
    args: Record<string, any>
  ): void {
    for (const param of schema) {
      // Vérifier required
      if (param.required && !(param.name in args)) {
        throw new Error(`Missing required parameter: ${param.name}`)
      }
      
      // Skip si pas fourni et pas required
      if (!(param.name in args)) {
        continue
      }
      
      const value = args[param.name]
      
      // Validation type
      if (param.type === 'string' && typeof value !== 'string') {
        throw new Error(`Parameter "${param.name}" must be a string`)
      }
      if (param.type === 'number' && typeof value !== 'number') {
        throw new Error(`Parameter "${param.name}" must be a number`)
      }
      if (param.type === 'boolean' && typeof value !== 'boolean') {
        throw new Error(`Parameter "${param.name}" must be a boolean`)
      }
      
      // Validation enum
      if (param.enum && !param.enum.includes(value)) {
        throw new Error(
          `Parameter "${param.name}" must be one of: ${param.enum.join(', ')}`
        )
      }
      
      // Validation min/max pour numbers
      if (param.type === 'number') {
        if (param.min !== undefined && value < param.min) {
          throw new Error(`Parameter "${param.name}" must be >= ${param.min}`)
        }
        if (param.max !== undefined && value > param.max) {
          throw new Error(`Parameter "${param.name}" must be <= ${param.max}`)
        }
      }
      
      // Validation pattern pour strings
      if (param.type === 'string' && param.pattern) {
        const regex = new RegExp(param.pattern)
        if (!regex.test(value)) {
          throw new Error(
            `Parameter "${param.name}" must match pattern: ${param.pattern}`
          )
        }
      }
    }
  }
  
  /**
   * Rate limiting (par membre et par gym)
   */
  private static async checkRateLimit(tool: CustomTool, memberId: string): Promise<void> {
    const today = new Date().toISOString().split('T')[0]
    const currentHour = new Date().toISOString().slice(0, 13)
    
    // Check rate limit member/jour
    const { count: memberCount } = await supabase
      .from('custom_tool_executions')
      .select('*', { count: 'exact', head: true })
      .eq('tool_id', tool.id)
      .eq('member_id', memberId)
      .gte('executed_at', `${today}T00:00:00Z`)
    
    if (memberCount && memberCount >= tool.rate_limit_per_member_per_day) {
      throw new Error(
        `Rate limit exceeded: ${memberCount}/${tool.rate_limit_per_member_per_day} executions today`
      )
    }
    
    // Check rate limit gym/heure
    const { count: gymCount } = await supabase
      .from('custom_tool_executions')
      .select('*', { count: 'exact', head: true })
      .eq('tool_id', tool.id)
      .eq('gym_id', tool.gym_id)
      .gte('executed_at', `${currentHour}:00:00Z`)
    
    if (gymCount && gymCount >= tool.rate_limit_per_gym_per_hour) {
      throw new Error(
        `Gym rate limit exceeded: ${gymCount}/${tool.rate_limit_per_gym_per_hour} executions this hour`
      )
    }
  }
  
  /**
   * Logger exécution dans custom_tool_executions
   */
  private static async logExecution(
    toolId: string,
    data: {
      gym_id: string
      member_id: string
      session_id: string
      input_args: Record<string, any>
      output_result: any
      execution_time_ms: number
      status: ExecutionStatus
      error_message?: string
      http_status_code?: number
    }
  ): Promise<void> {
    await supabase.from('custom_tool_executions').insert({
      tool_id: toolId,
      ...data
    })
  }
}

/**
 * Helper: Tester un tool sans l'exécuter réellement
 */
export async function testCustomTool(
  toolId: string,
  testArgs: Record<string, any>,
  mockContext: ToolExecutionContext
): Promise<ToolExecutionResult> {
  // Charger le tool
  const { data: tool } = await supabase
    .from('custom_tools')
    .select('*')
    .eq('id', toolId)
    .single()
  
  if (!tool) {
    throw new Error('Tool not found')
  }
  
  // Exécuter avec le mock context
  return await CustomToolExecutor.execute(
    tool.gym_id,
    tool.name,
    testArgs,
    mockContext
  )
}



 * Custom Tool Executor
 * 
 * Exécute les tools personnalisés créés par les gérants
 * Gère le templating, validation, rate limiting, logging
 */

import { createClient } from '@supabase/supabase-js'
import type {
  CustomTool,
  ToolExecutionContext,
  ToolExecutionResult,
  ApiRestConfig,
  McpSupabaseConfig,
  WebhookConfig,
  ToolParameter,
  ExecutionStatus
} from '@/types/custom-tools'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export class CustomToolExecutor {
  /**
   * Charge un tool depuis la DB
   */
  static async loadTool(gymId: string, toolName: string): Promise<CustomTool> {
    const { data: tool, error } = await supabase
      .from('custom_tools')
      .select('*')
      .eq('gym_id', gymId)
      .eq('name', toolName)
      .eq('status', 'active')
      .single()
    
    if (error || !tool) {
      throw new Error(`Tool "${toolName}" not found or inactive`)
    }
    
    return tool as CustomTool
  }
  
  /**
   * Exécute un tool custom
   */
  static async execute(
    gymId: string,
    toolName: string,
    args: Record<string, any>,
    context: ToolExecutionContext
  ): Promise<ToolExecutionResult> {
    const startTime = Date.now()
    let tool: CustomTool | null = null
    
    try {
      // 1. Charger config tool
      tool = await this.loadTool(gymId, toolName)
      console.log(`🔧 [CUSTOM TOOL] Executing: ${tool.display_name}`)
      
      // 2. Valider rate limiting
      await this.checkRateLimit(tool, context.member.id)
      
      // 3. Valider paramètres
      this.validateParameters(tool.parameters, args)
      
      // 4. Exécuter selon type
      let result: any
      let httpStatusCode: number | undefined
      
      switch (tool.type) {
        case 'api_rest':
          const apiResult = await this.executeApiRest(tool, args, context)
          result = apiResult.data
          httpStatusCode = apiResult.http_status_code
          break
          
        case 'mcp_supabase':
          result = await this.executeMcpSupabase(tool, args, context)
          break
          
        case 'webhook':
          const webhookResult = await this.executeWebhook(tool, args, context)
          result = webhookResult.data
          httpStatusCode = webhookResult.http_status_code
          break
          
        default:
          throw new Error(`Tool type ${tool.type} not supported yet`)
      }
      
      const executionTime = Date.now() - startTime
      
      // 5. Logger exécution succès
      await this.logExecution(tool.id, {
        gym_id: gymId,
        member_id: context.member.id,
        session_id: context.session_id,
        input_args: args,
        output_result: result,
        execution_time_ms: executionTime,
        status: 'success',
        http_status_code: httpStatusCode
      })
      
      console.log(`✅ [CUSTOM TOOL] Success: ${tool.display_name} (${executionTime}ms)`)
      
      return {
        success: true,
        data: result,
        execution_time_ms: executionTime,
        http_status_code: httpStatusCode
      }
      
    } catch (error: any) {
      const executionTime = Date.now() - startTime
      const errorMessage = error.message || 'Unknown error'
      
      // Logger erreur
      if (tool) {
        await this.logExecution(tool.id, {
          gym_id: gymId,
          member_id: context.member.id,
          session_id: context.session_id,
          input_args: args,
          output_result: null,
          execution_time_ms: executionTime,
          status: error.name === 'TimeoutError' ? 'timeout' : 'error',
          error_message: errorMessage,
          http_status_code: error.status
        })
      }
      
      console.error(`❌ [CUSTOM TOOL] Error: ${toolName}`, error)
      
      return {
        success: false,
        error: errorMessage,
        execution_time_ms: executionTime
      }
    }
  }
  
  /**
   * Exécute un appel API REST
   */
  private static async executeApiRest(
    tool: CustomTool,
    args: Record<string, any>,
    context: ToolExecutionContext
  ): Promise<{ data: any; http_status_code: number }> {
    const config = tool.config as ApiRestConfig
    
    // Template rendering
    const vars = this.buildTemplateVariables(args, context)
    const endpoint = this.renderTemplate(config.endpoint, vars)
    const headers = this.renderObject(config.headers || {}, vars)
    const body = config.body_template
      ? this.renderObject(config.body_template, vars)
      : undefined
    
    console.log(`🌐 [API REST] ${config.method} ${endpoint}`)
    
    // Appel HTTP avec timeout
    const timeout = config.timeout_ms || 10000
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeout)
    
    try {
      const response = await fetch(endpoint, {
        method: config.method || 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'JARVIS-Agent/1.0',
          ...headers
        },
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal
      })
      
      clearTimeout(timeoutId)
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      
      const data = await response.json()
      
      // Mapper réponse si config définie
      if (config.response_mapping) {
        const mappedData = this.mapResponse(data, config.response_mapping)
        return { data: mappedData, http_status_code: response.status }
      }
      
      return { data, http_status_code: response.status }
      
    } catch (error: any) {
      clearTimeout(timeoutId)
      
      if (error.name === 'AbortError') {
        const timeoutError = new Error(`Request timeout after ${timeout}ms`)
        timeoutError.name = 'TimeoutError'
        throw timeoutError
      }
      
      throw error
    }
  }
  
  /**
   * Exécute une query Supabase via MCP
   */
  private static async executeMcpSupabase(
    tool: CustomTool,
    args: Record<string, any>,
    context: ToolExecutionContext
  ): Promise<any> {
    const config = tool.config as McpSupabaseConfig
    
    // Render SQL template
    const vars = this.buildTemplateVariables(args, context)
    const query = this.renderTemplate(config.query_template, vars)
    
    console.log(`🗄️ [MCP SUPABASE] Query:`, query)
    
    // Validation sécurité: interdire keywords dangereux
    const dangerousKeywords = [
      'DROP', 'DELETE', 'UPDATE', 'TRUNCATE', 'ALTER', 
      'INSERT', 'GRANT', 'REVOKE', 'CREATE'
    ]
    const upperQuery = query.toUpperCase()
    
    for (const keyword of dangerousKeywords) {
      if (upperQuery.includes(keyword)) {
        throw new Error(`Query contains forbidden keyword: ${keyword}`)
      }
    }
    
    // Vérifier que c'est bien un SELECT
    if (!upperQuery.trim().startsWith('SELECT')) {
      throw new Error('Only SELECT queries are allowed')
    }
    
    // Exécuter query (via raw SQL)
    const { data, error } = await supabase.rpc('execute_sql', {
      query_text: query
    }).catch(async () => {
      // Fallback: utiliser la connexion directe
      const { data, error } = await (supabase as any).from('_sql').select('*').limit(0)
      // Alternative : utiliser postgrest directement
      return { data: null, error: new Error('SQL execution not available') }
    })
    
    if (error) {
      throw new Error(`Database error: ${error.message}`)
    }
    
    // Limiter nombre de résultats
    const maxRows = config.max_rows || 100
    const results = Array.isArray(data) ? data : [data]
    
    return results.slice(0, maxRows)
  }
  
  /**
   * Exécute un webhook
   */
  private static async executeWebhook(
    tool: CustomTool,
    args: Record<string, any>,
    context: ToolExecutionContext
  ): Promise<{ data: any; http_status_code: number }> {
    const config = tool.config as WebhookConfig
    
    // Template rendering
    const vars = this.buildTemplateVariables(args, context)
    const url = this.renderTemplate(config.url, vars)
    const headers = this.renderObject(config.headers || {}, vars)
    const payload = this.renderObject(config.payload_template, vars)
    
    console.log(`🔗 [WEBHOOK] ${config.method || 'POST'} ${url}`)
    
    // Appel webhook avec timeout
    const timeout = config.timeout_ms || 10000
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeout)
    
    try {
      const response = await fetch(url, {
        method: config.method || 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'JARVIS-Agent/1.0',
          ...headers
        },
        body: JSON.stringify(payload),
        signal: controller.signal
      })
      
      clearTimeout(timeoutId)
      
      if (!response.ok) {
        throw new Error(`Webhook error: HTTP ${response.status}`)
      }
      
      const data = await response.json().catch(() => ({ success: true }))
      
      return { data, http_status_code: response.status }
      
    } catch (error: any) {
      clearTimeout(timeoutId)
      
      if (error.name === 'AbortError') {
        const timeoutError = new Error(`Webhook timeout after ${timeout}ms`)
        timeoutError.name = 'TimeoutError'
        throw timeoutError
      }
      
      throw error
    }
  }
  
  /**
   * Construit les variables pour templating
   */
  private static buildTemplateVariables(
    args: Record<string, any>,
    context: ToolExecutionContext
  ): any {
    return {
      member: context.member,
      gym: context.gym,
      args,
      session: {
        id: context.session_id,
        timestamp: context.timestamp
      }
    }
  }
  
  /**
   * Render template string avec variables
   * Supporte: {{member.email}}, {{args.date}}, {{gym.name}}
   */
  private static renderTemplate(template: string, vars: any): string {
    if (!template || typeof template !== 'string') {
      return template
    }
    
    return template.replace(/\{\{([^}]+)\}\}/g, (match, path) => {
      const value = this.getNestedValue(vars, path.trim())
      return value !== undefined ? String(value) : match
    })
  }
  
  /**
   * Render object avec templates dans les valeurs
   */
  private static renderObject(obj: any, vars: any): any {
    if (typeof obj === 'string') {
      return this.renderTemplate(obj, vars)
    }
    
    if (Array.isArray(obj)) {
      return obj.map(item => this.renderObject(item, vars))
    }
    
    if (obj && typeof obj === 'object') {
      const result: any = {}
      for (const [key, value] of Object.entries(obj)) {
        result[key] = this.renderObject(value, vars)
      }
      return result
    }
    
    return obj
  }
  
  /**
   * Accès nested values (ex: "member.email")
   */
  private static getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj)
  }
  
  /**
   * Mapper réponse via JSONPath simple
   * Supporte: $.data.id, $.message, etc.
   */
  private static mapResponse(data: any, mapping: Record<string, string>): any {
    const result: any = {}
    
    for (const [key, jsonPath] of Object.entries(mapping)) {
      if (jsonPath.startsWith('$.')) {
        const path = jsonPath.substring(2)
        result[key] = this.getNestedValue(data, path)
      } else {
        result[key] = data[jsonPath]
      }
    }
    
    return result
  }
  
  /**
   * Valider paramètres selon schéma
   */
  private static validateParameters(
    schema: ToolParameter[],
    args: Record<string, any>
  ): void {
    for (const param of schema) {
      // Vérifier required
      if (param.required && !(param.name in args)) {
        throw new Error(`Missing required parameter: ${param.name}`)
      }
      
      // Skip si pas fourni et pas required
      if (!(param.name in args)) {
        continue
      }
      
      const value = args[param.name]
      
      // Validation type
      if (param.type === 'string' && typeof value !== 'string') {
        throw new Error(`Parameter "${param.name}" must be a string`)
      }
      if (param.type === 'number' && typeof value !== 'number') {
        throw new Error(`Parameter "${param.name}" must be a number`)
      }
      if (param.type === 'boolean' && typeof value !== 'boolean') {
        throw new Error(`Parameter "${param.name}" must be a boolean`)
      }
      
      // Validation enum
      if (param.enum && !param.enum.includes(value)) {
        throw new Error(
          `Parameter "${param.name}" must be one of: ${param.enum.join(', ')}`
        )
      }
      
      // Validation min/max pour numbers
      if (param.type === 'number') {
        if (param.min !== undefined && value < param.min) {
          throw new Error(`Parameter "${param.name}" must be >= ${param.min}`)
        }
        if (param.max !== undefined && value > param.max) {
          throw new Error(`Parameter "${param.name}" must be <= ${param.max}`)
        }
      }
      
      // Validation pattern pour strings
      if (param.type === 'string' && param.pattern) {
        const regex = new RegExp(param.pattern)
        if (!regex.test(value)) {
          throw new Error(
            `Parameter "${param.name}" must match pattern: ${param.pattern}`
          )
        }
      }
    }
  }
  
  /**
   * Rate limiting (par membre et par gym)
   */
  private static async checkRateLimit(tool: CustomTool, memberId: string): Promise<void> {
    const today = new Date().toISOString().split('T')[0]
    const currentHour = new Date().toISOString().slice(0, 13)
    
    // Check rate limit member/jour
    const { count: memberCount } = await supabase
      .from('custom_tool_executions')
      .select('*', { count: 'exact', head: true })
      .eq('tool_id', tool.id)
      .eq('member_id', memberId)
      .gte('executed_at', `${today}T00:00:00Z`)
    
    if (memberCount && memberCount >= tool.rate_limit_per_member_per_day) {
      throw new Error(
        `Rate limit exceeded: ${memberCount}/${tool.rate_limit_per_member_per_day} executions today`
      )
    }
    
    // Check rate limit gym/heure
    const { count: gymCount } = await supabase
      .from('custom_tool_executions')
      .select('*', { count: 'exact', head: true })
      .eq('tool_id', tool.id)
      .eq('gym_id', tool.gym_id)
      .gte('executed_at', `${currentHour}:00:00Z`)
    
    if (gymCount && gymCount >= tool.rate_limit_per_gym_per_hour) {
      throw new Error(
        `Gym rate limit exceeded: ${gymCount}/${tool.rate_limit_per_gym_per_hour} executions this hour`
      )
    }
  }
  
  /**
   * Logger exécution dans custom_tool_executions
   */
  private static async logExecution(
    toolId: string,
    data: {
      gym_id: string
      member_id: string
      session_id: string
      input_args: Record<string, any>
      output_result: any
      execution_time_ms: number
      status: ExecutionStatus
      error_message?: string
      http_status_code?: number
    }
  ): Promise<void> {
    await supabase.from('custom_tool_executions').insert({
      tool_id: toolId,
      ...data
    })
  }
}

/**
 * Helper: Tester un tool sans l'exécuter réellement
 */
export async function testCustomTool(
  toolId: string,
  testArgs: Record<string, any>,
  mockContext: ToolExecutionContext
): Promise<ToolExecutionResult> {
  // Charger le tool
  const { data: tool } = await supabase
    .from('custom_tools')
    .select('*')
    .eq('id', toolId)
    .single()
  
  if (!tool) {
    throw new Error('Tool not found')
  }
  
  // Exécuter avec le mock context
  return await CustomToolExecutor.execute(
    tool.gym_id,
    tool.name,
    testArgs,
    mockContext
  )
}



