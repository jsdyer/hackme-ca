export const terminalGames = [
  {
    id: "lost-carrier",
    title: "Lost Carrier",
    description: "Route a CoastNet mailbag through the night relay before your dial-up minutes run out.",
  },
  {
    id: "cache-lock",
    title: "Cache Lock",
    description: "Deduce the four-digit code to a fictional Rainline file cache.",
  },
];

const relays = {
  rainline: { title: "Rainline (Vancouver)", links: { ridge: 1, inlet: 2 } },
  ridge: { title: "Ridge packet switch", links: { rainline: 1, summit: 2, strait: 4 } },
  inlet: { title: "Inlet community board", links: { rainline: 2, strait: 1, island: 3 } },
  summit: { title: "Summit Board", links: { ridge: 2, island: 1 } },
  strait: { title: "Strait Signal", links: { ridge: 4, inlet: 1, island: 2 } },
  island: { title: "Island Exchange", links: { summit: 1, inlet: 3, strait: 2 } },
};

const jobs = [
  { source: "summit", destination: "strait", filename: "SYSOPS.PKT", minutes: 6 },
  { source: "strait", destination: "summit", filename: "LINUX.PKT", minutes: 6 },
  { source: "island", destination: "ridge", filename: "SWAP.PKT", minutes: 8 },
];

const carrierHelp = [
  "look / status   Show your node, mailbag and remaining minutes.",
  "map             Show the full relay network and link costs.",
  "go <node>       Dial a neighbouring relay. Costs minutes shown on the map.",
  "load            Pick up the mailbag at its source. Free.",
  "send            Deliver the mailbag at its destination. Free.",
].join("\n");

const lockHelp = [
  "guess <code>    Try four digits from 0 to 5. Digits may repeat.",
  "look / status   Review previous guesses and attempts left.",
  "Exact means right digit in the right slot. Shifted means right digit in a different slot.",
].join("\n");

const minutes = count => count + (count === 1 ? " minute" : " minutes");
const reply = (state, text) => ({ state, text });

function carrierStatus(state) {
  const { source, destination, filename } = state.job;
  const here = relays[state.node];
  const links = Object.entries(here.links).map(([node, cost]) => node + " (" + minutes(cost) + ")");
  return [
    (state.status === "lost" ? "NO CARRIER" : "CONNECTED") + " · " + here.title,
    "Call allowance · " + minutes(state.remaining),
    filename + " · " + (state.status === "won" ? "delivered to " + destination : (state.loaded ? "in your spool" : "waiting at " + source) + " → " + destination),
    "Dial from here · " + links.join(", "),
  ].join("\n");
}

function carrierMap() {
  return Object.entries(relays).map(([node, relay]) => {
    const links = Object.entries(relay.links).map(([target, cost]) => target + " " + cost + "m");
    return node.padEnd(9) + " " + links.join(" / ");
  }).join("\n");
}

function playCarrier(state, command, argument) {
  const { source, destination, filename } = state.job;
  switch (command) {
    case "go": {
      const links = relays[state.node].links;
      if (!argument || !Object.hasOwn(links, argument)) {
        return reply(state, "No direct line to that relay. Use look for available lines or map for the network.");
      }
      const cost = links[argument];
      if (cost > state.remaining) return reply(state, "That call costs " + minutes(cost) + ". Your allowance is " + minutes(state.remaining) + ".");
      const next = { ...state, node: argument, remaining: state.remaining - cost };
      if (next.remaining === 0 && !(next.loaded && next.node === destination)) {
        next.status = "lost";
        return reply(next, "NO CARRIER · The call allowance ran out at " + relays[next.node].title + ". " + filename + " will have to wait for tomorrow’s poll.");
      }
      const arrival = next.node === source && !next.loaded ? "\nType load to collect the mailbag."
        : next.node === destination && next.loaded ? "\nType send to deliver the mailbag." : "";
      return reply(next, carrierStatus(next) + arrival);
    }
    case "load":
      if (state.loaded) return reply(state, filename + " is already in your spool.");
      if (state.node !== source) return reply(state, "The mailbag is waiting at " + source + ".");
      return reply({ ...state, loaded: true }, filename + " loaded. Route to " + destination + " and type send.");
    case "send":
      if (!state.loaded) return reply(state, "Collect " + filename + " at " + source + " first.");
      if (state.node !== destination) return reply(state, "This mailbag is addressed to " + destination + ".");
      return reply({ ...state, status: "won" }, "250 RECEIVED · " + filename + " delivered to " + relays[destination].title + " with " + minutes(state.remaining) + " left.");
    default:
      return reply(state, "Relay command not recognised. Type help.");
  }
}

