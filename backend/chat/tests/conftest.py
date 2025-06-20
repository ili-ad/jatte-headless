"""Test configuration for the chat app."""

import pytest

# The previous version of the test harness disabled authentication globally in
# order to bootstrap early API tests.  JWT authentication is now fully
# implemented so this override is no longer required.  The fixture remains as a
# placeholder should additional global test configuration be needed in the
# future.

@pytest.fixture(autouse=True)
def configure_settings(settings):
    """Apply any test specific setting tweaks."""
    pass
