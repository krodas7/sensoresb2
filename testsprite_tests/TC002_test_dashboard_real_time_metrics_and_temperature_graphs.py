import requests
import time

BASE_URL = "http://localhost:8000"
LOGIN_URL = f"{BASE_URL}/api/auth/login/"
LOGOUT_URL = f"{BASE_URL}/api/auth/logout/"
REFRESH_URL = f"{BASE_URL}/api/auth/token/refresh/"

HEADERS = {"Content-Type": "application/json"}
TIMEOUT = 30


def login(username: str, password: str):
    payload = {"username": username, "password": password}
    resp = requests.post(LOGIN_URL, json=payload, headers=HEADERS, timeout=TIMEOUT)
    resp.raise_for_status()
    data = resp.json()
    assert "access" in data and "refresh" in data, "Login did not return JWT tokens"
    return data["access"], data["refresh"]


def refresh_token(refresh_token: str):
    payload = {"refresh": refresh_token}
    resp = requests.post(REFRESH_URL, json=payload, headers=HEADERS, timeout=TIMEOUT)
    resp.raise_for_status()
    data = resp.json()
    assert "access" in data, "Token refresh did not return access token"
    return data["access"]


def logout(access_token: str):
    headers = {"Authorization": f"Bearer {access_token}"}
    resp = requests.post(LOGOUT_URL, headers=headers, timeout=TIMEOUT)
    # Some implementations may return 204 No Content or 200 OK
    assert resp.status_code in (200, 204), "Logout failed"


def test_dashboard_realtime_metrics_and_temperature_graphs():
    # Step 1: Authenticate user (using a default test user)
    # Note: Replace with valid test credentials existing in the system or via a setup fixture
    username = "testuser"
    password = "testpassword"
    access_token, refresh_token_val = login(username, password)
    auth_headers = {"Authorization": f"Bearer {access_token}", "Accept": "application/json"}

    try:
        # Step 2: Validate dashboard main info and real-time metrics endpoint(s)
        # Assumed dashboard metrics endpoint
        dashboard_metrics_url = f"{BASE_URL}/api/dashboard/metrics/"
        resp = requests.get(dashboard_metrics_url, headers=auth_headers, timeout=TIMEOUT)
        assert resp.status_code == 200, f"Dashboard metrics endpoint failed: {resp.status_code}"
        metrics_data = resp.json()
        # Validate expected fields exist (example)
        assert isinstance(metrics_data, dict), "Metrics response is not a dict"
        assert any(k in metrics_data for k in ["active_weighing_card", "realtime_metrics", "sensor_monitoring"]), \
            "Expected keys missing in dashboard metrics response"

        # Step 3: Validate sensor monitoring data API
        sensor_monitoring_url = f"{BASE_URL}/api/sensors/monitoring/"
        resp = requests.get(sensor_monitoring_url, headers=auth_headers, timeout=TIMEOUT)
        assert resp.status_code == 200, f"Sensor monitoring endpoint failed: {resp.status_code}"
        sensor_data = resp.json()
        assert isinstance(sensor_data, list), "Sensor monitoring data is not a list"
        # Basic validation of sensor object
        if sensor_data:
            sensor = sensor_data[0]
            assert "id" in sensor and "temperature" in sensor and "status" in sensor, \
                "Sensor monitoring data missing required fields"

        # Step 4: Validate temperature graphs data endpoint
        temperature_graphs_url = f"{BASE_URL}/api/temperatures/graphs/"
        resp = requests.get(temperature_graphs_url, headers=auth_headers, timeout=TIMEOUT)
        assert resp.status_code == 200, f"Temperature graphs endpoint failed: {resp.status_code}"
        temp_graph_data = resp.json()
        assert isinstance(temp_graph_data, dict), "Temperature graphs response is not a dict"
        assert "temperature_series" in temp_graph_data and isinstance(temp_graph_data["temperature_series"], list), \
            "Temperature series data missing or invalid"

        # Step 5: Validate active weighing card endpoint
        active_weighing_url = f"{BASE_URL}/api/weights/active/"
        resp = requests.get(active_weighing_url, headers=auth_headers, timeout=TIMEOUT)
        assert resp.status_code == 200, f"Active weighing card endpoint failed: {resp.status_code}"
        active_weighing_data = resp.json()
        # Active weighing might be None or object
        assert active_weighing_data is None or isinstance(active_weighing_data, dict), \
            "Active weighing card response invalid"

        # Step 6: Test dynamic update simulation by repeated fetches and timing
        # Check response time less than 200ms as per validation criteria
        for url in [dashboard_metrics_url, sensor_monitoring_url, temperature_graphs_url, active_weighing_url]:
            start = time.time()
            resp = requests.get(url, headers=auth_headers, timeout=TIMEOUT)
            elapsed = (time.time() - start) * 1000  # ms
            assert resp.status_code == 200, f"{url} failed with {resp.status_code}"
            assert elapsed < 200, f"{url} response time exceeded 200ms: {elapsed:.2f}ms"

        # Step 7: Security - test for SQL injection (common injection string)
        sql_injection_payload = "' OR 1=1 --"
        for url in [dashboard_metrics_url, sensor_monitoring_url, temperature_graphs_url, active_weighing_url]:
            inj_url = f"{url}?search={sql_injection_payload}"
            resp = requests.get(inj_url, headers=auth_headers, timeout=TIMEOUT)
            # Expect server to respond without error or data leakage, likely 400 or 200 with filtered results
            assert resp.status_code in (200, 400), f"SQL Injection test failed on {url} with {resp.status_code}"

        # Step 8: Permission validation - attempt access with invalid token
        invalid_headers = {"Authorization": "Bearer invalidtoken123", "Accept": "application/json"}
        for url in [dashboard_metrics_url, sensor_monitoring_url, temperature_graphs_url, active_weighing_url]:
            resp = requests.get(url, headers=invalid_headers, timeout=TIMEOUT)
            assert resp.status_code == 401, f"Endpoint {url} allowed access with invalid token"

        # Step 9: CSRF check - Not applicable for JWT stateless APIs but send without auth header
        for url in [dashboard_metrics_url, sensor_monitoring_url, temperature_graphs_url, active_weighing_url]:
            resp = requests.get(url, timeout=TIMEOUT)
            # Expect unauthorized or forbidden
            assert resp.status_code in (401, 403), f"Unauthenticated access allowed to {url}"

        # Step 10: Data validation with invalid inputs (invalid query param types)
        invalid_inputs = ["<script>alert(1)</script>", "drop table users;", "😊"]
        for payload in invalid_inputs:
            inj_url = f"{dashboard_metrics_url}?filter={payload}"
            resp = requests.get(inj_url, headers=auth_headers, timeout=TIMEOUT)
            assert resp.status_code in (200, 400), f"Invalid input handling failed for dashboard_metrics with {resp.status_code}"

    finally:
        # Logout user regardless of test result
        logout(access_token)


test_dashboard_realtime_metrics_and_temperature_graphs()