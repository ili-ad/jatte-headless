from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):
    dependencies = [
        ("chat", "0001_initial"),
        ("chat_addons", "0003_merge"),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.AddField(
            model_name="agentrun",
            name="attempt_count",
            field=models.PositiveIntegerField(default=0),
        ),
        migrations.AddField(
            model_name="agentrun",
            name="finished_at",
            field=models.DateTimeField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name="agentrun",
            name="idempotency_key",
            field=models.CharField(blank=True, max_length=512, null=True, unique=True),
        ),
        migrations.AddField(
            model_name="agentrun",
            name="input_text",
            field=models.TextField(blank=True, default=""),
        ),
        migrations.AddField(
            model_name="agentrun",
            name="queued_at",
            field=models.DateTimeField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name="agentrun",
            name="request_meta",
            field=models.JSONField(blank=True, default=dict),
        ),
        migrations.AddField(
            model_name="agentrun",
            name="requested_by",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name="requested_agent_runs",
                to=settings.AUTH_USER_MODEL,
            ),
        ),
        migrations.AddField(
            model_name="agentrun",
            name="result_message",
            field=models.OneToOneField(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name="result_agent_run",
                to="chat.message",
            ),
        ),
        migrations.AddField(
            model_name="agentrun",
            name="room",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name="agent_runs",
                to="chat.room",
            ),
        ),
        migrations.AddField(
            model_name="agentrun",
            name="source_message",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name="source_agent_runs",
                to="chat.message",
            ),
        ),
        migrations.AddField(
            model_name="agentrun",
            name="started_at",
            field=models.DateTimeField(blank=True, null=True),
        ),
        migrations.AlterField(
            model_name="agentrun",
            name="status",
            field=models.CharField(
                choices=[
                    ("queued", "Queued"),
                    ("running", "Running"),
                    ("ok", "Ok"),
                    ("capped", "Capped"),
                    ("handoff", "Handoff"),
                    ("error", "Error"),
                    ("cancelled", "Cancelled"),
                ],
                max_length=16,
            ),
        ),
    ]
