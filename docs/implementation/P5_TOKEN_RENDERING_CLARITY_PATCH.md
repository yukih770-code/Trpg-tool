# P5 Token Rendering Clarity Patch

## Rule

One map token renders as one circular avatar body. The body uses an existing
`imageUrl` when it loads, otherwise stable initials. The token name is an
external label; HP, one condition, and combat linkage are small non-avatar
indicators outside the circular body.

## Compatibility

This is display-only. Existing manual tokens, actor-presence tokens, room-entry
tokens, `map.token_*` events, and scene snapshots keep their original data
shape. Tokens with missing names resolve safely to `?`; a failed image load
falls back to initials without changing the token event.

## Deferred

Account-avatar fallback, preset avatar galleries, image generation, uploads,
and object storage are outside this patch. Verified owned-token movement is
documented separately in `P5_TOKEN_OWNERSHIP_CONTROL_BINDING.md`; this visual
layer still does not make authorization decisions.

## Verification

- `npm run frontend:verify:token-rendering`
- `npm run frontend:verify:actor-presence`
- `npm run frontend:verify:map-replay`
- `npm run frontend:verify:scene-snapshot`
