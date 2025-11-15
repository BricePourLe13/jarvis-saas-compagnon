# 🔧 ARCHITECTURE NO-CODE TOOLS BUILDER - JARVIS

**Date :** 9 Novembre 2025  
**Vision :** Permettre aux gérants de créer des tools personnalisés pour JARVIS sans coder

---

## 🎯 **VISION BUSINESS**

### **Cas d'usage réels :**

#### **Gym Dax (crossfit)**
- Tool "Réserver WOD du jour" → API Planning CrossFit
- Tool "Checker PR personnel" → DB interne performances
- Tool "Inscrire compétition" → Webhook vers système tiers

#### **Gym Paris Premium (spa intégré)**
- Tool "Réserver massage" → API Booksy/Planity
- Tool "Commander shake protéiné" → Webhook vers bar
- Tool "Activer sauna privé" → API domotique

#### **Franchise BeFit (20 salles)**
- Tool "Programme nutritionnel personnalisé" → API Yuka/MyFitnessPal
- Tool "Commander complément" → Webhook Shopify
- Tool "Planifier RDV coach" → API Calendly

**➡️ Chaque gym a des besoins UNIQUES. Impossible de hardcoder.**

---

## 🏗️ **ARCHITECTURE PROPOSÉE**

### **Schéma Global**

```
┌─────────────────────────────────────────────────────────────┐
│                    DASHBOARD GÉRANT                          │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  "Créer Tool JARVIS"                                 │   │
│  │                                                        │   │
│  │  Nom: "Réserver cours de yoga"                       │   │
│  │  Description: "Réserve une place pour un cours"      │   │
│  │  Type: API REST                                       │   │
│  │  URL: https://api.monplanning.fr/reserve             │   │
│  │  Auth: Bearer token                                   │   │
│  │  Params:                                              │   │
│  │    - course_name (string, requis)                    │   │
│  │    - date (date, requis)                             │   │
│  │    - member_email (string, auto: {member.email})     │   │
│  │                                                        │   │
│  │  [Tester]  [Sauvegarder]                             │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                    TABLE: custom_tools                       │
│  {                                                            │
│    id: uuid                                                  │
│    gym_id: uuid                                              │
│    name: "reserve_yoga_class"                                │
│    display_name: "Réserver cours de yoga"                    │
│    description: "Réserve une place..."                       │
│    type: "api_rest" | "mcp_supabase" | "webhook" | "script" │
│    config: {                                                 │
│      endpoint: "https://...",                                │
│      method: "POST",                                         │
│      headers: { "Authorization": "Bearer {{gym.api_key}}" }, │
│      body_template: { ... },                                 │
│      response_mapping: { ... }                               │
│    },                                                        │
│    parameters: [ ... ],                                      │
│    is_active: true                                           │
│  }                                                           │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│              JARVIS RUNTIME (useVoiceChat)                   │
│                                                               │
│  Adhérent: "Je veux réserver le yoga de demain"             │
│     ↓                                                         │
│  OpenAI détecte intent → Function call "reserve_yoga_class"  │
│     ↓                                                         │
│  CustomToolExecutor.execute(                                 │
│    toolName: "reserve_yoga_class",                           │
│    args: { course_name: "yoga", date: "2025-11-10" }        │
│  )                                                           │
│     ↓                                                         │
│  Récupère config depuis custom_tools table                   │
│     ↓                                                         │
│  Execute selon type:                                         │
│    - API REST → fetch() avec templating                     │
│    - MCP Supabase → execute_sql()                           │
│    - Webhook → POST vers URL                                │
│    - Script → eval() sandboxé                               │
│     ↓                                                         │
│  Retourne résultat à OpenAI → JARVIS répond                 │
└─────────────────────────────────────────────────────────────┘
```

---

## 📊 **SCHEMA BDD: custom_tools**

```sql
-- Migration: 20251109_create_custom_tools.sql

CREATE TYPE tool_type AS ENUM (
  'api_rest',        -- Appel API externe (REST)
  'mcp_supabase',    -- Query Supabase via MCP
  'webhook',         -- POST vers webhook externe
  'javascript',      -- Script JS sandboxé
  'graphql',         -- Query GraphQL
  'database_query'   -- Query SQL directe (sécurisée)
);

CREATE TYPE tool_auth_type AS ENUM (
  'none',
  'bearer_token',
  'api_key',
  'oauth2',
  'basic_auth'
);

CREATE TYPE tool_status AS ENUM (
  'draft',           -- En cours de création
  'active',          -- Actif et utilisable par JARVIS
  'paused',          -- Temporairement désactivé
  'deprecated'       -- Obsolète (gardé pour historique)
);

CREATE TABLE custom_tools (
  -- Identification
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gym_id UUID NOT NULL REFERENCES gyms(id) ON DELETE CASCADE,
  
  -- Metadata
  name TEXT NOT NULL,                    -- Nom technique (snake_case)
  display_name TEXT NOT NULL,            -- Nom affiché UI
  description TEXT NOT NULL,             -- Description pour OpenAI
  category TEXT,                         -- 'booking', 'info', 'action', etc.
  icon TEXT,                             -- Emoji ou nom icône
  
  -- Configuration technique
  type tool_type NOT NULL,
  status tool_status DEFAULT 'draft',
  
  -- Configuration exécution (JSONB flexible)
  config JSONB NOT NULL DEFAULT '{}'::jsonb,
  /*
  Exemples par type:
  
  API REST:
  {
    "endpoint": "https://api.example.com/reserve",
    "method": "POST",
    "headers": {
      "Authorization": "Bearer {{gym.api_key}}",
      "Content-Type": "application/json"
    },
    "body_template": {
      "course": "{{args.course_name}}",
      "date": "{{args.date}}",
      "email": "{{member.email}}"
    },
    "response_mapping": {
      "success": "$.success",
      "booking_id": "$.data.id",
      "message": "$.message"
    },
    "timeout_ms": 5000
  }
  
  MCP Supabase:
  {
    "query_template": "SELECT * FROM gym_classes WHERE name = '{{args.class_name}}' AND date = '{{args.date}}'",
    "max_rows": 10
  }
  
  Webhook:
  {
    "url": "https://zapier.com/hooks/catch/xxx",
    "method": "POST",
    "payload_template": { ... }
  }
  
  JavaScript:
  {
    "code": "function execute(args, context) { return { success: true }; }",
    "timeout_ms": 3000,
    "max_memory_mb": 10
  }
  */
  
  -- Paramètres du tool (pour OpenAI function calling)
  parameters JSONB NOT NULL DEFAULT '[]'::jsonb,
  /*
  [
    {
      "name": "course_name",
      "type": "string",
      "description": "Nom du cours (ex: yoga, pilates)",
      "required": true,
      "enum": ["yoga", "pilates", "spinning"] // Optionnel
    },
    {
      "name": "date",
      "type": "string",
      "description": "Date au format YYYY-MM-DD",
      "required": true
    }
  ]
  */
  
  -- Authentification (si nécessaire)
  auth_type tool_auth_type DEFAULT 'none',
  auth_config JSONB,  -- Stockage sécurisé credentials (encrypted)
  /*
  {
    "type": "bearer_token",
    "token": "encrypted_token_here"  // Chiffré avec supabase vault
  }
  */
  
  -- Rate limiting
  rate_limit_per_member_per_day INTEGER DEFAULT 10,
  rate_limit_per_gym_per_hour INTEGER DEFAULT 100,
  
  -- Analytics & Monitoring
  usage_count INTEGER DEFAULT 0,
  last_used_at TIMESTAMPTZ,
  avg_execution_time_ms INTEGER,
  success_rate NUMERIC(5,2),  -- Pourcentage 0-100
  
  -- Validation & Tests
  test_cases JSONB,  -- Cas de test définis par le gérant
  last_test_result JSONB,
  last_test_at TIMESTAMPTZ,
  
  -- Métadonnées
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  -- Contraintes
  UNIQUE(gym_id, name),  -- Nom unique par gym
  CHECK (name ~ '^[a-z0-9_]+$'),  -- snake_case only
  CHECK (char_length(name) <= 50),
  CHECK (char_length(display_name) <= 100),
  CHECK (char_length(description) <= 500)
);

-- Indexes pour performance
CREATE INDEX idx_custom_tools_gym_id ON custom_tools(gym_id);
CREATE INDEX idx_custom_tools_status ON custom_tools(status);
CREATE INDEX idx_custom_tools_type ON custom_tools(type);
CREATE INDEX idx_custom_tools_gym_status ON custom_tools(gym_id, status) WHERE status = 'active';

-- Table pour logs d'exécution
CREATE TABLE custom_tool_executions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tool_id UUID NOT NULL REFERENCES custom_tools(id) ON DELETE CASCADE,
  gym_id UUID NOT NULL REFERENCES gyms(id),
  member_id UUID REFERENCES gym_members_v2(id),
  session_id TEXT,
  
  -- Inputs/Outputs
  input_args JSONB NOT NULL,
  output_result JSONB,
  
  -- Performance
  execution_time_ms INTEGER,
  status TEXT CHECK (status IN ('success', 'error', 'timeout')),
  error_message TEXT,
  
  -- Metadata
  executed_at TIMESTAMPTZ DEFAULT now(),
  
  -- Retention: 30 jours
  CHECK (executed_at > now() - INTERVAL '30 days')
);

CREATE INDEX idx_custom_tool_executions_tool_id ON custom_tool_executions(tool_id);
CREATE INDEX idx_custom_tool_executions_executed_at ON custom_tool_executions(executed_at);

-- Trigger pour mise à jour analytics
CREATE OR REPLACE FUNCTION update_custom_tool_analytics()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE custom_tools
  SET 
    usage_count = usage_count + 1,
    last_used_at = NEW.executed_at,
    avg_execution_time_ms = (
      SELECT AVG(execution_time_ms)::INTEGER
      FROM custom_tool_executions
      WHERE tool_id = NEW.tool_id
      AND executed_at > now() - INTERVAL '7 days'
    ),
    success_rate = (
      SELECT (COUNT(*) FILTER (WHERE status = 'success')::NUMERIC / COUNT(*) * 100)::NUMERIC(5,2)
      FROM custom_tool_executions
      WHERE tool_id = NEW.tool_id
      AND executed_at > now() - INTERVAL '7 days'
    )
  WHERE id = NEW.tool_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_custom_tool_analytics
  AFTER INSERT ON custom_tool_executions
  FOR EACH ROW
  EXECUTE FUNCTION update_custom_tool_analytics();

-- RLS
ALTER TABLE custom_tools ENABLE ROW LEVEL SECURITY;
ALTER TABLE custom_tool_executions ENABLE ROW LEVEL SECURITY;

-- Policies: Gym managers peuvent gérer leurs tools
CREATE POLICY "Gym managers can manage their tools"
  ON custom_tools
  FOR ALL
  USING (
    gym_id IN (
      SELECT gym_id FROM users WHERE id = auth.uid()
    )
  );

-- Service role peut tout (pour JARVIS runtime)
CREATE POLICY "Service role full access custom_tools"
  ON custom_tools
  FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

CREATE POLICY "Service role full access tool_executions"
  ON custom_tool_executions
  FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');
```

