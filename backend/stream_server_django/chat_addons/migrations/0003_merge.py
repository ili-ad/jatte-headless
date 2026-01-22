# Generated manually to resolve divergent 0002 migrations safely.
# This is a merge-only migration (no DB operations).
#
# It fixes: Conflicting migrations detected; multiple leaf nodes in the migration graph:
#   (0002_agentrun_handoff_fields, 0002_sms_consent) in chat_addons.

from django.db import migrations


class Migration(migrations.Migration):
    dependencies = [
        ("chat_addons", "0002_agentrun_handoff_fields"),
        ("chat_addons", "0002_sms_consent"),
    ]

    operations = []
