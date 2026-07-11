export type ConnectionStatus =
  | 'disconnected'
  | 'connecting'
  | 'connected'
  | 'error';

export type AuthStatus = 'logged_out' | 'logging_in' | 'authenticated' | 'failed';

export type BookLevels = {
  level_1: number;
  level_2: number;
  level_3: number;
  level_4: number;
  level_5: number;
};

export type MarketSnapshot = {
  ask: BookLevels;
  bid: BookLevels;
};

export type ServerMessage =
  | { type: 'login_response'; status: 'success' | 'failed' | 'already_logged_in' }
  | { type: 'subscribe_response'; status: string; channel: string }
  | { type: 'unsubscribe_response'; status: string; channel: string }
  | { type: 'error'; message: string }
  | MarketSnapshot;

export const MARKET_CHANNEL = 'market/snapshot';
export const DEFAULT_WS_URL = 'wss://localhost:7000';
