from django.db import migrations, models
import django.db.models.deletion


def bind_existing_polls(apps, schema_editor):
    Poll = apps.get_model("polls", "Poll")
    Room = apps.get_model("chat", "Room")

    rooms = {room.uuid: room for room in Room.objects.all().iterator()}
    for poll in Poll.objects.filter(room__isnull=True).iterator():
        identifier = (poll.cid or "").strip()
        if ":" in identifier:
            _room_type, identifier = identifier.split(":", 1)
        room = rooms.get(identifier)
        if room is None:
            continue
        poll.room_id = room.pk
        poll.cid = f"messaging:{room.uuid}"
        poll.save(update_fields=["room", "cid"])


class Migration(migrations.Migration):
    dependencies = [
        ("chat", "0001_initial"),
        ("polls", "0001_initial"),
    ]

    operations = [
        migrations.AddField(
            model_name="poll",
            name="room",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.PROTECT,
                related_name="polls",
                to="chat.room",
            ),
        ),
        migrations.RunPython(bind_existing_polls, migrations.RunPython.noop),
    ]
