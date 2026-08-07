from stream_server_django.rooms.utils import get_room_or_404

from .models import Room


class RoomFromCIDMixin:
    """Resolve an existing Room identified by cid or plain uuid."""

    def get_room(self, cid: str) -> Room:
        """Normalise the identifier and resolve it without creating state."""

        return get_room_or_404(cid)
