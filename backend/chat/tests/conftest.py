import pytest

@pytest.fixture(autouse=True)
def disable_auth(settings):
    settings.REST_FRAMEWORK['DEFAULT_PERMISSION_CLASSES'] = [
        'rest_framework.permissions.AllowAny'
    ]
