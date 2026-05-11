import http from "http";
import https from "https";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BASE_URL = "http://localhost:8000/api/v1";

let accessToken = null;
let userId = null;
let videoId = null;
let tweetId = null;
let commentId = null;
let playlistId = null;

function request(method, url, body = null, headers = {}) {
    return new Promise((resolve, reject) => {
        const urlObj = new URL(url);
        const isHttps = urlObj.protocol === "https:";
        const client = isHttps ? https : http;

        const options = {
            method,
            headers: {
                "Content-Type": "application/json",
                ...headers,
            },
        };

        if (accessToken) {
            options.headers.Authorization = `Bearer ${accessToken}`;
        }

        const req = client.request(url, options, (res) => {
            let data = "";
            res.on("data", (chunk) => { data += chunk; });
            res.on("end", () => {
                try {
                    const parsed = data ? JSON.parse(data) : {};
                    resolve({ status: res.statusCode, body: parsed });
                } catch {
                    resolve({ status: res.statusCode, body: data });
                }
            });
        });

        req.on("error", reject);
        if (body) req.write(JSON.stringify(body));
        req.end();
    });
}

function log(testName, status, result) {
    const emoji = status === "✓" ? "✅" : status === "✗" ? "❌" : "⏳";
    console.log(`${emoji} ${testName}: ${result}`);
}