function lockStatus(state) {
  const results = state.guesses.map(({ guess, exact, shifted }, index) =>
    (index + 1) + ". " + guess + " · " + exact + " exact / " + shifted + " shifted"
  );
  return ["Attempts left · " + state.remaining, ...results].join("\n");
}

function scoreGuess(code, guess) {
  let exact = 0;
  const unmatched = [];
  const misplaced = [];
  for (let i = 0; i < code.length; i++) {
    if (code[i] === guess[i]) exact++;
    else {
      unmatched.push(code[i]);
      misplaced.push(guess[i]);
    }
  }
  let shifted = 0;
  for (const digit of misplaced) {
    const match = unmatched.indexOf(digit);
    if (match === -1) continue;
    unmatched.splice(match, 1);
    shifted++;
  }
  return { guess, exact, shifted };
}

function playLock(state, command, argument) {
  if (command !== "guess") return reply(state, "Cache command not recognised. Type help.");
  if (!/^[0-5]{4}$/.test(argument)) return reply(state, "Use guess followed by four digits from 0 to 5, for example guess 0123.");
  if (state.guesses.some(entry => entry.guess === argument)) return reply(state, "You already tried " + argument + ". Type status to review the result.");
  const result = scoreGuess(state.code, argument);
  const remaining = state.remaining - 1;
  const status = result.exact === 4 ? "won" : remaining === 0 ? "lost" : "playing";
  const next = { ...state, status, remaining, guesses: [...state.guesses, result] };
  if (status === "won") return reply(next, "CACHE UNLOCKED · Code " + argument + " accepted in " + next.guesses.length + " of 8 attempts. File index recovered.");
  if (status === "lost") return reply(next, lockStatus(next) + "\nCACHE SEALED · The code was " + state.code + ". Start a new game for another code.");
  return reply(next, argument + " · " + result.exact + " exact / " + result.shifted + " shifted\nAttempts left · " + remaining);
}

export function startTerminalGame(id) {
  if (id === "lost-carrier") {
    const job = jobs[Math.floor(Math.random() * jobs.length)];
    const state = { id, status: "playing", node: "rainline", remaining: job.minutes, loaded: false, job };
    return reply(state, "LOST CARRIER · Pick up the mailbag and deliver it before the call ends.\n" + carrierStatus(state) + "\nType map to plan your route or help for commands.");
  }
  if (id === "cache-lock") {
    const code = Array.from({ length: 4 }, () => Math.floor(Math.random() * 6)).join("");
    const state = { id, status: "playing", code, remaining: 8, guesses: [] };
    return reply(state, "CACHE LOCK · Deduce a four-digit code in eight attempts.\n" + lockHelp);
  }
  return null;
}

export function playTerminalGame(state, line) {
  const [command, ...args] = line.trim().toLowerCase().split(/\s+/);
  const argument = args.join(" ");
  const carrier = state.id === "lost-carrier";
  if (command === "help") return reply(state, carrier ? carrierHelp : lockHelp);
  if (command === "status" || command === "look") return reply(state, carrier ? carrierStatus(state) : lockStatus(state));
  if (command === "map" && carrier) return reply(state, carrierMap());
  if (state.status !== "playing") return reply(state, "This run is over. Start another game to play again.");
  return carrier ? playCarrier(state, command, argument) : playLock(state, command, argument);
}
