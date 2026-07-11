import { useState, type FormEvent } from 'react';
import { useExchangeSocket } from './hooks/useExchangeSocket';
import { DEFAULT_WS_URL, type BookLevels } from './types';

const LEVELS = [
  'level_1',
  'level_2',
  'level_3',
  'level_4',
  'level_5',
] as const;

function formatPrice(n: number): string {
  return n.toFixed(6);
}

function BookSide({
  title,
  levels,
  side,
}: {
  title: string;
  levels: BookLevels | undefined;
  side: 'ask' | 'bid';
}) {
  return (
    <div className={`book-side book-side--${side}`}>
      <h3>{title}</h3>
      <table>
        <thead>
          <tr>
            <th>Level</th>
            <th>Price</th>
          </tr>
        </thead>
        <tbody>
          {LEVELS.map((key, i) => (
            <tr key={key}>
              <td>{i + 1}</td>
              <td className="mono">
                {levels ? formatPrice(levels[key]) : '—'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function statusLabel(status: string): string {
  return status.replaceAll('_', ' ');
}

export default function App() {
  const [wsUrl, setWsUrl] = useState(DEFAULT_WS_URL);
  const [user, setUser] = useState('shashwat');
  const [password, setPassword] = useState('shashwat');

  const {
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
  } = useExchangeSocket(wsUrl);

  const onLogin = (e: FormEvent) => {
    e.preventDefault();
    login(user, password);
  };

  const connected = connectionStatus === 'connected';
  const authenticated = authStatus === 'authenticated';

  return (
    <div className="app">
      <header className="header">
        <div>
          <h1>Exchange</h1>
          <p className="subtitle">Live market data over WSS</p>
        </div>
        <div className="status-pills">
          <span className={`pill pill--${connectionStatus}`}>
            {statusLabel(connectionStatus)}
          </span>
          <span className={`pill pill--${authStatus}`}>
            {statusLabel(authStatus)}
            {username ? ` · ${username}` : ''}
          </span>
        </div>
      </header>

      {lastError && <div className="banner banner--error">{lastError}</div>}

      <section className="panel">
        <h2>Connection</h2>
        <div className="row">
          <label className="field grow">
            <span>WebSocket URL</span>
            <input
              value={wsUrl}
              onChange={(e) => setWsUrl(e.target.value)}
              disabled={connected || connectionStatus === 'connecting'}
              spellCheck={false}
            />
          </label>
          {!connected ? (
            <button
              type="button"
              className="btn btn--primary"
              onClick={connect}
              disabled={connectionStatus === 'connecting'}
            >
              {connectionStatus === 'connecting' ? 'Connecting…' : 'Connect'}
            </button>
          ) : (
            <button type="button" className="btn" onClick={disconnect}>
              Disconnect
            </button>
          )}
        </div>
        <p className="hint">
          Backend listens on <code>wss://localhost:7000</code>. Self-signed certs
          must be trusted by the browser (import <code>backend/certs/cert.pem</code>
          or accept the certificate warning).
        </p>
      </section>

      <section className="panel">
        <h2>Login</h2>
        <form className="row" onSubmit={onLogin}>
          <label className="field">
            <span>Username</span>
            <input
              value={user}
              onChange={(e) => setUser(e.target.value)}
              disabled={!connected || authenticated}
              autoComplete="username"
            />
          </label>
          <label className="field">
            <span>Password</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={!connected || authenticated}
              autoComplete="current-password"
            />
          </label>
          <button
            type="submit"
            className="btn btn--primary"
            disabled={!connected || authenticated || authStatus === 'logging_in'}
          >
            {authStatus === 'logging_in' ? 'Logging in…' : 'Login'}
          </button>
        </form>
        <p className="hint">
          Demo users: <code>shashwat / shashwat</code>, <code>nero / nero</code>
        </p>
      </section>

      <section className="panel">
        <div className="row between">
          <h2>Market Snapshot</h2>
          <div className="row gap">
            <button
              type="button"
              className="btn btn--primary"
              onClick={subscribe}
              disabled={!authenticated || subscribed}
            >
              Subscribe
            </button>
            <button
              type="button"
              className="btn"
              onClick={unsubscribe}
              disabled={!authenticated || !subscribed}
            >
              Unsubscribe
            </button>
          </div>
        </div>

        <div className="book">
          <BookSide title="Bids" levels={snapshot?.bid} side="bid" />
          <BookSide title="Asks" levels={snapshot?.ask} side="ask" />
        </div>
        {!subscribed && authenticated && (
          <p className="hint">Subscribe to receive live snapshots every second.</p>
        )}
      </section>

      <section className="panel">
        <h2>Event Log</h2>
        <ul className="log">
          {log.length === 0 && <li className="muted">No events yet</li>}
          {log.map((line, i) => (
            <li key={`${i}-${line}`} className="mono">
              {line}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
