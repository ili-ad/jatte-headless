# Jatte Headless Backend

This repository provides a minimal chat backend built on Django and Django Channels.
It exposes REST APIs with `djangorestframework` and real time messaging via WebSockets.
Authentication is handled by Supabase JWT tokens.

## API Endpoints

- `GET /api/rooms/` – list chat rooms
- `POST /api/rooms/` – create a room
- `GET /api/rooms/<uuid>/` – retrieve or update a room
- `GET /api/rooms/<uuid>/messages/` – list messages in a room
- `POST /api/rooms/<uuid>/messages/` – add a new message

All endpoints expect an `Authorization: Bearer <JWT>` header issued by Supabase.

### WebSocket

Connect to `ws://<host>/ws/<room_uuid>/?token=<JWT>` to send and receive
messages in real time. Messages follow the existing structure of the original
project.

This project is designed to be included in another Django project as an
installed app.
