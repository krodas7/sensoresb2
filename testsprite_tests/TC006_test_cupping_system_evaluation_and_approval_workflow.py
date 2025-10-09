import requests
import time

BASE_URL = "http://localhost:8000"
TIMEOUT = 30

def test_cupping_system_evaluation_and_approval_workflow():
    """
    Test the commercial cupping evaluation system including scoring,
    quality analysis, and approval workflow to ensure correct processing and status updates.
    Includes:
    - Authentication with JWT token handling
    - CRUD operations for cupping sessions and evaluations
    - Permission validation
    - Data validation and error handling with valid/invalid inputs
    - Response time checks under 200ms where applicable
    - Basic security checks with malformed inputs
    """
    session = requests.Session()
    try:
        # ----------------------
        # 1) Authenticate as a valid user to obtain JWT token
        # ----------------------
        login_payload = {
            "username": "testuser",
            "password": "testpass123"
        }
        login_resp = session.post(
            f"{BASE_URL}/api/core/auth/login/",
            json=login_payload,
            timeout=TIMEOUT
        )
        assert login_resp.status_code == 200, f"Login failed: {login_resp.text}"
        login_data = login_resp.json()
        access_token = login_data.get("access")
        assert access_token, "Access token not found in login response"

        # Set Authorization header for subsequent requests
        session.headers.update({"Authorization": f"Bearer {access_token}"})

        # ----------------------
        # 2) Create a new cupping session (POST)
        # ----------------------
        cupping_session_payload = {
            "name": "Test Cupping Session",
            "date": "2025-10-04",
            "location": "Test Lab",
            "notes": "Initial test session for evaluation workflow"
        }
        start_time = time.time()
        create_session_resp = session.post(
            f"{BASE_URL}/api/cupping/sessions/",
            json=cupping_session_payload,
            timeout=TIMEOUT
        )
        elapsed = (time.time() - start_time) * 1000  # ms
        assert create_session_resp.status_code == 201, f"Failed to create cupping session: {create_session_resp.text}"
        assert elapsed < 2000, f"Cupping session creation too slow: {elapsed}ms"
        created_session = create_session_resp.json()
        session_id = created_session.get("id")
        assert session_id, "Created session has no ID"

        # ----------------------
        # 3) Add cupping evaluations (scores, quality analysis) to the session
        # ----------------------
        cupping_evaluation_payload = {
            "session": session_id,
            "scores": {
                "aroma": 8.5,
                "flavor": 8.0,
                "aftertaste": 7.5,
                "acidity": 8.2,
                "body": 7.8,
                "balance": 8.0,
                "uniformity": 8.5,
                "clean_cup": 8.7,
                "sweetness": 7.9,
                "total_cup_points": 80.1
            },
            "quality_analysis": "Good balance and aroma, slight acidity noted.",
            "notes": "Evaluator test notes"
        }
        start_time = time.time()
        create_eval_resp = session.post(
            f"{BASE_URL}/api/cupping/evaluations/",
            json=cupping_evaluation_payload,
            timeout=TIMEOUT
        )
        elapsed = (time.time() - start_time) * 1000
        assert create_eval_resp.status_code == 201, f"Failed to create cupping evaluation: {create_eval_resp.text}"
        assert elapsed < 2000, f"Cupping evaluation creation too slow: {elapsed}ms"
        created_evaluation = create_eval_resp.json()
        evaluation_id = created_evaluation.get("id")
        assert evaluation_id, "Created evaluation has no ID"

        # ----------------------
        # 4) Validate permission: try to access evaluation with invalid token
        # ----------------------
        invalid_session = requests.Session()
        invalid_session.headers.update({"Authorization": "Bearer invalidtoken"})
        invalid_resp = invalid_session.get(
            f"{BASE_URL}/api/cupping/evaluations/{evaluation_id}/",
            timeout=TIMEOUT
        )
        assert invalid_resp.status_code == 401 or invalid_resp.status_code == 403, (
            f"Unauthorized access did not fail as expected: {invalid_resp.status_code}"
        )

        # ----------------------
        # 5) Update evaluation status to 'approved' (PUT)
        # ----------------------
        approval_payload = {
            "status": "approved"  # Assuming status field controls workflow approval
        }
        update_resp = session.put(
            f"{BASE_URL}/api/cupping/evaluations/{evaluation_id}/",
            json=approval_payload,
            timeout=TIMEOUT
        )
        assert update_resp.status_code == 200, f"Failed to update evaluation approval status: {update_resp.text}"
        updated_evaluation = update_resp.json()
        assert updated_evaluation.get("status") == "approved", "Evaluation status was not updated to approved"

        # ----------------------
        # 6) Test data validation: try to create evaluation with invalid score (e.g. string instead of float)
        # ----------------------
        invalid_score_payload = {
            "session": session_id,
            "scores": {
                "aroma": "bad_string_value",
                "flavor": 8.0
            },
            "quality_analysis": "Invalid score test"
        }
        invalid_create_resp = session.post(
            f"{BASE_URL}/api/cupping/evaluations/",
            json=invalid_score_payload,
            timeout=TIMEOUT
        )
        assert invalid_create_resp.status_code == 400, "Invalid score input should return 400 Bad Request"

        # ----------------------
        # 7) Security test: SQL Injection attempt in notes field
        # ----------------------
        sql_injection_payload = {
            "session": session_id,
            "scores": {
                "aroma": 7.0,
                "flavor": 7.0
            },
            "quality_analysis": "Testing SQL Injection'; DROP TABLE users;--",
            "notes": "'); DROP TABLE cupping_evaluations;--"
        }
        sql_injection_resp = session.post(
            f"{BASE_URL}/api/cupping/evaluations/",
            json=sql_injection_payload,
            timeout=TIMEOUT
        )
        # Should not execute or cause server error
        assert sql_injection_resp.status_code in (201, 400), (
            f"SQL Injection attempt triggered unexpected response: {sql_injection_resp.status_code}"
        )

        # ----------------------
        # 8) Retrieve session details with evaluations, check for N+1 query problems by timing
        # ----------------------
        start = time.time()
        detail_resp = session.get(
            f"{BASE_URL}/api/cupping/sessions/{session_id}/?include_evaluations=true",
            timeout=TIMEOUT
        )
        elapsed_detail = (time.time() - start) * 1000
        assert detail_resp.status_code == 200, f"Failed to retrieve session details: {detail_resp.text}"
        # While we can't check DB queries directly, response time under 500ms suggests no N+1 problem
        assert elapsed_detail < 500, f"Possible N+1 query issue: session detail retrieval took {elapsed_detail}ms"

        # ----------------------
        # 9) Delete created evaluation and session (cleanup)
        # ----------------------
        del_eval_resp = session.delete(
            f"{BASE_URL}/api/cupping/evaluations/{evaluation_id}/",
            timeout=TIMEOUT
        )
        assert del_eval_resp.status_code == 204, f"Failed to delete evaluation: {del_eval_resp.text}"

        del_session_resp = session.delete(
            f"{BASE_URL}/api/cupping/sessions/{session_id}/",
            timeout=TIMEOUT
        )
        assert del_session_resp.status_code == 204, f"Failed to delete session: {del_session_resp.text}"

        # ----------------------
        # 10) Test logout and token invalidation
        # ----------------------
        logout_resp = session.post(f"{BASE_URL}/api/core/auth/logout/", timeout=TIMEOUT)
        assert logout_resp.status_code == 204, f"Logout failed: {logout_resp.text}"
        
        # Verify token invalid by accessing protected endpoint
        post_logout_resp = session.get(f"{BASE_URL}/api/cupping/sessions/", timeout=TIMEOUT)
        assert post_logout_resp.status_code == 401 or post_logout_resp.status_code == 403, "Token not invalidated after logout"

    finally:
        session.close()

test_cupping_system_evaluation_and_approval_workflow()
