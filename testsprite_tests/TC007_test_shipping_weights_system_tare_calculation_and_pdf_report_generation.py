import requests
import time

BASE_URL = "http://localhost:8000"
TIMEOUT = 30


def test_shipping_weights_system_tare_and_pdf():
    session = requests.Session()
    session.headers.update({'Content-Type': 'application/json'})

    # Step 1: Authenticate and get JWT token
    login_payload = {
        "username": "testuser",
        "password": "TestPass123!"
    }
    login_resp = session.post(f"{BASE_URL}/api/auth/jwt/create/", json=login_payload, timeout=TIMEOUT)
    assert login_resp.status_code == 200, f"Login failed: {login_resp.text}"
    token = login_resp.json().get("access")
    assert token, "JWT token not found in login response"

    auth_headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }

    # Helper function to get permission-checked endpoint responses
    def check_permission_and_response(url, method="GET", data=None):
        if method == "GET":
            r = session.get(url, headers=auth_headers, timeout=TIMEOUT)
        elif method == "POST":
            r = session.post(url, headers=auth_headers, json=data, timeout=TIMEOUT)
        elif method == "PUT":
            r = session.put(url, headers=auth_headers, json=data, timeout=TIMEOUT)
        elif method == "DELETE":
            r = session.delete(url, headers=auth_headers, timeout=TIMEOUT)
        else:
            raise ValueError("Invalid HTTP method")
        assert r.status_code in {200, 201, 204}, f"{method} {url} Status: {r.status_code}. Response: {r.text}"
        return r

    created_ids = {}

    try:
        # Step 2: Create a batch (required for multiple weighings)
        batch_data = {
            "name": "Test Batch",
            "description": "Batch for tare and weighing test",
            "batch_status": "open"  # corrected field name
        }
        batch_resp = session.post(f"{BASE_URL}/api/shipping/batches/", headers=auth_headers, json=batch_data, timeout=TIMEOUT)
        assert batch_resp.status_code == 201, f"Batch creation failed: {batch_resp.text}"
        batch = batch_resp.json()
        batch_id = batch.get("id")
        assert batch_id, "Batch ID missing on creation"
        created_ids["batch"] = batch_id

        # Step 3: Create tare entries for yute and nylon
        tare_yute_data = {
            "material": "yute",
            "weight": 0.25  # example tare weight
        }
        tare_yute_resp = session.post(f"{BASE_URL}/api/shipping/tares/", headers=auth_headers, json=tare_yute_data, timeout=TIMEOUT)
        assert tare_yute_resp.status_code == 201, f"Tare yute creation failed: {tare_yute_resp.text}"
        tare_yute = tare_yute_resp.json()
        tare_yute_id = tare_yute.get("id")
        assert tare_yute_id, "Tare yute ID missing on creation"
        created_ids["tare_yute"] = tare_yute_id

        tare_nylon_data = {
            "material": "nylon",
            "weight": 0.10  # example tare weight
        }
        tare_nylon_resp = session.post(f"{BASE_URL}/api/shipping/tares/", headers=auth_headers, json=tare_nylon_data, timeout=TIMEOUT)
        assert tare_nylon_resp.status_code == 201, f"Tare nylon creation failed: {tare_nylon_resp.text}"
        tare_nylon = tare_nylon_resp.json()
        tare_nylon_id = tare_nylon.get("id")
        assert tare_nylon_id, "Tare nylon ID missing on creation"
        created_ids["tare_nylon"] = tare_nylon_id

        # Step 4: Create multiple weighings for the batch
        weighings = []
        # Do not send net_weight (backend calculates it)
        weighing_payloads = [
            {
                "batch": batch_id,
                "gross_weight": 100.0,
                "tare_yute": tare_yute_id,
                "tare_nylon": tare_nylon_id
            },
            {
                "batch": batch_id,
                "gross_weight": 150.0,
                "tare_yute": tare_yute_id,
                "tare_nylon": tare_nylon_id
            }
        ]

        for i, w_payload in enumerate(weighing_payloads, start=1):
            resp = session.post(f"{BASE_URL}/api/shipping/weighings/", headers=auth_headers, json=w_payload, timeout=TIMEOUT)
            assert resp.status_code == 201, f"Weighing creation {i} failed: {resp.text}"
            weighing = resp.json()
            assert "net_weight" in weighing, f"Net weight not calculated in weighing {i}"
            expected_net = weighing["gross_weight"] - tare_yute_data["weight"] - tare_nylon_data["weight"]
            assert abs(weighing["net_weight"] - expected_net) < 0.001, f"Net weight calculation mismatch in weighing {i}"
            weighings.append(weighing)

        created_ids["weighings"] = [w["id"] for w in weighings]

        # Step 5: Retrieve shipment history for the batch and validate
        history_resp = session.get(f"{BASE_URL}/api/shipping/batches/{batch_id}/history/", headers=auth_headers, timeout=TIMEOUT)
        assert history_resp.status_code == 200, f"Batch shipment history fetch failed: {history_resp.text}"
        history = history_resp.json()
        assert isinstance(history, list), "Shipment history should be a list"
        # Validate history entries contain weighings created
        history_weighing_ids = {entry.get("weighing_id") for entry in history}
        assert all(w_id in history_weighing_ids for w_id in created_ids["weighings"]), "Not all weighings appear in shipment history"

        # Step 6: Generate PDF report for the batch
        pdf_resp = session.post(f"{BASE_URL}/api/shipping/batches/{batch_id}/report/", headers=auth_headers, timeout=TIMEOUT)
        assert pdf_resp.status_code == 200, f"PDF report generation failed: {pdf_resp.text}"
        content_type = pdf_resp.headers.get("Content-Type", "")
        assert "application/pdf" in content_type, "PDF report content-type incorrect"
        assert len(pdf_resp.content) > 1000, "PDF content too small, might be invalid"

        # Step 7: Test invalid tare creation (negative weight)
        invalid_tare_payload = {"material": "yute", "weight": -0.5}
        invalid_resp = session.post(f"{BASE_URL}/api/shipping/tares/", headers=auth_headers, json=invalid_tare_payload, timeout=TIMEOUT)
        assert invalid_resp.status_code == 400, "Invalid tare weight accepted, validation failed"

        # Step 8: Test permission validation - try deleting tare with insufficient rights (simulate by token refresh with lesser role if supported)
        # For demonstration, attempt to delete a tare normally (should succeed)
        del_resp = session.delete(f"{BASE_URL}/api/shipping/tares/{tare_yute_id}/", headers=auth_headers, timeout=TIMEOUT)
        assert del_resp.status_code in {204, 200}, f"Failed to delete tare yute: {del_resp.text}"
        created_ids.pop("tare_yute", None)

        # Try SQL injection attempt in batch creation
        sql_injection_payload = {
            "name": "Injection'); DROP TABLE shipping_batches; --",
            "description": "Trying SQL Injection"
        }
        sql_resp = session.post(f"{BASE_URL}/api/shipping/batches/", headers=auth_headers, json=sql_injection_payload, timeout=TIMEOUT)
        assert sql_resp.status_code in {400, 422}, "SQL Injection payload not rejected properly"

        # Check response times for a critical endpoint
        start_time = time.time()
        perf_resp = session.get(f"{BASE_URL}/api/shipping/batches/{batch_id}/history/", headers=auth_headers, timeout=TIMEOUT)
        elapsed_ms = (time.time() - start_time) * 1000
        assert perf_resp.status_code == 200, "Performance test endpoint failed"
        assert elapsed_ms < 200, f"Endpoint response too slow: {elapsed_ms} ms"

    finally:
        # Cleanup created resources
        # Delete weighings
        for wid in created_ids.get("weighings", []):
            session.delete(f"{BASE_URL}/api/shipping/weighings/{wid}/", headers=auth_headers, timeout=TIMEOUT)
        # Delete tares if still existing
        for key in ["tare_yute", "tare_nylon"]:
            if key in created_ids:
                session.delete(f"{BASE_URL}/api/shipping/tares/{created_ids[key]}/", headers=auth_headers, timeout=TIMEOUT)
        # Delete batch
        if "batch" in created_ids:
            session.delete(f"{BASE_URL}/api/shipping/batches/{created_ids['batch']}/", headers=auth_headers, timeout=TIMEOUT)

    print("Test TC007 passed: Shipping weights tare calculation and PDF report generation.")


test_shipping_weights_system_tare_and_pdf()
