# from channels.middleware import BaseMiddleware

# class SupabaseJWTAuthMiddleware(BaseMiddleware):
#     """
#     Placeholder that does *nothing* except pass the scope through.
#     Replace with real Supabase-JWT parsing when ready.
#     """

#     async def __call__(self, scope, receive, send):
#         # You could attach a user here in the future:
#         # scope["user"] = AnonymousUser()
#         return await self.app(scope, receive, send)
# (a) drop the placeholder middleware entirely for now
# or (b) keep it but make it a proper pass-through

from channels.middleware import BaseMiddleware
class SupabaseJWTAuthMiddleware(BaseMiddleware):
    async def __call__(self, scope, receive, send):
        return await super().__call__(scope, receive, send)
