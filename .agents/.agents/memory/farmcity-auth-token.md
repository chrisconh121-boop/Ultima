---
name: FarmCity auth token getter
description: Why setAuthTokenGetter must read localStorage directly and never close over React state
---

## Rule
In `auth-context.tsx`, call `setAuthTokenGetter(() => localStorage.getItem('farmcity_token'))` — the getter function must look up localStorage at call time, not capture a state variable.

**Why:** `setAuthTokenGetter` is called once on mount. A closure over `token` state would capture the initial value (null) and never update as the user logs in, causing every API request to be unauthenticated despite the user being logged in.

**How to apply:** Any time you need to update the token getter pattern, always use `localStorage.getItem(TOKEN_KEY)` inside the getter function body, not a reference to React state or a `useRef`.
