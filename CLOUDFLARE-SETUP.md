# Cloudflare Tunnel Setup

## Quick Tunnel (Temporary)
```bash
# Start server
node src/server.js

# Start quick tunnel (no account needed)
cloudflared tunnel --url http://localhost:4000
```
This gives you a temporary `*.trycloudflare.com` URL.

## Named Tunnel (Permanent - Future Setup)
Requires a Cloudflare account and a domain:

1. `cloudflared tunnel login`
2. `cloudflared tunnel create gst-website`
3. Create `config.yml`:
   ```yaml
   tunnel: <TUNNEL_ID>
   credentials-file: ~/.cloudflared/<TUNNEL_ID>.json
   ingress:
     - hostname: gst.yourdomain.com
       service: http://localhost:4000
     - service: http_status:404
   ```
4. `cloudflared tunnel route dns gst-website gst.yourdomain.com`
5. `cloudflared tunnel run gst-website`
