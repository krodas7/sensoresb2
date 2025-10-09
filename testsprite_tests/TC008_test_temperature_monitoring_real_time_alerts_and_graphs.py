import requests
import time

BASE_URL = "http://localhost:8000"
TIMEOUT = 30

def test_temperature_monitoring_real_time_alerts_and_graphs():
    session = requests.Session()
    session.headers.update({'Content-Type': 'application/json'})
    try:
        # 1) Authenticate and obtain JWT token
        login_payload = {
            "username": "admin",
            "password": "admin123"
        }
        login_resp = session.post(f"{BASE_URL}/api/auth/jwt/create/", json=login_payload, timeout=TIMEOUT)
        assert login_resp.status_code == 200, f"Login failed: {login_resp.text}"
        tokens = login_resp.json()
        assert "access" in tokens and "refresh" in tokens, "JWT tokens missing in login response"
        access_token = tokens["access"]
        refresh_token = tokens["refresh"]
        session.headers.update({"Authorization": f"Bearer {access_token}"})

        # 2) Create a new sensor resource to test temperature monitoring CRUD
        sensor_payload = {
            "name": "Test Sensor Temp Monitoring",
            "location": "Lab Room 1",
            "type": "temperature"
        }
        create_sensor_resp = session.post(f"{BASE_URL}/api/sensors/", json=sensor_payload, timeout=TIMEOUT)
        assert create_sensor_resp.status_code == 201, f"Sensor creation failed: {create_sensor_resp.text}"
        sensor = create_sensor_resp.json()
        sensor_id = sensor.get("id")
        assert sensor_id is not None, "Sensor ID missing after creation"

        try:
            # 3) Add temperature data points for the sensor (simulate real-time data)
            temp_points = [
                {"sensor": sensor_id, "temperature": 25.5, "timestamp": "2025-10-04T10:00:00Z"},
                {"sensor": sensor_id, "temperature": 30.0, "timestamp": "2025-10-04T10:05:00Z"},
                {"sensor": sensor_id, "temperature": 35.2, "timestamp": "2025-10-04T10:10:00Z"},  # high temp alert
                {"sensor": sensor_id, "temperature": 28.0, "timestamp": "2025-10-04T10:15:00Z"}
            ]
            for point in temp_points:
                resp = session.post(f"{BASE_URL}/api/temperatures/", json=point, timeout=TIMEOUT)
                assert resp.status_code == 201, f"Failed to add temperature data point: {resp.text}"

            # 4) Retrieve the real-time temperature data for the sensor
            get_temps_resp = session.get(f"{BASE_URL}/api/sensors/{sensor_id}/temperatures/?recent=true", timeout=TIMEOUT)
            assert get_temps_resp.status_code == 200, f"Failed to retrieve sensor temperatures: {get_temps_resp.text}"
            temps_data = get_temps_resp.json()
            assert isinstance(temps_data, list) and len(temps_data) >= len(temp_points), "Temperature data missing or incorrect"

            # 5) Check alert generation endpoint or alert status for sensor (simulate or query alerts)
            alerts_resp = session.get(f"{BASE_URL}/api/temperatures/alerts/?sensor_id={sensor_id}&active=true", timeout=TIMEOUT)
            assert alerts_resp.status_code == 200, f"Failed to retrieve alerts: {alerts_resp.text}"
            alerts = alerts_resp.json()
            assert isinstance(alerts, list), "Alerts response should be a list"
            alert_temperatures = [alert.get("temperature") for alert in alerts if "temperature" in alert]
            assert any(t >= 35 for t in alert_temperatures), "No high temperature alert generated for threshold breach"

            # 6) Test graph data endpoint with compact and expanded views
            graph_compact_resp = session.get(f"{BASE_URL}/api/temperatures/{sensor_id}/graph/?view=compact", timeout=TIMEOUT)
            graph_expanded_resp = session.get(f"{BASE_URL}/api/temperatures/{sensor_id}/graph/?view=expanded", timeout=TIMEOUT)
            assert graph_compact_resp.status_code == 200, f"Compact graph fetch failed: {graph_compact_resp.text}"
            assert graph_expanded_resp.status_code == 200, f"Expanded graph fetch failed: {graph_expanded_resp.text}"
            compact_data = graph_compact_resp.json()
            expanded_data = graph_expanded_resp.json()
            assert "data" in compact_data and isinstance(compact_data["data"], list), "Invalid compact graph data"
            assert "data" in expanded_data and isinstance(expanded_data["data"], list), "Invalid expanded graph data"

            # 7) Validate permission enforcement - try accessing endpoints without token and with invalid token
            session.headers.pop("Authorization")
            unauthorized_resp = session.get(f"{BASE_URL}/api/sensors/{sensor_id}/temperatures/", timeout=TIMEOUT)
            assert unauthorized_resp.status_code == 401 or unauthorized_resp.status_code == 403, "Unauthorized access without token succeeded"

            session.headers.update({"Authorization": "Bearer invalidtoken"})
            invalid_token_resp = session.get(f"{BASE_URL}/api/sensors/{sensor_id}/temperatures/", timeout=TIMEOUT)
            assert invalid_token_resp.status_code == 401 or invalid_token_resp.status_code == 403, "Access with invalid token succeeded"

            # Restore valid token header for further tests
            session.headers.update({"Authorization": f"Bearer {access_token}"})

            # 8) Check response times for a critical temperature fetch endpoint (<200ms)
            start_time = time.time()
            perf_resp = session.get(f"{BASE_URL}/api/sensors/{sensor_id}/temperatures/?recent=true", timeout=TIMEOUT)
            elapsed_time = (time.time() - start_time) * 1000  # ms
            assert perf_resp.status_code == 200, f"Performance endpoint failed: {perf_resp.text}"
            assert elapsed_time < 200, f"Response time too high: {elapsed_time}ms"

            # 9) Security test: attempt SQL injection in sensor creation
            malicious_payload = {
                "name": "MaliciousSensor'; DROP TABLE sensors_sensors; --",
                "location": "Injection Test",
                "type": "temperature"
            }
            sql_inject_resp = session.post(f"{BASE_URL}/api/sensors/", json=malicious_payload, timeout=TIMEOUT)
            # Should be rejected with 400 or sanitized input
            assert sql_inject_resp.status_code in [400, 422], f"SQL injection not handled properly: {sql_inject_resp.text}"

            # 10) Data validation test: posting invalid temperature data (string instead of float)
            invalid_temp_payload = {"sensor": sensor_id, "temperature": "not_a_float", "timestamp": "2025-10-04T10:20:00Z"}
            invalid_temp_resp = session.post(f"{BASE_URL}/api/temperatures/", json=invalid_temp_payload, timeout=TIMEOUT)
            assert invalid_temp_resp.status_code in [400, 422], "Invalid temperature data accepted"

            # 11) CSRF protection check (POST without proper CSRF token if required)
            # Assuming the API uses JWT and no CSRF, so should be accepted, else 403 error.
            # This test is included for completeness.
            if "X-CSRFToken" in session.headers:
                del session.headers["X-CSRFToken"]
            csrf_test_resp = session.post(f"{BASE_URL}/api/temperatures/", json=temp_points[0], timeout=TIMEOUT)
            assert csrf_test_resp.status_code in [201, 403], "CSRF protection not properly enforced"

            # 12) Check for N+1 queries situation by comparing response with/without expansions
            # Validate no data duplication or excessive delay indicating N+1 issues by response shape and timing
            start_time = time.time()
            expanded_resp = session.get(f"{BASE_URL}/api/temperatures/?expand_sensor=true", timeout=TIMEOUT)
            expanded_elapsed = (time.time() - start_time) * 1000
            assert expanded_resp.status_code == 200, f"Expanded temperatures query failed: {expanded_resp.text}"
            # Not asserting timing here since depends heavily on DB size, but should be under 500ms ideally
            assert expanded_elapsed < 500, f"Potential N+1 query problem, slow response time: {expanded_elapsed}ms"

        finally:
            # Cleanup: delete the created sensor resource
            del_resp = session.delete(f"{BASE_URL}/api/sensors/{sensor_id}/", timeout=TIMEOUT)
            assert del_resp.status_code in [204, 200, 202], f"Sensor deletion failed: {del_resp.text}"

    finally:
        # Logout for cleanup if API supports it
        if "Authorization" in session.headers:
            session.post(f"{BASE_URL}/api/auth/token/logout/", timeout=TIMEOUT)
        session.close()

test_temperature_monitoring_real_time_alerts_and_graphs()
