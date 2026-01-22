from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("chat_addons", "0001_initial"),
    ]

    operations = [
        migrations.AddField(
            model_name="agentrun",
            name="handoff",
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name="agentrun",
            name="handoff_reason",
            field=models.CharField(max_length=64, blank=True, default=""),
        ),
        migrations.AddField(
            model_name="agentrun",
            name="handoff_detail",
            field=models.TextField(blank=True, default=""),
        ),
        migrations.AddField(
            model_name="agentrun",
            name="last_tool_name",
            field=models.CharField(max_length=128, blank=True, default=""),
        ),
        migrations.AddField(
            model_name="agentrun",
            name="last_tool_call_id",
            field=models.CharField(max_length=128, blank=True, default=""),
        ),
        migrations.AddField(
            model_name="agentrun",
            name="last_tool_args_preview",
            field=models.TextField(blank=True, default=""),
        ),
    ]
