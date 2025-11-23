# Local development servers

This project runs a Django backend and Next.js frontend locally. The commands below assume you are in the repository root.

## Prerequisites

- Node.js with [pnpm](https://pnpm.io/) installed
- Python 3.10 (other versions are untested)
- Redis running locally (default settings are fine)

## Backend setup

From the `backend/` directory:

1. Create and activate a virtual environment.
2. Install dependencies:

   ```bash
   pip install -r requirements.txt
   ```

3. Apply database migrations:

   ```bash
   python manage.py migrate
   ```

4. Start the development server on port 8000:

   ```bash
   python manage.py runserver 8000
   ```

## Frontend setup

1. Configure the API and WebSocket endpoints in `frontend/.env.local` (create the file if it does not exist):

   ```bash
   NEXT_PUBLIC_API_URL=http://localhost:8000
   NEXT_PUBLIC_WS_URL=ws://localhost:8000
   ```

2. Start the dev server on port 3000:

   ```bash
   pnpm --filter frontend dev
   ```

## Smoke test

1. Visit `http://localhost:3000/chat` in your browser.
2. Open the browser's network tab and confirm the page connects to the WebSocket endpoint at `/ws/<room_key>/`.
