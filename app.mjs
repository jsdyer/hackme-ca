import { cases } from "./cases.mjs";
import { newSession, runCase } from "./shell.mjs";

const el = id => document.getElementById(id);
const storageKey = "hackme-ca.case-notes.v1";
let records = {};
try {
  const saved = JSON.parse(localStorage.getItem(storageKey) || "{}");
  for (const mission of cases) {
    if (typeof saved?.[mission.id] === "string") records[mission.id] = saved[mission.id];
  }
} catch {
  // A blocked storage API should not prevent play.
}

const requestedCase = new URLSearchParams(location.search).get("case");
let current = cases.find(mission => mission.id === requestedCase) || cases[0];
const sessions = new Map();
let session;
let historyIndex = 0;
const output = el("output");
const input = el("command");
const buttons = [];

function renderProgress() {
  el("progress").textContent = Object.keys(records).length + "/" + cases.length + " CLOSED";
  for (const [mission, button, state] of buttons) {
    button.setAttribute("aria-pressed", String(current === mission));
    state.textContent = records[mission.id] ? "Closed" : "";
  }
}

function print(text, kind = "") {
  const line = document.createElement("div");
  line.className = kind;
  line.textContent = text;
  output.append(line);
  if (output.childElementCount > 200) output.firstElementChild.remove();
  output.scrollTop = output.scrollHeight;
}

function start(mission, restart = false) {
  current = mission;
  if (restart || !sessions.has(mission.id)) {
    sessions.set(mission.id, { state: newSession(), history: [], transcript: [] });
  }
  session = sessions.get(mission.id);
  historyIndex = session.history.length;
  input.value = "";
  el("host").textContent = mission.host + ".lab.test";
  el("metadata").textContent = mission.topic + " / " + mission.level;
  el("title").textContent = mission.title;
  el("brief").textContent = mission.brief;
  output.replaceChildren();
  if (session.transcript.length) {
    for (const entry of session.transcript) print(...entry);
  } else {
    print("Connected to " + mission.host + ".lab.test");
    print("Run help for commands or ls to see the evidence files.");
    if (records[mission.id]) print("This case is already closed. You can replay it here.", "success");
  }
  renderProgress();
}

function log(text, kind) {
  session.transcript.push([text, kind]);
  if (session.transcript.length > 200) session.transcript.shift();
  print(text, kind);
}

function execute(value) {
  const command = value.trim();
  if (!command) return;
  session.history.push(command);
  if (session.history.length > 100) session.history.shift();
  historyIndex = session.history.length;
  log("operator@lab:$ " + command, "entered");
  const result = runCase(current, session.state, command);
  if (result.clear) {
    session.transcript.length = 0;
    output.replaceChildren();
    return;
  }
  log(result.text, result.kind);
  if (!result.closed || records[current.id]) return;
  records[current.id] = new Date().toISOString();
  renderProgress();
  try {
    localStorage.setItem(storageKey, JSON.stringify(records));
  } catch {
    log("Browser storage is unavailable. Download case notes to keep a record.", "warn");
  }
}

for (const [index, mission] of cases.entries()) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "case";
  const number = document.createElement("span");
  number.className = "number";
  number.textContent = String(index + 1).padStart(2, "0");
  number.setAttribute("aria-hidden", "true");
  const summary = document.createElement("span");
  const title = document.createElement("strong");
  title.textContent = mission.title;
  const topic = document.createElement("small");
  topic.textContent = mission.topic;
  summary.append(title, topic);
  const state = document.createElement("small");
  state.className = "done";
  button.append(number, summary, state);
  button.addEventListener("click", () => {
    start(mission);
    el("title").scrollIntoView({ block: "nearest" });
  });
  el(mission.era === "retro" ? "retro-cases" : "cases").append(button);
  buttons.push([mission, button, state]);
}

el("shell").addEventListener("submit", event => {
  event.preventDefault();
  execute(input.value);
  input.value = "";
  input.focus();
});
input.addEventListener("keydown", event => {
  if (event.key !== "ArrowUp" && event.key !== "ArrowDown") return;
  event.preventDefault();
  const direction = event.key === "ArrowUp" ? -1 : 1;
  historyIndex = Math.min(session.history.length, Math.max(0, historyIndex + direction));
  input.value = session.history[historyIndex] || "";
});

el("hint").addEventListener("click", () => execute("hint"));
el("commands").addEventListener("click", () => execute("help"));
el("restart").addEventListener("click", () => start(current, true));
el("export").addEventListener("click", () => {
  const notes = cases.filter(mission => records[mission.id]).map(mission =>
    "## " + mission.title + "\n\nClosed " + records[mission.id] + "\n\n" + mission.lesson
  );
  const contents = "# hackme.ca / After Hours Lab\n\n" + (notes.join("\n\n") || "No cases closed yet.") + "\n";
  const url = URL.createObjectURL(new Blob([contents], { type: "text/markdown" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = "hackme-case-notes.md";
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
});

start(current);
