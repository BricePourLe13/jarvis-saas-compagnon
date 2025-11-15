/**
 * 🎙️ CORE COMMUN - VOICE REALTIME SYSTEM
 * 
 * Hook React réutilisable pour la gestion WebRTC avec OpenAI Realtime API
 * 
 * Ce hook gère uniquement la couche WebRTC commune (kiosk + vitrine)
 * La logique métier (function calling, timeouts, logging) reste dans les hooks spécifiques
 * 
 * @version 1.0.0
 * @date 2025-01-XX
 */

import { useState, useRef, useCallback, useEffect } from 'react'
import {
  VoiceRealtimeCoreConfig,
  VoiceRealtimeCoreReturn,
  VoiceStatus,
  VoiceAudioState,
  FunctionCallEvent,
  AudioConfig
} from './types'
