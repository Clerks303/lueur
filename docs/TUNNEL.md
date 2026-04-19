# Cloudflare Tunnel — off-WiFi testing

> Default is LAN-only. The Lueur API runs on your Mac at `http://<mac-lan-ip>:3000` and a physical iPhone/Android on the same WiFi can reach it directly. **Only start a tunnel when you need off-WiFi access** — testing from a café, sharing a preview build with someone external, or running a QA pass on cellular. Turn it off the moment you're done.

## Why tunnels, not `npx expo start --tunnel`

Expo's built-in tunnel is only for the Metro bundler. It does not proxy arbitrary HTTP traffic to your local API. We need our own tunnel to expose `http://localhost:3000`.

## Install cloudflared (one-time)

```bash
brew install cloudflared
```

Verify:

```bash
cloudflared --version
```

No account or login is required for the *quick tunnels* we'll use (ephemeral `*.trycloudflare.com` URLs, free, no auth). Named persistent tunnels with a custom domain are possible but unnecessary until we're in production.

## Start a tunnel

```bash
# In one terminal: make sure the API is running on :3000.
# In another terminal:
cloudflared tunnel --url http://localhost:3000
```

Cloudflared prints something like:

```
+--------------------------------------------------------------------------------------------+
|  Your quick Tunnel has been created! Visit it at (it may take some time to be reachable):  |
|  https://two-word-random.trycloudflare.com                                                 |
+--------------------------------------------------------------------------------------------+
```

Copy that HTTPS URL and use it where you normally use `http://localhost:3000`:

```bash
# Mobile build pointed at the tunnel
EXPO_PUBLIC_API_URL=https://two-word-random.trycloudflare.com eas build --profile preview --platform ios
```

## Stop the tunnel

`Ctrl+C` in the terminal running `cloudflared`. The URL dies immediately — no residual surface.

## When NOT to use a tunnel

- Your dev workflow on your own WiFi: stick with LAN. Faster, zero external dependency.
- Anything with real user data. The tunnel is plaintext from your Mac to Cloudflare (HTTPS at the edge, but the Mac endpoint has no auth). Fine for your own testing, not for production.
- Long-running exposure (days). The URL rotates every tunnel restart, but leaving it open is a passive attack surface.

## Hardening checklist (before sharing a tunnel URL with anyone else)

- [ ] API requires a valid session token on every endpoint except `/health`
- [ ] Anonymous auth endpoint is rate-limited (even loosely — e.g. 5/min per IP)
- [ ] Verbose error responses disabled (no stack traces leaking)
- [ ] Logs scrubbed of any secret before sharing

## Troubleshooting

- **"connection refused" from the tunnel URL**: the local API is not running. Start it first, then the tunnel.
- **Slow first response**: Cloudflare takes a few seconds to propagate the tunnel. Wait ~10 s and retry.
- **Mobile build cached the old URL**: rebuild with `--profile preview` and the new `EXPO_PUBLIC_API_URL`. EAS does not hot-reload env vars into a signed build.
