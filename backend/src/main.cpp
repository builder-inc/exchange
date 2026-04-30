#include <include/WebSocketServer.hpp>

int main() {
    constexpr int listen_port = 7000;

    WebSocketServer server(listen_port, "../certs/key.pem",
                           "../certs/cert.pem");
    server.run();
    return 0;
}
