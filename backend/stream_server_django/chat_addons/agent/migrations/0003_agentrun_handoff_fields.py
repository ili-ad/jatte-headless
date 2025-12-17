from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("agent", "0002_agentrun_status_choices"),
    ]

    operations = [
        migrations.AddField(
            model_name="agentrun",
            name="handoff",
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name="agentrun",
            name="handoff_detail",
            field=models.TextField(blank=True, default=""),
        ),
        migrations.AddField(
            model_name="agentrun",
            name="handoff_reason",
            field=models.CharField(blank=True, default="", max_length=64),
        ),
        migrations.AddField(
            model_name="agentrun",
            name="last_tool_args_preview",
            field=models.TextField(blank=True, default=""),
        ),
        migrations.AddField(
            model_name="agentrun",
            name="last_tool_call_id",
            field=models.CharField(blank=True, default="", max_length=128),
        ),
        migrations.AddField(
            model_name="agentrun",
            name="last_tool_name",
            field=models.CharField(blank=True, default="", max_length=128),
        ),
    ]
