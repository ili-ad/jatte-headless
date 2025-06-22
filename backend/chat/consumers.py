from channels.generic.websocket import AsyncJsonWebsocketConsumer


class ChatConsumer(AsyncJsonWebsocketConsumer):
    async def connect(self):
        self.cid = self.scope["url_route"]["kwargs"].get("cid")
        await self.accept()
        await self.channel_layer.group_add(self.cid, self.channel_name)

    async def receive_json(self, content, **kwargs):
        if content.get("type") == "message.new":
            await self.channel_layer.group_send(
                self.cid,
                {"type": "chat.message", "payload": content},
            )

    async def chat_message(self, event):
        await self.send_json(event["payload"])

    async def disconnect(self, code):
        await self.channel_layer.group_discard(self.cid, self.channel_name)
        await super().disconnect(code)
