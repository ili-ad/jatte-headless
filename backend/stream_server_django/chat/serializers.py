from datetime import datetime

from django.contrib.auth import get_user_model
from rest_framework import serializers

from stream_server_django.common.identity import get_chat_identity

from .models import (
    Draft,
    Flag,
    Message,
    Notification,
    Pin,
    Poll,
    PollOption,
    PollVote,
    Reaction,
    Reminder,
    Room,
    RoomMemberMute,
    UserMute,
    WebPushSubscription,
)


class MessageAttachmentSerializer(serializers.Serializer):
    """Serializer for message attachment payloads."""

    id = serializers.CharField()
    name = serializers.CharField()
    url = serializers.URLField()
    size = serializers.IntegerField(required=False)
    mime_type = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    scan_status = serializers.CharField(read_only=True)
    scan_label = serializers.CharField(read_only=True, allow_blank=True, allow_null=True)

    def to_representation(self, instance):
        data = super().to_representation(instance)
        raw = dict(instance)
        status = raw.get("scan_status") or Message.ATTACHMENT_SCAN_PENDING
        if status not in {
            Message.ATTACHMENT_SCAN_PENDING,
            Message.ATTACHMENT_SCAN_CLEAN,
            Message.ATTACHMENT_SCAN_FLAGGED,
            Message.ATTACHMENT_SCAN_ERROR,
        }:
            status = Message.ATTACHMENT_SCAN_PENDING
        data["scan_status"] = status
        data["scan_label"] = raw.get("scan_label")
        if not data.get("mime_type") and raw.get("content_type"):
            data["mime_type"] = raw.get("content_type")
        return data


class MessagePreviewSerializer(serializers.Serializer):
    """Serializer for message link previews."""

    url = serializers.URLField()
    title = serializers.CharField(allow_blank=True)


class MessageSerializer(serializers.ModelSerializer):
    """Expose ``body`` via ``text`` while supporting thread metadata."""

    text = serializers.CharField(source="body", allow_blank=True)
    pinned = serializers.SerializerMethodField()
    pinned_by = serializers.SerializerMethodField()
    custom_data = serializers.JSONField(required=False, default=dict)
    show_in_channel = serializers.BooleanField(required=False, default=False)
    attachments = MessageAttachmentSerializer(many=True, required=False, default=list)
    preview = MessagePreviewSerializer(required=False, allow_null=True)
    reply_to = serializers.PrimaryKeyRelatedField(
        queryset=Message.objects.all(),
        required=False,
        allow_null=True,
        write_only=True,
    )
    parent_id = serializers.IntegerField(source="reply_to_id", read_only=True)

    class Meta:
        model = Message
        fields = [
            "id",
            "text",
            "body",
            "sent_by",
            "created_at",
            "updated_at",
            "deleted_at",
            "hidden",
            "hidden_at",
            "reply_to",
            "custom_data",
            "show_in_channel",
            "attachments",
            "preview",
            "parent_id",
            "pinned",
            "pinned_by",
        ]
        read_only_fields = [
            "id",
            "body",
            "sent_by",
            "created_at",
            "updated_at",
            "deleted_at",
            "hidden",
            "hidden_at",
            "parent_id",
            "pinned",
            "pinned_by",
        ]

    def create(self, validated_data: dict) -> Message:
        validated_data.setdefault("custom_data", {})
        attachments = validated_data.setdefault("attachments", [])
        if attachments:
            validated_data["attachments"] = [
                Message.ensure_attachment_scan_defaults(item) for item in attachments
            ]
        if "preview" not in validated_data:
            validated_data["preview"] = None
        return super().create(validated_data)

    def get_pinned(self, obj: Message) -> bool:
        return obj.pins.exists()

    def get_pinned_by(self, obj: Message) -> int | None:
        pin = obj.pins.order_by("-created_at").first()
        return getattr(pin, "user_id", None)


