from rest_framework.decorators import api_view
from rest_framework.response import Response


@api_view(['GET'])
def notification_list(request):
    """List notifications"""
    return Response({'message': 'Notifications endpoint'})
