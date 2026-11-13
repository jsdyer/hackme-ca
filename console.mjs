import { dnsTypes, domainLinks, normalizeTarget, recordTargets, summarizeDns } from "./records-core.mjs";
import { playTerminalGame, startTerminalGame, terminalGames } from "./terminal-games.mjs";

const byId = id => document.getElementById(id);
const output = byId("console-output");
const input = byId("console-input");
const hostField = byId("record-target");
const typeField = byId("record-type");
const dnsButton = byId("dns-button");
const exportButton = byId("export-dns");
const notice = byId("isp-notice");
const ispLink = { label: "Visit Interweb International ↗", url: "https://interweb.international/" };
const scope = "Public-records scope: " + recordTargets.join(", ");
let game = null;
let lookingUp = false;
let lastDns = null;
let historyIndex = 0;
const history = [];

function append(node) {
  output.append(node);
  if (output.childElementCount > 160) output.firstElementChild.remove();
  output.scrollTop = output.scrollHeight;
}

function print(text, kind = "") {
  const line = document.createElement("div");
  line.className = kind;
  line.textContent = text;
  append(line);
}

function printLinks(links) {
  const list = document.createElement("ul");
  for (const { label, url } of links) {
    const item = document.createElement("li");
    const link = document.createElement("a");
    link.href = url;
    link.textContent = label;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    item.append(link);
    list.append(item);
  }
  append(list);
}

function noticeOfScope() {
  notice.hidden = false;
  byId("notice-copy").textContent = "Your request has been forwarded to the Department of Excessive Curiosity. Continued irregularity may result in administrative cancellation of your imaginary internet.";
  byId("appeal").hidden = false;
  print("IWI-451 / SIMULATED NOTICE\nQuery refused by the console. No lookup was sent.\n" + scope + "\nType appeal to dispute the fictional warning.", "warning");
  printLinks([ispLink]);
}

function appeal() {
  if (notice.hidden || byId("appeal").hidden) {
    print("No fictional notice is awaiting appeal.");
    return;
  }
  byId("notice-copy").textContent = "Appeal accepted by the Department of Provisional Reinstatement. Your imaginary internet has been renewed pending further curiosity.";
  byId("appeal").hidden = true;
  print("IWI-200 / SIMULATED APPEAL ACCEPTED");
}

async function resolveDns(target, type) {
  const endpoint = new URL("https://cloudflare-dns.com/dns-query");
  endpoint.search = new URLSearchParams({ name: target, type });
  try {
    const response = await fetch(endpoint, {
      headers: { Accept: "application/dns-json" },
      credentials: "omit",
      referrerPolicy: "no-referrer",
      redirect: "error",
      signal: AbortSignal.timeout(8000),
    });
    if (!response.ok) return { text: target + " / " + type + "\nLive DNS unavailable (HTTP " + response.status + ")." };
    return { text: summarizeDns(await response.json(), target, type), received: true };
  } catch {
    return { text: target + " / " + type + "\nLive DNS unavailable. Retry or use Find records." };
  }
}

async function queryDns(targets, type) {
  if (lookingUp) {
    print("One live DNS query is already running.");
    return;
  }
  lookingUp = true;
  dnsButton.disabled = true;
  print("Querying Cloudflare public DNS for " + targets.join(" and ") + " / " + type + "…");
  try {
    const results = await Promise.all(targets.map(target => resolveDns(target, type)));
    const heading = "LIVE DNS / CLOUDFLARE / " + new Date().toISOString();
    const report = heading + "\n" + results.map(result => result.text).join("\n\n");
    print(report);
    if (results.some(result => result.received)) {
      lastDns = { name: targets.join("-vs-") + "-" + type.toLowerCase() + "-dns.txt", report };
      exportButton.disabled = false;
    }
  } finally {
    lookingUp = false;
    dnsButton.disabled = false;
  }
}

function updateMode() {
  const info = terminalGames.find(item => item.id === game?.id);
  byId("mode").textContent = info ? info.title : "READY";
}

function listGames() {
  print(terminalGames.map(({ id, title, description }) => "play " + id + "  —  " + title + "\n  " + description).join("\n"));
}