---

## 🎨 **UI DASHBOARD: TOOL BUILDER**

### **Page: `/dashboard/tools`**

```tsx
// src/app/dashboard/tools/page.tsx

export default function CustomToolsPage() {
  const { currentGym } = useGymContext()
  const [tools, setTools] = useState<CustomTool[]>([])
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Tools JARVIS</h1>
          <p className="text-gray-500 mt-2">
            Créez des actions personnalisées pour votre assistant vocal
          </p>
        </div>
        <Link href="/dashboard/tools/new">
          <button className="btn-primary flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Créer un tool
          </button>
        </Link>
      </div>
      
      {/* Stats rapides */}
      <div className="grid grid-cols-4 gap-4">
        <StatCard
          label="Tools actifs"
          value={tools.filter(t => t.status === 'active').length}
          icon={Check}
        />
        <StatCard
          label="Utilisations aujourd'hui"
          value={getTodayUsage(tools)}
          icon={Activity}
        />
        <StatCard
          label="Taux succès moyen"
          value={`${getAvgSuccessRate(tools)}%`}
          icon={TrendingUp}
        />
        <StatCard
          label="Temps exec. moyen"
          value={`${getAvgExecTime(tools)}ms`}
          icon={Clock}
        />
      </div>
      
      {/* Liste des tools */}
      <div className="grid gap-4">
        {tools.map(tool => (
          <ToolCard key={tool.id} tool={tool} onEdit={handleEdit} />
        ))}
      </div>
      
      {/* Templates pré-configurés */}
      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4">Templates</h2>
        <div className="grid grid-cols-3 gap-4">
          <TemplateCard
            name="Réservation cours"
            description="Permet aux adhérents de réserver un cours"
            icon="📅"
            category="booking"
          />
          <TemplateCard
            name="Info horaires"
            description="Consulter les horaires d'ouverture"
            icon="🕐"
            category="info"
          />
          <TemplateCard
            name="Commander produit"
            description="Commander shake/complément au bar"
            icon="🥤"
            category="commerce"
          />
        </div>
      </div>
    </div>
  )
}
```

---

### **Page: `/dashboard/tools/new` (Tool Builder)**

```tsx
// src/app/dashboard/tools/new/page.tsx

export default function NewToolPage() {
  const [step, setStep] = useState(1) // 1: Basic, 2: Config, 3: Test
  const [toolConfig, setToolConfig] = useState<Partial<CustomTool>>({
    type: 'api_rest',
    status: 'draft'
  })
  
  return (
    <div className="max-w-4xl mx-auto">
      {/* Stepper */}
      <Stepper currentStep={step} steps={[
        'Informations de base',
        'Configuration technique',
        'Test & Activation'
      ]} />
      
      {/* Step 1: Basic Info */}
      {step === 1 && (
        <div className="space-y-6 mt-8">
          <FormField
            label="Nom du tool"
            help="Nom technique (snake_case, ex: reserve_yoga_class)"
            value={toolConfig.name}
            onChange={(v) => setToolConfig({...toolConfig, name: v})}
          />
          
          <FormField
            label="Nom affiché"
            help="Nom affiché dans JARVIS (ex: Réserver cours de yoga)"
            value={toolConfig.display_name}
            onChange={(v) => setToolConfig({...toolConfig, display_name: v})}
          />
          
          <FormField
            label="Description"
            type="textarea"
            help="Décrivez ce que fait ce tool (utilisé par l'IA pour comprendre quand l'utiliser)"
            value={toolConfig.description}
            onChange={(v) => setToolConfig({...toolConfig, description: v})}
          />
          
          <FormField
            label="Type de tool"
            type="select"
            options={[
              { value: 'api_rest', label: '🌐 API REST (appel externe)' },
              { value: 'mcp_supabase', label: '🗄️ Base de données Supabase' },
              { value: 'webhook', label: '🔗 Webhook (Zapier, Make)' },
              { value: 'javascript', label: '⚡ Script personnalisé' }
            ]}
            value={toolConfig.type}
            onChange={(v) => setToolConfig({...toolConfig, type: v})}
          />
          
          <button onClick={() => setStep(2)} className="btn-primary">
            Suivant →
          </button>
        </div>
      )}
      
      {/* Step 2: Technical Config */}
      {step === 2 && toolConfig.type === 'api_rest' && (
        <ApiRestConfig
          config={toolConfig.config}
          onChange={(config) => setToolConfig({...toolConfig, config})}
          onNext={() => setStep(3)}
        />
      )}
      
      {step === 2 && toolConfig.type === 'mcp_supabase' && (
        <McpSupabaseConfig
          config={toolConfig.config}
          onChange={(config) => setToolConfig({...toolConfig, config})}
          onNext={() => setStep(3)}
        />
      )}
      
      {/* Step 3: Test & Activate */}
      {step === 3 && (
        <TestAndActivate
          tool={toolConfig}
          onTest={handleTest}
          onActivate={handleActivate}
        />
      )}
    </div>
  )
}
```

---

### **Component: API REST Config**

