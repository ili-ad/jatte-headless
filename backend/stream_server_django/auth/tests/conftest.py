"""Pytest fixtures for auth identity tests."""

import pytest
from django.test.utils import (
    setup_databases,
    setup_test_environment,
    teardown_databases,
    teardown_test_environment,
)


@pytest.fixture(scope="session", autouse=True)
def django_test_environment():
    """Bootstrap a minimal Django test environment for pytest."""

    setup_test_environment()
    old_config = setup_databases(verbosity=0, interactive=False)
    try:
        yield
    finally:
        teardown_databases(old_config, verbosity=0)
        teardown_test_environment()
