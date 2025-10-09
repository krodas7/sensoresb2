import requests
import time

BASE_URL = "http://localhost:8000"
TIMEOUT = 30

# Credentials for authentication (should exist in the system)
AUTH_CREDENTIALS = {
    "username": "testuser",
    "password": "testpassword"
}

def get_jwt_token():
    url = f"{BASE_URL}/api/auth/jwt/create/"
    resp = requests.post(url, json=AUTH_CREDENTIALS, timeout=TIMEOUT)
    assert resp.status_code == 200, f"Login failed: {resp.text}"
    token = resp.json().get("access")
    assert token, "No access token returned"
    return token

def test_fermentation_control_simulation_and_monitoring():
    token = get_jwt_token()
    headers = {"Authorization": f"Bearer {token}"}

    # --- Helper functions ---

    def create_fermentation_tank(data):
        url = f"{BASE_URL}/api/fermentation/tanks/"
        resp = requests.post(url, json=data, headers=headers, timeout=TIMEOUT)
        assert resp.status_code == 201, f"Failed to create tank: {resp.text}"
        return resp.json()

    def get_fermentation_tank(tank_id):
        url = f"{BASE_URL}/api/fermentation/tanks/{tank_id}/"
        resp = requests.get(url, headers=headers, timeout=TIMEOUT)
        assert resp.status_code == 200, f"Failed to get tank {tank_id}: {resp.text}"
        return resp.json()

    def update_fermentation_tank(tank_id, data):
        url = f"{BASE_URL}/api/fermentation/tanks/{tank_id}/"
        resp = requests.put(url, json=data, headers=headers, timeout=TIMEOUT)
        assert resp.status_code == 200, f"Failed to update tank {tank_id}: {resp.text}"
        return resp.json()

    def delete_fermentation_tank(tank_id):
        url = f"{BASE_URL}/api/fermentation/tanks/{tank_id}/"
        resp = requests.delete(url, headers=headers, timeout=TIMEOUT)
        assert resp.status_code in (204, 200), f"Failed to delete tank {tank_id}: {resp.text}"

    def test_permission_denied_on_unauthorized_access():
        # Access without token
        url = f"{BASE_URL}/api/fermentation/tanks/"
        resp = requests.get(url, timeout=TIMEOUT)
        assert resp.status_code == 401 or resp.status_code == 403, f"Unauthorized access not blocked: {resp.status_code}"

    def test_invalid_data_create():
        # Missing required fields or invalid values
        invalid_payloads = [
            {},  # empty
            {"volume": -10, "temperature": 25, "ph": 4.5},  # negative volume
            {"volume": 1000, "temperature": -5, "ph": 4.5},  # invalid temperature (too low)
            {"volume": 1000, "temperature": 25, "ph": 15},  # invalid pH (too high)
            {"volume": "large", "temperature": "warm", "ph": "acidic"}  # wrong types
        ]
        url = f"{BASE_URL}/api/fermentation/tanks/"
        for payload in invalid_payloads:
            resp = requests.post(url, json=payload, headers=headers, timeout=TIMEOUT)
            assert resp.status_code == 400, f"Invalid payload accepted: {payload} Response: {resp.text}"

    def measure_response_time(method, url, **kwargs):
        start = time.time()
        resp = method(url, **kwargs)
        elapsed = (time.time() - start) * 1000
        assert elapsed < 200, f"Response time too high: {elapsed}ms"
        return resp

    # --- Start tests ---

    test_permission_denied_on_unauthorized_access()
    test_invalid_data_create()

    # Valid fermentation tank data for creation
    tank_data = {
        "name": "Test Tank",
        "volume": 1000,        # in liters
        "temperature": 25.0,   # degrees Celsius
        "ph": 4.5
    }

    # Create a tank and keep track for cleanup
    created_tank = None
    try:
        # Create
        created_tank = create_fermentation_tank(tank_data)
        tank_id = created_tank["id"]
        assert created_tank["volume"] == tank_data["volume"]
        assert abs(created_tank["temperature"] - tank_data["temperature"]) < 0.01
        assert abs(created_tank["ph"] - tank_data["ph"]) < 0.01

        # Read and validate correctness & performance
        url_get = f"{BASE_URL}/api/fermentation/tanks/{tank_id}/"
        resp_get = measure_response_time(requests.get, url_get, headers=headers, timeout=TIMEOUT)
        assert resp_get.status_code == 200
        tank_info = resp_get.json()
        assert tank_info["id"] == tank_id
        assert tank_info["name"] == tank_data["name"]

        # Update with valid data and check
        update_data = {
            "name": "Updated Tank",
            "volume": 1200,
            "temperature": 26.5,
            "ph": 4.3
        }
        url_put = f"{BASE_URL}/api/fermentation/tanks/{tank_id}/"
        resp_put = measure_response_time(requests.put, url_put, json=update_data, headers=headers, timeout=TIMEOUT)
        assert resp_put.status_code == 200
        updated = resp_put.json()
        assert updated["name"] == update_data["name"]
        assert updated["volume"] == update_data["volume"]
        assert abs(updated["temperature"] - update_data["temperature"]) < 0.01
        assert abs(updated["ph"] - update_data["ph"]) < 0.01

        # Simulate monitoring: get latest states multiple times
        url_monitor = f"{BASE_URL}/api/fermentation/tanks/{tank_id}/monitor/"
        for _ in range(3):
            resp_mon = measure_response_time(requests.get, url_monitor, headers=headers, timeout=TIMEOUT)
            assert resp_mon.status_code == 200
            monitor_data = resp_mon.json()
            # Validate keys and value ranges
            assert "volume" in monitor_data and isinstance(monitor_data["volume"], (int,float))
            assert 0 <= monitor_data["volume"] <= updated["volume"] * 1.5
            assert "temperature" in monitor_data and isinstance(monitor_data["temperature"], (float,int))
            assert -10 <= monitor_data["temperature"] <= 100
            assert "ph" in monitor_data and isinstance(monitor_data["ph"], (float,int))
            assert 0 <= monitor_data["ph"] <= 14

        # Security checks: attempt simple SQL injection in name field
        malicious_update = {
            "name": "Tank1; DROP TABLE fermentation_tanks;--",
            "volume": 1000,
            "temperature": 25,
            "ph": 5
        }
        resp_sec = requests.put(url_put, json=malicious_update, headers=headers, timeout=TIMEOUT)
        # Should reject malicious input or sanitize it; expect 200 but name should not include SQL command verbatim
        assert resp_sec.status_code in (200, 400)
        if resp_sec.status_code == 200:
            sanitized_name = resp_sec.json().get("name", "")
            assert "DROP TABLE" not in sanitized_name.upper()

        # XSS test: send script tags in name, expect sanitization or rejection
        xss_payload = {
            "name": "<script>alert('xss')</script>",
            "volume": 1000,
            "temperature": 25,
            "ph": 5
        }
        resp_xss = requests.put(url_put, json=xss_payload, headers=headers, timeout=TIMEOUT)
        assert resp_xss.status_code in (200, 400)
        if resp_xss.status_code == 200:
            name_val = resp_xss.json().get("name", "")
            assert "<script>" not in name_val.lower()

        # CSRF test: POST without CSRF token - should be okay if JWT used, otherwise 403
        # Try to create without auth header (should fail)
        url_post = f"{BASE_URL}/api/fermentation/tanks/"
        resp_csrf = requests.post(url_post, json=tank_data, timeout=TIMEOUT)
        assert resp_csrf.status_code == 401 or resp_csrf.status_code == 403

    finally:
        if created_tank:
            delete_fermentation_tank(created_tank["id"])


test_fermentation_control_simulation_and_monitoring()
