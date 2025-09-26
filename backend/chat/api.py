from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.decorators import api_view, authentication_classes, permission_classes
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.utils import timezone
from django.conf import settings
from jwt import PyJWKClient
import jwt

from accounts_supabase.authentication import DevTokenOrJWTAuthentication

from .serializers import RegisterSubscriptionsSerializer
from .webpush import broadcast_subscriptions_registered

@api_view(["GET"])
def ws_auth(request):
    """Return a signed websocket URL for authenticated requests."""
    auth = request.headers.get("Authorization")
    if not auth or not auth.startswith("Bearer "):
        return Response(status=403)
    token = auth.split()[1]
    try:
        jwt.decode(
            token,
            settings.SUPABASE_JWT_SECRET,
            algorithms=["HS256"],
            options={"verify_aud": False},
            leeway=30,
        )
    except jwt.PyJWTError:
        jwks_url = settings.SUPABASE_JWKS_URL or "https://example.com/keys"
        try:
            signing_key = PyJWKClient(jwks_url).get_signing_key_from_jwt(token)
            jwt.decode(
                token,
                signing_key.key,
                algorithms=["RS256"],
                options={"verify_aud": False},
            )
        except jwt.PyJWTError:
            return Response(status=403)

    exp = timezone.now() + timezone.timedelta(minutes=5)
    ws_token = jwt.encode({"exp": int(exp.timestamp())}, settings.SUPABASE_JWT_SECRET, algorithm="HS256")
    ws_url = f"ws://{request.get_host()}/ws/?token={ws_token}"
    return Response({"auth": ws_url, "expires": exp.isoformat()})

@api_view(["GET"])
def connection_id(request):
    auth = request.headers.get("Authorization")
    if not auth or not auth.startswith("Bearer "):
        return Response(status=403)
    token = auth.split()[1]
    try:
        jwt.decode(
            token,
            settings.SUPABASE_JWT_SECRET,
            algorithms=["HS256"],
            options={"verify_aud": False},
            leeway=30,
        )
    except jwt.PyJWTError:
        jwks_url = settings.SUPABASE_JWKS_URL or "https://example.com/keys"
        try:
            signing_key = PyJWKClient(jwks_url).get_signing_key_from_jwt(token)
            jwt.decode(
                token,
                signing_key.key,
                algorithms=["RS256"],
                options={"verify_aud": False},
            )
        except jwt.PyJWTError:
            return Response(status=403)

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
        r.set(f"cid:{cid}", request.user.username, ex=60)
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
    serializer = RegisterSubscriptionsSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    client_id = serializer.validated_data.get("client_id")
    data = serializer.save(user=request.user)
    broadcast_subscriptions_registered(request.user, client_id, data)
    return Response(data, status=status.HTTP_201_CREATED)


@api_view(["POST"])
def editing_audit_state(request):
    """Echo posted editing audit state after JWT auth."""
    auth = request.headers.get("Authorization")
    if not auth or not auth.startswith("Bearer "):
        return Response(status=403)
    token = auth.split()[1]
    try:
        jwt.decode(
            token,
            settings.SUPABASE_JWT_SECRET,
            algorithms=["HS256"],
            options={"verify_aud": False},
            leeway=30,
        )
    except jwt.PyJWTError:
        jwks_url = settings.SUPABASE_JWKS_URL or "https://example.com/keys"
        try:
            signing_key = PyJWKClient(jwks_url).get_signing_key_from_jwt(token)
            jwt.decode(
                token,
                signing_key.key,
                algorithms=["RS256"],
                options={"verify_aud": False},
            )
        except jwt.PyJWTError:
            return Response(status=403)

    draft_update = request.data.get("draft_update")
    state_update = request.data.get("state_update")
    return Response({"draft_update": draft_update, "state_update": state_update})