class ThreadPreviewSerializer(serializers.Serializer):
    """Serialize a thread preview with root and last reply metadata."""

    thread_id = serializers.SerializerMethodField()
    cid = serializers.SerializerMethodField()
    root_message = serializers.SerializerMethodField()
    reply_count = serializers.IntegerField()
    last_reply_at = serializers.DateTimeField(allow_null=True)
    last_reply_preview = serializers.SerializerMethodField()

    def get_thread_id(self, obj: Message) -> str:
        return f"root-{obj.id}"

    def get_cid(self, obj: Message) -> str:
        return self.context["cid"]

    def get_root_message(self, obj: Message) -> dict:
        serializer = MessageSerializer(obj, context=self.context)
        return serializer.data

    def get_last_reply_preview(self, obj: Message) -> dict | None:
        replies_map: dict[int, Message] = self.context.get("replies_map", {})
        reply = replies_map.get(getattr(obj, "last_reply_id", None))
        if not reply:
            return None
        serializer = MessageSerializer(reply, context=self.context)
        return serializer.data


class MessageUpdateSerializer(serializers.ModelSerializer):
    """Serializer used for message updates via the room-scoped endpoint."""

    text = serializers.CharField(source="body", allow_blank=True, write_only=True)
    pinned = serializers.BooleanField(required=False, write_only=True)
    pinned_by = serializers.IntegerField(required=False, write_only=True)
    attachments = MessageAttachmentSerializer(many=True, required=False)
    preview = MessagePreviewSerializer(required=False, allow_null=True)

    class Meta:
        model = Message
        fields = [
            "id",
            "text",
            "body",
            "sent_by",
            "created_at",
            "pinned",
            "pinned_by",
            "attachments",
            "preview",
        ]
        read_only_fields = ["id", "body", "sent_by", "created_at"]

    def update(self, instance: Message, validated_data: dict) -> Message:
        pinned = validated_data.pop("pinned", serializers.empty)
        pinned_by = validated_data.pop("pinned_by", None)

        attachments = validated_data.get("attachments")
        if attachments is not None:
            validated_data["attachments"] = [
                Message.ensure_attachment_scan_defaults(item) for item in attachments
            ]

        instance = super().update(instance, validated_data)

        if pinned is not serializers.empty:
            request = self.context.get("request") if self.context else None
            pin_user = getattr(request, "user", None)

            if pinned_by is not None:
                User = get_user_model()
                try:
                    pin_user = User.objects.get(pk=pinned_by)
                except User.DoesNotExist:
                    raise serializers.ValidationError({"pinned_by": "Invalid user."})

            if pinned:
                if pin_user is None or not getattr(pin_user, "is_authenticated", False):
                    raise serializers.ValidationError({"pinned": "Authentication required."})
                Pin.objects.filter(message=instance).delete()
                Pin.objects.create(message=instance, user=pin_user)
            else:
                Pin.objects.filter(message=instance).delete()

        return instance



class DraftSerializer(serializers.ModelSerializer):
    body = serializers.SerializerMethodField()

    class Meta:
        model = Draft
        fields = ["id", "text", "body", "updated_at"]
        read_only_fields = ["id", "text", "body", "updated_at"]

    def get_body(self, obj: Draft) -> str:
        return obj.text


class RoomSerializer(serializers.ModelSerializer):
    messages = MessageSerializer(many=True, read_only=True)
    cid = serializers.SerializerMethodField()
    name = serializers.SerializerMethodField()
    type = serializers.SerializerMethodField()
    visible = serializers.SerializerMethodField()

    def get_cid(self, obj: Room) -> str:
        return f"messaging:{obj.uuid}"

    def get_name(self, obj: Room) -> str | None:
        return obj.data.get("name") if obj.data else None

    def get_type(self, obj: Room) -> str:
        return "messaging"

    def get_visible(self, obj: Room) -> bool:
        data = obj.data or {}
        return not data.get("hidden", False)

    class Meta:
        model = Room
        fields = [
            "id",
            "uuid",
            "cid",
            "name",
            "type",
            "client",
            "agent",
            "messages",
            "url",
            "data",
            "visible",
            "status",
            "created_at",
        ]
        read_only_fields = ["id", "created_at"]


class RoomMemberUserOut(serializers.Serializer):
    id = serializers.CharField()


class RoomMemberOut(serializers.Serializer):
    user_id = serializers.IntegerField()
    role = serializers.CharField()
    banned = serializers.BooleanField()
    user = RoomMemberUserOut(required=False)


class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = ["id", "text", "created_at"]


class ReactionSerializer(serializers.ModelSerializer):
    user_id = serializers.ReadOnlyField(source="user.username")

    class Meta:
        model = Reaction
        fields = ["id", "type", "user_id", "created_at"]
        read_only_fields = ["id", "user_id", "created_at"]


