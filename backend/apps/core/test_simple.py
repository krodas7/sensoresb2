"""
Simple tests for CI/CD - only essential functionality
"""
from django.test import TestCase
from django.urls import reverse
from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APITestCase

User = get_user_model()

class SimpleAPITest(APITestCase):
    """Simple API tests for CI/CD"""
    
    def test_health_check(self):
        """Test health check endpoint"""
        url = reverse('health')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('status', response.data)
    
    def test_login_endpoint_exists(self):
        """Test login endpoint exists"""
        url = reverse('login')
        response = self.client.post(url, {})
        # Should return 400 (bad request) not 404 (not found)
        self.assertNotEqual(response.status_code, 404)
