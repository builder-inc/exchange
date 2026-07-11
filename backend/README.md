## Build

```bash
# uwebsocket submodule
git submodule update --init --recursive

# generate build files
cmake -S . -B build
```

This server uses `wss://` (Secure WebSockets) and requires an SSL certificate to run.
For local development, you can generate a self-signed certificate.
**Note:** These certificates are for development purposes only and will cause browser warnings.
1.  **Create a directory for your certificates:**
    ```bash
    mkdir certs
    ```
2.  **Generate the self-signed certificate and private key:**
    ```bash
    openssl req -x509 -sha256 -newkey rsa:2048 -keyout certs/key.pem -out certs/cert.pem -days 365 -nodes \
        -subj "/C=IN/O=Builder Inc./CN=localhost" \
        -addext "subjectAltName = DNS:localhost"
    ```

The server is configured to look for `key.pem` and `cert.pem` inside the `certs/` directory.
```bash
# Using make (default generator)
cd build && make

# Or a generator-agnostic alternative
cd build && cmake --build .
```

**Start the server:**
```bash
./websocket_server
```

## Tests
```bash
# Build test executable only
cd build && make tests

# Run tests manually
./tests

# Build and run all tests in one step
make check

# Or using CMake generator-agnostic syntax
cmake --build . --target check
```

## API

The server uses **WebSocket over TLS** (`wss://`) on port `7000`. Connect to `wss://localhost:7000`.

All messages are JSON strings. Clients must authenticate before using any other command.

### Message Types

#### Login
Send:
```json
{"type": "login", "username": "shashwat", "password": "shashwat"}
```
Response:
```json
{"type": "login_response", "status": "success"}
```
Other statuses: `"failed"`, `"already_logged_in"`

Default credentials: `shashwat`/`shashwat`, `nero`/`nero`

#### Subscribe to Market Data
Send:
```json
{"type": "subscribe", "channel": "market/snapshot"}
```
Response:
```json
{"type": "subscribe_response", "status": "ok", "channel": "market/snapshot"}
```
Once subscribed, the server broadcasts a market snapshot every second.

#### Unsubscribe
Send:
```json
{"type": "unsubscribe", "channel": "market/snapshot"}
```
Response:
```json
{"type": "unsubscribe_response", "status": "ok", "channel": "market/snapshot"}
```

#### Market Snapshot (Server Broadcast)
```json
{
  "ask":{
      "level_1":0.6617469155089037,"level_2":0.5694185425603027,
      "level_3":0.6623632407720937,"level_4":0.7771555433504215,
      "level_5":0.9472390224056843
      },
  "bid":{
      "level_1":0.49673064124261396,"level_2":0.2642594874240395,
      "level_3":0.7683473906185206,"level_4":0.6231112700637431,
      "level_5":0.32603959983506586
      }
}
```

#### Error Responses
```json
{"type": "error", "message": "not_authenticated"}
{"type": "error", "message": "unknown_command"}
{"type": "error", "message": "invalid_json"}
{"type": "error", "message": "unknown_channel"}
```

### Usage Examples

**websocat**
```bash
websocat -v --insecure wss://localhost:7000
```

Then type messages directly:
```json
{"type": "login", "username": "shashwat", "password": "shashwat"}
{"type": "subscribe", "channel": "market/snapshot"}
```

**wscat**:
```bash
wscat -v -n -c wss://localhost:7000 --no-check
```

## Editor Notes
```bash
# only needed if your editor/clangd is SHIT.
# (optional) editor happy = developer happy
ln -sf build/compile_commands.json compile_commands.json
```