```tsx
// src/components/dashboard/tools/ApiRestConfig.tsx

export function ApiRestConfig({ config, onChange, onNext }: Props) {
  const [endpoint, setEndpoint] = useState(config?.endpoint || '')
  const [method, setMethod] = useState(config?.method || 'POST')
  const [headers, setHeaders] = useState(config?.headers || {})
  const [bodyTemplate, setBodyTemplate] = useState(
    JSON.stringify(config?.body_template || {}, null, 2)
  )
  
  // Variables disponibles pour templating
  const availableVars = [
    { key: '{{member.id}}', description: 'ID du membre' },
    { key: '{{member.email}}', description: 'Email du membre' },
    { key: '{{member.first_name}}', description: 'Prénom' },
    { key: '{{gym.id}}', description: 'ID de la salle' },
    { key: '{{gym.name}}', description: 'Nom de la salle' },
    { key: '{{gym.api_key}}', description: 'Clé API gym (secrets)' },
    { key: '{{args.xxx}}', description: 'Arguments passés par JARVIS' }
  ]
  
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold">Configuration API REST</h2>
      
      {/* URL Endpoint */}
      <FormField
        label="URL Endpoint"
        placeholder="https://api.monplanning.fr/reserve"
        value={endpoint}
        onChange={setEndpoint}
      />
      
      {/* HTTP Method */}
      <FormField
        label="Méthode HTTP"
        type="select"
        options={['GET', 'POST', 'PUT', 'DELETE']}
        value={method}
        onChange={setMethod}
      />
      
      {/* Headers */}
      <div>
        <label className="block font-medium mb-2">Headers HTTP</label>
        <KeyValueEditor
          values={headers}
          onChange={setHeaders}
          placeholder={{
            key: 'Authorization',
            value: 'Bearer {{gym.api_key}}'
          }}
        />
        <p className="text-sm text-gray-500 mt-1">
          💡 Utilisez {{'{'}{'{'} variables {{'}'}{'}'}} pour les valeurs dynamiques
        </p>
      </div>
      
      {/* Body Template */}
      <div>
        <label className="block font-medium mb-2">Body Template (JSON)</label>
        <CodeEditor
          language="json"
          value={bodyTemplate}
          onChange={setBodyTemplate}
          height="200px"
        />
        <VariableSelector
          variables={availableVars}
          onInsert={(v) => insertAtCursor(v)}
        />
      </div>
      
      {/* Parameters (pour OpenAI) */}
      <div>
        <label className="block font-medium mb-2">
          Paramètres attendus
        </label>
        <p className="text-sm text-gray-500 mb-2">
          Quels paramètres JARVIS doit demander à l'utilisateur ?
        </p>
        <ParametersEditor
          parameters={config?.parameters || []}
          onChange={(params) => onChange({...config, parameters: params})}
        />
      </div>
      
      {/* Response Mapping */}
      <div>
        <label className="block font-medium mb-2">
          Mapping réponse (optionnel)
        </label>
        <p className="text-sm text-gray-500 mb-2">
          Utilisez JSONPath pour extraire les données de la réponse
        </p>
        <KeyValueEditor
          values={config?.response_mapping || {}}
          onChange={(mapping) => onChange({...config, response_mapping: mapping})}
          placeholder={{
            key: 'booking_id',
            value: '$.data.id'
          }}
        />
      </div>
      
      {/* Actions */}
      <div className="flex gap-4">
        <button onClick={() => saveAndNext()} className="btn-primary">
          Suivant →
        </button>
        <button onClick={() => testNow()} className="btn-secondary">
          Tester maintenant
        </button>
      </div>
    </div>
  )
}
```

---

## ⚙️ **RUNTIME: CUSTOM TOOL EXECUTOR**

```typescript
// src/lib/custom-tools/executor.ts

import { createClient } from '@supabase/supabase-js'
import { z } from 'zod'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export interface ExecutionContext {
  member: {
    id: string
    email: string
    first_name: string
    last_name: string
  }
  gym: {
    id: string
    name: string
    api_keys?: Record<string, string> // Secrets chiffrés
  }
  session_id: string
}

export class CustomToolExecutor {
  /**
   * Charge un tool depuis la DB
   */
  static async loadTool(gymId: string, toolName: string) {
    const { data: tool, error } = await supabase
      .from('custom_tools')
      .select('*')
      .eq('gym_id', gymId)
      .eq('name', toolName)
      .eq('status', 'active')
      .single()
    
    if (error || !tool) {
      throw new Error(`Tool ${toolName} not found or inactive`)
    }
    
    return tool
  }
  
  /**
   * Exécute un tool custom
   */
  static async execute(
    gymId: string,
    toolName: string,
    args: Record<string, any>,
    context: ExecutionContext
  ): Promise<any> {
    const startTime = Date.now()
    
    try {
      // 1. Charger config tool
      const tool = await this.loadTool(gymId, toolName)
      
      // 2. Valider rate limiting
      await this.checkRateLimit(tool, context.member.id)
      
      // 3. Valider paramètres
      this.validateParameters(tool.parameters, args)
      
      // 4. Exécuter selon type
      let result: any
      
      switch (tool.type) {
        case 'api_rest':
          result = await this.executeApiRest(tool, args, context)
          break
        case 'mcp_supabase':
          result = await this.executeMcpSupabase(tool, args, context)
          break
        case 'webhook':
          result = await this.executeWebhook(tool, args, context)
          break
        case 'javascript':
          result = await this.executeJavascript(tool, args, context)
          break
        default:
          throw new Error(`Tool type ${tool.type} not supported`)
      }
      
      // 5. Logger exécution
      await this.logExecution(tool.id, {
        gym_id: gymId,
        member_id: context.member.id,
        session_id: context.session_id,
        input_args: args,
        output_result: result,
        execution_time_ms: Date.now() - startTime,
        status: 'success'
      })
      
      return result
      
    } catch (error: any) {
      // Logger erreur
      await this.logExecution(tool.id, {
        gym_id: gymId,
        member_id: context.member.id,
        session_id: context.session_id,
        input_args: args,
        output_result: null,
        execution_time_ms: Date.now() - startTime,
        status: 'error',
        error_message: error.message
      })
      
      throw error
    }
  }
  
  /**
   * Exécute un appel API REST
   */
  private static async executeApiRest(
    tool: any,
    args: Record<string, any>,
    context: ExecutionContext
  ) {
    const config = tool.config
    
    // Template rendering (remplacer {{variables}})
    const endpoint = this.renderTemplate(config.endpoint, { args, ...context })
    const headers = this.renderObject(config.headers, { args, ...context })
    const body = config.body_template
      ? this.renderObject(config.body_template, { args, ...context })
      : undefined
    
    // Appel HTTP
    const response = await fetch(endpoint, {
      method: config.method || 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...headers
      },
      body: body ? JSON.stringify(body) : undefined,
      signal: AbortSignal.timeout(config.timeout_ms || 10000)
    })
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`)
    }
    
    const data = await response.json()
    
    // Mapper réponse si config définie
    if (config.response_mapping) {
      return this.mapResponse(data, config.response_mapping)
    }
    
    return data
  }
  
  /**
   * Exécute une query Supabase via MCP
   */
  private static async executeMcpSupabase(
    tool: any,
    args: Record<string, any>,
    context: ExecutionContext
  ) {
    const config = tool.config
    
    // Render SQL template
    const query = this.renderTemplate(config.query_template, { args, ...context })
    
    // Validation: interdire DROP, DELETE, UPDATE, TRUNCATE
    const dangerousKeywords = ['DROP', 'DELETE', 'UPDATE', 'TRUNCATE', 'ALTER']
    const upperQuery = query.toUpperCase()
    
    for (const keyword of dangerousKeywords) {
      if (upperQuery.includes(keyword)) {
        throw new Error(`Query contains forbidden keyword: ${keyword}`)
      }
    }
    
    // Exécuter query (SELECT only)
    const { data, error } = await supabase.rpc('execute_readonly_query', {
      query_text: query
    })
    
    if (error) {
      throw new Error(`Database error: ${error.message}`)
    }
    
    // Limiter nombre de résultats
    const maxRows = config.max_rows || 100
    return data.slice(0, maxRows)
  }
  
  /**
   * Exécute un webhook
   */
  private static async executeWebhook(
    tool: any,
    args: Record<string, any>,
    context: ExecutionContext
  ) {
    const config = tool.config
    
    const url = this.renderTemplate(config.url, { args, ...context })
    const payload = this.renderObject(config.payload_template, { args, ...context })
    
    const response = await fetch(url, {
      method: config.method || 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(config.headers || {})
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(config.timeout_ms || 10000)
    })
    
    if (!response.ok) {
      throw new Error(`Webhook error: ${response.status}`)
    }
    
    return await response.json()
  }
  
  /**
   * Exécute un script JavaScript sandboxé
   */
  private static async executeJavascript(
    tool: any,
    args: Record<string, any>,
    context: ExecutionContext
  ) {
    // TODO: Implémenter sandbox sécurisé
    // Options: vm2, isolated-vm, ou Deno runtime
    throw new Error('JavaScript execution not yet implemented')
  }
  
  /**
   * Render template string avec variables
   */
  private static renderTemplate(
    template: string,
    vars: any
  ): string {
    return template.replace(/\{\{([^}]+)\}\}/g, (match, path) => {
      const value = this.getNestedValue(vars, path.trim())
      return value !== undefined ? String(value) : match
    })
  }
  
  /**
   * Render object avec templates dans valeurs
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
   * Mapper réponse via JSONPath
   */
  private static mapResponse(data: any, mapping: Record<string, string>): any {
    const result: any = {}
    
    for (const [key, jsonPath] of Object.entries(mapping)) {
      // Simple JSONPath implementation ($ = root)
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
   * Valider paramètres
   */
  private static validateParameters(
    schema: any[],
    args: Record<string, any>
  ) {
    for (const param of schema) {
      if (param.required && !(param.name in args)) {
        throw new Error(`Missing required parameter: ${param.name}`)
      }
      
      // Validation type basique
      if (args[param.name] !== undefined) {
        const value = args[param.name]
        const expectedType = param.type
        
        if (expectedType === 'string' && typeof value !== 'string') {
          throw new Error(`Parameter ${param.name} must be a string`)
        }
        if (expectedType === 'number' && typeof value !== 'number') {
          throw new Error(`Parameter ${param.name} must be a number`)
        }
        
        // Validation enum
        if (param.enum && !param.enum.includes(value)) {
          throw new Error(`Parameter ${param.name} must be one of: ${param.enum.join(', ')}`)
        }
      }
    }
  }
  
  /**
   * Rate limiting
   */
  private static async checkRateLimit(tool: any, memberId: string) {
    const today = new Date().toISOString().split('T')[0]
    
    const { count } = await supabase
      .from('custom_tool_executions')
      .select('*', { count: 'exact', head: true })
      .eq('tool_id', tool.id)
      .eq('member_id', memberId)
      .gte('executed_at', `${today}T00:00:00Z`)
    
    if (count && count >= tool.rate_limit_per_member_per_day) {
      throw new Error(`Rate limit exceeded: ${count}/${tool.rate_limit_per_member_per_day} today`)
    }
  }
  
  /**
   * Logger exécution
   */
  private static async logExecution(toolId: string, data: any) {
    await supabase.from('custom_tool_executions').insert({
      tool_id: toolId,
      ...data
    })
  }
}
```

---

## 🔗 **INTÉGRATION AVEC useVoiceChat**

```typescript
// src/hooks/useVoiceChat.ts (MODIFIÉ)

import { CustomToolExecutor } from '@/lib/custom-tools/executor'
import { sessionContextStore } from '@/lib/voice/session-context-store'

// ...

const handleFunctionCall = useCallback(async (functionCallItem: any) => {
  const { name, call_id, arguments: argsString } = functionCallItem
  
  try {
    const args = JSON.parse(argsString || '{}')
    const context = sessionContextStore.get(sessionRef.current?.session_id)
    
    if (!context) {
      throw new Error('Session context not found')
    }
    
    // 🔧 NOUVEAUTÉ: Vérifier si c'est un custom tool
    const isCustomTool = !['get_member_profile', 'update_member_info', 'log_member_interaction', 'manage_session_state'].includes(name)
    
    let toolResponse: any
    
    if (isCustomTool) {
      // ✨ EXÉCUTER VIA CUSTOM TOOL EXECUTOR
      kioskLogger.session(`🔧 Custom tool: ${name}`, 'info')
      
      const result = await CustomToolExecutor.execute(
        context.gym_id,
        name,
        args,
        {
          member: {
            id: context.member_id,
            email: context.member_email,
            first_name: context.member_first_name,
            last_name: context.member_last_name
          },
          gym: {
            id: context.gym_id,
            name: context.gym_name
          },
          session_id: context.session_id
        }
      )
      
      // Envoyer résultat à OpenAI
      sendToolResult(call_id, result)
      
    } else {
      // Tools built-in (comme avant)
      switch (name) {
        case 'get_member_profile':
          toolResponse = await fetch('/api/jarvis/tools/get-member-profile', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(args)
          })
          break
        // ... autres tools built-in
      }
      
      const result = await toolResponse.json()
      sendToolResult(call_id, result)
    }
    
  } catch (error: any) {
    kioskLogger.session(`❌ Tool error: ${error.message}`, 'error')
    sendToolError(call_id, error.message)
  }
}, [])
```

---

## 🔐 **SÉCURITÉ & BEST PRACTICES**

### **1. Validation stricte**
```typescript
// Interdire keywords SQL dangereux
const FORBIDDEN_SQL = ['DROP', 'DELETE', 'UPDATE', 'TRUNCATE', 'ALTER', 'GRANT']

