import requests
import time

BASE_URL = "http://localhost:8000"
TIMEOUT = 30

# Credentials for authentication - adjust as applicable for the test environment
USERNAME = "testuser"
PASSWORD = "testpassword"

def authenticate():
    url = f"{BASE_URL}/api/auth/login/"
    payload = {"username": USERNAME, "password": PASSWORD}
    response = requests.post(url, json=payload, timeout=TIMEOUT)
    assert response.status_code == 200, f"Login failed with status code {response.status_code}"
    data = response.json()
    assert "access" in data, "JWT access token not found in login response"
    return data["access"]

def create_report(auth_token):
    url = f"{BASE_URL}/api/reports/"
    headers = {"Authorization": f"Bearer {auth_token}"}
    payload = {
        "title": "Test Report PDF Generation",
        "description": "Report created for test case TC010",
        # Example fields to create a report; adjust as per actual API schema if known
        "filters": {"date_from": "2025-01-01", "date_to": "2025-12-31"},
    }
    response = requests.post(url, json=payload, headers=headers, timeout=TIMEOUT)
    assert response.status_code == 201, f"Report creation failed: {response.status_code} {response.text}"
    report = response.json()
    assert "id" in report, "Created report ID missing"
    return report["id"]

def delete_report(auth_token, report_id):
    url = f"{BASE_URL}/api/reports/{report_id}/"
    headers = {"Authorization": f"Bearer {auth_token}"}
    response = requests.delete(url, headers=headers, timeout=TIMEOUT)
    assert response.status_code in (204, 200), f"Failed to delete report {report_id}, status {response.status_code}"

def test_report_generation_pdf_preview_search_and_statistics():
    auth_token = authenticate()
    headers = {"Authorization": f"Bearer {auth_token}"}

    # Create a new report resource for testing
    report_id = None
    try:
        report_id = create_report(auth_token)

        # 1) Test PDF preview generation endpoint (assume /api/reports/{id}/pdf-preview/)
        preview_url = f"{BASE_URL}/api/reports/{report_id}/pdf-preview/"
        start_time = time.time()
        preview_resp = requests.get(preview_url, headers=headers, timeout=TIMEOUT)
        duration = time.time() - start_time
        assert preview_resp.status_code == 200, f"PDF preview failed with status {preview_resp.status_code}"
        assert preview_resp.headers.get("Content-Type") == "application/pdf", "Preview is not a PDF"
        assert duration < 0.5, f"PDF preview took too long: {duration}s"

        # 2) Test search filters on reports
        search_url = f"{BASE_URL}/api/reports/"
        params_valid = {"search": "Test Report"}
        start_time = time.time()
        search_resp = requests.get(search_url, headers=headers, params=params_valid, timeout=TIMEOUT)
        duration = time.time() - start_time
        assert search_resp.status_code == 200, f"Search failed with status {search_resp.status_code}"
        search_data = search_resp.json()
        assert isinstance(search_data, list) or isinstance(search_data, dict), "Search response invalid format"
        assert duration < 0.5, f"Report search took too long: {duration}s"

        # 3) Test statistics display endpoint (assume /api/reports/statistics/)
        stats_url = f"{BASE_URL}/api/reports/statistics/"
        start_time = time.time()
        stats_resp = requests.get(stats_url, headers=headers, timeout=TIMEOUT)
        duration = time.time() - start_time
        assert stats_resp.status_code == 200, f"Statistics retrieval failed with status {stats_resp.status_code}"
        stats_data = stats_resp.json()
        # Expected fields in statistics (example)
        for key in ("total_reports", "reports_last_week", "new_reports_count"):
            assert key in stats_data, f"Statistics key '{key}' missing"
        assert duration < 0.5, f"Statistics retrieval took too long: {duration}s"

        # 4) Validate marking of new reports (assume 'new' boolean or tag in report list)
        list_resp = requests.get(search_url, headers=headers, timeout=TIMEOUT)
        assert list_resp.status_code == 200, "Failed to list reports"
        reports = list_resp.json()
        found_new = False
        if isinstance(reports, dict) and "results" in reports:
            reports = reports["results"]
        for r in reports:
            if r.get("id") == report_id:
                # Check new tag logic, e.g. 'is_new' or 'tags' contains 'New'
                is_new = r.get("is_new", False) or ("New" in r.get("tags", []))
                found_new = True
                assert is_new is True, "New report tag missing or incorrect"
        assert found_new, "Created report not found in listing with new tag"

        # 5) Security and input validation tests for search parameters
        for invalid_search in ["'; DROP TABLE reports; --", "<script>alert(1)</script>", ""]:
            params = {"search": invalid_search}
            resp = requests.get(search_url, headers=headers, params=params, timeout=TIMEOUT)
            # Should return 200 with empty or safe results, no errors or SQL injection
            assert resp.status_code == 200, f"Invalid search input caused error with status {resp.status_code}"
            res_data = resp.json()
            # Expect results safe and no crash, res_data could be list or dict with results
            assert res_data is not None

        # 6) Permission system validation: attempt access without token
        no_auth_resp = requests.get(preview_url, timeout=TIMEOUT)
        assert no_auth_resp.status_code == 401, "Access without token should be unauthorized"

    finally:
        if report_id:
            delete_report(auth_token, report_id)

test_report_generation_pdf_preview_search_and_statistics()
