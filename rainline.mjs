import { createTransfer, lineProfiles, playTransfer, transferActions } from "./door.mjs";

const byId = id => document.getElementById(id);
const modem = document.querySelector(".modem");
const menu = byId("board-menu");
const menuButtons = [...menu.querySelectorAll("[data-view]")];
const dial = byId("dial");
const hangup = byId("hangup");
const profile = byId("profile");
const start = byId("start-transfer");
const actionList = byId("transfer-actions");
const bestKey = "hackme-ca.rainline.last-call.v1";

const best = new Map();
let transfer = null;
try {
  const stored = JSON.parse(localStorage.getItem(bestKey) || "{}");
  for (const line of lineProfiles) {
    const score = stored?.[line.id];
    if (Number.isSafeInteger(score) && score > 0) best.set(line.id, score);
  }
} catch {
  // Last Call remains playable when browser storage is unavailable.
}

function showBoard(view) {
  for (const button of menuButtons) {
    const selected = button.dataset.view === view;
    if (selected) button.setAttribute("aria-current", "true");
    else button.removeAttribute("aria-current");
    byId(button.dataset.view).hidden = !selected;
  }
  byId("offline").hidden = view !== "offline";
  if (view !== "offline") byId(view).querySelector("h2").focus();
}

function renderTransfer() {
  const selected = lineProfiles.find(line => line.id === profile.value);
  byId("profile-detail").textContent = selected.description;
  const score = best.get(selected.id);
  byId("personal-best").textContent = score ? "Personal best on this line: " + score : "";
  byId("transfer").hidden = !transfer;
  start.textContent = transfer ? "Restart transfer" : "Start transfer";
  actionList.replaceChildren();

  if (!transfer) {
    byId("transfer-result").textContent = "";
    return;
  }

  const playing = transfer.status === "playing";
  const meter = byId("transfer-meter");
  meter.max = transfer.target;
  meter.value = transfer.progress;
  byId("blocks").textContent = transfer.progress + " / " + transfer.target + " blocks";
  byId("turns").textContent = "Call slots left: " + transfer.remaining;
  byId("forecast").textContent = transfer.forecast || "";
  const scoreLine = transfer.status === "won" ? " Score: " + transfer.score + "." : "";
  byId("transfer-result").textContent = transfer.message + scoreLine;

  for (const action of transferActions(transfer)) {
    const button = document.createElement("button");
    button.type = "button";
    button.dataset.action = action.id;
    button.textContent = action.label;
    const detail = document.createElement("small");
    detail.textContent = action.detail;
    button.append(detail);
    actionList.append(button);
  }
  actionList.hidden = !playing;
}

for (const line of lineProfiles) {
  const option = document.createElement("option");
  option.value = line.id;
  option.textContent = line.title;
  profile.append(option);
}
renderTransfer();

dial.addEventListener("click", () => {
  dial.hidden = true;
  menu.hidden = false;
  hangup.hidden = false;
  modem.setAttribute("data-connected", "");
  byId("line-status").textContent = "CONNECT 28800";
  showBoard("welcome");
});

hangup.addEventListener("click", () => {
  showBoard("offline");
  menu.hidden = true;
  hangup.hidden = true;
  dial.hidden = false;
  modem.removeAttribute("data-connected");
  byId("line-status").textContent = "NO CARRIER";
  transfer = null;
  renderTransfer();
  dial.focus();
});

menu.addEventListener("click", event => {
  const button = event.target.closest("[data-view]");
  if (button) showBoard(button.dataset.view);
});
byId("welcome").querySelector("[data-jump]").addEventListener("click", () => showBoard("door"));

profile.addEventListener("change", () => {
  transfer = null;
  renderTransfer();
});
start.addEventListener("click", () => {
  transfer = createTransfer(profile.value);
  renderTransfer();
  actionList.querySelector("button")?.focus();
});
actionList.addEventListener("click", event => {
  const button = event.target.closest("[data-action]");
  if (!button || !transfer) return;
  const actionId = button.dataset.action;
  transfer = playTransfer(transfer, actionId);
  if (transfer.status === "won" && transfer.score > (best.get(profile.value) || 0)) {
    best.set(profile.value, transfer.score);
    try {
      localStorage.setItem(bestKey, JSON.stringify(Object.fromEntries(best)));
    } catch {
      // Keep the best score for the current visit.
    }
  }
  renderTransfer();
  const next = [...actionList.children].find(action => action.dataset.action === actionId);
  (next || actionList.firstElementChild || start).focus();
});