// Limiter taille payload
const MAX_BODY_SIZE = 1MB

// Timeout obligatoire
const MAX_TIMEOUT = 30000 // 30s max
```

### **2. Sandbox JavaScript**
```typescript
// Utiliser isolated-vm ou Deno runtime
import { Isolate } from 'isolated-vm'

const isolate = new Isolate({ memoryLimit: 128 })
const context = isolate.createContextSync()

// Interdire accès:
// - process, require, import
// - fs, net, http
// - eval, Function constructor
```

### **3. Secrets Management**
```typescript
// Stocker API keys chiffrées dans Supabase Vault
const { data } = await supabase.rpc('decrypt_secret', {
  secret_id: 'gym_api_key_xxx'
})
```

### **4. Rate Limiting**
- Par membre: 10 calls/jour (configurable par tool)
- Par gym: 100 calls/heure (protection abus)
- Global: 1000 calls/jour (quota Supabase)

### **5. Audit Trail**
- Toutes exécutions loggées (30 jours retention)
- Analytics temps réel (success rate, exec time)
- Alertes si error rate > 50%

---

## 📊 **AVANTAGES vs HARDCODÉ**

| Critère | Hardcodé | No-Code Tools |
|---------|----------|---------------|
| **Ajout tool** | 3 fichiers à modifier | UI dashboard (5 min) |
| **Maintenance** | Dev requis | Gérant autonome |
| **Personnalisation** | Impossible | Infinie |
| **Time to market** | 2h/tool | 5 min/tool |
| **Scalabilité** | Limitée | Illimitée |
| **Business model** | Gratuit | Potentiel upsell |

---

## 💰 **MONÉTISATION POSSIBLE**

```
Plan Starter (inclus):
  - 5 custom tools max
  - 100 exécutions/jour
  
Plan Professional (+50€/mois):
  - 20 custom tools
  - 1000 exécutions/jour
  - JavaScript sandbox
  
Plan Enterprise (+150€/mois):
  - Tools illimités
  - Exécutions illimitées
  - Support prioritaire
