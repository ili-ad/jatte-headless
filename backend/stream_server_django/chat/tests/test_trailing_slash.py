from django.urls import get_resolver


def test_api_routes_have_trailing_slash():
    patterns = [p.pattern._route for p in get_resolver().url_patterns
                if getattr(p, 'callback', None) and getattr(p.callback, 'cls', None)
                and getattr(p.pattern, '_route', None) and p.pattern._route.startswith('api/')]
    assert all(route.endswith('/') for route in patterns), (
        "All API routes must end with a trailing slash")

