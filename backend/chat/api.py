from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt

@csrf_exempt
def ws_auth(_request):
    return JsonResponse({"auth": "ok"})

@csrf_exempt
def connection_id(_request):
    return JsonResponse({"connection_id": "local"})

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
