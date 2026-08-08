from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.decorators import api_view, authentication_classes, permission_classes
from django.conf import settings
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from datetime import datetime, timezone

from stream_server_django.accounts_supabase.authentication import (
    DevTokenOrJWTAuthentication,
    decode_supabase_token,
)
from stream_server_django.common.identity import get_chat_identity

from .serializers import RegisterSubscriptionsSerializer
from .webpush import broadcast_subscriptions_registered

@api_view(["GET"])
@authentication_classes([DevTokenOrJWTAuthentication])
@permission_classes([permissions.IsAuthenticated])
def ws_auth(request):
    """Return a legacy WebSocket URL carrying the verified Supabase token."""
    decoded = decode_supabase_token(request.auth)
    exp = datetime.fromtimestamp(decoded["exp"], tz=timezone.utc)
    scheme = "wss" if request.is_secure() else "ws"
    ws_url = f"{scheme}://{request.get_host()}/ws/?token={request.auth}"
    response = Response(
        {"stream_server_django.auth": ws_url, "expires": exp.isoformat()}
    )
    response["Cache-Control"] = "no-store"
    response["Pragma"] = "no-cache"
    return response

@api_view(["GET"])
@authentication_classes([DevTokenOrJWTAuthentication])
@permission_classes([permissions.IsAuthenticated])
def connection_id(request):
    identity = get_chat_identity(request)

    cid = request.session.get("connection_id")
    if not cid:
        from .utils import generate_snowflake

        cid = str(generate_snowflake())
        request.session["connection_id"] = cid

    try:
        import redis

        r = redis.Redis(
            host=settings.REDIS_HOST,
            port=settings.REDIS_PORT,
            decode_responses=True,
        )
        r.set(f"cid:{cid}", identity.username, ex=60)
    except Exception:
        pass

    return Response({"connection_id": cid})

@csrf_exempt
def ok(_request):
    return JsonResponse({})

@csrf_exempt
def ok_post(_request):
    return JsonResponse({}, status=201)

@csrf_exempt
def channel_config(_request, cid):
    return JsonResponse({"name": cid, "type": "messaging"})

@csrf_exempt
def members(_request, cid):
    return JsonResponse({"members": []})

@csrf_exempt
def messages(_request, cid):
    return JsonResponse({"messages": []})


@api_view(["POST"])
@authentication_classes([DevTokenOrJWTAuthentication])
@permission_classes([permissions.IsAuthenticated])
def register_subscriptions(request):
    """Register web push subscriptions and echo them back."""
    identity = get_chat_identity(request)
    user = identity.as_user()
    serializer = RegisterSubscriptionsSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    client_id = serializer.validated_data.get("client_id")
    data = serializer.save(user=user)
    broadcast_subscriptions_registered(user, client_id, data)
    return Response(data, status=status.HTTP_201_CREATED)


@api_view(["POST"])
@authentication_classes([DevTokenOrJWTAuthentication])
@permission_classes([permissions.IsAuthenticated])
def editing_audit_state(request):
    """Echo state only for callers authenticated by the shared JWT path."""
    draft_update = request.data.get("draft_update")
    state_update = request.data.get("state_update")
    return Response({"draft_update": draft_update, "state_update": state_update})