class FlagSerializer(serializers.ModelSerializer):
    user_id = serializers.ReadOnlyField(source="user.username")

    class Meta:
        model = Flag
        fields = ["id", "user_id", "created_at"]
        read_only_fields = ["id", "user_id", "created_at"]


class PinSerializer(serializers.ModelSerializer):
    user_id = serializers.ReadOnlyField(source="user.username")

    class Meta:
        model = Pin
        fields = ["id", "user_id", "created_at"]
        read_only_fields = ["id", "user_id", "created_at"]


class PollOptionSerializer(serializers.ModelSerializer):
    user_id = serializers.ReadOnlyField(source="user.username")

    class Meta:
        model = PollOption
        fields = ["id", "poll_id", "text", "user_id", "created_at"]
        read_only_fields = ["id", "poll_id", "user_id", "created_at"]


class PollSerializer(serializers.ModelSerializer):
    user_id = serializers.ReadOnlyField(source="user.username")

    class Meta:
        model = Poll
        fields = ["id", "question", "user_id", "created_at"]
        read_only_fields = ["id", "user_id", "created_at"]


class PollVoteSerializer(serializers.ModelSerializer):
    user_id = serializers.ReadOnlyField(source="user.username")
    user = serializers.SerializerMethodField()

    class Meta:
        model = PollVote
        fields = [
            "id",
            "poll_id",
            "option_id",
            "user_id",
            "user",
            "created_at",
            "updated_at",
        ]
        read_only_fields = fields

    def get_user(self, obj):
        user = getattr(obj, "user", None)
        if not user:
            return None

        profile = getattr(user, "profile", None)
        display_name = getattr(profile, "display_name", None) or getattr(
            user, "username", None
        )
        image = getattr(profile, "image_url", None)
        uid = getattr(user, "supabase_uid", None) or str(getattr(user, "id", ""))

        return {
            "id": str(uid),
            "name": display_name or "",
            "image": image,
        }


class ReminderSerializer(serializers.ModelSerializer):
    message_id = serializers.IntegerField(read_only=True, allow_null=True)
    note = serializers.CharField(allow_blank=True, allow_null=True, required=False)
    created_by = serializers.IntegerField(source="created_by_id", read_only=True)

    class Meta:
        model = Reminder
        fields = [
            "id",
            "remind_at",
            "message_id",
            "note",
            "created_by",
            "created_at",
        ]
        read_only_fields = ["id", "message_id", "created_by", "created_at"]


class ReminderCreateSerializer(serializers.Serializer):
    remind_at = serializers.DateTimeField()
    message_id = serializers.IntegerField(required=False, allow_null=True)
    note = serializers.CharField(
        required=False, allow_blank=True, allow_null=True, max_length=255
    )

    def validate_message_id(self, value):
        if value is None:
            return value
        room = self.context.get("room")
        try:
            message = Message.objects.get(id=value)
        except Message.DoesNotExist:
            raise serializers.ValidationError("Invalid message_id")
        if room and not room.messages.filter(id=message.id).exists():
            raise serializers.ValidationError("Message does not belong to this room")
        self.context["message_obj"] = message
        return value

    def create(self, validated_data):
        room = self.context["room"]
        user = self.context["user"]
        message = self.context.get("message_obj")
        note = validated_data.get("note")
        reminder = Reminder.objects.create(
            room=room,
            message=message,
            created_by=user,
            note=note,
            remind_at=validated_data["remind_at"],
        )
        return reminder


class WebPushKeysSerializer(serializers.Serializer):
    p256dh = serializers.CharField()
    auth = serializers.CharField()


class WebPushSubscriptionInputSerializer(serializers.Serializer):
    endpoint = serializers.CharField()
    expirationTime = serializers.FloatField(required=False, allow_null=True)
    keys = WebPushKeysSerializer()


