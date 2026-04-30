cmake_minimum_required(VERSION 3.20)
if(POLICY CMP0135)
    cmake_policy(SET CMP0135 NEW)
endif()

project(WebSocketServer CXX)

set(CMAKE_CXX_STANDARD 23)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_EXPORT_COMPILE_COMMANDS ON)
set(TARGET_NAME websocket_server)

if (MSVC)
    add_compile_options(/W4 /WX)
else()
    add_compile_options(-Wall -Wextra -Wpedantic -fno-exceptions)
    if (CMAKE_BUILD_TYPE MATCHES "Debug|RelWithDebInfo")
        add_compile_options(
            -fsanitize=address,undefined
            -fno-omit-frame-pointer
        )
        add_link_options(
            -fsanitize=address,undefined
        )
    endif()

endif()

include(FetchContent)

FetchContent_Declare(
  tec.h
  GIT_REPOSITORY https://github.com/ShashwatAgrawal20/tec.h.git
)
FetchContent_MakeAvailable(tec.h)

# https://json.nlohmann.me/integration/cmake/#fetchcontent
FetchContent_Declare(nlohmann_json URL https://github.com/nlohmann/json/releases/download/v3.12.0/json.tar.xz)
FetchContent_MakeAvailable(nlohmann_json)

find_package(OpenSSL REQUIRED)
find_package(ZLIB REQUIRED)

set(USOCKETS_SOURCE_DIR ${CMAKE_CURRENT_SOURCE_DIR}/external/uwebsockets/uSockets)
set(USOCKETS_LIBRARY ${USOCKETS_SOURCE_DIR}/uSockets.a)

add_custom_command(
    OUTPUT ${USOCKETS_LIBRARY}
    COMMAND make WITH_OPENSSL=1 -C ${USOCKETS_SOURCE_DIR}
    COMMENT "Building uSockets library with its Makefile"
)

add_custom_target(
    build_usockets ALL
    DEPENDS ${USOCKETS_LIBRARY}
)

add_library(uSockets STATIC IMPORTED)
set_target_properties(uSockets PROPERTIES
    IMPORTED_LOCATION "${USOCKETS_LIBRARY}"
    INTERFACE_INCLUDE_DIRECTORIES "${USOCKETS_SOURCE_DIR}/src"
)
add_dependencies(uSockets build_usockets)

add_library(uWebSockets_Interface INTERFACE)
target_include_directories(uWebSockets_Interface INTERFACE
    ${CMAKE_CURRENT_SOURCE_DIR}
)
target_link_libraries(uWebSockets_Interface INTERFACE uSockets ZLIB::ZLIB OpenSSL::SSL OpenSSL::Crypto)

file(GLOB_RECURSE TARGET_SOURCES "src/*.cpp")
list(FILTER TARGET_SOURCES EXCLUDE REGEX ".*/main\\.cpp$")

add_library(app_lib STATIC ${TARGET_SOURCES})
target_link_libraries(app_lib PUBLIC
    uWebSockets_Interface
    nlohmann_json::nlohmann_json
)
target_include_directories(app_lib PUBLIC
    ${CMAKE_CURRENT_SOURCE_DIR}
)
add_dependencies(app_lib build_usockets)

add_executable(${TARGET_NAME} src/main.cpp)
target_link_libraries(${TARGET_NAME} PRIVATE app_lib)

include(CTest)
if(BUILD_TESTING)
    file(GLOB_RECURSE TEST_SOURCES "tests/*.cpp")
    add_executable(tests EXCLUDE_FROM_ALL
        ${TEST_SOURCES}
    )
    target_link_libraries(tests PRIVATE app_lib)
    target_include_directories(tests PUBLIC
        ${tec.h_SOURCE_DIR}
    )
    add_test(NAME tests COMMAND tests)
    add_custom_target(check
        COMMAND ${CMAKE_COMMAND} -E env CTEST_OUTPUT_ON_FAILURE=1 ./tests || true
        DEPENDS tests
        WORKING_DIRECTORY ${CMAKE_BINARY_DIR}
    )
endif()
