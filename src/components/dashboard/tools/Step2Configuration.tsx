/**
 * Step 2: Technical Configuration
 * Configuration selon le type de tool (API REST, MCP Supabase, Webhook)
 */

'use client'

import { useState } from 'react'
import type { 
  CustomToolFormData, 
  ApiRestConfig,
  McpSupabaseConfig,
  WebhookConfig,
  ToolParameter 
} from '@/types/custom-tools'
