"""
Tests for reports models and views
"""

from django.test import TestCase
from django.contrib.auth import get_user_model
from django.utils import timezone
from rest_framework.test import APITestCase
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken
from .models import Report, ReportTemplate, ReportSchedule, ReportLog
from apps.areas.models import Area
from apps.lots.models import Lot

User = get_user_model()


class ReportModelTest(TestCase):
    """Test cases for Report model"""
    
    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )
        
        self.report_data = {
            'name': 'Test Report',
            'report_type': 'daily_production',
            'format': 'pdf',
            'parameters': {'include_lots': True, 'include_temperatures': True},
            'filters': {'date_range': 'today'},
            'description': 'Test report description',
            'created_by': self.user
        }
    
    def test_create_report(self):
        """Test report creation"""
        report = Report.objects.create(**self.report_data)
        self.assertEqual(report.name, 'Test Report')
        self.assertEqual(report.report_type, 'daily_production')
        self.assertEqual(report.status, 'draft')
        self.assertEqual(report.created_by, self.user)
    
    def test_report_str_representation(self):
        """Test report string representation"""
        report = Report.objects.create(**self.report_data)
        expected = f"{report.name} ({report.get_report_type_display()})"
        self.assertEqual(str(report), expected)
    
    def test_report_is_ready_property(self):
        """Test report is_ready property"""
        report = Report.objects.create(**self.report_data)
        self.assertFalse(report.is_ready)
        
        report.status = 'completed'
        report.file_path = 'reports/test_report.pdf'
        report.save()
        self.assertTrue(report.is_ready)


class ReportTemplateModelTest(TestCase):
    """Test cases for ReportTemplate model"""
    
    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )
        
        self.template_data = {
            'name': 'Test Template',
            'report_type': 'daily_production',
            'template_type': 'html',
            'template_content': '<html><body>{{report.name}}</body></html>',
            'created_by': self.user
        }
    
    def test_create_template(self):
        """Test template creation"""
        template = ReportTemplate.objects.create(**self.template_data)
        self.assertEqual(template.name, 'Test Template')
        self.assertEqual(template.template_type, 'html')
        self.assertTrue(template.is_active)
    
    def test_template_str_representation(self):
        """Test template string representation"""
        template = ReportTemplate.objects.create(**self.template_data)
        expected = f"{template.name} ({template.get_template_type_display()})"
        self.assertEqual(str(template), expected)


class ReportScheduleModelTest(TestCase):
    """Test cases for ReportSchedule model"""
    
    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )
        
        self.report = Report.objects.create(
            name='Test Report',
            report_type='daily_production',
            created_by=self.user
        )
        
        self.schedule_data = {
            'report': self.report,
            'name': 'Daily Report Schedule',
            'frequency': 'daily',
            'email_recipients': ['admin@example.com'],
            'created_by': self.user
        }
    
    def test_create_schedule(self):
        """Test schedule creation"""
        schedule = ReportSchedule.objects.create(**self.schedule_data)
        self.assertEqual(schedule.name, 'Daily Report Schedule')
        self.assertEqual(schedule.frequency, 'daily')
        self.assertTrue(schedule.is_active)
    
    def test_schedule_str_representation(self):
        """Test schedule string representation"""
        schedule = ReportSchedule.objects.create(**self.schedule_data)
        expected = f"{schedule.name} - {schedule.get_frequency_display()}"
        self.assertEqual(str(schedule), expected)


class ReportLogModelTest(TestCase):
    """Test cases for ReportLog model"""
    
    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )
        
        self.report = Report.objects.create(
            name='Test Report',
            report_type='daily_production',
            created_by=self.user
        )
    
    def test_create_log(self):
        """Test log creation"""
        log = ReportLog.objects.create(
            report=self.report,
            level='info',
            message='Report generated successfully',
            details={'duration': 5.2}
        )
        self.assertEqual(log.report, self.report)
        self.assertEqual(log.level, 'info')
        self.assertEqual(log.message, 'Report generated successfully')


class ReportsAPITest(APITestCase):
    """Test cases for Reports API endpoints"""
    
    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123',
            role='admin'
        )
        
        self.token = RefreshToken.for_user(self.user)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.token.access_token}')
        
        self.area = Area.objects.create(
            name='Test Area',
            area_type='guardeola',
            capacity=100.0
        )
        
        self.lot = Lot.objects.create(
            code='TEST_LOT_001',
            finca='Test Finca',
            variety='Bourbon',
            initial_weight=100.0,
            initial_humidity=12.0
        )
    
    def test_create_report(self):
        """Test creating a report via API"""
        url = reverse('report-list')
        data = {
            'name': 'API Test Report',
            'report_type': 'daily_production',
            'format': 'pdf',
            'parameters': {'include_lots': True, 'include_temperatures': True},
            'filters': {'date_range': 'today'},
            'description': 'Test report via API'
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['name'], 'API Test Report')
        self.assertEqual(response.data['created_by'], self.user.id)
    
    def test_list_reports(self):
        """Test listing reports"""
        # Create a test report
        Report.objects.create(
            name='Test Report',
            report_type='daily_production',
            created_by=self.user
        )
        
        url = reverse('report-list')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)
    
    def test_report_detail(self):
        """Test retrieving report detail"""
        report = Report.objects.create(
            name='Test Report',
            report_type='daily_production',
            created_by=self.user
        )
        
        url = reverse('report-detail', kwargs={'pk': report.pk})
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['name'], 'Test Report')
    
    def test_update_report(self):
        """Test updating a report"""
        report = Report.objects.create(
            name='Test Report',
            report_type='daily_production',
            created_by=self.user
        )
        
        url = reverse('report-detail', kwargs={'pk': report.pk})
        data = {
            'name': 'Updated Test Report',
            'description': 'Updated description'
        }
        response = self.client.patch(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['name'], 'Updated Test Report')
    
    def test_delete_report(self):
        """Test deleting a report"""
        report = Report.objects.create(
            name='Test Report',
            report_type='daily_production',
            created_by=self.user
        )
        
        url = reverse('report-detail', kwargs={'pk': report.pk})
        response = self.client.delete(url)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        
        # Verify report was deleted
        self.assertFalse(Report.objects.filter(pk=report.pk).exists())
    
    def test_generate_report(self):
        """Test report generation endpoint"""
        url = reverse('generate-report')
        data = {
            'report_type': 'daily_production',
            'format': 'pdf',
            'parameters': {'include_lots': True, 'include_temperatures': True},
            'filters': {'date_range': 'today'}
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_202_ACCEPTED)
        self.assertIn('report_id', response.data)
    
    def test_report_stats(self):
        """Test report statistics endpoint"""
        # Create some test reports
        Report.objects.create(
            name='Report 1',
            report_type='daily_production',
            status='completed',
            download_count=5,
            created_by=self.user
        )
        Report.objects.create(
            name='Report 2',
            report_type='temperature_summary',
            status='completed',
            download_count=3,
            created_by=self.user
        )
        
        url = reverse('report-stats')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('total_reports', response.data)
        self.assertIn('completed_reports', response.data)
        self.assertIn('total_downloads', response.data)
        self.assertEqual(response.data['total_reports'], 2)
        self.assertEqual(response.data['completed_reports'], 2)
        self.assertEqual(response.data['total_downloads'], 8)
    
    def test_unauthorized_access(self):
        """Test unauthorized access to reports"""
        self.client.credentials()  # Remove authentication
        
        url = reverse('report-list')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
