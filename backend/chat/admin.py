from django.contrib import admin

from .models import (
    Channel,
    Message,
    Room,
    Draft,
    Notification,
    Reaction,
    PollOption,
    Poll,
    Flag,
    Pin,
    UserMute,
    RoomMute,
    Reminder,
)


admin.site.register(Channel)
admin.site.register(Message)
admin.site.register(Room)
admin.site.register(Draft)
admin.site.register(Notification)
admin.site.register(Reaction)
admin.site.register(PollOption)
admin.site.register(Poll)
admin.site.register(Flag)
admin.site.register(Pin)
admin.site.register(UserMute)
admin.site.register(RoomMute)
admin.site.register(Reminder)
