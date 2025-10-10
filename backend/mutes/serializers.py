from rest_framework import serializers


class MuteStatusOut(serializers.Serializer):
    muted = serializers.BooleanField()


class MutedUserOut(serializers.Serializer):
    username = serializers.CharField()


class MutedChannelOut(serializers.Serializer):
    cid = serializers.CharField()


class MuteActionOut(serializers.Serializer):
    status = serializers.CharField()
