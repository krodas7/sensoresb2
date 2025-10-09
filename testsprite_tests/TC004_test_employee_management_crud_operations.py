import requests
import time

BASE_URL = "http://localhost:8000"
TIMEOUT = 30
ADMIN_CREDENTIALS = {
    "username": "admin",
    "password": "adminpassword"  # Replace with valid admin credentials for testing
}

def authenticate():
    url = f"{BASE_URL}/api/token/"
    resp = requests.post(url, json=ADMIN_CREDENTIALS, timeout=TIMEOUT)
    assert resp.status_code == 200, f"Authentication failed with status {resp.status_code}"
    data = resp.json()
    assert "access" in data and "refresh" in data, "Missing JWT tokens in response"
    return data["access"]

def test_employee_management_crud_operations():
    token = authenticate()
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }

    # Validate response times under 200ms for critical requests
    def assert_response_time(response):
        assert response.elapsed.total_seconds() < 0.2, f"Response time too high: {response.elapsed.total_seconds()}s"

    # Step1: Create a new Occupation (Job position)
    occupation_payload = {
        "name": "Quality Inspector",
        "description": "Inspect quality of coffee beans"
    }
    occ_create_resp = requests.post(f"{BASE_URL}/api/occupations/", json=occupation_payload, headers=headers, timeout=TIMEOUT)
    assert occ_create_resp.status_code == 201, f"Failed occupation creation: {occ_create_resp.text}"
    assert_response_time(occ_create_resp)
    occupation = occ_create_resp.json()
    occ_id = occupation.get("id")
    assert occ_id is not None, "Occupation ID missing after creation"

    try:
        # Step2: Create a new Employee with valid data including occupation assignment
        employee_payload = {
            "first_name": "Juan",
            "last_name": "Perez",
            "email": "juan.perez@example.com",
            "phone": "+50255551234",
            "date_of_birth": "1990-01-15",
            "occupation": occ_id,
            "address": "Central Street 123"
        }
        emp_create_resp = requests.post(f"{BASE_URL}/api/employees/", json=employee_payload, headers=headers, timeout=TIMEOUT)
        assert emp_create_resp.status_code == 201, f"Failed employee creation: {emp_create_resp.text}"
        assert_response_time(emp_create_resp)
        employee = emp_create_resp.json()
        emp_id = employee.get("id")
        assert emp_id is not None, "Employee ID missing after creation"

        # Step3: Retrieve the employee and verify fields match and occupation is linked
        emp_get_resp = requests.get(f"{BASE_URL}/api/employees/{emp_id}/", headers=headers, timeout=TIMEOUT)
        assert emp_get_resp.status_code == 200, f"Failed to get employee: {emp_get_resp.text}"
        assert_response_time(emp_get_resp)
        emp_data = emp_get_resp.json()
        assert emp_data["first_name"] == employee_payload["first_name"]
        assert emp_data["last_name"] == employee_payload["last_name"]
        assert emp_data["email"] == employee_payload["email"]
        assert emp_data["occupation"] == occ_id

        # Step4: Update employee - change some fields and occupation
        new_occupation_payload = {
            "name": "Senior Inspector",
            "description": "Senior role inspecting quality"
        }
        occ_update_resp = requests.post(f"{BASE_URL}/api/occupations/", json=new_occupation_payload, headers=headers, timeout=TIMEOUT)
        assert occ_update_resp.status_code == 201, f"Failed creation of new occupation for update: {occ_update_resp.text}"
        new_occ = occ_update_resp.json()
        new_occ_id = new_occ.get("id")
        assert new_occ_id is not None

        employee_update_payload = {
            "first_name": "Juan Carlos",
            "last_name": "Perez Gomez",
            "email": "juan.c.perez@example.com",
            "occupation": new_occ_id,
            "phone": "+50255559876",
            "address": "New Street 456",
            "date_of_birth": "1990-01-15"
        }
        emp_update_resp = requests.put(f"{BASE_URL}/api/employees/{emp_id}/", json=employee_update_payload, headers=headers, timeout=TIMEOUT)
        assert emp_update_resp.status_code == 200, f"Failed employee update: {emp_update_resp.text}"
        assert_response_time(emp_update_resp)
        updated_emp = emp_update_resp.json()
        assert updated_emp["first_name"] == employee_update_payload["first_name"]
        assert updated_emp["occupation"] == new_occ_id

        # Step5: Test invalid data for employee creation (e.g. invalid email and missing required fields)
        invalid_employee_payload = {
            "first_name": "",
            "last_name": "Invalid",
            "email": "not-an-email",
            "occupation": None
        }
        emp_bad_create_resp = requests.post(f"{BASE_URL}/api/employees/", json=invalid_employee_payload, headers=headers, timeout=TIMEOUT)
        assert emp_bad_create_resp.status_code == 400, "Invalid employee creation did not fail as expected"
        # Check error message keys for fields
        errors = emp_bad_create_resp.json()
        assert "first_name" in errors or "email" in errors, "Validation errors missing for invalid employee creation"

        # Step6: Permission validation - try to perform an action without token or with invalid token
        no_auth_resp = requests.get(f"{BASE_URL}/api/employees/", timeout=TIMEOUT)
        assert no_auth_resp.status_code in [401, 403], "Unauthorized access without token did not fail"

        bad_headers = {"Authorization": "Bearer badtoken123"}
        bad_token_resp = requests.get(f"{BASE_URL}/api/employees/", headers=bad_headers, timeout=TIMEOUT)
        assert bad_token_resp.status_code in [401, 403], "Access with invalid token did not fail"

        # Step7: Check listing employees for N+1 problem by verifying timing (rudimentary)
        start_time = time.time()
        list_resp = requests.get(f"{BASE_URL}/api/employees/?expand=occupation", headers=headers, timeout=TIMEOUT)
        duration = time.time() - start_time
        assert list_resp.status_code == 200, "Failed to list employees"
        # assuming less than 0.5s reflects no N+1 issue for small test db
        assert duration < 0.5, f"Potential N+1 query detected, duration too long: {duration}s"

        # Step8: Security tests for SQL Injection and XSS in employee creation
        malicious_payload = {
            "first_name": "Robert'); DROP TABLE employees;--",
            "last_name": "<script>alert('xss')</script>",
            "email": "robert@example.com",
            "occupation": new_occ_id,
            "phone": "+50255550000",
            "address": "Malicious Street"
        }
        sec_resp = requests.post(f"{BASE_URL}/api/employees/", json=malicious_payload, headers=headers, timeout=TIMEOUT)
        # Should reject or sanitize inputs, not cause server error or data corruption
        assert sec_resp.status_code in [201, 400], "Security test: unexpected status code"
        if sec_resp.status_code == 201:
            emp_sec = sec_resp.json()
            # Verify that returned fields are sanitized (no raw script tags)
            assert "<script>" not in emp_sec.get("last_name", ""), "XSS attack vector possible in response"
            # Delete this test employee after check
            requests.delete(f"{BASE_URL}/api/employees/{emp_sec['id']}/", headers=headers, timeout=TIMEOUT)

        # Step9: Delete employee and verify no longer accessible
        del_resp = requests.delete(f"{BASE_URL}/api/employees/{emp_id}/", headers=headers, timeout=TIMEOUT)
        assert del_resp.status_code == 204, f"Failed to delete employee: {del_resp.text}"
        get_after_del_resp = requests.get(f"{BASE_URL}/api/employees/{emp_id}/", headers=headers, timeout=TIMEOUT)
        assert get_after_del_resp.status_code == 404, "Deleted employee still accessible"

    finally:
        # Clean up created occupations
        requests.delete(f"{BASE_URL}/api/occupations/{occ_id}/", headers=headers, timeout=TIMEOUT)
        if 'new_occ_id' in locals():
            requests.delete(f"{BASE_URL}/api/occupations/{new_occ_id}/", headers=headers, timeout=TIMEOUT)

test_employee_management_crud_operations()
