#include "include/WebSocketServer.hpp"
#include "include/MarketData.hpp"
#include <charconv>
#include <chrono>
#include <include/handlers/Handlers.hpp>
#include <nlohmann/json.hpp>
#include <print>

namespace {
struct BroadcastData {
    uWS::SSLApp *app;
    size_t broadcast_left;
};

void broadcast_callback(us_timer_t *t) {
    if (t) {
        BroadcastData *data = static_cast<BroadcastData *>(us_timer_ext(t));
        if (data->broadcast_left > 0) {
            std::string snapshot = create_market_snapshot();
            data->app->publish(WebSocketServer::MARKET_SNAPSHOT_SUB_STR,
                               snapshot, uWS::OpCode::TEXT);

            data->broadcast_left--;
            std::println("Broadcast sent. {} remaining", data->broadcast_left);
        } else {
            // closing the timer here will cause double free :sob:
            us_timer_set(t, nullptr, 0, 0);
        }
    }
};
using json = nlohmann::json;
using ordered_json = nlohmann::ordered_json;
} // namespace

WebSocketServer::WebSocketServer(int port, const std::string &key_file,
                                 const std::string &cert_file)
    : auth_(), key_file_(key_file), cert_file_(cert_file),
      app_({.key_file_name = key_file_.c_str(),
            .cert_file_name = cert_file_.c_str()}),
      port_(port), broadcast_timer_(nullptr, [](us_timer_t *t) {
          if (t)
              us_timer_close(t);
      }) {
    setup_routes();
};

WebSocketServer::~WebSocketServer() { stop_broadcast_timer(); }

void WebSocketServer::setup_routes(void) {
    uWS::SSLApp::WebSocketBehavior<SocketData> ws_behaviour = {
        .open = [this](WebSocket *ws) { this->on_open(ws); },
        .message =
            [this](WebSocket *ws, std::string_view message,
                   uWS::OpCode op_code) {
                this->on_message(ws, message, op_code);
            },
        .close =
            [this](WebSocket *ws, int code, std::string_view message) {
                this->on_close(ws, code, message);
            }};
    app_.ws<SocketData>("/*", std::move(ws_behaviour));
}

void WebSocketServer::start_broadcast_timer(void) {
    if (broadcast_timer_ || app_.numSubscribers(MARKET_SNAPSHOT_SUB_STR) == 0)
        return;

    us_loop_t *loop = reinterpret_cast<us_loop_t *>(uWS::Loop::get());
    broadcast_timer_.reset(us_create_timer(loop, 0, sizeof(BroadcastData)));
    auto *data =
        static_cast<BroadcastData *>(us_timer_ext(broadcast_timer_.get()));
    data->app = &app_;
    data->broadcast_left = 10;
    us_timer_set(broadcast_timer_.get(), broadcast_callback, 1000, 1000);
}

void WebSocketServer::stop_broadcast_timer(void) {
    if (!broadcast_timer_)
        return;

    std::println("No subscribers left. Stopping broadcast timer.");
    broadcast_timer_.reset();
}

void WebSocketServer::run(void) {
    app_.listen(
            port_,
            [this](us_listen_socket_t *listen_socket) {
                if (!listen_socket) {
                    std::println("webSocket server failed to listen on port {}",
                                 port_);
                    return;
                }
                std::println("WebSocket server listening on port: {}", port_);
            })
        .run();
    std::println("Server shutdown.");
}

void WebSocketServer::on_open(WebSocket * /*ws*/) {
    std::println("Client Connected");
}

/*
 * yeah this does way too much rn, but it works. don’t touch it till it breaks.
 */
void WebSocketServer::on_message(WebSocket *ws, std::string_view message,
                                 uWS::OpCode /*op_code*/) {
    SocketData *user = ws->getUserData();
    if (!message.empty() &&
        std::all_of(message.begin(), message.end(), ::isdigit)) {
        long long client_timestamp{};
        // https://en.cppreference.com/cpp/utility/from_chars
        auto [ptr, ec] = std::from_chars(
            message.data(), message.data() + message.size(), client_timestamp);
        if (ec != std::errc{}) {
            std::println(stderr, "Received a non-timestamp message: {}",
                         message);
            return;
        }
        auto server_timestamp =
            std::chrono::duration_cast<std::chrono::milliseconds>(
                std::chrono::system_clock::now().time_since_epoch())
                .count();
        long long diff = server_timestamp - client_timestamp;
        std::println("[LOG]: server: {} client: {} diff: {}", server_timestamp,
                     client_timestamp, diff);
        return;
    }

    enum class MessageType { LOGIN, SUBSCRIBE, UNSUBSCRIBE, UNKNOWN };
    auto message_type_from_string = [](std::string_view type) {
        if (type == "login")
            return MessageType::LOGIN;
        if (type == "subscribe")
            return MessageType::SUBSCRIBE;
        if (type == "unsubscribe")
            return MessageType::UNSUBSCRIBE;
        return MessageType::UNKNOWN;
    };

    json msg = json::parse(message, nullptr, false);
    if (msg.is_discarded()) {
        std::println("[Error] Invalid JSON:");
        ws->send(R"({"type":"error","message":"invalid_json"})",
                 uWS::OpCode::TEXT);
        return;
    }
    std::string type = msg.value("type", "");
    MessageType mtype = message_type_from_string(type);
    if (mtype != MessageType::LOGIN && !user->is_authenticated) {
        ws->send(R"({"type":"error","message":"not_authenticated"})",
                 uWS::OpCode::TEXT);
        return;
    }

    /*
     * TODO: class with virtual handler function would be the best choice
     * for this :)"
     */
    // clang-format off
        switch (mtype) {
            case MessageType::LOGIN: {
                LoginHandler(this, ws, user, msg);
                break;
            }
            case MessageType::SUBSCRIBE: {
                SubscribeHandler(this, ws, user, msg);
                break;
            }
            case MessageType::UNSUBSCRIBE: {
                UnSubscribeHandler(this, ws, user, msg);
                break;
            }
            case MessageType::UNKNOWN:
            default: {
                ws->send(R"({"type":"error","message":"unknown_command"})",
                         uWS::OpCode::TEXT);
                break;
            }
        }
    // clang-format on
}

void WebSocketServer::on_close(WebSocket * /*ws*/, int /*code*/,
                               std::string_view /*message*/) {
    std::println("Client disconnected.");
    if (app_.numSubscribers(MARKET_SNAPSHOT_SUB_STR) == 0) {
        std::println("Last client disconnected. Stopping broadcast timer.");
        broadcast_timer_.reset(nullptr);
    }
}
