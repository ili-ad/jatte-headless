from django.db import migrations


ROOM_SLUG = "agent-lab"


def seed_agent_lab_room(apps, schema_editor):
    Room = apps.get_model("chat", "Room")
    Channel = apps.get_model("chat", "Channel")
    RoomAgentFlag = apps.get_model("chat_addons", "RoomAgentFlag")
    AgentRoomPolicy = apps.get_model("chat_addons", "AgentRoomPolicy")

    room, _ = Room.objects.get_or_create(
        uuid=ROOM_SLUG,
        defaults={"client": "stream", "data": {"name": "Agent lab"}},
    )

    if not room.data or room.data.get("name") != "Agent lab":
        data = dict(room.data or {})
        data.setdefault("name", "Agent lab")
        room.data = data
        room.save(update_fields=["data"])

    Channel.objects.get_or_create(uuid=room.uuid, defaults={"client": room.client})
    RoomAgentFlag.objects.update_or_create(room=room, defaults={"agent_enabled": True})
    AgentRoomPolicy.objects.update_or_create(
        cid=f"messaging:{room.uuid}", defaults={"agent_enabled": True}
    )


def remove_agent_lab_room(apps, schema_editor):
    Room = apps.get_model("chat", "Room")
    Channel = apps.get_model("chat", "Channel")
    RoomAgentFlag = apps.get_model("chat_addons", "RoomAgentFlag")
    AgentRoomPolicy = apps.get_model("chat_addons", "AgentRoomPolicy")

    room = Room.objects.filter(uuid=ROOM_SLUG).first()
    if not room:
        return

    RoomAgentFlag.objects.filter(room=room).delete()
    AgentRoomPolicy.objects.filter(cid=f"messaging:{room.uuid}").delete()
    Channel.objects.filter(uuid=room.uuid).delete()
    room.delete()


class Migration(migrations.Migration):
    dependencies = [
        (
            "chat_addons",
            "0010_rename_chat_addons_last_154576_idx_chat_addons_last_se_56d70a_idx_and_more",
        ),
        ("chat", "0013_message_hidden_message_hidden_at_message_hidden_by"),
    ]


    operations = [
        migrations.RunPython(seed_agent_lab_room, remove_agent_lab_room),
    ]
