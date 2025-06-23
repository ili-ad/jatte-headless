from .models import Room

class RoomFromCIDMixin:
    """Create or retrieve a Room identified by cid/uuid."""

    def get_room(self, cid: str) -> Room:
        room, _ = Room.objects.get_or_create(uuid=cid, defaults={"client": "stream"})
        return room