class RegisterSubscriptionsSerializer(serializers.Serializer):
    subscriptions = WebPushSubscriptionInputSerializer(many=True)
    client_id = serializers.CharField(required=False)
    platform = serializers.ChoiceField(
        choices=WebPushSubscription.PLATFORM_CHOICES,
        required=False,
        allow_null=True,
    )

    def save(self, *, user):
        if not hasattr(self, "validated_data"):
            raise AssertionError("You must call `.is_valid()` before calling `.save()`")

        validated = self.validated_data
        client_id_provided = "client_id" in validated
        platform_provided = "platform" in validated
        client_id = validated.get("client_id") if client_id_provided else None
        platform = validated.get("platform") if platform_provided else None

        saved_subscriptions: list[WebPushSubscription] = []

        for subscription in validated["subscriptions"]:
            keys = subscription["keys"]
            defaults = {
                "expiration_time": subscription.get("expirationTime"),
                "p256dh": keys["p256dh"],
                "stream_server_django.auth": keys["stream_server_django.auth"],
            }
            if client_id_provided:
                defaults["client_id"] = client_id
            if platform_provided:
                defaults["platform"] = platform

            stored_subscription, _ = WebPushSubscription.objects.update_or_create(
                user=user,
                endpoint=subscription["endpoint"],
                defaults=defaults,
            )
            saved_subscriptions.append(stored_subscription)

        response_payload: dict[str, object] = {"subscriptions": saved_subscriptions}
        if client_id_provided:
            response_payload["client_id"] = client_id
        if platform_provided:
            response_payload["platform"] = platform

        response_serializer = RegisterSubscriptionsResponseSerializer(response_payload)
        return response_serializer.data


class StoredWebPushSubscriptionSerializer(serializers.ModelSerializer):
    expirationTime = serializers.FloatField(
        source="expiration_time", allow_null=True, required=False
    )
    keys = serializers.SerializerMethodField()

    class Meta:
        model = WebPushSubscription
        fields = ("endpoint", "expirationTime", "keys")

    def get_keys(self, obj: WebPushSubscription) -> dict[str, str]:
        return {"p256dh": obj.p256dh, "stream_server_django.auth": obj.auth}


class RegisterSubscriptionsResponseSerializer(serializers.Serializer):
    subscriptions = StoredWebPushSubscriptionSerializer(many=True, read_only=True)
    client_id = serializers.CharField(required=False, allow_null=True)
    platform = serializers.ChoiceField(
        choices=WebPushSubscription.PLATFORM_CHOICES,
        required=False,
        allow_null=True,
    )


class MuteStatusSerializer(serializers.Serializer):
    muted = serializers.BooleanField()
    muted_until = serializers.DateTimeField(allow_null=True, required=False)

    def to_representation(self, instance):
        muted = bool(instance.get("muted")) if isinstance(instance, dict) else False
        muted_until = None
        if isinstance(instance, dict):
            muted_until = instance.get("muted_until")
            if isinstance(muted_until, datetime):
                muted_until = muted_until.isoformat()
        return {"muted": muted, "muted_until": muted_until}


class RoomMemberMuteCreateSerializer(serializers.Serializer):
    user_id = serializers.PrimaryKeyRelatedField(
        queryset=get_user_model().objects.all(), source="user"
    )
    muted_until = serializers.DateTimeField(allow_null=True, required=False)


class RoomMemberMuteSerializer(serializers.ModelSerializer):
    user_id = serializers.IntegerField(read_only=True)
    muted_by = serializers.IntegerField(source="muted_by_id", read_only=True)
    muted_until = serializers.DateTimeField(allow_null=True, required=False)

    class Meta:
        model = RoomMemberMute
        fields = ["id", "user_id", "muted_until", "muted_by", "created_at"]
        read_only_fields = ["id", "user_id", "muted_by", "created_at"]


class UserMuteUnmuteSerializer(serializers.Serializer):
    """Validate and process a global user unmute request."""

    target_user_id = serializers.PrimaryKeyRelatedField(
        queryset=get_user_model().objects.all(),
        source="target",
    )

    def _acting_user(self):
        identity = self.context.get("identity")
        if identity is not None:
            return identity.as_user()
        request = self.context.get("request")
        if request is not None:
            return get_chat_identity(request).as_user()
        return None

    def validate_target(self, value):
        user = self._acting_user()
        if user and user == value:
            raise serializers.ValidationError("You cannot unmute yourself.")
        return value

    def save(self, **kwargs):  # type: ignore[override]
        user = self._acting_user()
        target = self.validated_data["target"]
        if user is not None:
            UserMute.objects.filter(user=user, target=target).delete()
        return {"target_user_id": target.pk, "muted": False}
