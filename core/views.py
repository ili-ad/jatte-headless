from rest_framework.decorators import api_view
from rest_framework.response import Response


@api_view(["GET"])
def index(request):
    return Response({"message": "Jatte API"})


@api_view(["GET"])
def about(request):
    return Response({"about": "Jatte headless backend"})
