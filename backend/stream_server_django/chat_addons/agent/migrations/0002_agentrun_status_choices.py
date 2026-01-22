from django.db import migrations

class Migration(migrations.Migration):
    dependencies = [
        ("agent", "0001_initial"),
    ]

    # Intentionally no-op: AgentRun lives in chat_addons (not agent),
    # and status choices are enforced at the Python layer.
    operations = []