async function runTests() {
    console.log("\n🚀 REAL API INTEGRATION TEST SUITE\n");
    console.log("=".repeat(70) + "\n");

    try {
        // HEALTHCHECK
        console.log("📋 HEALTHCHECK");
        console.log("-".repeat(70));
        try {
            const res = await request("GET", `${BASE_URL}/healthcheck`);
            log("GET /healthcheck", res.status === 200 ? "✓" : "✗", `Status ${res.status}`);
        } catch (err) { log("GET /healthcheck", "✗", err.message); }

        // USER ENDPOINTS
        console.log("\n👤 USER AUTHENTICATION");
        console.log("-".repeat(70));

        // Try login with test credentials
        try {
            const loginRes = await request("POST", `${BASE_URL}/users/login`, {
                email: "test@example.com",
                password: "Test@123456"
            });
            if (loginRes.status === 200) {
                accessToken = loginRes.body?.data?.accessToken;
                userId = loginRes.body?.data?.user?._id;
                log("POST /users/login", "✓", `Status ${loginRes.status}`);
            } else {
                log("POST /users/login", "✗", `Status ${loginRes.status}`);
            }
        } catch (err) { log("POST /users/login", "✗", err.message); }

        if (accessToken) {
            // Get Current User
            try {
                const res = await request("GET", `${BASE_URL}/users/current-user`);
                log("GET /users/current-user", res.status === 200 ? "✓" : "✗", `Status ${res.status}`);
            } catch (err) { log("GET /users/current-user", "✗", err.message); }

            // Refresh Token
            try {
                const res = await request("POST", `${BASE_URL}/users/refresh-token`, {});
                if (res.status === 200) accessToken = res.body?.data?.accessToken || accessToken;
                log("POST /users/refresh-token", res.status === 200 ? "✓" : "✗", `Status ${res.status}`);
            } catch (err) { log("POST /users/refresh-token", "✗", err.message); }

            // Change Password
            try {
                const res = await request("POST", `${BASE_URL}/users/change-password`, {
                    oldPassword: "Test@123456",
                    newPassword: "NewTest@123456"
                });
                log("POST /users/change-password", res.status === 200 ? "✓" : "✗", `Status ${res.status}`);
            } catch (err) { log("POST /users/change-password", "✗", err.message); }

            // Update Account
            try {
                const res = await request("PATCH", `${BASE_URL}/users/update-account`, {
                    fullName: "Updated Test User",
                    email: `test_${Date.now()}@example.com`
                });
                log("PATCH /users/update-account", res.status === 200 ? "✓" : "✗", `Status ${res.status}`);
            } catch (err) { log("PATCH /users/update-account", "✗", err.message); }

            // Get Watch History
            try {
                const res = await request("GET", `${BASE_URL}/users/history`);
                log("GET /users/history", res.status === 200 ? "✓" : "✗", `Status ${res.status}`);
            } catch (err) { log("GET /users/history", "✗", err.message); }
        }

        // VIDEO ENDPOINTS
        console.log("\n🎥 VIDEO ENDPOINTS");
        console.log("-".repeat(70));
        try {
            const res = await request("GET", `${BASE_URL}/videos`);
            if (res.status === 200) {
                videoId = res.body?.data?.[0]?._id;
                log("GET /videos", "✓", `Status ${res.status} - ${res.body?.data?.length || 0} videos`);
            } else {
                log("GET /videos", "✗", `Status ${res.status}`);
            }
        } catch (err) { log("GET /videos", "✗", err.message); }

        if (videoId) {
            try {
                const res = await request("GET", `${BASE_URL}/videos/${videoId}`);
                log("GET /videos/{videoId}", res.status === 200 ? "✓" : "✗", `Status ${res.status}`);
            } catch (err) { log("GET /videos/{videoId}", "✗", err.message); }
        }

        // TWEET ENDPOINTS
        console.log("\n🐦 TWEET ENDPOINTS");
        console.log("-".repeat(70));
        if (accessToken) {
            try {
                const res = await request("POST", `${BASE_URL}/tweets`, {
                    content: `API Test Tweet ${Date.now()}`
                });
                if (res.status === 201 || res.status === 200) {
                    tweetId = res.body?.data?._id;
                    log("POST /tweets", "✓", `Status ${res.status}`);
                } else {
                    log("POST /tweets", "✗", `Status ${res.status}`);
                }
            } catch (err) { log("POST /tweets", "✗", err.message); }

            if (userId) {
                try {
                    const res = await request("GET", `${BASE_URL}/tweets/user/${userId}`);
                    log("GET /tweets/user/{userId}", res.status === 200 ? "✓" : "✗", `Status ${res.status}`);
                } catch (err) { log("GET /tweets/user/{userId}", "✗", err.message); }
            }

            if (tweetId) {
                try {
                    const res = await request("PATCH", `${BASE_URL}/tweets/${tweetId}`, {
                        content: `Updated Tweet ${Date.now()}`
                    });
                    log("PATCH /tweets/{tweetId}", res.status === 200 ? "✓" : "✗", `Status ${res.status}`);
                } catch (err) { log("PATCH /tweets/{tweetId}", "✗", err.message); }
            }
        }

        // COMMENT ENDPOINTS
        console.log("\n💬 COMMENT ENDPOINTS");
        console.log("-".repeat(70));
        if (videoId) {
            try {
                const res = await request("GET", `${BASE_URL}/comments/${videoId}`);
                if (res.status === 200) {
                    commentId = res.body?.data?.[0]?._id;
                    log("GET /comments/{videoId}", "✓", `Status ${res.status}`);
                } else {
                    log("GET /comments/{videoId}", "✗", `Status ${res.status}`);
                }
            } catch (err) { log("GET /comments/{videoId}", "✗", err.message); }
        }

        if (accessToken && videoId) {
            try {
                const res = await request("POST", `${BASE_URL}/comments/${videoId}`, {
                    content: `Test Comment ${Date.now()}`
                });
                if (res.status === 201 || res.status === 200) {
                    commentId = res.body?.data?._id;
                    log("POST /comments/{videoId}", "✓", `Status ${res.status}`);
                } else {
                    log("POST /comments/{videoId}", "✗", `Status ${res.status}`);
                }
            } catch (err) { log("POST /comments/{videoId}", "✗", err.message); }

            if (commentId) {
                try {
                    const res = await request("PATCH", `${BASE_URL}/comments/c/${commentId}`, {
                        content: `Updated Comment ${Date.now()}`
                    });
                    log("PATCH /comments/c/{commentId}", res.status === 200 ? "✓" : "✗", `Status ${res.status}`);
                } catch (err) { log("PATCH /comments/c/{commentId}", "✗", err.message); }
            }
        }

        // LIKE ENDPOINTS
        console.log("\n👍 LIKE ENDPOINTS");
        console.log("-".repeat(70));
        if (accessToken && videoId) {
            try {
                const res = await request("POST", `${BASE_URL}/likes/toggle/v/${videoId}`);
                log("POST /likes/toggle/v/{videoId}", res.status === 200 ? "✓" : "✗", `Status ${res.status}`);
            } catch (err) { log("POST /likes/toggle/v/{videoId}", "✗", err.message); }

            if (commentId) {
                try {
                    const res = await request("POST", `${BASE_URL}/likes/toggle/c/${commentId}`);
                    log("POST /likes/toggle/c/{commentId}", res.status === 200 ? "✓" : "✗", `Status ${res.status}`);
                } catch (err) { log("POST /likes/toggle/c/{commentId}", "✗", err.message); }
            }

            if (tweetId) {
                try {
                    const res = await request("POST", `${BASE_URL}/likes/toggle/t/${tweetId}`);
                    log("POST /likes/toggle/t/{tweetId}", res.status === 200 ? "✓" : "✗", `Status ${res.status}`);
                } catch (err) { log("POST /likes/toggle/t/{tweetId}", "✗", err.message); }
            }

            try {
                const res = await request("GET", `${BASE_URL}/likes/videos`);
                log("GET /likes/videos", res.status === 200 ? "✓" : "✗", `Status ${res.status}`);
            } catch (err) { log("GET /likes/videos", "✗", err.message); }
        }

        // PLAYLIST ENDPOINTS
        console.log("\n📑 PLAYLIST ENDPOINTS");
        console.log("-".repeat(70));
        if (accessToken) {
            try {
                const res = await request("POST", `${BASE_URL}/playlist`, {
                    name: `Test Playlist ${Date.now()}`,
                    description: "API Test Playlist"
                });
                if (res.status === 201 || res.status === 200) {
                    playlistId = res.body?.data?._id;
                    log("POST /playlist", "✓", `Status ${res.status}`);
                } else {
                    log("POST /playlist", "✗", `Status ${res.status}`);
                }
            } catch (err) { log("POST /playlist", "✗", err.message); }

            if (userId) {
                try {
                    const res = await request("GET", `${BASE_URL}/playlist/user/${userId}`);
                    log("GET /playlist/user/{userId}", res.status === 200 ? "✓" : "✗", `Status ${res.status}`);
                } catch (err) { log("GET /playlist/user/{userId}", "✗", err.message); }
            }

            if (playlistId) {
                try {
                    const res = await request("GET", `${BASE_URL}/playlist/${playlistId}`);
                    log("GET /playlist/{playlistId}", res.status === 200 ? "✓" : "✗", `Status ${res.status}`);
                } catch (err) { log("GET /playlist/{playlistId}", "✗", err.message); }

                try {
                    const res = await request("PATCH", `${BASE_URL}/playlist/${playlistId}`, {
                        name: `Updated Playlist ${Date.now()}`,
                        description: "Updated Description"
                    });
                    log("PATCH /playlist/{playlistId}", res.status === 200 ? "✓" : "✗", `Status ${res.status}`);
                } catch (err) { log("PATCH /playlist/{playlistId}", "✗", err.message); }

                if (videoId) {
                    try {
                        const res = await request("PATCH", `${BASE_URL}/playlist/add/${videoId}/${playlistId}`);
                        log("PATCH /playlist/add/{videoId}/{playlistId}", res.status === 200 ? "✓" : "✗", `Status ${res.status}`);
                    } catch (err) { log("PATCH /playlist/add/{videoId}/{playlistId}", "✗", err.message); }
                }
            }
        }

        // SUBSCRIPTION ENDPOINTS
        console.log("\n📢 SUBSCRIPTION ENDPOINTS");
        console.log("-".repeat(70));
        if (accessToken && userId) {
            try {
                const res = await request("POST", `${BASE_URL}/subscriptions/c/${userId}`);
                log("POST /subscriptions/c/{userId}", res.status === 200 ? "✓" : "✗", `Status ${res.status}`);
            } catch (err) { log("POST /subscriptions/c/{userId}", "✗", err.message); }

            try {
                const res = await request("GET", `${BASE_URL}/subscriptions/c/${userId}`);
                log("GET /subscriptions/c/{userId}", res.status === 200 ? "✓" : "✗", `Status ${res.status}`);
            } catch (err) { log("GET /subscriptions/c/{userId}", "✗", err.message); }

            try {
                const res = await request("GET", `${BASE_URL}/subscriptions/u/${userId}`);
                log("GET /subscriptions/u/{userId}", res.status === 200 ? "✓" : "✗", `Status ${res.status}`);
            } catch (err) { log("GET /subscriptions/u/{userId}", "✗", err.message); }
        }

        // DASHBOARD ENDPOINTS
        console.log("\n📊 DASHBOARD ENDPOINTS");
        console.log("-".repeat(70));
        if (accessToken) {
            try {
                const res = await request("GET", `${BASE_URL}/dashboard/stats`);
                log("GET /dashboard/stats", res.status === 200 ? "✓" : "✗", `Status ${res.status}`);
            } catch (err) { log("GET /dashboard/stats", "✗", err.message); }

            try {
                const res = await request("GET", `${BASE_URL}/dashboard/videos`);
                log("GET /dashboard/videos", res.status === 200 ? "✓" : "✗", `Status ${res.status}`);
            } catch (err) { log("GET /dashboard/videos", "✗", err.message); }
        }

        // CLEANUP
        console.log("\n🧹 CLEANUP OPERATIONS");
        console.log("-".repeat(70));
        if (accessToken) {
            if (tweetId) {
                try {
                    const res = await request("DELETE", `${BASE_URL}/tweets/${tweetId}`);
                    log("DELETE /tweets/{tweetId}", res.status === 200 ? "✓" : "✗", `Status ${res.status}`);
                } catch (err) { log("DELETE /tweets/{tweetId}", "✗", err.message); }
            }

            if (commentId) {
                try {
                    const res = await request("DELETE", `${BASE_URL}/comments/c/${commentId}`);
                    log("DELETE /comments/c/{commentId}", res.status === 200 ? "✓" : "✗", `Status ${res.status}`);
                } catch (err) { log("DELETE /comments/c/{commentId}", "✗", err.message); }
            }

            if (playlistId) {
                try {
                    const res = await request("DELETE", `${BASE_URL}/playlist/${playlistId}`);
                    log("DELETE /playlist/{playlistId}", res.status === 200 ? "✓" : "✗", `Status ${res.status}`);
                } catch (err) { log("DELETE /playlist/{playlistId}", "✗", err.message); }
            }

            try {
                const res = await request("POST", `${BASE_URL}/users/logout`, {});
                log("POST /users/logout", res.status === 200 ? "✓" : "✗", `Status ${res.status}`);
            } catch (err) { log("POST /users/logout", "✗", err.message); }
        }

        console.log("\n" + "=".repeat(70));
        console.log("✨ ALL API TESTS COMPLETED!\n");
    } catch (error) {
        console.error("❌ Test Error:", error);
    }

    process.exit(0);
}

setTimeout(() => { runTests(); }, 1500);
