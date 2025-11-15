/**
 * JARVIS Voice System - Unified Exports
 * 
 * Architecture GA propre et scalable pour OpenAI Realtime API
 */

// Core
export { AudioProcessor } from './core/audio-processor';
export { EventRouter, createStandardEventRouter } from './core/event-router';
export { RealtimeSessionFactory, createSessionWithRetry } from './core/realtime-session-factory';
export { RealtimeWebRTCClient } from './core/realtime-webrtc-client';

// Contexts
export { 
  VITRINE_CONFIG,
  getVitrineSessionConfig,
  checkVitrineRateLimit
} from './contexts/vitrine-config';

export {
  KIOSK_CONFIG,
  KIOSK_TOOLS,
  getKioskSessionConfig
} from './contexts/kiosk-config';

// Types
export type * from './types';



 * JARVIS Voice System - Unified Exports
 * 
 * Architecture GA propre et scalable pour OpenAI Realtime API
 */

// Core
export { AudioProcessor } from './core/audio-processor';
export { EventRouter, createStandardEventRouter } from './core/event-router';
export { RealtimeSessionFactory, createSessionWithRetry } from './core/realtime-session-factory';
export { RealtimeWebRTCClient } from './core/realtime-webrtc-client';

// Contexts
export { 
  VITRINE_CONFIG,
  getVitrineSessionConfig,
  checkVitrineRateLimit
} from './contexts/vitrine-config';

export {
  KIOSK_CONFIG,
  KIOSK_TOOLS,
  getKioskSessionConfig
} from './contexts/kiosk-config';

// Types
export type * from './types';



