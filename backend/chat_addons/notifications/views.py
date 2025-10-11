from __future__ import annotations

from rest_framework.authentication import BaseAuthentication
from rest_framework.permissions import IsAuthenticated
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts_supabase.authentication import DevTokenOrJWTAuthentication

from backend.chat_addons.admin_console.models import MessageIntake


class IntakeSummaryView(APIView):
    authentication_classes: list[type[BaseAuthentication]] = [
        DevTokenOrJWTAuthentication
    ]
    permission_classes = [IsAuthenticated]

    def get(self, request: Request) -> Response:
        pending = MessageIntake.objects.filter(status=MessageIntake.STATUS_PENDING).count()
        rejected = MessageIntake.objects.filter(status=MessageIntake.STATUS_REJECTED).count()
        return Response(
            {
                "intake": {
                    "pending": pending,
                    "rejected": rejected,
                }
            }
        )
