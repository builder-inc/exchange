### NICE
```cpp
enum class MessageType : uint32_t {
    LOGIN_REQUEST,
    LOGIN_RESPONSE,
    HEART_BEAT,
    USER_INFORMATION_REQUEST,
    USER_INFORMATION_RESPONSE,
    USER_CREDIT_INFORMATION,
    USER_ORDER_INFORMATION_HEADER,
    USER_ORDER_INFORMATION,
    USER_ORDER_INFORMATION_FOOTER,
    ORDER_ENTRY_REQUEST,
    ORDER_ENTRY_RESPONSE,
    ORDER_MODIFICATION_REQUEST,
    ORDER_MODIFICATION_RESPONSE,
    ORDER_CANCELLATION_REQUEST,
    ORDER_CANCELLATION_RESPONSE,
    TRADE_RESPONSE
};

enum class ResponseType : uint32_t {
    SUCCESS,
    FAILURE,
    INVALID_USER,
    INVALID_PASSWORD,
    UNKNOWN_ERROR
};

enum class UserInformationType : uint32_t {
    ACCOUNT_BALANCE,
    ACCOUNT_MARGIN,
    AVAILABLE_FUNDS
};

struct LoginRequest {
    MessageType message_type;
    uint32_t sequence_no;
    uint32_t user_id;
    char password[32];
};

struct LoginResponse {
    MessageType message_type;
    uint32_t sequence_no;
    ResponseType response_code;
};

struct HeartBeat {
    MessageType message_type;
    uint32_t sequence_no;
};

struct UserInformationRequest {
    MessageType message_type;
    uint32_t sequence_no;
    UserInformationType user_information_type;
};

struct UserInformationResponse {
    MessageType message_type;
    uint32_t sequence_no;
    UserInformationType user_information_type;
};

struct UserCreditInformation {
    MessageType message_type;
    uint32_t sequence_no;
    uint32_t account_balance;
    uint32_t account_margin;
    uint32_t available_fund;
};

struct UserOrderInformationHeader {
    MessageType message_type;
    uint32_t sequence_no;
};

struct UserOrderInformation {
    MessageType message_type;
    uint32_t sequence_no;
    uint32_t asset_id;
    uint32_t quantity;
    uint32_t price;
    uint64_t timestamp;
};

struct UserOrderInformationFooter {
    MessageType message_type;
    uint32_t sequence_no;
};

struct OrderEntryRequest {
    MessageType message_type;
    uint32_t sequence_no;
    uint32_t asset_id;
    uint32_t quantity;
    uint32_t price;
    uint32_t user_id;
    uint64_t timestamp;
};

struct OrderEntryResponse {
    MessageType message_type;
    uint32_t sequence_no;
    uint32_t asset_id;
    uint32_t quantity;
    uint32_t price;
    uint32_t user_id;
    uint64_t timestamp;
    uint32_t order_id;
};

struct OrderModificationRequest {
    MessageType message_type;
    uint32_t sequence_no;
    uint32_t asset_id;
    uint32_t quantity;
    uint32_t price;
    uint32_t user_id;
    uint64_t timestamp;
    uint32_t order_id;
};

struct OrderModificationResponse {
    MessageType message_type;
    uint32_t sequence_no;
    uint32_t asset_id;
    uint32_t quantity;
    uint32_t price;
    uint32_t user_id;
    uint64_t timestamp;
    uint32_t order_id;
};

struct OrderCancellationRequest {
    MessageType message_type;
    uint32_t sequence_no;
    uint32_t user_id;
    uint32_t order_id;
};

struct OrderCancellationResponse {
    MessageType message_type;
    uint32_t sequence_no;
    uint32_t user_id;
    uint32_t order_id;
};

struct TradeResponse {
    MessageType message_type;
    uint32_t sequence_no;
    uint32_t asset_id;
    uint32_t trade_price;
    uint32_t quantity;
    uint32_t buyer_order_id;
    uint32_t seller_order_id;
    uint64_t timestamp;
};
```
