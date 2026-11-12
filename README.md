# hackme.ca — After Hours Lab

An interactive incident lab set at a fictional Canadian hosting co-op. Work through nine cases from a simulated Linux shell: DNS reverse-lookup traffic, an Apache/PHP-FPM socket mismatch, a cross-border routing detour, a checksum-based restore, a retired SSH key, a 28.8k dial-up BBS, a missing TCP reply, a broken webring link, and missing BBS echomail.

## Run locally

Serve the repository root with any static HTTP server. For example:

```sh
python3 -m http.server 8000
```

Open http://localhost:8000/ and type `help`. The browser stores case completions locally and can export a Markdown case notebook. The terminal executes a small set of simulated commands over bundled evidence. It never executes system commands or contacts the case hosts.

## Rainline BBS

Open `rainline.html` from the home page and dial in as a guest. The board has fictional posts from November 1999, downloadable textfiles, and Last Call, a turn-based door game. Each line has a different noise schedule. Use the current and next-slot forecast to pick a transfer strategy. Personal bests are kept per line in browser storage, when available.

`rainline.html`, `rainline.css`, and `rainline.mjs` contain the board. Textfiles live in `rainline-files/`. The game rules and profiles are in `door.mjs`. Use `?case=<id>#lab` on the home page to link to an individual incident.

## Deploy

Serve the repository root over HTTPS with Apache or another static host. The site also works on GitHub Pages with `main` and the repository root as the source. Set the Pages custom domain and DNS separately if using GitHub Pages for hackme.ca. JavaScript module files (`.mjs`) must be served with a JavaScript MIME type.

## Add a case

Add an entry to `cases.mjs` with a unique ID, brief, virtual files, hints, required evidence, answer, and debrief. Optionally add a simulated operation with a command, target, and result. Keep the case evidence fictional or use a deliberately sanitized public dataset.

The four period cases are registered in `retro.mjs`. The BBS responds to simulated modem and dial commands, the packet trace is bundled as text, and the webring is a small local collection of pages explored with `browse`.
