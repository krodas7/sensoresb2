import requests
import time

BASE_URL = "http://localhost:8000"
TIMEOUT = 30

def test_user_management_crud_with_role_based_permissions():
    # Sample admin/test user credentials for authentication
    admin_credentials = {
        "username": "admin_testuser",
        "password": "admin1234"  # Example, adapt as needed
    }

    headers = {
        "Content-Type": "application/json"
    }

    # Authenticate and obtain JWT token
    auth_url = f"{BASE_URL}/api/auth/jwt/create/"
    try:
        auth_resp = requests.post(auth_url, json=admin_credentials, headers=headers, timeout=TIMEOUT)
        assert auth_resp.status_code == 200, f"Authentication failed with status {auth_resp.status_code}"
        auth_data = auth_resp.json()
        assert "access" in auth_data and "refresh" in auth_data, "JWT tokens not returned"
    except Exception as e:
        raise AssertionError(f"Authentication request failed: {str(e)}")

    token = auth_data["access"]
    auth_headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }

    # VARIABLES TO CLEANUP
    created_user_id = None
    created_role_id = None

    try:
        # --- 1. Create a Role with permissions ---
        role_payload = {
            "name": "TestRoleAPI",
            "permissions": [
                # Example permissions, adapt if schema different:
                # Usually permissions might be strings or ids referencing allowed modules/actions
                "user.view_user",
                "user.add_user",
                "user.change_user",
                "user.delete_user",
                "module_access.dashboard"
            ]
        }

        role_create_url = f"{BASE_URL}/api/roles/"
        role_resp = requests.post(role_create_url, json=role_payload, headers=auth_headers, timeout=TIMEOUT)
        assert role_resp.status_code == 201, f"Failed to create role, status: {role_resp.status_code}"
        role_data = role_resp.json()
        created_role_id = role_data.get("id")
        assert created_role_id is not None, "Role ID not returned in creation response"

        # --- 2. Create a User with the assigned role ---
        user_payload = {
            "username": "testuser_api",
            "email": "testuser_api@example.com",
            "password": "TestPass123!",
            "first_name": "Test",
            "last_name": "User",
            "roles": [created_role_id],
            "profile": {
                "phone": "+1234567890",
                "address": "123 API St",
                "bio": "API test user profile"
            }
        }

        user_create_url = f"{BASE_URL}/api/users/"
        user_resp = requests.post(user_create_url, json=user_payload, headers=auth_headers, timeout=TIMEOUT)
        assert user_resp.status_code == 201, f"Failed to create user, status: {user_resp.status_code}"
        user_data = user_resp.json()
        created_user_id = user_data.get("id")
        assert created_user_id is not None, "User ID not returned in creation response"

        # --- 3. Read/Get the User details, validate permissions and profile ---
        user_get_url = f"{BASE_URL}/api/users/{created_user_id}/"
        user_get_resp = requests.get(user_get_url, headers=auth_headers, timeout=TIMEOUT)
        assert user_get_resp.status_code == 200, f"Failed to get user details, status: {user_get_resp.status_code}"
        user_fetched = user_get_resp.json()
        assert user_fetched.get("username") == user_payload["username"], "Username mismatch on fetch"
        assert created_role_id in user_fetched.get("roles", []), "User roles not matching assigned"
        profile = user_fetched.get("profile", {})
        assert profile.get("phone") == user_payload["profile"]["phone"], "User profile phone mismatch"
        assert profile.get("bio") == user_payload["profile"]["bio"], "User profile bio mismatch"

        # --- 4. Update the User: modify email and profile ---
        update_payload = {
            "email": "updated_user_api@example.com",
            "profile": {
                "phone": "+1987654321",
                "bio": "Updated API test user profile"
            }
        }
        user_update_resp = requests.put(user_get_url, json=update_payload, headers=auth_headers, timeout=TIMEOUT)
        assert user_update_resp.status_code == 200, f"Failed to update user, status: {user_update_resp.status_code}"
        user_updated = user_update_resp.json()
        assert user_updated.get("email") == update_payload["email"], "Email not updated"
        updated_profile = user_updated.get("profile", {})
        assert updated_profile.get("phone") == update_payload["profile"]["phone"], "Phone not updated"
        assert updated_profile.get("bio") == update_payload["profile"]["bio"], "Bio not updated"

        # --- 5. Validate permission system enforcement for user with role ---
        # Login as created user to test permission enforcement
        user_login_payload = {
            "username": user_payload["username"],
            "password": user_payload["password"]
        }
        user_auth_resp = requests.post(auth_url, json=user_login_payload, headers=headers, timeout=TIMEOUT)
        assert user_auth_resp.status_code == 200, "Login failed for created user"
        user_tokens = user_auth_resp.json()
        user_token = user_tokens.get("access")
        assert user_token is not None, "User JWT token missing"
        user_auth_headers = {
            "Authorization": f"Bearer {user_token}",
            "Content-Type": "application/json"
        }

        # Attempt an allowed action (e.g., read own user data)
        user_fetch_resp = requests.get(user_get_url, headers=user_auth_headers, timeout=TIMEOUT)
        assert user_fetch_resp.status_code == 200, "User should be allowed to read own data"

        # Attempt a forbidden action (e.g., delete another user)
        # For test, try to delete admin (assuming admin ID = 1)
        delete_admin_url = f"{BASE_URL}/api/users/1/"
        delete_admin_resp = requests.delete(delete_admin_url, headers=user_auth_headers, timeout=TIMEOUT)
        assert delete_admin_resp.status_code in (403, 401), "User without delete permissions should not delete admin"

        # --- 6. Validate input data sanitization and error handling ---
        # SQL Injection attempt in username field
        injection_payload = {
            "username": "'; DROP TABLE users; --",
            "email": "injection@example.com",
            "password": "SafePass123!",
            "first_name": "Inject",
            "last_name": "Test",
            "roles": [created_role_id]
        }
        injection_resp = requests.post(user_create_url, json=injection_payload, headers=auth_headers, timeout=TIMEOUT)
        # Should be rejected, due to validation or internal sanitization
        assert injection_resp.status_code == 400 or injection_resp.status_code == 422, "SQL injection attempt not caught"

        # XSS attempt in profile bio
        xss_payload = {
            "username": "xsstestuser",
            "email": "xss@example.com",
            "password": "SafePass123!",
            "first_name": "XSS",
            "last_name": "Test",
            "roles": [created_role_id],
            "profile": {
                "bio": "<script>alert('XSS')</script>"
            }
        }
        xss_resp = requests.post(user_create_url, json=xss_payload, headers=auth_headers, timeout=TIMEOUT)
        # Either sanitized or rejected, so expect 400/422 or 201 with escaped data
        assert xss_resp.status_code in (201, 400, 422), "XSS attempt not properly handled"

        # --- 7. Check performance: response times < 200ms for GET user ---
        start_time = time.perf_counter()
        perf_resp = requests.get(user_get_url, headers=auth_headers, timeout=TIMEOUT)
        end_time = time.perf_counter()
        assert perf_resp.status_code == 200, "GET user request failed during performance check"
        duration_ms = (end_time - start_time) * 1000
        assert duration_ms < 200, f"GET user request took too long: {duration_ms:.2f}ms"

        # --- 8. Validate that permission system properly protects endpoint with invalid token ---
        invalid_token_headers = {
            "Authorization": "Bearer invalid.token.contents",
            "Content-Type": "application/json"
        }
        invalid_token_resp = requests.get(user_get_url, headers=invalid_token_headers, timeout=TIMEOUT)
        assert invalid_token_resp.status_code in (401, 403), "Invalid token should not grant access"

        # --- 9. Delete the created user (using admin auth) ---
        user_delete_resp = requests.delete(user_get_url, headers=auth_headers, timeout=TIMEOUT)
        assert user_delete_resp.status_code == 204, "Failed to delete user"

        created_user_id = None  # Mark as deleted

        # --- 10. Delete the created role ---
        if created_role_id:
            role_delete_url = f"{BASE_URL}/api/roles/{created_role_id}/"
            role_delete_resp = requests.delete(role_delete_url, headers=auth_headers, timeout=TIMEOUT)
            assert role_delete_resp.status_code == 204, "Failed to delete role"
            created_role_id = None

    finally:
        # Cleanup if anything left
        if created_user_id:
            try:
                requests.delete(f"{BASE_URL}/api/users/{created_user_id}/", headers=auth_headers, timeout=TIMEOUT)
            except:
                pass
        if created_role_id:
            try:
                requests.delete(f"{BASE_URL}/api/roles/{created_role_id}/", headers=auth_headers, timeout=TIMEOUT)
            except:
                pass

test_user_management_crud_with_role_based_permissions()
