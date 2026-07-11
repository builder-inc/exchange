import { useCallback, useEffect, useRef, useState } from 'react';
import {
  DEFAULT_WS_URL,
  MARKET_CHANNEL,
  type AuthStatus,
  type ConnectionStatus,
  type MarketSnapshot,
  type ServerMessage,
} from '../types';

function isMarketSnapshot(msg: ServerMessage): msg is MarketSnapshot {
  return (
    typeof msg === 'object' &&
    msg !== null &&
    'ask' in msg &&
    'bid' in msg &&
    !('type' in msg)
  );
}

export function useExchangeSocket(url: string = DEFAULT_WS_URL) {
  const wsRef = useRef<WebSocket | null>(null);
  const [connectionStatus, setConnectionStatus] =
    useState<ConnectionStatus>('disconnected');
  const [authStatus, setAuthStatus] = useState<AuthStatus>('logged_out');
  const [username, setUsername] = useState<string | null>(null);
  const [snapshot, setSnapshot] = useState<MarketSnapshot | null>(null);
  const [subscribed, setSubscribed] = useState(false);
  const [lastError, setLastError] = useState<string | null>(null);
  const [log, setLog] = useState<string[]>([]);

  const appendLog = useCallback((line: string) => {
    setLog((prev) => [line, ...prev].slice(0, 40));
  }, []);

  const send = useCallback((payload: Record<string, unknown>) => {
    const ws = wsRef.current;
    if (!ws || ws.readyState !== WebSocket.OPEN) {
      setLastError('Socket is not connected');
      return false;
    }
    ws.send(JSON.stringify(payload));
    return true;
  }, []);

  const disconnect = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    setConnectionStatus('disconnected');
    setAuthStatus('logged_out');
    setUsername(null);
    setSnapshot(null);
    setSubscribed(false);
  }, []);

  const connect = useCallback(() => {
    if (
      wsRef.current &&
      (wsRef.current.readyState === WebSocket.OPEN ||
        wsRef.current.readyState === WebSocket.CONNECTING)
    ) {
      return;
    }

    setConnectionStatus('connecting');
    setLastError(null);
    appendLog(`Connecting to ${url}…`);

    const ws = new WebSocket(url);
    wsRef.current = ws;

    ws.onopen = () => {
      setConnectionStatus('connected');
      appendLog('Connected');
    };

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(String(event.data)) as ServerMessage;

        if (isMarketSnapshot(msg)) {
          setSnapshot(msg);
          return;
        }

        if (!('type' in msg)) {
          return;
        }

        switch (msg.type) {
          case 'login_response':
            if (msg.status === 'success' || msg.status === 'already_logged_in') {
              setAuthStatus('authenticated');
              appendLog(`Login ${msg.status}`);
            } else {
              setAuthStatus('failed');
              setLastError('Login failed — check credentials');
              appendLog('Login failed');
            }
            break;
          case 'subscribe_response':
            setSubscribed(true);
            appendLog(`Subscribed to ${msg.channel}`);
            break;
          case 'unsubscribe_response':
            setSubscribed(false);
            setSnapshot(null);
            appendLog(`Unsubscribed from ${msg.channel}`);
            break;
          case 'error':
            setLastError(msg.message);
            appendLog(`Error: ${msg.message}`);
            break;
          default:
            appendLog(`Message: ${JSON.stringify(msg)}`);
        }
      } catch {
        appendLog(`Non-JSON message: ${String(event.data)}`);
      }
    };

    ws.onerror = () => {
      setConnectionStatus('error');
      setLastError(
        'WebSocket error. For self-signed certs, trust certs/cert.pem or open the backend URL once in the browser and accept the warning.',
      );
      appendLog('WebSocket error');
    };

    ws.onclose = () => {
      setConnectionStatus('disconnected');
      setAuthStatus('logged_out');
      setUsername(null);
      setSubscribed(false);
      wsRef.current = null;
      appendLog('Disconnected');
    };
  }, [appendLog, url]);

  const login = useCallback(
    (user: string, password: string) => {
      setAuthStatus('logging_in');
      setUsername(user);
      setLastError(null);
      const ok = send({ type: 'login', username: user, password });
      if (!ok) {
        setAuthStatus('logged_out');
        setUsername(null);
      }
    },
    [send],
  );

  const subscribe = useCallback(() => {
    send({ type: 'subscribe', channel: MARKET_CHANNEL });
  }, [send]);

  const unsubscribe = useCallback(() => {
    send({ type: 'unsubscribe', channel: MARKET_CHANNEL });
  }, [send]);

  useEffect(() => {
    return () => {
      wsRef.current?.close();
    };
  }, []);

  return {
    connectionStatus,
    authStatus,
    username,
    snapshot,
    subscribed,
    lastError,
    log,
    connect,
    disconnect,
    login,
    subscribe,
    unsubscribe,
  };
}
