from .models import Room

class RoomFromCIDMixin:
    """Create or retrieve a Room identified by cid or plain uuid."""

    def get_room(self, cid: str) -> Room:
        """Normalise ``messaging:foo`` and ``foo`` to the same Room row."""
        if ":" in cid:
            _, room_uuid = cid.split(":", 1)
        else:
            room_uuid = cid
        room, _ = Room.objects.get_or_create(
            uuid=room_uuid,
            defaults={"client": "stream"},
        )
        return room