function run(value) {
  const line = value.trim();
  if (!line) return;
  history.push(line);
  if (history.length > 60) history.shift();
  historyIndex = history.length;
  print("guest@field:$ " + line, "entered");
  const [verb, ...args] = line.split(/\s+/);
  const command = verb.toLowerCase();
  switch (command) {
    case "clear":
      output.replaceChildren();
      return;
    case "games":
      listGames();
      return;
    case "play": {
      const selected = args.length === 1 ? startTerminalGame(args[0].toLowerCase()) : null;
      if (!selected) {
        listGames();
        return;
      }
      game = selected.state;
      updateMode();
      print(selected.text);
      return;
    }
    case "quit":
      if (!game) {
        print("No game running. Type games to see the available doors.");
        return;
      }
      game = null;
      updateMode();
      print("Returned to the field console.");
      return;
    case "scope":
      print(scope);
      return;
    case "dns":
    case "records": {
      const target = normalizeTarget(args[0]);
      if (!args.length) {
        print(command === "dns" ? "Usage: dns <domain> [" + dnsTypes.join("|") + "]" : "Usage: records <domain>");
        return;
      }
      if (!target) {
        noticeOfScope();
        return;
      }
      if (command === "records") {
        if (args.length !== 1) {
          print("Usage: records <domain>");
          return;
        }
        print("PUBLIC SOURCES / " + target);
        printLinks([...domainLinks(target), { label: "Visit " + target + " ↗", url: "https://" + target + "/" }]);
        return;
      }
      const type = args[1]?.toUpperCase() || "A";
      if (args.length > 2 || !dnsTypes.includes(type)) {
        print("Supported DNS types: " + dnsTypes.join(", "));
        return;
      }
      void queryDns([target], type);
      return;
    }
    case "compare": {
      if (args.length < 2 || args.length > 3) {
        print("Usage: compare <domain> <domain> [type]");
        return;
      }
      const targets = args.slice(0, 2).map(normalizeTarget);
      if (targets.includes(null)) {
        noticeOfScope();
        return;
      }
      const type = args[2]?.toUpperCase() || "A";
      if (!dnsTypes.includes(type)) {
        print("Supported DNS types: " + dnsTypes.join(", "));
        return;
      }
      if (targets[0] === targets[1]) {
        print("Choose two different domains from scope.");
        return;
      }
      void queryDns(targets, type);
      return;
    }
    case "scan":
      noticeOfScope();
      return;
    case "appeal":
      appeal();
      return;
    default:
      if (game) {
        const result = playTerminalGame(game, line);
        game = result.state;
        print(result.text);
        if (game.status !== "playing") print("Type games to pick another door, or quit to leave this one.");
        return;
      }
      if (command === "help") {
        print([
          "games                 List Rainline terminal games",
          "play <game>           Start or restart a door game",
          "quit                  Leave a game",
          "scope                 List permitted domains",
          "dns <domain> [type]   Run a live public DNS lookup",
          "compare <a> <b> [type] Compare a DNS type for two project domains",
          "records <domain>      Find archive, certificate and registration links",
          "clear                 Clear the screen",
          "Use ↑ and ↓ for command history. Inside a game, type help for its moves.",
        ].join("\n"));
        return;
      }
      print("Unknown command. Type help.");
  }
}

function addOption(select, value) {
  const option = document.createElement("option");
  option.value = value;
  option.textContent = value;
  select.append(option);
}

for (const target of recordTargets) addOption(hostField, target);
hostField.value = "superapp.ca";
for (const type of dnsTypes) addOption(typeField, type);
for (const gameInfo of terminalGames) {
  const button = document.createElement("button");
  button.type = "button";
  button.textContent = gameInfo.title;
  const detail = document.createElement("small");
  detail.textContent = gameInfo.description;
  button.append(detail);
  button.addEventListener("click", () => {
    run("play " + gameInfo.id);
    input.focus();
  });
  byId("games-list").append(button);
}
byId("console-form").addEventListener("submit", event => {
  event.preventDefault();
  run(input.value);
  input.value = "";
  input.focus();
});
input.addEventListener("keydown", event => {
  if (event.key !== "ArrowUp" && event.key !== "ArrowDown") return;
  event.preventDefault();
  const direction = event.key === "ArrowUp" ? -1 : 1;
  historyIndex = Math.min(history.length, Math.max(0, historyIndex + direction));
  input.value = history[historyIndex] || "";
});
byId("record-form").addEventListener("submit", event => {
  event.preventDefault();
  run("dns " + hostField.value + " " + typeField.value);
});
byId("links-button").addEventListener("click", () => run("records " + hostField.value));
byId("appeal").addEventListener("click", () => {
  run("appeal");
  input.focus();
});
exportButton.addEventListener("click", () => {
  if (!lastDns) return;
  const url = URL.createObjectURL(new Blob([lastDns.report], { type: "text/plain" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = lastDns.name;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
});
print("After Hours Field Console ready. Type help, play lost-carrier, or dns superapp.ca MX.");