```

---

## 🎯 **ROADMAP IMPLÉMENTATION**

### **Phase 1: MVP (5 jours)**
```bash
Jour 1: Créer tables custom_tools + custom_tool_executions
Jour 2: CustomToolExecutor (API REST + MCP Supabase)
Jour 3: UI Tool Builder (basic form)
Jour 4: Intégration useVoiceChat
Jour 5: Tests E2E
```

### **Phase 2: Templates & UX (3 jours)**
```bash
Jour 6: Templates pré-configurés
Jour 7: Visual editor amélioré
Jour 8: Analytics dashboard
```

### **Phase 3: Advanced (2 jours)**
```bash
Jour 9: JavaScript sandbox
Jour 10: Marketplace tools communautaires
```

---

## 🚀 **CONCLUSION**

**Avec cette architecture:**

1. ✅ Gérants créent tools en 5 min (sans coder)
2. ✅ Chaque gym personnalise JARVIS selon ses besoins
3. ✅ MCP utilisé de manière sécurisée (backend only ou queries READ)
4. ✅ Scalabilité infinie (tools = data, pas code)
5. ✅ Nouveau business model (upsell plans avancés)

**Tu veux que je commence par quoi ?**

1. **Créer migration SQL tables** (30 min)
2. **Coder CustomToolExecutor** (3h)
3. **Builder UI dashboard** (4h)
4. **Intégration complète** (2h)

**Dis-moi et je code ! 🚀**




**Date :** 9 Novembre 2025  
**Vision :** Permettre aux gérants de créer des tools personnalisés pour JARVIS sans coder

---

## 🎯 **VISION BUSINESS**

### **Cas d'usage réels :**

#### **Gym Dax (crossfit)**
- Tool "Réserver WOD du jour" → API Planning CrossFit
- Tool "Checker PR personnel" → DB interne performances
- Tool "Inscrire compétition" → Webhook vers système tiers

#### **Gym Paris Premium (spa intégré)**
- Tool "Réserver massage" → API Booksy/Planity
- Tool "Commander shake protéiné" → Webhook vers bar
- Tool "Activer sauna privé" → API domotique

#### **Franchise BeFit (20 salles)**
- Tool "Programme nutritionnel personnalisé" → API Yuka/MyFitnessPal
- Tool "Commander complément" → Webhook Shopify
- Tool "Planifier RDV coach" → API Calendly

**➡️ Chaque gym a des besoins UNIQUES. Impossible de hardcoder.**

---

## 🏗️ **ARCHITECTURE PROPOSÉE**

### **Schéma Global**

```
┌─────────────────────────────────────────────────────────────┐
│                    DASHBOARD GÉRANT                          │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  "Créer Tool JARVIS"                                 │   │
│  │                                                        │   │
│  │  Nom: "Réserver cours de yoga"                       │   │
│  │  Description: "Réserve une place pour un cours"      │   │
│  │  Type: API REST                                       │   │
│  │  URL: https://api.monplanning.fr/reserve             │   │
│  │  Auth: Bearer token                                   │   │
│  │  Params:                                              │   │
│  │    - course_name (string, requis)                    │   │
│  │    - date (date, requis)                             │   │
│  │    - member_email (string, auto: {member.email})     │   │
│  │                                                        │   │
│  │  [Tester]  [Sauvegarder]                             │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                    TABLE: custom_tools                       │
│  {                                                            │
│    id: uuid                                                  │
│    gym_id: uuid                                              │
│    name: "reserve_yoga_class"                                │
│    display_name: "Réserver cours de yoga"                    │
│    description: "Réserve une place..."                       │
│    type: "api_rest" | "mcp_supabase" | "webhook" | "script" │
│    config: {                                                 │
│      endpoint: "https://...",                                │
│      method: "POST",                                         │
│      headers: { "Authorization": "Bearer {{gym.api_key}}" }, │
│      body_template: { ... },                                 │
│      response_mapping: { ... }                               │
│    },                                                        │
│    parameters: [ ... ],                                      │
│    is_active: true                                           │
│  }                                                           │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│              JARVIS RUNTIME (useVoiceChat)                   │
│                                                               │
│  Adhérent: "Je veux réserver le yoga de demain"             │
│     ↓                                                         │
│  OpenAI détecte intent → Function call "reserve_yoga_class"  │
│     ↓                                                         │
│  CustomToolExecutor.execute(                                 │
│    toolName: "reserve_yoga_class",                           │
│    args: { course_name: "yoga", date: "2025-11-10" }        │
│  )                                                           │
│     ↓                                                         │
│  Récupère config depuis custom_tools table                   │
│     ↓                                                         │
│  Execute selon type:                                         │
│    - API REST → fetch() avec templating                     │
│    - MCP Supabase → execute_sql()                           │
│    - Webhook → POST vers URL                                │
│    - Script → eval() sandboxé                               │
│     ↓                                                         │
│  Retourne résultat à OpenAI → JARVIS répond                 │
└─────────────────────────────────────────────────────────────┘
```

---

## 📊 **SCHEMA BDD: custom_tools**

```sql
-- Migration: 20251109_create_custom_tools.sql

CREATE TYPE tool_type AS ENUM (
  'api_rest',        -- Appel API externe (REST)
  'mcp_supabase',    -- Query Supabase via MCP
  'webhook',         -- POST vers webhook externe
  'javascript',      -- Script JS sandboxé
  'graphql',         -- Query GraphQL
  'database_query'   -- Query SQL directe (sécurisée)
);

CREATE TYPE tool_auth_type AS ENUM (
  'none',
  'bearer_token',
  'api_key',
  'oauth2',
  'basic_auth'
);

CREATE TYPE tool_status AS ENUM (
  'draft',           -- En cours de création
  'active',          -- Actif et utilisable par JARVIS
  'paused',          -- Temporairement désactivé
  'deprecated'       -- Obsolète (gardé pour historique)
);

CREATE TABLE custom_tools (
  -- Identification
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gym_id UUID NOT NULL REFERENCES gyms(id) ON DELETE CASCADE,
  
  -- Metadata
  name TEXT NOT NULL,                    -- Nom technique (snake_case)
  display_name TEXT NOT NULL,            -- Nom affiché UI
  description TEXT NOT NULL,             -- Description pour OpenAI
  category TEXT,                         -- 'booking', 'info', 'action', etc.
  icon TEXT,                             -- Emoji ou nom icône
  
  -- Configuration technique
  type tool_type NOT NULL,
  status tool_status DEFAULT 'draft',
  
  -- Configuration exécution (JSONB flexible)
  config JSONB NOT NULL DEFAULT '{}'::jsonb,
  /*
  Exemples par type:
  
  API REST:
  {
    "endpoint": "https://api.example.com/reserve",
    "method": "POST",
    "headers": {
      "Authorization": "Bearer {{gym.api_key}}",
      "Content-Type": "application/json"
    },
    "body_template": {
      "course": "{{args.course_name}}",
      "date": "{{args.date}}",
      "email": "{{member.email}}"
    },
    "response_mapping": {
      "success": "$.success",
      "booking_id": "$.data.id",
      "message": "$.message"
    },
    "timeout_ms": 5000
  }
  
  MCP Supabase:
  {
    "query_template": "SELECT * FROM gym_classes WHERE name = '{{args.class_name}}' AND date = '{{args.date}}'",
    "max_rows": 10
  }
  
  Webhook:
  {
    "url": "https://zapier.com/hooks/catch/xxx",
    "method": "POST",
    "payload_template": { ... }
  }
  
  JavaScript:
  {
    "code": "function execute(args, context) { return { success: true }; }",
    "timeout_ms": 3000,
    "max_memory_mb": 10
  }
  */
  
  -- Paramètres du tool (pour OpenAI function calling)
  parameters JSONB NOT NULL DEFAULT '[]'::jsonb,
  /*
  [
    {
      "name": "course_name",
      "type": "string",
      "description": "Nom du cours (ex: yoga, pilates)",
      "required": true,
      "enum": ["yoga", "pilates", "spinning"] // Optionnel
    },
    {
      "name": "date",
      "type": "string",
      "description": "Date au format YYYY-MM-DD",
      "required": true
    }
  ]
  */
  
  -- Authentification (si nécessaire)
  auth_type tool_auth_type DEFAULT 'none',
  auth_config JSONB,  -- Stockage sécurisé credentials (encrypted)
  /*
  {
    "type": "bearer_token",
    "token": "encrypted_token_here"  // Chiffré avec supabase vault
  }
  */
  
  -- Rate limiting
  rate_limit_per_member_per_day INTEGER DEFAULT 10,
  rate_limit_per_gym_per_hour INTEGER DEFAULT 100,
  
  -- Analytics & Monitoring
  usage_count INTEGER DEFAULT 0,
  last_used_at TIMESTAMPTZ,
  avg_execution_time_ms INTEGER,
  success_rate NUMERIC(5,2),  -- Pourcentage 0-100
  
  -- Validation & Tests
  test_cases JSONB,  -- Cas de test définis par le gérant
  last_test_result JSONB,
  last_test_at TIMESTAMPTZ,
  
  -- Métadonnées
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  -- Contraintes
  UNIQUE(gym_id, name),  -- Nom unique par gym
  CHECK (name ~ '^[a-z0-9_]+$'),  -- snake_case only
  CHECK (char_length(name) <= 50),
  CHECK (char_length(display_name) <= 100),
  CHECK (char_length(description) <= 500)
);

-- Indexes pour performance
CREATE INDEX idx_custom_tools_gym_id ON custom_tools(gym_id);
CREATE INDEX idx_custom_tools_status ON custom_tools(status);
CREATE INDEX idx_custom_tools_type ON custom_tools(type);
CREATE INDEX idx_custom_tools_gym_status ON custom_tools(gym_id, status) WHERE status = 'active';

