### TITLE
Unstub all components in one pass

### BODY
Write a Node script (`scripts/unstub-stream-ui.ts`) that:

1. Recursively scans `libs/stream-chat-shim/src/**/*.{ts,tsx}`.
2. For every file that contains `TODO backend-wire-up`
   * Load the same relative file from `libs/stream-ui/src/**`.
   * Copy **only** the import lines that were commented-out / removed.
     (Hint: they always import from `stream-chat` or `stream-chat-react`.)
   * Delete the local stub declarations (e.g. `class SearchController {}`).
3. Overwrite the shim file in place.
4. When the walk is finished, run  
   `pnpm build && pnpm -F frontend tsc --noEmit`.
   Exit with non-zero code if the build fails.

Add the script to `package.json`:

```json
"scripts": {
  "unstub": "tsx scripts/unstub-stream-ui.ts"
}
