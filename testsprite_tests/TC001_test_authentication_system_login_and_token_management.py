import requests
import time

BASE_URL = "http://localhost:8000"
TIMEOUT = 30

def test_authentication_system_login_and_token_management():
    session = requests.Session()
    try:
        # 1) Test login with valid credentials
        login_payload = {
            "username": "testuser",
            "password": "TestPassword123!"
        }
        login_resp = session.post(f"{BASE_URL}/api/auth/token/", json=login_payload, timeout=TIMEOUT)
        assert login_resp.status_code == 200, f"Login failed with status code {login_resp.status_code}"
        login_data = login_resp.json()
        access_token = login_data.get("access")
        refresh_token = login_data.get("refresh")
        assert access_token and refresh_token, "Tokens not received on login"

        # Prepare auth header using access token
        auth_headers = {
            "Authorization": f"Bearer {access_token}"
        }

        # 2) Access a protected endpoint to verify access token validity
        protected_resp = session.get(f"{BASE_URL}/api/core/user/", headers=auth_headers, timeout=TIMEOUT)
        assert protected_resp.status_code == 200, "Access with valid token failed"
        protected_data = protected_resp.json()
        assert "username" in protected_data, "User info not returned from protected endpoint"

        # 3) Test token refresh endpoint with valid refresh token
        refresh_payload = {
            "refresh": refresh_token
        }
        refresh_resp = session.post(f"{BASE_URL}/api/auth/token/refresh/", json=refresh_payload, timeout=TIMEOUT)
        assert refresh_resp.status_code == 200, f"Token refresh failed with status code {refresh_resp.status_code}"
        refresh_data = refresh_resp.json()
        new_access_token = refresh_data.get("access")
        assert new_access_token and new_access_token != access_token, "New access token not issued or same as old"

        # 4) Test logout endpoint (invalidate refresh token or blacklist)
        logout_payload = {
            "refresh": refresh_token
        }
        logout_resp = session.post(f"{BASE_URL}/api/auth/logout/", json=logout_payload, headers=auth_headers, timeout=TIMEOUT)
        assert logout_resp.status_code in (200, 204), f"Logout failed with status code {logout_resp.status_code}"

        # 5) Verify that using the old access token still works until expiry (depends on implementation)
        protected_resp_after_logout = session.get(f"{BASE_URL}/api/core/user/", headers=auth_headers, timeout=TIMEOUT)
        # Some systems allow access token usage after logout until expiry
        # So we allow 200 or 401/403 if token revoked immediately
        assert protected_resp_after_logout.status_code in (200, 401, 403), "Unexpected status after logout with old access token"

        # 6) Verify refresh token invalid after logout (should fail)
        refresh_resp_after_logout = session.post(f"{BASE_URL}/api/auth/token/refresh/", json=refresh_payload, timeout=TIMEOUT)
        assert refresh_resp_after_logout.status_code == 401 or refresh_resp_after_logout.status_code == 403, \
            "Refresh token still valid after logout - potential security issue"

        # 7) Test login with invalid credentials
        invalid_login_payload = {
            "username": "wronguser",
            "password": "wrongpass"
        }
        invalid_login_resp = session.post(f"{BASE_URL}/api/auth/token/", json=invalid_login_payload, timeout=TIMEOUT)
        assert invalid_login_resp.status_code == 401 or invalid_login_resp.status_code == 400, \
            "Invalid login did not fail properly"

        # 8) Test potential security vulnerabilities with malicious inputs for login (SQLi, XSS, CSRF)
        malicious_payloads = [
            {"username": "' OR '1'='1", "password": "any"},
            {"username": "<script>alert('xss')</script>", "password": "any"},
            {"username": "normaluser", "password": "' OR '1'='1"},
        ]
        for payload in malicious_payloads:
            resp = session.post(f"{BASE_URL}/api/auth/token/", json=payload, timeout=TIMEOUT)
            assert resp.status_code in (400,401), f"Security vulnerability detected with payload {payload}"

        # 9) Performance test: measure login response time < 200ms (allow some tolerance)
        start_time = time.time()
        perf_resp = session.post(f"{BASE_URL}/api/auth/token/", json=login_payload, timeout=TIMEOUT)
        elapsed_ms = (time.time() - start_time) * 1000
        assert perf_resp.status_code == 200, "Performance login test failed login"
        assert elapsed_ms < 500, f"Login response too slow: {elapsed_ms:.2f}ms"

    finally:
        session.close()

test_authentication_system_login_and_token_management()