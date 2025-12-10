# Lazy re-export of contact-room helpers to avoid importing auth models
# before Django apps are fully loaded.

__all__ = [
    "CONTACT_ROOM_KIND",
    "contact_identity_key",
    "get_or_create_contact_room",
]


def __getattr__(name):
    # PEP 562: module-level __getattr__ for lazy attributes
    if name in __all__:
        from .contact_rooms import (
            CONTACT_ROOM_KIND,
            contact_identity_key,
            get_or_create_contact_room,
        )

        return {
            "CONTACT_ROOM_KIND": CONTACT_ROOM_KIND,
            "contact_identity_key": contact_identity_key,
            "get_or_create_contact_room": get_or_create_contact_room,
        }[name]

    raise AttributeError(f"module {__name__!r} has no attribute {name!r}")
