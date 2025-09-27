from datetime import datetime

from django.contrib.auth import get_user_model
from rest_framework import serializers

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


class MessageSerializer(serializers.ModelSerializer):
    """Expose `body` via the `text` field while keeping the column read-only."""

    text = serializers.CharField(source="body", allow_blank=True)

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
        ]
        read_only_fields = [
            "id",
            "body",
            "sent_by",
            "created_at",
            "updated_at",
            "deleted_at",
        ]


class MessageUpdateSerializer(serializers.ModelSerializer):
    """Serializer used for message updates via the room-scoped endpoint."""

    text = serializers.CharField(source="body", allow_blank=True, write_only=True)

    class Meta:
        model = Message
        fields = ["id", "text", "body", "sent_by", "created_at"]
        read_only_fields = ["id", "body", "sent_by", "created_at"]



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
                "auth": keys["auth"],
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
        return {"p256dh": obj.p256dh, "auth": obj.auth}


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

    def validate_target(self, value):
        request = self.context.get("request")
        if request and request.user == value:
            raise serializers.ValidationError("You cannot unmute yourself.")
        return value

    def save(self, **kwargs):  # type: ignore[override]
        request = self.context["request"]
        target = self.validated_data["target"]
        UserMute.objects.filter(user=request.user, target=target).delete()
        return {"target_user_id": target.pk, "muted": False}
