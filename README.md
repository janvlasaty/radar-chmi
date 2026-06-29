# radar-chmi
Simple page for showing radar data for czech republic

## CORS / loading images

CHMI's `opendata.chmi.cz` server serves the radar PNGs **without** CORS
headers, so the browser blocks a cross-origin `fetch()` from the deployed site
(e.g. GitHub Pages). To work around this without disabling CORS in the browser,
image requests are routed through a CORS proxy.

By default the app uses the free [images.weserv.nl](https://images.weserv.nl/)
image proxy. You can change or disable this with the `VITE_CORS_PROXY`
environment variable (the image URL is URL-encoded and appended to the value):

```sh
# Use a different proxy
VITE_CORS_PROXY="https://corsproxy.io/?url=" npm run build

# Disable proxying entirely (e.g. when running behind your own proxy)
VITE_CORS_PROXY="" npm run build
```
