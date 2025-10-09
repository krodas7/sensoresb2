import requests
import time

BASE_URL = "http://localhost:8000"
TIMEOUT = 30

# Credentials for authentication - these should be valid for the system
AUTH_PAYLOAD = {"username": "testuser", "password": "testpassword"}

HEADERS = {"Content-Type": "application/json"}

def test_lot_management_quality_tracking_and_status_monitoring():
    session = requests.Session()
    session.headers.update(HEADERS)
    token = None
    created_lot_id = None

    try:
        # 1) Authenticate and obtain JWT token
        auth_resp = session.post(f"{BASE_URL}/api/token/", json=AUTH_PAYLOAD, timeout=TIMEOUT)
        assert auth_resp.status_code == 200, f"Login failed with status {auth_resp.status_code}"
        auth_data = auth_resp.json()
        assert "access" in auth_data, "Access token missing in login response"
        token = auth_data["access"]
        session.headers.update({"Authorization": f"Bearer {token}"})

        # 2) Test Create Lot (valid payload)
        lot_create_payload = {
            "name": "Test Lot Quality Tracking",
            "batch_number": "BATCH-001",
            "quality_score": 85,
            "status": "pending",
            "notes": "Initial creation for testing",
            "harvest_date": "2025-10-01",
            "origin": "Farm A",
            "weight_kg": 1500.0
        }
        create_resp = session.post(f"{BASE_URL}/api/lots/", json=lot_create_payload, timeout=TIMEOUT)
        assert create_resp.status_code == 201, f"Lot creation failed with status {create_resp.status_code}"
        created_lot = create_resp.json()
        created_lot_id = created_lot.get("id")
        assert created_lot_id is not None, "Created lot ID missing"
        assert created_lot["quality_score"] == lot_create_payload["quality_score"]
        assert created_lot["status"] == lot_create_payload["status"]

        # 3) Test Read Lot (valid)
        read_resp = session.get(f"{BASE_URL}/api/lots/{created_lot_id}/", timeout=TIMEOUT)
        assert read_resp.status_code == 200, f"Read lot failed with status {read_resp.status_code}"
        read_lot = read_resp.json()
        assert read_lot["id"] == created_lot_id

        # 4) Test Update Lot (change status and quality_score)
        update_payload = {"status": "approved", "quality_score": 90}
        update_resp = session.put(f"{BASE_URL}/api/lots/{created_lot_id}/", json=update_payload, timeout=TIMEOUT)
        assert update_resp.status_code == 200, f"Update lot failed with status {update_resp.status_code}"
        updated_lot = update_resp.json()
        assert updated_lot["status"] == "approved"
        assert updated_lot["quality_score"] == 90

        # 5) Test Partial Update Lot (PATCH) - notes only
        patch_payload = {"notes": "Updated notes after quality check"}
        patch_resp = session.patch(f"{BASE_URL}/api/lots/{created_lot_id}/", json=patch_payload, timeout=TIMEOUT)
        assert patch_resp.status_code == 200, f"Patch lot failed with status {patch_resp.status_code}"
        patched_lot = patch_resp.json()
        assert patched_lot["notes"] == patch_payload["notes"]

        # 6) Test List Lots with filtering and check no N+1 query problem by response time under 200ms
        start = time.time()
        list_resp = session.get(f"{BASE_URL}/api/lots/?status=approved", timeout=TIMEOUT)
        duration = (time.time() - start) * 1000  # ms
        assert list_resp.status_code == 200, "Lot list fetch failed"
        assert duration < 200, f"Lot list API too slow: {duration}ms"
        lots = list_resp.json()
        assert isinstance(lots, list), "Lot list response should be a list"

        # 7) Test Create Lot with invalid data (SQL Injection attempt in name)
        invalid_payload = {
            "name": "Test'; DROP TABLE lots;--",
            "batch_number": "BATCH-002",
            "quality_score": -10,  # invalid score to trigger validation error
            "status": "pending",
            "notes": "<script>alert('xss')</script>",
            "harvest_date": "2025-10-04",
            "origin": "Farm B",
            "weight_kg": -100  # invalid negative weight
        }
        invalid_resp = session.post(f"{BASE_URL}/api/lots/", json=invalid_payload, timeout=TIMEOUT)
        assert invalid_resp.status_code == 400, "Invalid lot creation did not fail as expected"
        errors = invalid_resp.json()
        assert "quality_score" in errors or "weight_kg" in errors or "name" in errors or "notes" in errors

        # 8) Test permission system by trying to access lots API without token
        unauth_session = requests.Session()
        unauth_list_resp = unauth_session.get(f"{BASE_URL}/api/lots/", timeout=TIMEOUT)
        assert unauth_list_resp.status_code in (401, 403), "Unauthenticated access to lots API should be denied"

        # 9) Test delete lot (permission test and actual delete)
        delete_resp = session.delete(f"{BASE_URL}/api/lots/{created_lot_id}/", timeout=TIMEOUT)
        assert delete_resp.status_code == 204, f"Delete lot failed with status {delete_resp.status_code}"

        # 10) Verify deleted lot is inaccessible
        post_delete_resp = session.get(f"{BASE_URL}/api/lots/{created_lot_id}/", timeout=TIMEOUT)
        assert post_delete_resp.status_code == 404, "Deleted lot still accessible"

    finally:
        # Cleanup if lot still exists
        if token and created_lot_id:
            try:
                session.delete(f"{BASE_URL}/api/lots/{created_lot_id}/", timeout=TIMEOUT)
            except Exception:
                pass

test_lot_management_quality_tracking_and_status_monitoring()
