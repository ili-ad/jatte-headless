from django.conf import settings
from django.core.exceptions import RequestDataTooBig
from django.http import JsonResponse


class RequestBodyLimitMiddleware:
    """Reject declared oversized Django request bodies before parsing."""

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        limit = int(settings.DATA_UPLOAD_MAX_MEMORY_SIZE)
        raw_length = request.META.get("CONTENT_LENGTH")
        try:
            content_length = int(raw_length) if raw_length else None
        except (TypeError, ValueError):
            return self._too_large()
        if content_length is not None and content_length > limit:
            return self._too_large()
        if content_length is None:
            try:
                if len(request.body) > limit:
                    return self._too_large()
            except RequestDataTooBig:
                return self._too_large()
        return self.get_response(request)

    @staticmethod
    def _too_large():
        return JsonResponse({"error": "request body too large"}, status=413)
