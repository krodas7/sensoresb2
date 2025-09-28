"""
Tests for core models and views
"""

from django.test import TestCase, Client
from django.contrib.auth import get_user_model
from django.urls import reverse
from django.utils import timezone
from rest_framework.test import APITestCase
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken
from .models import User, Parameter, Event, Alert
from apps.areas.models import Area
from apps.sensors.models import Sensor


User = get_user_model()


class UserModelTest(TestCase):
    """Test cases for User model"""
    
    def setUp(self):
        self.user_data = {
            'username': 'testuser',
            'email': 'test@example.com',
            'first_name': 'Test',
            'last_name': 'User',
            'password': 'testpass123',
            'role': 'operador_seco'
        }
    
    def test_create_user(self):
        """Test user creation"""
        user = User.objects.create_user(**self.user_data)
        self.assertEqual(user.username, 'testuser')
        self.assertEqual(user.email, 'test@example.com')
        self.assertEqual(user.role, 'operador_seco')
        self.assertTrue(user.check_password('testpass123'))
    
    def test_user_str_representation(self):
        """Test user string representation"""
        user = User.objects.create_user(**self.user_data)
        expected = f"{user.get_full_name()} ({user.email})"
        self.assertEqual(str(user), expected)
    
    def test_user_required_fields(self):
        """Test user required fields"""
        with self.assertRaises(ValueError):
            User.objects.create_user(
                username='test',
                email='',
                password='testpass123'
            )


class ParameterModelTest(TestCase):
    """Test cases for Parameter model"""
    
    def setUp(self):
        self.parameter_data = {
            'key': 'test_param',
            'value_json': '{"value": 42}',
            'description': 'Test parameter',
            'category': 'general',
            'param_type': 'number'
        }
    
    def test_create_parameter(self):
        """Test parameter creation"""
        param = Parameter.objects.create(**self.parameter_data)
        self.assertEqual(param.key, 'test_param')
        self.assertEqual(param.category, 'general')
        self.assertTrue(param.is_active)
    
    def test_parameter_str_representation(self):
        """Test parameter string representation"""
        param = Parameter.objects.create(**self.parameter_data)
        expected = f"{param.key} ({param.category})"
        self.assertEqual(str(param), expected)


class EventModelTest(TestCase):
    """Test cases for Event model"""
    
    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )
    
    def test_create_event(self):
        """Test event creation"""
        event = Event.objects.create(
            event_type='user_login',
            payload_json='{"user_id": 1}',
            severity='info',
            user=self.user
        )
        self.assertEqual(event.event_type, 'user_login')
        self.assertEqual(event.severity, 'info')
        self.assertEqual(event.user, self.user)


class AlertModelTest(TestCase):
    """Test cases for Alert model"""
    
    def test_create_alert(self):
        """Test alert creation"""
        alert = Alert.objects.create(
            alert_type='temperature',
            rule='temp > 40°C',
            destination='admin@example.com',
            severity='high'
        )
        self.assertEqual(alert.alert_type, 'temperature')
        self.assertEqual(alert.severity, 'high')
        self.assertTrue(alert.is_active)


class CoreAPITest(APITestCase):
    """Test cases for Core API endpoints"""
    
    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )
        self.client = Client()
    
    def test_health_check(self):
        """Test health check endpoint"""
        url = reverse('health_check')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('status', response.data)
        self.assertEqual(response.data['status'], 'healthy')
    
    def test_login_endpoint(self):
        """Test login endpoint"""
        url = reverse('login')
        data = {
            'username': 'testuser',
            'password': 'testpass123'
        }
        response = self.client.post(url, data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access', response.data)
        self.assertIn('refresh', response.data)
        self.assertIn('user', response.data)
    
    def test_login_invalid_credentials(self):
        """Test login with invalid credentials"""
        url = reverse('login')
        data = {
            'username': 'testuser',
            'password': 'wrongpassword'
        }
        response = self.client.post(url, data)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
    
    def test_me_endpoint_authenticated(self):
        """Test me endpoint with authentication"""
        token = RefreshToken.for_user(self.user)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token.access_token}')
        
        url = reverse('me')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['username'], 'testuser')
    
    def test_me_endpoint_unauthenticated(self):
        """Test me endpoint without authentication"""
        url = reverse('me')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


class SensorDataAPITest(APITestCase):
    """Test cases for sensor data endpoints"""
    
    def setUp(self):
        self.area = Area.objects.create(
            name='Test Area',
            area_type='guardeola',
            capacity=100.0
        )
        self.sensor = Sensor.objects.create(
            code='TEST_SENSOR',
            sensor_type='temperature',
            area=self.area
        )
    
    def test_receive_sensor_data(self):
        """Test receiving sensor data"""
        url = reverse('receive_sensor_data')
        data = {
            'sensor_id': 'TEST_SENSOR',
            'temperature': 25.5,
            'timestamp': timezone.now().isoformat(),
            'status': 'OK'
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('message', response.data)
        self.assertEqual(response.data['sensor_id'], 'TEST_SENSOR')
    
    def test_receive_sensor_data_missing_fields(self):
        """Test receiving sensor data with missing required fields"""
        url = reverse('receive_sensor_data')
        data = {
            'sensor_id': 'TEST_SENSOR',
            # Missing temperature field
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
    
    def test_sensor_status(self):
        """Test sensor status endpoint"""
        url = reverse('sensor_status')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('status', response.data)
        self.assertEqual(response.data['status'], 'online')
    
    def test_get_sensor_data(self):
        """Test getting sensor data"""
        # First, send some sensor data
        url_send = reverse('receive_sensor_data')
        data = {
            'sensor_id': 'TEST_SENSOR',
            'temperature': 25.5,
            'status': 'OK'
        }
        self.client.post(url_send, data, format='json')
        
        # Then retrieve it
        url_get = reverse('get_sensor_data')
        response = self.client.get(url_get)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('sensors', response.data)
        self.assertIn('TEST_SENSOR', response.data['sensors'])
