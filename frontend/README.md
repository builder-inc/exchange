# Frontend

React + TypeScript client for the exchange WebSocket API.

## Dev server

```bash
npm install
npm run dev
```

Open the URL Vite prints (usually `http://localhost:5173`).

## Connecting to the backend

1. Start the C++ backend on port `7000` with SSL certs (see `backend/README.md`).
2. In the UI, connect to `wss://localhost:7000`.
3. Log in with a demo user (`shashwat` / `shashwat` or `nero` / `nero`).
4. Subscribe to `market/snapshot` to stream live bid/ask levels.

Browsers reject self-signed certificates by default. Trust `backend/certs/cert.pem`
locally, or accept the certificate warning before the WebSocket handshake succeeds.
