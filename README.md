# Exchange

A small real-time trading exchange playground: C++ market-data server, React UI,
and a Node prototype simulator.

## What is this?

Three packages under one repo:

| Package | Role |
|---------|------|
| **backend** | C++23 WebSocket server (uWebSockets + OpenSSL). Auth, channel subscribe, live market snapshots over `wss://`. |
| **frontend** | React + TypeScript (Vite) UI that connects to the backend, logs in, and renders the order book. |
| **simulator** | Early Node.js WebSocket mock that emits random bid/ask levels. Useful as a stand-in when the C++ server is not running. |

This is not a full matching engine yet. The backend currently focuses on secure
WebSocket transport, login, and broadcast market data. Binary protocol sketches
for order entry live in `backend/TODO.md`.

## Project layout

```
exchange/
├── backend/     # C++ WSS server
├── frontend/    # React client
└── simulator/   # Node mock market-data server
```

## Prerequisites

- C++23 compiler (g++ or clang++)
- CMake ≥ 3.20
- OpenSSL + zlib development libraries
- Node.js 18+ and npm
- Git (for submodules)

On Debian/Ubuntu:

```bash
sudo apt install build-essential cmake libssl-dev zlib1g-dev
```

## Getting started

### 1. Clone and init submodules

```bash
git clone https://github.com/builder-inc/exchange.git
cd exchange
git submodule update --init --recursive
```

### 2. Backend (C++ WSS server)

The server speaks **WebSocket over TLS** on port `7000`.

Generate a local self-signed cert (dev only):

```bash
cd backend
mkdir -p certs
openssl req -x509 -sha256 -newkey rsa:2048 \
  -keyout certs/key.pem -out certs/cert.pem -days 365 -nodes \
  -subj "/C=IN/O=Builder Inc./CN=localhost" \
  -addext "subjectAltName = DNS:localhost"
```

Build and run:

```bash
cmake -S . -B build
cmake --build build
cd build && ./websocket_server
```

Optional tests:

```bash
cmake --build build --target check
# or: cd build && make tests && ./tests
```

Demo logins hard-coded in the server:

| Username  | Password  |
|-----------|-----------|
| `shashwat` | `shashwat` |
| `nero`     | `nero`     |

WebSocket message formats, error codes, and `websocat` / `wscat` examples are in
[backend/README.md](backend/README.md).

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

Open the Vite URL (usually `http://localhost:5173`), connect to
`wss://localhost:7000`, log in, then subscribe to `market/snapshot`.

Browsers block self-signed certificates by default. Trust
`backend/certs/cert.pem` in your OS/browser, or accept the certificate warning
before the WebSocket handshake will succeed.

### 4. Simulator (optional mock)

The simulator is a **separate** mock server on port `7000`. Do not run it at the
same time as the C++ backend — both bind the same port.

```bash
cd simulator
npm install
npm run dev
```

Use it when you only need a throwaway market-data stream and do not want to
build the C++ server.

## Typical local workflow

1. Generate certs and start the backend: `cd backend/build && ./websocket_server`
2. Start the frontend: `cd frontend && npm run dev`
3. In the UI: Connect → Login → Subscribe

## Commands cheat sheet

### Backend

| Command | Description |
|---------|-------------|
| `cmake -S backend -B backend/build` | Configure from repo root |
| `cmake --build backend/build` | Build server |
| `cmake --build backend/build --target tests` | Build tests |
| `backend/build/tests` | Run tests |
| `backend/build/websocket_server` | Run WSS server (cwd with access to `certs/`) |

### Frontend

| Command | Description |
|---------|-------------|
| `npm run dev` | Dev server with HMR |
| `npm run build` | Production build |
| `npm run lint` | ESLint |
| `npm run preview` | Preview production build |

### Simulator

| Command | Description |
|---------|-------------|
| `npm run dev` | Start mock WS server on port 7000 |

## Troubleshooting

**CMake cannot find OpenSSL**  
Install `libssl-dev` (Debian/Ubuntu) or `openssl` (Homebrew).

**Submodule checkout is empty**  
From the repo root: `git submodule update --init --recursive`.

**Browser WebSocket fails with a certificate error**  
Expected with the self-signed cert. Trust `backend/certs/cert.pem` or use
`websocat --insecure wss://localhost:7000` for CLI testing.

**Port 7000 already in use**  
Stop the other process. Backend and simulator both default to 7000.

## Further reading

- [backend/README.md](backend/README.md) — build notes and WebSocket API
- [frontend/README.md](frontend/README.md) — client usage
- [backend/TODO.md](backend/TODO.md) — sketched binary trading protocol
