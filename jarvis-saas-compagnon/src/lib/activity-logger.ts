// ===========================================
// 📊 ACTIVITY LOGGER UTILITY
// ===========================================
// Helper pour logger automatiquement les actions utilisateur

interface LogActivityParams {
  action_type: string
  description: string
  target_type?: string
  target_id?: string
  target_name?: string
  details?: Record<string, unknown>
  old_values?: Record<string, unknown>
  new_values?: Record<string, unknown>
  risk_level?: 'low' | 'medium' | 'high' | 'critical'
  severity?: 'debug' | 'info' | 'warning' | 'error' | 'critical'
}

/**
 * Log une activité utilisateur
 * Utilise l'API /admin/activity pour enregistrer l'action
 */
export async function logActivity(params: LogActivityParams): Promise<boolean> {
  try {
    const response = await fetch('/api/admin/activity', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action_type: params.action_type,
        description: params.description,
        target_type: params.target_type,
        target_id: params.target_id,
        target_name: params.target_name,
        details: params.details || {},
        old_values: params.old_values || {},
        new_values: params.new_values || {},
        risk_level: params.risk_level || 'low',
        severity: params.severity || 'info'
      }),
    })

    const result = await response.json()
    
    if (!result.success) {
      console.warn('⚠️ Échec enregistrement log activité:', result.message)
      return false
    }

    console.log('✅ Log activité enregistré:', params.action_type)
    return true
    
  } catch (error) {
    console.error('❌ Erreur enregistrement log activité:', error)
    return false
  }
}

// ===========================================
// 🎯 HELPERS SPÉCIFIQUES PAR ACTION
// ===========================================

/**
 * Log une connexion utilisateur
 */
export async function logLogin(userDetails?: Record<string, unknown>) {
  return logActivity({
    action_type: 'login',
    description: 'Connexion au dashboard administrateur',
    target_type: 'system',
    details: {
      browser: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
      timestamp: new Date().toISOString(),
      ...userDetails
    },
    severity: 'info'
  })
}

/**
 * Log une déconnexion utilisateur
 */
export async function logLogout() {
  return logActivity({
    action_type: 'logout',
    description: 'Déconnexion du dashboard administrateur',
    target_type: 'system',
    severity: 'info'
  })
}

/**
 * Log la création d'un utilisateur
 */
export async function logUserCreation(
  targetUserId: string, 
  targetUserName: string, 
  userRole: string,
  invitationDetails?: Record<string, any>
) {
  return logActivity({
    action_type: 'user_created',
    description: `Création d'un nouvel utilisateur: ${targetUserName} (${userRole})`,
    target_type: 'user',
    target_id: targetUserId,
    target_name: targetUserName,
    details: {
      user_role: userRole,
      invitation_method: 'email',
      ...invitationDetails
    },
    new_values: {
      full_name: targetUserName,
      role: userRole,
      is_active: false
    },
    risk_level: 'medium',
    severity: 'info'
  })
}

/**
 * Log la modification d'un utilisateur
 */
export async function logUserUpdate(
  targetUserId: string,
  targetUserName: string,
  oldValues: Record<string, unknown>,
  newValues: Record<string, unknown>,
  changedFields: string[]
) {
  const riskLevel = changedFields.includes('role') || changedFields.includes('permissions') ? 'medium' : 'low'
  
  return logActivity({
    action_type: 'user_updated',
    description: `Modification utilisateur: ${targetUserName} (${changedFields.join(', ')})`,
    target_type: 'user',
    target_id: targetUserId,
    target_name: targetUserName,
    details: {
      fields_changed: changedFields,
      change_count: changedFields.length
    },
    old_values: oldValues,
    new_values: newValues,
    risk_level: riskLevel,
    severity: 'info'
  })
}

/**
 * Log la suppression d'un utilisateur
 */
export async function logUserDeletion(
  targetUserId: string,
  targetUserName: string,
  targetUserRole: string
) {
  return logActivity({
    action_type: 'user_deleted',
    description: `Suppression utilisateur: ${targetUserName} (${targetUserRole})`,
    target_type: 'user',
    target_id: targetUserId,
    target_name: targetUserName,
    details: {
      deleted_role: targetUserRole,
      permanent: true
    },
    old_values: {
      full_name: targetUserName,
      role: targetUserRole,
      is_active: true
    },
    risk_level: 'high',
    severity: 'warning'
  })
}

/**
 * Log la modification des permissions d'un utilisateur
 */
export async function logPermissionsUpdate(
  targetUserId: string,
  targetUserName: string,
  oldFranchises: string[],
  newFranchises: string[],
  oldGyms: string[],
  newGyms: string[]
) {
  const franchiseChanges = {
    added: newFranchises.filter(id => !oldFranchises.includes(id)),
    removed: oldFranchises.filter(id => !newFranchises.includes(id))
  }
  
  const gymChanges = {
    added: newGyms.filter(id => !oldGyms.includes(id)),
    removed: oldGyms.filter(id => !newGyms.includes(id))
  }
  
  const hasChanges = franchiseChanges.added.length > 0 || 
                    franchiseChanges.removed.length > 0 || 
                    gymChanges.added.length > 0 || 
                    gymChanges.removed.length > 0
  
  if (!hasChanges) return true // Pas de changements, pas de log
  
  return logActivity({
    action_type: 'permissions_updated',
    description: `Mise à jour permissions: ${targetUserName}`,
    target_type: 'user',
    target_id: targetUserId,
    target_name: targetUserName,
    details: {
      franchise_changes: franchiseChanges,
      gym_changes: gymChanges,
      total_franchises: newFranchises.length,
      total_gyms: newGyms.length
    },
    old_values: {
      franchise_access: oldFranchises,
      gym_access: oldGyms
    },
    new_values: {
      franchise_access: newFranchises,
      gym_access: newGyms
    },
    risk_level: 'medium',
    severity: 'info'
  })
}

/**
 * Log l'envoi d'une invitation
 */
export async function logInvitationSent(
  targetEmail: string,
  targetRole: string,
  targetName?: string
) {
  return logActivity({
    action_type: 'invitation_sent',
    description: `Invitation envoyée à ${targetEmail} pour le rôle ${targetRole}`,
    target_type: 'user',
    target_name: targetName || targetEmail,
    details: {
      email: targetEmail,
      role: targetRole,
      invitation_method: 'email'
    },
    new_values: {
      email: targetEmail,
      role: targetRole,
      is_active: false
    },
    severity: 'info'
  })
}

/**
 * Log une tentative d'accès non autorisé
 */
export async function logUnauthorizedAccess(
  attemptedAction: string,
  requiredRole?: string,
  attemptedResource?: string
) {
  return logActivity({
    action_type: 'unauthorized_access_attempt',
    description: `Tentative d'accès non autorisé: ${attemptedAction}`,
    target_type: 'system',
    target_name: attemptedResource || 'resource_unknown',
    details: {
      attempted_action: attemptedAction,
      required_role: requiredRole,
      attempted_resource: attemptedResource,
      timestamp: new Date().toISOString()
    },
    risk_level: 'high',
    severity: 'warning'
  })
}

/**
 * Log les opérations en masse
 */
export async function logBulkOperation(
  operationType: string,
  targetCount: number,
  details: Record<string, unknown>
) {
  return logActivity({
    action_type: 'bulk_operation',
    description: `Opération en masse: ${operationType} sur ${targetCount} éléments`,
    target_type: 'system',
    details: {
      operation_type: operationType,
      target_count: targetCount,
      ...details
    },
    risk_level: targetCount > 10 ? 'high' : 'medium',
    severity: 'info'
  })
}
