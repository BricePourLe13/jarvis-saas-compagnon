/**
 * Custom Tools - Helpers
 * Fonctions utilitaires pour manipuler les custom tools
 */

import { createClient } from '@supabase/supabase-js'
import type {
  CustomTool,
  CustomToolExecution,
  ToolAnalytics,
  GymToolsStats,
  ToolExecutionContext
} from '@/types/custom-tools'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

/**
 * Récupère tous les tools actifs d'une gym
 */
export async function getActiveTools(gymId: string): Promise<CustomTool[]> {
  const { data, error } = await supabase
    .from('custom_tools')
    .select('*')
    .eq('gym_id', gymId)
    .eq('status', 'active')
    .order('display_name', { ascending: true })
  
  if (error) {
    console.error('[CUSTOM TOOLS] Error fetching active tools:', error)
    return []
  }
  
  return (data || []) as CustomTool[]
}

/**
 * Récupère tous les tools d'une gym (tous status)
 */
export async function getAllTools(gymId: string): Promise<CustomTool[]> {
  const { data, error } = await supabase
    .from('custom_tools')
    .select('*')
    .eq('gym_id', gymId)
    .order('created_at', { ascending: false })
  
  if (error) {
    console.error('[CUSTOM TOOLS] Error fetching all tools:', error)
    return []
  }
  
  return (data || []) as CustomTool[]
}

/**
 * Récupère un tool par ID
 */
export async function getToolById(toolId: string): Promise<CustomTool | null> {
  const { data, error } = await supabase
    .from('custom_tools')
    .select('*')
    .eq('id', toolId)
    .single()
  
  if (error) {
    console.error('[CUSTOM TOOLS] Error fetching tool:', error)
    return null
  }
  
  return data as CustomTool
}

/**
 * Convertit un custom tool en format OpenAI function
 */
export function toolToOpenAIFunction(tool: CustomTool) {
  return {
    type: 'function' as const,
    name: tool.name,
    description: tool.description,
    parameters: {
      type: 'object',
      properties: tool.parameters.reduce((acc, param) => {
        acc[param.name] = {
          type: param.type,
          description: param.description,
          ...(param.enum && { enum: param.enum })
        }
        return acc
      }, {} as Record<string, any>),
      required: tool.parameters
        .filter(p => p.required)
        .map(p => p.name)
    }
  }
}

/**
 * Convertit tous les tools d'une gym en format OpenAI functions
 */
export async function getOpenAIFunctionsForGym(gymId: string) {
  const tools = await getActiveTools(gymId)
  return tools.map(toolToOpenAIFunction)
}

/**
 * Récupère les logs d'exécution d'un tool
 */
export async function getToolExecutions(
  toolId: string,
  limit = 50
): Promise<CustomToolExecution[]> {
  const { data, error } = await supabase
    .from('custom_tool_executions')
    .select('*')
    .eq('tool_id', toolId)
    .order('executed_at', { ascending: false })
    .limit(limit)
  
  if (error) {
    console.error('[CUSTOM TOOLS] Error fetching executions:', error)
    return []
  }
  
  return (data || []) as CustomToolExecution[]
}

/**
 * Calcule les analytics d'un tool
 */
