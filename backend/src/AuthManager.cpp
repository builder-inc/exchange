#include "include/AuthManager.hpp"

// clang-format off
AuthManager::AuthManager() {
    credentials_ = {
        {"shashwat", "shashwat"},
        {"nero", "nero"},
        {"test", "test"}
    };
};
// clang-format on

bool AuthManager::authenticate(const std::string &username,
                               const std::string &password) const {
    auto it = credentials_.find(username);
    return (it != credentials_.end() && it->second == password);
}