-- Table pour logs d'exécution
CREATE TABLE custom_tool_executions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tool_id UUID NOT NULL REFERENCES custom_tools(id) ON DELETE CASCADE,
  gym_id UUID NOT NULL REFERENCES gyms(id),
  member_id UUID REFERENCES gym_members_v2(id),
  session_id TEXT,
  
  -- Inputs/Outputs
  input_args JSONB NOT NULL,
  output_result JSONB,
  
  -- Performance
  execution_time_ms INTEGER,
  status TEXT CHECK (status IN ('success', 'error', 'timeout')),
  error_message TEXT,
  
  -- Metadata
  executed_at TIMESTAMPTZ DEFAULT now(),
  
  -- Retention: 30 jours
  CHECK (executed_at > now() - INTERVAL '30 days')
);

CREATE INDEX idx_custom_tool_executions_tool_id ON custom_tool_executions(tool_id);
CREATE INDEX idx_custom_tool_executions_executed_at ON custom_tool_executions(executed_at);

-- Trigger pour mise à jour analytics
CREATE OR REPLACE FUNCTION update_custom_tool_analytics()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE custom_tools
  SET 
    usage_count = usage_count + 1,
    last_used_at = NEW.executed_at,
    avg_execution_time_ms = (
      SELECT AVG(execution_time_ms)::INTEGER
      FROM custom_tool_executions
      WHERE tool_id = NEW.tool_id
      AND executed_at > now() - INTERVAL '7 days'
    ),
    success_rate = (
      SELECT (COUNT(*) FILTER (WHERE status = 'success')::NUMERIC / COUNT(*) * 100)::NUMERIC(5,2)
      FROM custom_tool_executions
      WHERE tool_id = NEW.tool_id
      AND executed_at > now() - INTERVAL '7 days'
    )
  WHERE id = NEW.tool_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_custom_tool_analytics
  AFTER INSERT ON custom_tool_executions
  FOR EACH ROW
  EXECUTE FUNCTION update_custom_tool_analytics();

-- RLS
ALTER TABLE custom_tools ENABLE ROW LEVEL SECURITY;
ALTER TABLE custom_tool_executions ENABLE ROW LEVEL SECURITY;

-- Policies: Gym managers peuvent gérer leurs tools
CREATE POLICY "Gym managers can manage their tools"
  ON custom_tools
  FOR ALL
  USING (
    gym_id IN (
      SELECT gym_id FROM users WHERE id = auth.uid()
    )
  );

-- Service role peut tout (pour JARVIS runtime)
CREATE POLICY "Service role full access custom_tools"
  ON custom_tools
  FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

CREATE POLICY "Service role full access tool_executions"
  ON custom_tool_executions
  FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');
```

---

## 🎨 **UI DASHBOARD: TOOL BUILDER**

### **Page: `/dashboard/tools`**

```tsx
// src/app/dashboard/tools/page.tsx

export default function CustomToolsPage() {
  const { currentGym } = useGymContext()
  const [tools, setTools] = useState<CustomTool[]>([])
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Tools JARVIS</h1>
          <p className="text-gray-500 mt-2">
            Créez des actions personnalisées pour votre assistant vocal
          </p>
        </div>
        <Link href="/dashboard/tools/new">
          <button className="btn-primary flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Créer un tool
          </button>
        </Link>
      </div>
      
      {/* Stats rapides */}
      <div className="grid grid-cols-4 gap-4">
        <StatCard
          label="Tools actifs"
          value={tools.filter(t => t.status === 'active').length}
          icon={Check}
        />
        <StatCard
          label="Utilisations aujourd'hui"
          value={getTodayUsage(tools)}
          icon={Activity}
        />
        <StatCard
          label="Taux succès moyen"
          value={`${getAvgSuccessRate(tools)}%`}
          icon={TrendingUp}
        />
        <StatCard
          label="Temps exec. moyen"
          value={`${getAvgExecTime(tools)}ms`}
          icon={Clock}
        />
      </div>
      
      {/* Liste des tools */}
      <div className="grid gap-4">
        {tools.map(tool => (
          <ToolCard key={tool.id} tool={tool} onEdit={handleEdit} />
        ))}
      </div>
      
      {/* Templates pré-configurés */}
      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4">Templates</h2>
        <div className="grid grid-cols-3 gap-4">
          <TemplateCard
            name="Réservation cours"
            description="Permet aux adhérents de réserver un cours"
            icon="📅"
            category="booking"
          />
          <TemplateCard
            name="Info horaires"
            description="Consulter les horaires d'ouverture"
            icon="🕐"
            category="info"
          />
          <TemplateCard
            name="Commander produit"
            description="Commander shake/complément au bar"
            icon="🥤"
            category="commerce"
          />
        </div>
      </div>
    </div>
  )
}
```

---

### **Page: `/dashboard/tools/new` (Tool Builder)**

```tsx
// src/app/dashboard/tools/new/page.tsx

export default function NewToolPage() {
  const [step, setStep] = useState(1) // 1: Basic, 2: Config, 3: Test
  const [toolConfig, setToolConfig] = useState<Partial<CustomTool>>({
    type: 'api_rest',
    status: 'draft'
  })
  
  return (
    <div className="max-w-4xl mx-auto">
      {/* Stepper */}
      <Stepper currentStep={step} steps={[
        'Informations de base',
        'Configuration technique',
        'Test & Activation'
      ]} />
      
      {/* Step 1: Basic Info */}
      {step === 1 && (
        <div className="space-y-6 mt-8">
          <FormField
            label="Nom du tool"
            help="Nom technique (snake_case, ex: reserve_yoga_class)"
            value={toolConfig.name}
            onChange={(v) => setToolConfig({...toolConfig, name: v})}
          />
          
          <FormField
            label="Nom affiché"
            help="Nom affiché dans JARVIS (ex: Réserver cours de yoga)"
            value={toolConfig.display_name}
            onChange={(v) => setToolConfig({...toolConfig, display_name: v})}
          />
          
          <FormField
            label="Description"
            type="textarea"
            help="Décrivez ce que fait ce tool (utilisé par l'IA pour comprendre quand l'utiliser)"
            value={toolConfig.description}
            onChange={(v) => setToolConfig({...toolConfig, description: v})}
          />
          
          <FormField
            label="Type de tool"
            type="select"
            options={[
              { value: 'api_rest', label: '🌐 API REST (appel externe)' },
              { value: 'mcp_supabase', label: '🗄️ Base de données Supabase' },
              { value: 'webhook', label: '🔗 Webhook (Zapier, Make)' },
              { value: 'javascript', label: '⚡ Script personnalisé' }
            ]}
            value={toolConfig.type}
            onChange={(v) => setToolConfig({...toolConfig, type: v})}
          />
          
          <button onClick={() => setStep(2)} className="btn-primary">
            Suivant →
          </button>
        </div>
      )}
      
      {/* Step 2: Technical Config */}
      {step === 2 && toolConfig.type === 'api_rest' && (
        <ApiRestConfig
          config={toolConfig.config}
          onChange={(config) => setToolConfig({...toolConfig, config})}
          onNext={() => setStep(3)}
        />
      )}
      
      {step === 2 && toolConfig.type === 'mcp_supabase' && (
        <McpSupabaseConfig
          config={toolConfig.config}
          onChange={(config) => setToolConfig({...toolConfig, config})}
          onNext={() => setStep(3)}
        />
      )}
      
      {/* Step 3: Test & Activate */}
      {step === 3 && (
        <TestAndActivate
          tool={toolConfig}
          onTest={handleTest}
          onActivate={handleActivate}
        />
      )}
    </div>
  )
}
```

---

### **Component: API REST Config**

```tsx
// src/components/dashboard/tools/ApiRestConfig.tsx

