/**
 * 🎨 DASHBOARD DESIGN SYSTEM - MONOCHROME STRICT
 * Palette monochrome (blanc/gris/noir) avec violet TRÈS subtil
 * Aligné avec landing page (Apple-like, minimaliste, épuré)
 */

// ========================================
// PALETTE MONOCHROME
// ========================================

export const mono = {
  // Cards & Containers
  card: "bg-black/40 backdrop-blur-xl border border-white/5 rounded-lg",
  cardHover: "hover:bg-white/5 hover:border-white/10 transition-all duration-200",
  cardSolid: "bg-black/60 backdrop-blur-xl border border-white/10 rounded-lg",
  
  // Typography
  h1: "text-white/90 font-semibold tracking-tight",
  h2: "text-white/85 font-semibold",
  h3: "text-white/80 font-medium",
  label: "text-gray-400 text-sm font-medium",
  value: "text-white font-bold",
  valueHuge: "text-white font-bold text-3xl",
  valueSmall: "text-white/90 font-semibold text-sm",
  description: "text-gray-500 text-sm",
  muted: "text-gray-600 text-xs",
  
  // Icons (MONOCHROME strict - pas de couleurs vives)
  icon: "text-white/70",
  iconActive: "text-white/90",
  iconMuted: "text-gray-500",
  iconSubtle: "text-white/40",
  
  // Backgrounds
  bgPrimary: "bg-black",
  bgCard: "bg-black/40 backdrop-blur-xl",
  bgCardHover: "bg-white/5",
  bgSection: "bg-black/60 backdrop-blur-md",
  
  // Borders
  border: "border-white/5",
  borderMedium: "border-white/10",
  borderHover: "border-white/15",
  borderStrong: "border-white/20",
  
  // Shadows (très subtils)
  shadow: "shadow-lg shadow-black/20",
  shadowSubtle: "shadow-md shadow-black/10",
  
  // Trends & Indicators (MONOCHROME - nuances de gris)
  trendPositive: "text-white/90",      // Blanc brillant
  trendNeutral: "text-gray-400",       // Gris moyen
  trendNegative: "text-gray-600",      // Gris foncé
  
  // Status (MONOCHROME)
  statusOnline: "text-white/90 bg-white/10",
  statusOffline: "text-gray-500 bg-gray-500/10",
  statusWarning: "text-gray-300 bg-gray-300/10",
  statusError: "text-gray-600 bg-gray-600/10",
  
  // Badges
  badge: "bg-white/10 text-white/90 text-xs font-medium px-2 py-0.5 rounded-full",
  badgeMuted: "bg-gray-500/10 text-gray-400 text-xs font-medium px-2 py-0.5 rounded-full",
  
  // Buttons
  button: "bg-white/10 hover:bg-white/15 text-white/90 border border-white/20 rounded-lg px-4 py-2 transition-all duration-200",
  buttonGhost: "hover:bg-white/5 text-white/70 hover:text-white/90 rounded-lg px-4 py-2 transition-all duration-200",
  
  // Inputs
  input: "bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white placeholder:text-gray-500 focus:border-white/20 focus:outline-none",
  
  // Dividers
  divider: "border-t border-white/5",
  dividerMedium: "border-t border-white/10",
}

// ========================================
// VIOLET SUBTIL (< 5% surface uniquement)
// ========================================

export const violet = {
  // Utiliser TRÈS rarement (accents uniquement)
  accent: "text-violet-400/50",
  accentBg: "bg-violet-500/5",
  accentBorder: "border-violet-400/20",
  accentHover: "hover:bg-violet-500/10",
  
  // Pour les éléments de focus/highlight UNIQUEMENT
  focus: "ring-2 ring-violet-400/30",
}

// ========================================
// HELPERS - Remplacement Couleurs Vives
// ========================================

/**
 * Convertit n'importe quelle couleur vive en monochrome
 * Utilisé pour remplacer text-blue-500, text-red-500, etc.
 */
export function toMonochrome(colorClass?: string): string {
  // Ignore le paramètre, retourne toujours monochrome
  return mono.icon
}

/**
 * Applique une intensité monochrome selon le contexte
 */
export function monoIntensity(level: 'high' | 'medium' | 'low'): string {
  switch (level) {
    case 'high':
      return 'text-white/90'
    case 'medium':
      return 'text-white/70'
    case 'low':
      return 'text-gray-500'
    default:
      return mono.icon
  }
}

/**
 * Génère des classes pour les graphiques Recharts (monochrome)
 */
export function monoChartColors() {
  return {
    // Nuances de gris pour les graphiques
    primary: '#9ca3af',     // gray-400
    secondary: '#6b7280',   // gray-500
    tertiary: '#4b5563',    // gray-600
    stroke: '#374151',      // gray-700
    grid: 'rgba(255,255,255,0.05)',
    text: 'rgba(255,255,255,0.7)',
  }
}

/**
 * Génère un gradient monochrome pour les backgrounds
 */
export function monoGradient(direction: 'to-r' | 'to-b' = 'to-r'): string {
  return `bg-gradient-${direction} from-black via-gray-900 to-black`
}

// ========================================
// COMPOSANTS RÉUTILISABLES
// ========================================

/**
 * Classes pour les KPI Cards (métriques dashboard)
 */
export const kpiCard = {
  container: `${mono.card} p-6 ${mono.cardHover}`,
  header: "flex items-center justify-between mb-4",
  label: mono.label,
  value: mono.valueHuge,
  trend: "flex items-center gap-1 text-sm mt-2",
  icon: `${mono.icon} w-5 h-5`,
}

/**
 * Classes pour les Data Tables
 */
export const dataTable = {
  container: `${mono.card} overflow-hidden`,
  header: "bg-black/60 px-6 py-4 border-b border-white/5",
  headerTitle: mono.h2,
  row: "border-b border-white/5 hover:bg-white/5 transition-colors",
  cell: "px-6 py-4 text-white/80",
  cellMuted: "px-6 py-4 text-gray-500",
}

/**
 * Classes pour les Stats
 */
export const stats = {
  value: mono.valueHuge,
  label: mono.label,
  change: "text-sm flex items-center gap-1",
  changePositive: mono.trendPositive,
  changeNeutral: mono.trendNeutral,
  changeNegative: mono.trendNegative,
}

// ========================================
// EXPORT PAR DÉFAUT
// ========================================

export default {
  mono,
  violet,
  toMonochrome,
  monoIntensity,
  monoChartColors,
  monoGradient,
  kpiCard,
  dataTable,
  stats,
}




