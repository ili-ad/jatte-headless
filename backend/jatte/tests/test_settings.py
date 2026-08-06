"""Isolated settings for auth-boundary regression tests.

The production URL configuration currently imports optional agent modules that
are not needed to exercise the legacy auth compatibility functions. Keeping
this URLconf minimal lets these boundary tests run without changing public
routing or agent behavior.
"""

from jatte.settings import *  # noqa: F403


ROOT_URLCONF = "jatte.tests.urls_security"
DATABASES = {"default": {"ENGINE": "django.db.backends.sqlite3", "NAME": ":memory:"}}