export function ApiRestConfig({ config, onChange, onNext }: Props) {
  const [endpoint, setEndpoint] = useState(config?.endpoint || '')
  const [method, setMethod] = useState(config?.method || 'POST')
  const [headers, setHeaders] = useState(config?.headers || {})
  const [bodyTemplate, setBodyTemplate] = useState(
    JSON.stringify(config?.body_template || {}, null, 2)
  )
  
  // Variables disponibles pour templating
  const availableVars = [
    { key: '{{member.id}}', description: 'ID du membre' },
    { key: '{{member.email}}', description: 'Email du membre' },
    { key: '{{member.first_name}}', description: 'Prénom' },
    { key: '{{gym.id}}', description: 'ID de la salle' },
    { key: '{{gym.name}}', description: 'Nom de la salle' },
    { key: '{{gym.api_key}}', description: 'Clé API gym (secrets)' },
    { key: '{{args.xxx}}', description: 'Arguments passés par JARVIS' }
  ]
  
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold">Configuration API REST</h2>
      
      {/* URL Endpoint */}
      <FormField
        label="URL Endpoint"
        placeholder="https://api.monplanning.fr/reserve"
        value={endpoint}
        onChange={setEndpoint}
      />
      
      {/* HTTP Method */}
      <FormField
        label="Méthode HTTP"
        type="select"
        options={['GET', 'POST', 'PUT', 'DELETE']}
        value={method}
        onChange={setMethod}
      />
      
      {/* Headers */}
      <div>
        <label className="block font-medium mb-2">Headers HTTP</label>
        <KeyValueEditor
          values={headers}
          onChange={setHeaders}
          placeholder={{
            key: 'Authorization',
            value: 'Bearer {{gym.api_key}}'
          }}
        />
        <p className="text-sm text-gray-500 mt-1">
          💡 Utilisez {{'{'}{'{'} variables {{'}'}{'}'}} pour les valeurs dynamiques
        </p>
      </div>
      
      {/* Body Template */}
      <div>
        <label className="block font-medium mb-2">Body Template (JSON)</label>
        <CodeEditor
          language="json"
          value={bodyTemplate}
          onChange={setBodyTemplate}
          height="200px"
        />
        <VariableSelector
          variables={availableVars}
          onInsert={(v) => insertAtCursor(v)}
        />
      </div>
      
      {/* Parameters (pour OpenAI) */}
      <div>
        <label className="block font-medium mb-2">
          Paramètres attendus
        </label>
        <p className="text-sm text-gray-500 mb-2">
          Quels paramètres JARVIS doit demander à l'utilisateur ?
        </p>
        <ParametersEditor
          parameters={config?.parameters || []}
          onChange={(params) => onChange({...config, parameters: params})}
        />
      </div>
      
      {/* Response Mapping */}
      <div>
        <label className="block font-medium mb-2">
          Mapping réponse (optionnel)
        </label>
        <p className="text-sm text-gray-500 mb-2">
          Utilisez JSONPath pour extraire les données de la réponse
        </p>
        <KeyValueEditor
          values={config?.response_mapping || {}}
          onChange={(mapping) => onChange({...config, response_mapping: mapping})}
          placeholder={{
            key: 'booking_id',
            value: '$.data.id'
          }}
        />
      </div>
      
      {/* Actions */}
      <div className="flex gap-4">
        <button onClick={() => saveAndNext()} className="btn-primary">
          Suivant →
        </button>
        <button onClick={() => testNow()} className="btn-secondary">
          Tester maintenant
        </button>
      </div>
    </div>
  )
}
```

---

## ⚙️ **RUNTIME: CUSTOM TOOL EXECUTOR**

```typescript
// src/lib/custom-tools/executor.ts

import { createClient } from '@supabase/supabase-js'
import { z } from 'zod'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export interface ExecutionContext {
  member: {
    id: string
    email: string
    first_name: string
    last_name: string
  }
  gym: {
    id: string
    name: string
    api_keys?: Record<string, string> // Secrets chiffrés
  }
  session_id: string
}

export class CustomToolExecutor {
  /**
   * Charge un tool depuis la DB
   */
  static async loadTool(gymId: string, toolName: string) {
    const { data: tool, error } = await supabase
      .from('custom_tools')
      .select('*')
      .eq('gym_id', gymId)
      .eq('name', toolName)
      .eq('status', 'active')
      .single()
    
    if (error || !tool) {
      throw new Error(`Tool ${toolName} not found or inactive`)
    }
    
    return tool
  }
  
  /**
   * Exécute un tool custom
   */
  static async execute(
    gymId: string,
    toolName: string,
    args: Record<string, any>,
    context: ExecutionContext
  ): Promise<any> {
    const startTime = Date.now()
    
    try {
      // 1. Charger config tool
      const tool = await this.loadTool(gymId, toolName)
      
      // 2. Valider rate limiting
      await this.checkRateLimit(tool, context.member.id)
      
      // 3. Valider paramètres
      this.validateParameters(tool.parameters, args)
      
      // 4. Exécuter selon type
      let result: any
      
      switch (tool.type) {
        case 'api_rest':
          result = await this.executeApiRest(tool, args, context)
          break
        case 'mcp_supabase':
          result = await this.executeMcpSupabase(tool, args, context)
          break
        case 'webhook':
          result = await this.executeWebhook(tool, args, context)
          break
        case 'javascript':
          result = await this.executeJavascript(tool, args, context)
          break
        default:
          throw new Error(`Tool type ${tool.type} not supported`)
      }
      
      // 5. Logger exécution
      await this.logExecution(tool.id, {
        gym_id: gymId,
        member_id: context.member.id,
        session_id: context.session_id,
        input_args: args,
        output_result: result,
        execution_time_ms: Date.now() - startTime,
        status: 'success'
      })
      
      return result
      
    } catch (error: any) {
      // Logger erreur
      await this.logExecution(tool.id, {
        gym_id: gymId,
        member_id: context.member.id,
        session_id: context.session_id,
        input_args: args,
        output_result: null,
        execution_time_ms: Date.now() - startTime,
        status: 'error',
        error_message: error.message
      })
      
      throw error
    }
  }
  
