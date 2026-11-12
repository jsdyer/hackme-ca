# hackme.ca — After Hours Lab

An interactive incident lab set at a fictional Canadian hosting co-op. Work through five cases from a simulated Linux shell: DNS reverse-lookup traffic, an Apache/PHP-FPM socket mismatch, a cross-border routing detour, a checksum-based restore, and a retired SSH key.

## Run locally

Serve the repository root with any static HTTP server. For example:

```sh
python3 -m http.server 8000
```

Open http://localhost:8000/ and type `help`. The browser stores case completions locally and can export a Markdown case notebook. The terminal executes a small set of simulated commands over bundled evidence. It never executes system commands or contacts the case hosts.

## Deploy

Serve the repository root over HTTPS with Apache or another static host. The site also works on GitHub Pages with `main` and the repository root as the source. Set the Pages custom domain and DNS separately if using GitHub Pages for hackme.ca. JavaScript module files (`.mjs`) must be served with a JavaScript MIME type.

## Add a case

Add an entry to `cases.mjs` with a unique ID, brief, virtual files, hints, required evidence, answer, and debrief. Optionally add a simulated operation with a command, target, and result. Keep the case evidence fictional or use a deliberately sanitized public dataset.

Possible follow-up cases include a retro dial-up mystery, a packet-capture investigation, and an IndieWeb scavenger hunt through an offline mirror.
