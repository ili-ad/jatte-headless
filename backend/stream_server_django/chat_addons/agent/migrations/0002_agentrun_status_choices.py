from django.db import migrations

class Migration(migrations.Migration):
    dependencies = [
        ("agent", "0001_initial"),
    ]

    # NOTE: This migration is intentionally a no-op.
    # The AgentRun.status field’s choices are enforced at the Python level only;
    # there is no DB constraint on the choices, so we don’t need a schema change.
    operations = []