  /**
   * Exécute un appel API REST
   */
  private static async executeApiRest(
    tool: any,
    args: Record<string, any>,
    context: ExecutionContext
  ) {
    const config = tool.config
    
    // Template rendering (remplacer {{variables}})
    const endpoint = this.renderTemplate(config.endpoint, { args, ...context })
    const headers = this.renderObject(config.headers, { args, ...context })
    const body = config.body_template
      ? this.renderObject(config.body_template, { args, ...context })
      : undefined
    
    // Appel HTTP
    const response = await fetch(endpoint, {
      method: config.method || 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...headers
      },
      body: body ? JSON.stringify(body) : undefined,
      signal: AbortSignal.timeout(config.timeout_ms || 10000)
    })
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`)
    }
    
    const data = await response.json()
    
    // Mapper réponse si config définie
    if (config.response_mapping) {
      return this.mapResponse(data, config.response_mapping)
    }
    
    return data
  }
  
  /**
   * Exécute une query Supabase via MCP
   */
  private static async executeMcpSupabase(
    tool: any,
    args: Record<string, any>,
    context: ExecutionContext
  ) {
    const config = tool.config
    
    // Render SQL template
    const query = this.renderTemplate(config.query_template, { args, ...context })
    
    // Validation: interdire DROP, DELETE, UPDATE, TRUNCATE
    const dangerousKeywords = ['DROP', 'DELETE', 'UPDATE', 'TRUNCATE', 'ALTER']
    const upperQuery = query.toUpperCase()
    
    for (const keyword of dangerousKeywords) {
      if (upperQuery.includes(keyword)) {
        throw new Error(`Query contains forbidden keyword: ${keyword}`)
      }
    }
    
    // Exécuter query (SELECT only)
    const { data, error } = await supabase.rpc('execute_readonly_query', {
      query_text: query
    })
    
    if (error) {
      throw new Error(`Database error: ${error.message}`)
    }
    
    // Limiter nombre de résultats
    const maxRows = config.max_rows || 100
    return data.slice(0, maxRows)
  }
  
  /**
   * Exécute un webhook
   */
  private static async executeWebhook(
    tool: any,
    args: Record<string, any>,
    context: ExecutionContext
  ) {
    const config = tool.config
    
    const url = this.renderTemplate(config.url, { args, ...context })
    const payload = this.renderObject(config.payload_template, { args, ...context })
    
    const response = await fetch(url, {
      method: config.method || 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(config.headers || {})
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(config.timeout_ms || 10000)
    })
    
    if (!response.ok) {
      throw new Error(`Webhook error: ${response.status}`)
    }
    
    return await response.json()
  }
  
  /**
   * Exécute un script JavaScript sandboxé
   */
  private static async executeJavascript(
    tool: any,
    args: Record<string, any>,
    context: ExecutionContext
  ) {
    // TODO: Implémenter sandbox sécurisé
    // Options: vm2, isolated-vm, ou Deno runtime
    throw new Error('JavaScript execution not yet implemented')
  }
  
  /**
   * Render template string avec variables
   */
  private static renderTemplate(
    template: string,
    vars: any
  ): string {
    return template.replace(/\{\{([^}]+)\}\}/g, (match, path) => {
      const value = this.getNestedValue(vars, path.trim())
      return value !== undefined ? String(value) : match
    })
  }
  
  /**
   * Render object avec templates dans valeurs
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
   * Mapper réponse via JSONPath
   */
  private static mapResponse(data: any, mapping: Record<string, string>): any {
    const result: any = {}
    
    for (const [key, jsonPath] of Object.entries(mapping)) {
      // Simple JSONPath implementation ($ = root)
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
   * Valider paramètres
   */
  private static validateParameters(
    schema: any[],
    args: Record<string, any>
  ) {
    for (const param of schema) {
      if (param.required && !(param.name in args)) {
        throw new Error(`Missing required parameter: ${param.name}`)
      }
      
      // Validation type basique
      if (args[param.name] !== undefined) {
        const value = args[param.name]
        const expectedType = param.type
        
        if (expectedType === 'string' && typeof value !== 'string') {
          throw new Error(`Parameter ${param.name} must be a string`)
        }
        if (expectedType === 'number' && typeof value !== 'number') {
          throw new Error(`Parameter ${param.name} must be a number`)
        }
        
        // Validation enum
        if (param.enum && !param.enum.includes(value)) {
          throw new Error(`Parameter ${param.name} must be one of: ${param.enum.join(', ')}`)
        }
      }
    }
  }
  
  /**
   * Rate limiting
   */
  private static async checkRateLimit(tool: any, memberId: string) {
    const today = new Date().toISOString().split('T')[0]
    
    const { count } = await supabase
      .from('custom_tool_executions')
      .select('*', { count: 'exact', head: true })
      .eq('tool_id', tool.id)
      .eq('member_id', memberId)
      .gte('executed_at', `${today}T00:00:00Z`)
    
    if (count && count >= tool.rate_limit_per_member_per_day) {
      throw new Error(`Rate limit exceeded: ${count}/${tool.rate_limit_per_member_per_day} today`)
    }
  }
  
  /**
   * Logger exécution
   */
  private static async logExecution(toolId: string, data: any) {
    await supabase.from('custom_tool_executions').insert({
      tool_id: toolId,
      ...data
    })
  }
}
```

---

## 🔗 **INTÉGRATION AVEC useVoiceChat**

```typescript
// src/hooks/useVoiceChat.ts (MODIFIÉ)

import { CustomToolExecutor } from '@/lib/custom-tools/executor'
import { sessionContextStore } from '@/lib/voice/session-context-store'

// ...

const handleFunctionCall = useCallback(async (functionCallItem: any) => {
  const { name, call_id, arguments: argsString } = functionCallItem
  
  try {
    const args = JSON.parse(argsString || '{}')
    const context = sessionContextStore.get(sessionRef.current?.session_id)
    
    if (!context) {
      throw new Error('Session context not found')
    }
    
    // 🔧 NOUVEAUTÉ: Vérifier si c'est un custom tool
    const isCustomTool = !['get_member_profile', 'update_member_info', 'log_member_interaction', 'manage_session_state'].includes(name)
    
    let toolResponse: any
    
    if (isCustomTool) {
      // ✨ EXÉCUTER VIA CUSTOM TOOL EXECUTOR
      kioskLogger.session(`🔧 Custom tool: ${name}`, 'info')
      
      const result = await CustomToolExecutor.execute(
        context.gym_id,
        name,
        args,
        {
          member: {
            id: context.member_id,
            email: context.member_email,
            first_name: context.member_first_name,
            last_name: context.member_last_name
          },
          gym: {
            id: context.gym_id,
            name: context.gym_name
          },
          session_id: context.session_id
        }
      )
      
      // Envoyer résultat à OpenAI
      sendToolResult(call_id, result)
      
    } else {
      // Tools built-in (comme avant)
      switch (name) {
        case 'get_member_profile':
          toolResponse = await fetch('/api/jarvis/tools/get-member-profile', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(args)
          })
          break
        // ... autres tools built-in
      }
      
      const result = await toolResponse.json()
      sendToolResult(call_id, result)
    }
    
  } catch (error: any) {
    kioskLogger.session(`❌ Tool error: ${error.message}`, 'error')
    sendToolError(call_id, error.message)
  }
}, [])
```

---

## 🔐 **SÉCURITÉ & BEST PRACTICES**

### **1. Validation stricte**
```typescript
// Interdire keywords SQL dangereux
const FORBIDDEN_SQL = ['DROP', 'DELETE', 'UPDATE', 'TRUNCATE', 'ALTER', 'GRANT']

// Limiter taille payload
const MAX_BODY_SIZE = 1MB

// Timeout obligatoire
const MAX_TIMEOUT = 30000 // 30s max
```

### **2. Sandbox JavaScript**
```typescript
// Utiliser isolated-vm ou Deno runtime
import { Isolate } from 'isolated-vm'

const isolate = new Isolate({ memoryLimit: 128 })
const context = isolate.createContextSync()

// Interdire accès:
// - process, require, import
// - fs, net, http
// - eval, Function constructor
```

### **3. Secrets Management**
```typescript
// Stocker API keys chiffrées dans Supabase Vault
const { data } = await supabase.rpc('decrypt_secret', {
  secret_id: 'gym_api_key_xxx'
})
```

### **4. Rate Limiting**
- Par membre: 10 calls/jour (configurable par tool)
- Par gym: 100 calls/heure (protection abus)
- Global: 1000 calls/jour (quota Supabase)

### **5. Audit Trail**
- Toutes exécutions loggées (30 jours retention)
- Analytics temps réel (success rate, exec time)
- Alertes si error rate > 50%

---

## 📊 **AVANTAGES vs HARDCODÉ**

| Critère | Hardcodé | No-Code Tools |
|---------|----------|---------------|
| **Ajout tool** | 3 fichiers à modifier | UI dashboard (5 min) |
| **Maintenance** | Dev requis | Gérant autonome |
| **Personnalisation** | Impossible | Infinie |
| **Time to market** | 2h/tool | 5 min/tool |
| **Scalabilité** | Limitée | Illimitée |
| **Business model** | Gratuit | Potentiel upsell |

---

## 💰 **MONÉTISATION POSSIBLE**

```
Plan Starter (inclus):
  - 5 custom tools max
  - 100 exécutions/jour
  
Plan Professional (+50€/mois):
  - 20 custom tools
  - 1000 exécutions/jour
  - JavaScript sandbox
  
Plan Enterprise (+150€/mois):
  - Tools illimités
  - Exécutions illimitées
  - Support prioritaire
```

---

## 🎯 **ROADMAP IMPLÉMENTATION**

### **Phase 1: MVP (5 jours)**
```bash
Jour 1: Créer tables custom_tools + custom_tool_executions
Jour 2: CustomToolExecutor (API REST + MCP Supabase)
Jour 3: UI Tool Builder (basic form)
Jour 4: Intégration useVoiceChat
Jour 5: Tests E2E
```

### **Phase 2: Templates & UX (3 jours)**
```bash
Jour 6: Templates pré-configurés
Jour 7: Visual editor amélioré
Jour 8: Analytics dashboard
```

### **Phase 3: Advanced (2 jours)**
```bash
Jour 9: JavaScript sandbox
Jour 10: Marketplace tools communautaires
```

---

## 🚀 **CONCLUSION**

**Avec cette architecture:**

1. ✅ Gérants créent tools en 5 min (sans coder)
2. ✅ Chaque gym personnalise JARVIS selon ses besoins
3. ✅ MCP utilisé de manière sécurisée (backend only ou queries READ)
4. ✅ Scalabilité infinie (tools = data, pas code)
5. ✅ Nouveau business model (upsell plans avancés)

**Tu veux que je commence par quoi ?**

1. **Créer migration SQL tables** (30 min)
2. **Coder CustomToolExecutor** (3h)
3. **Builder UI dashboard** (4h)
4. **Intégration complète** (2h)

**Dis-moi et je code ! 🚀**