export async function getToolAnalytics(toolId: string): Promise<ToolAnalytics | null> {
  const tool = await getToolById(toolId)
  if (!tool) return null
  
  // Récupérer exécutions des 30 derniers jours
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
  
  const { data: executions } = await supabase
    .from('custom_tool_executions')
    .select('*')
    .eq('tool_id', toolId)
    .gte('executed_at', thirtyDaysAgo.toISOString())
  
  if (!executions || executions.length === 0) {
    return {
      tool_id: toolId,
      tool_name: tool.display_name,
      total_executions: 0,
      successful_executions: 0,
      failed_executions: 0,
      timeout_executions: 0,
      success_rate: 0,
      avg_execution_time_ms: 0,
      last_used_at: null,
      most_active_hours: [],
      top_users: []
    }
  }
  
  const successful = executions.filter(e => e.status === 'success').length
  const failed = executions.filter(e => e.status === 'error').length
  const timeout = executions.filter(e => e.status === 'timeout').length
  
  // Heures les plus actives
  const hourCounts: Record<number, number> = {}
  executions.forEach(e => {
    const hour = new Date(e.executed_at).getHours()
    hourCounts[hour] = (hourCounts[hour] || 0) + 1
  })
  const mostActiveHours = Object.entries(hourCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)
    .map(([hour]) => parseInt(hour))
  
  // Top utilisateurs
  const userCounts: Record<string, number> = {}
  executions.forEach(e => {
    if (e.member_id) {
      userCounts[e.member_id] = (userCounts[e.member_id] || 0) + 1
    }
  })
  
  const topUsers = await Promise.all(
    Object.entries(userCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(async ([memberId, count]) => {
        const { data: member } = await supabase
          .from('gym_members_v2')
          .select('first_name, last_name')
          .eq('id', memberId)
          .single()
        
        return {
          member_id: memberId,
          member_name: member ? `${member.first_name} ${member.last_name}` : 'Inconnu',
          execution_count: count
        }
      })
  )
  
  return {
    tool_id: toolId,
    tool_name: tool.display_name,
    total_executions: executions.length,
    successful_executions: successful,
    failed_executions: failed,
    timeout_executions: timeout,
    success_rate: (successful / executions.length) * 100,
    avg_execution_time_ms: tool.avg_execution_time_ms,
    last_used_at: tool.last_used_at,
    most_active_hours: mostActiveHours,
    top_users: topUsers
  }
}

/**
 * Récupère les stats globales des tools d'une gym
 */
export async function getGymToolsStats(gymId: string): Promise<GymToolsStats> {
  const tools = await getAllTools(gymId)
  
  const activeTools = tools.filter(t => t.status === 'active').length
  const draftTools = tools.filter(t => t.status === 'draft').length
  const pausedTools = tools.filter(t => t.status === 'paused').length
  
  // Exécutions aujourd'hui
  const today = new Date().toISOString().split('T')[0]
  const { count: todayCount } = await supabase
    .from('custom_tool_executions')
    .select('*', { count: 'exact', head: true })
    .eq('gym_id', gymId)
    .gte('executed_at', `${today}T00:00:00Z`)
  
  // Exécutions cette semaine
  const weekAgo = new Date()
  weekAgo.setDate(weekAgo.getDate() - 7)
  const { count: weekCount } = await supabase
    .from('custom_tool_executions')
    .select('*', { count: 'exact', head: true })
    .eq('gym_id', gymId)
    .gte('executed_at', weekAgo.toISOString())
  
  // Success rate moyen
  const avgSuccessRate = tools.length > 0
    ? tools.reduce((sum, t) => sum + t.success_rate, 0) / tools.length
    : 0
  
  // Tool le plus utilisé
  const mostUsedTool = tools.length > 0
    ? tools.reduce((prev, current) => 
        current.usage_count > prev.usage_count ? current : prev
      )
    : null
  
  return {
    total_tools: tools.length,
    active_tools: activeTools,
    draft_tools: draftTools,
    paused_tools: pausedTools,
    total_executions_today: todayCount || 0,
    total_executions_week: weekCount || 0,
    avg_success_rate: avgSuccessRate,
    most_used_tool: mostUsedTool ? {
      id: mostUsedTool.id,
      name: mostUsedTool.display_name,
      usage_count: mostUsedTool.usage_count
    } : null
  }
}

/**
 * Crée un contexte d'exécution à partir des données membre/gym
 */
export async function buildExecutionContext(
  memberId: string,
  gymId: string,
  sessionId: string
): Promise<ToolExecutionContext> {
  // Charger membre
  const { data: member } = await supabase
    .from('gym_members_v2')
    .select('id, email, first_name, last_name, badge_id, membership_type')
    .eq('id', memberId)
    .single()
  
  // Charger gym
  const { data: gym } = await supabase
    .from('gyms')
    .select('id, name, opening_hours')
    .eq('id', gymId)
    .single()
  
  if (!member || !gym) {
    throw new Error('Member or gym not found')
  }
  
  return {
    member: {
      id: member.id,
      email: member.email,
      first_name: member.first_name,
      last_name: member.last_name,
      badge_id: member.badge_id,
      membership_type: member.membership_type
    },
    gym: {
      id: gym.id,
      name: gym.name,
      opening_hours: gym.opening_hours
    },
    session_id: sessionId,
    timestamp: new Date().toISOString()
  }
}

/**
 * Désactive un tool (soft delete)
 */
export async function deactivateTool(toolId: string): Promise<boolean> {
  const { error } = await supabase
    .from('custom_tools')
    .update({ status: 'paused', updated_at: new Date().toISOString() })
    .eq('id', toolId)
  
  return !error
}

/**
 * Active un tool
 */
export async function activateTool(toolId: string): Promise<boolean> {
  const { error } = await supabase
    .from('custom_tools')
    .update({ status: 'active', updated_at: new Date().toISOString() })
    .eq('id', toolId)
  
  return !error
}

/**
 * Supprime un tool (définitif)
 */
export async function deleteTool(toolId: string): Promise<boolean> {
  const { error } = await supabase
    .from('custom_tools')
    .delete()
    .eq('id', toolId)
  
  return !error
}

/**
 * Duplique un tool
 */
export async function duplicateTool(
  toolId: string,
  newName: string,
  newDisplayName: string
): Promise<CustomTool | null> {
  const original = await getToolById(toolId)
  if (!original) return null
  
  const { data, error } = await supabase
    .from('custom_tools')
    .insert({
      gym_id: original.gym_id,
      name: newName,
      display_name: newDisplayName,
      description: original.description,
      category: original.category,
      icon: original.icon,
      type: original.type,
      status: 'draft',
      config: original.config,
      parameters: original.parameters,
      auth_type: original.auth_type,
      auth_config: original.auth_config,
      rate_limit_per_member_per_day: original.rate_limit_per_member_per_day,
      rate_limit_per_gym_per_hour: original.rate_limit_per_gym_per_hour,
      test_cases: original.test_cases
    })
    .select()
    .single()
  
  if (error) {
    console.error('[CUSTOM TOOLS] Error duplicating tool:', error)
    return null
  }
  
  return data as CustomTool
}



 * Custom Tools - Helpers
 * Fonctions utilitaires pour manipuler les custom tools
 */

import { createClient } from '@supabase/supabase-js'
import type {
  CustomTool,
  CustomToolExecution,
  ToolAnalytics,
  GymToolsStats,
  ToolExecutionContext
} from '@/types/custom-tools'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

/**
 * Récupère tous les tools actifs d'une gym
 */
export async function getActiveTools(gymId: string): Promise<CustomTool[]> {
  const { data, error } = await supabase
    .from('custom_tools')
    .select('*')
    .eq('gym_id', gymId)
    .eq('status', 'active')
    .order('display_name', { ascending: true })
  
  if (error) {
    console.error('[CUSTOM TOOLS] Error fetching active tools:', error)
    return []
  }
  
  return (data || []) as CustomTool[]
}

/**
 * Récupère tous les tools d'une gym (tous status)
 */
export async function getAllTools(gymId: string): Promise<CustomTool[]> {
  const { data, error } = await supabase
    .from('custom_tools')
    .select('*')
    .eq('gym_id', gymId)
    .order('created_at', { ascending: false })
  
  if (error) {
    console.error('[CUSTOM TOOLS] Error fetching all tools:', error)
    return []
  }
  
  return (data || []) as CustomTool[]
}

/**
 * Récupère un tool par ID
 */
export async function getToolById(toolId: string): Promise<CustomTool | null> {
  const { data, error } = await supabase
    .from('custom_tools')
    .select('*')
    .eq('id', toolId)
    .single()
  
  if (error) {
    console.error('[CUSTOM TOOLS] Error fetching tool:', error)
    return null
  }
  
  return data as CustomTool
}

/**
 * Convertit un custom tool en format OpenAI function
 */
export function toolToOpenAIFunction(tool: CustomTool) {
  return {
    type: 'function' as const,
    name: tool.name,
    description: tool.description,
    parameters: {
      type: 'object',
      properties: tool.parameters.reduce((acc, param) => {
        acc[param.name] = {
          type: param.type,
          description: param.description,
          ...(param.enum && { enum: param.enum })
        }
        return acc
      }, {} as Record<string, any>),
      required: tool.parameters
        .filter(p => p.required)
        .map(p => p.name)
    }
  }
}

/**
 * Convertit tous les tools d'une gym en format OpenAI functions
 */
export async function getOpenAIFunctionsForGym(gymId: string) {
  const tools = await getActiveTools(gymId)
  return tools.map(toolToOpenAIFunction)
}

/**
 * Récupère les logs d'exécution d'un tool
 */
export async function getToolExecutions(
  toolId: string,
  limit = 50
): Promise<CustomToolExecution[]> {
  const { data, error } = await supabase
    .from('custom_tool_executions')
    .select('*')
    .eq('tool_id', toolId)
    .order('executed_at', { ascending: false })
    .limit(limit)
  
  if (error) {
    console.error('[CUSTOM TOOLS] Error fetching executions:', error)
    return []
  }
  
  return (data || []) as CustomToolExecution[]
}

/**
 * Calcule les analytics d'un tool
 */
export async function getToolAnalytics(toolId: string): Promise<ToolAnalytics | null> {
  const tool = await getToolById(toolId)
  if (!tool) return null
  
  // Récupérer exécutions des 30 derniers jours
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
  
  const { data: executions } = await supabase
    .from('custom_tool_executions')
    .select('*')
    .eq('tool_id', toolId)
    .gte('executed_at', thirtyDaysAgo.toISOString())
  
  if (!executions || executions.length === 0) {
    return {
      tool_id: toolId,
      tool_name: tool.display_name,
      total_executions: 0,
      successful_executions: 0,
      failed_executions: 0,
      timeout_executions: 0,
      success_rate: 0,
      avg_execution_time_ms: 0,
      last_used_at: null,
      most_active_hours: [],
      top_users: []
    }
  }
  
  const successful = executions.filter(e => e.status === 'success').length
  const failed = executions.filter(e => e.status === 'error').length
  const timeout = executions.filter(e => e.status === 'timeout').length
  
  // Heures les plus actives
  const hourCounts: Record<number, number> = {}
  executions.forEach(e => {
    const hour = new Date(e.executed_at).getHours()
    hourCounts[hour] = (hourCounts[hour] || 0) + 1
  })
  const mostActiveHours = Object.entries(hourCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)
    .map(([hour]) => parseInt(hour))
  
  // Top utilisateurs
  const userCounts: Record<string, number> = {}
  executions.forEach(e => {
    if (e.member_id) {
      userCounts[e.member_id] = (userCounts[e.member_id] || 0) + 1
    }
  })
  
  const topUsers = await Promise.all(
    Object.entries(userCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(async ([memberId, count]) => {
        const { data: member } = await supabase
          .from('gym_members_v2')
          .select('first_name, last_name')
          .eq('id', memberId)
          .single()
        
        return {
          member_id: memberId,
          member_name: member ? `${member.first_name} ${member.last_name}` : 'Inconnu',
          execution_count: count
        }
      })
  )
  
  return {
    tool_id: toolId,
    tool_name: tool.display_name,
    total_executions: executions.length,
    successful_executions: successful,
    failed_executions: failed,
    timeout_executions: timeout,
    success_rate: (successful / executions.length) * 100,
    avg_execution_time_ms: tool.avg_execution_time_ms,
    last_used_at: tool.last_used_at,
    most_active_hours: mostActiveHours,
    top_users: topUsers
  }
}

/**
 * Récupère les stats globales des tools d'une gym
 */
export async function getGymToolsStats(gymId: string): Promise<GymToolsStats> {
  const tools = await getAllTools(gymId)
  
  const activeTools = tools.filter(t => t.status === 'active').length
  const draftTools = tools.filter(t => t.status === 'draft').length
  const pausedTools = tools.filter(t => t.status === 'paused').length
  
  // Exécutions aujourd'hui
  const today = new Date().toISOString().split('T')[0]
  const { count: todayCount } = await supabase
    .from('custom_tool_executions')
    .select('*', { count: 'exact', head: true })
    .eq('gym_id', gymId)
    .gte('executed_at', `${today}T00:00:00Z`)
  
  // Exécutions cette semaine
  const weekAgo = new Date()
  weekAgo.setDate(weekAgo.getDate() - 7)
  const { count: weekCount } = await supabase
    .from('custom_tool_executions')
    .select('*', { count: 'exact', head: true })
    .eq('gym_id', gymId)
    .gte('executed_at', weekAgo.toISOString())
  
  // Success rate moyen
  const avgSuccessRate = tools.length > 0
    ? tools.reduce((sum, t) => sum + t.success_rate, 0) / tools.length
    : 0
  
  // Tool le plus utilisé
  const mostUsedTool = tools.length > 0
    ? tools.reduce((prev, current) => 
        current.usage_count > prev.usage_count ? current : prev
      )
    : null
  
  return {
    total_tools: tools.length,
    active_tools: activeTools,
    draft_tools: draftTools,
    paused_tools: pausedTools,
    total_executions_today: todayCount || 0,
    total_executions_week: weekCount || 0,
    avg_success_rate: avgSuccessRate,
    most_used_tool: mostUsedTool ? {
      id: mostUsedTool.id,
      name: mostUsedTool.display_name,
      usage_count: mostUsedTool.usage_count
    } : null
  }
}

/**
 * Crée un contexte d'exécution à partir des données membre/gym
 */
export async function buildExecutionContext(
  memberId: string,
  gymId: string,
  sessionId: string
): Promise<ToolExecutionContext> {
  // Charger membre
  const { data: member } = await supabase
    .from('gym_members_v2')
    .select('id, email, first_name, last_name, badge_id, membership_type')
    .eq('id', memberId)
    .single()
  
  // Charger gym
  const { data: gym } = await supabase
    .from('gyms')
    .select('id, name, opening_hours')
    .eq('id', gymId)
    .single()
  
  if (!member || !gym) {
    throw new Error('Member or gym not found')
  }
  
  return {
    member: {
      id: member.id,
      email: member.email,
      first_name: member.first_name,
      last_name: member.last_name,
      badge_id: member.badge_id,
      membership_type: member.membership_type
    },
    gym: {
      id: gym.id,
      name: gym.name,
      opening_hours: gym.opening_hours
    },
    session_id: sessionId,
    timestamp: new Date().toISOString()
  }
}

/**
 * Désactive un tool (soft delete)
 */
export async function deactivateTool(toolId: string): Promise<boolean> {
  const { error } = await supabase
    .from('custom_tools')
    .update({ status: 'paused', updated_at: new Date().toISOString() })
    .eq('id', toolId)
  
  return !error
}

/**
 * Active un tool
 */
export async function activateTool(toolId: string): Promise<boolean> {
  const { error } = await supabase
    .from('custom_tools')
    .update({ status: 'active', updated_at: new Date().toISOString() })
    .eq('id', toolId)
  
  return !error
}

/**
 * Supprime un tool (définitif)
 */
export async function deleteTool(toolId: string): Promise<boolean> {
  const { error } = await supabase
    .from('custom_tools')
    .delete()
    .eq('id', toolId)
  
  return !error
}

/**
 * Duplique un tool
 */
export async function duplicateTool(
  toolId: string,
  newName: string,
  newDisplayName: string
): Promise<CustomTool | null> {
  const original = await getToolById(toolId)
  if (!original) return null
  
  const { data, error } = await supabase
    .from('custom_tools')
    .insert({
      gym_id: original.gym_id,
      name: newName,
      display_name: newDisplayName,
      description: original.description,
      category: original.category,
      icon: original.icon,
      type: original.type,
      status: 'draft',
      config: original.config,
      parameters: original.parameters,
      auth_type: original.auth_type,
      auth_config: original.auth_config,
      rate_limit_per_member_per_day: original.rate_limit_per_member_per_day,
      rate_limit_per_gym_per_hour: original.rate_limit_per_gym_per_hour,
      test_cases: original.test_cases
    })
    .select()
    .single()
  
  if (error) {
    console.error('[CUSTOM TOOLS] Error duplicating tool:', error)
    return null
  }
  
  return data as CustomTool
}



