const profiles = [
  {
    id: "local",
    title: "Local loop",
    description: "A short call across Vancouver. Most slots are clear, but crosstalk is expected near the end.",
    schedule: ["clear", "hiss", "clear", "clear", "crosstalk"],
  },
  {
    id: "party-line",
    title: "Shared line",
    description: "A call on a busy shared line. Crosstalk interrupts the first half of the transfer.",
    schedule: ["hiss", "crosstalk", "clear", "hiss", "clear"],
  },
  {
    id: "long-distance",
    title: "Long distance",
    description: "Six slots on a rough line. Repeated crosstalk makes retraining worth the time.",
    schedule: ["crosstalk", "crosstalk", "hiss", "clear", "crosstalk", "crosstalk"],
  },
];

export const lineProfiles = Object.freeze(profiles.map(({ id, title, description }) =>
  Object.freeze({ id, title, description })
));

const targetBlocks = 20;
const verifiedBlocks = {
  burst: { clear: 6, hiss: 2, crosstalk: 0 },
  protected: { clear: 4, hiss: 4, crosstalk: 2 },
};

function profileFor(id) {
  const profile = profiles.find(profile => profile.id === id);
  if (!profile) throw new RangeError("Unknown Last Call line profile: " + id);
  return profile;
}

function currentNoise(profile, remaining, retrained) {
  return retrained ? "clear" : profile.schedule[profile.schedule.length - remaining];
}

function forecast(profile, remaining, retrained) {
  const noise = currentNoise(profile, remaining, retrained);
  const current = retrained ? "clear throughput after retraining" : noise;
  const next = profile.schedule[profile.schedule.length - remaining + 1];
  return "Current slot: " + current + ". " + (next ? "Next slot: " + next + "." : "Final slot.");
}

/**
 * A frozen transfer snapshot. remaining counts call slots, and progress/target
 * count verified blocks. status is playing, won or lost. forecast describes
 * the current and following slots during play. message is the last result.
 * score is null until a win. crcFailures counts failed burst blocks, and
 * retrained indicates that the previous turn restored clear-line throughput for this slot.
 */
export function createTransfer(profileId) {
  const profile = profileFor(profileId);
  const remaining = profile.schedule.length;
  return Object.freeze({
    profileId,
    status: "playing",
    remaining,
    progress: 0,
    target: targetBlocks,
    message: "CONNECT. The remote board is ready to send " + targetBlocks + " blocks.",
    score: null,
    forecast: forecast(profile, remaining, false),
    crcFailures: 0,
    retrained: false,
  });
}

export function transferActions(state) {
  if (state.status !== "playing") return [];
  const profile = profileFor(state.profileId);
  const noise = currentNoise(profile, state.remaining, state.retrained);
  const blocksLeft = state.target - state.progress;
  const actions = [
    {
      id: "burst",
      label: "Burst transfer",
      detail: Math.min(blocksLeft, verifiedBlocks.burst[noise]) + " verified blocks this slot. Fast on a clear line.",
    },
    {
      id: "protected",
      label: "Protected transfer",
      detail: Math.min(blocksLeft, verifiedBlocks.protected[noise]) + " verified blocks this slot. Shorter blocks tolerate noise.",
    },
  ];
  if (state.remaining > 1) {
    actions.push({ id: "retrain", label: "Retrain modem", detail: "Spend this slot to adapt to the next slot’s line noise." });
  }
  return actions;
}

export function playTransfer(state, actionId) {
  if (state.status !== "playing" || !transferActions(state).some(action => action.id === actionId)) return state;

  const profile = profileFor(state.profileId);
  const noise = currentNoise(profile, state.remaining, state.retrained);
  const retrained = actionId === "retrain";
  const remaining = state.remaining - 1;
  const blocksLeft = state.target - state.progress;
  let progress = state.progress;
  let crcFailures = state.crcFailures;
  let message = "MODEM RETRAIN. The next slot gets clear-line throughput.";

  if (!retrained) {
    const received = Math.min(blocksLeft, verifiedBlocks[actionId][noise]);
    const failed = actionId === "burst" ? Math.min(blocksLeft, verifiedBlocks.burst.clear) - received : 0;
    progress += received;
    crcFailures += failed;
    message = received + " blocks verified." + (failed ? " " + failed + " failed CRC and are still pending." : "");
  }

  let status = "playing";
  let score = null;
  if (progress === state.target) {
    status = "won";
    score = 100 + 20 * remaining - 2 * crcFailures;
    message += " TRANSFER COMPLETE. All " + state.target + " blocks verified.";
  } else if (!remaining) {
    status = "lost";
    message += " NO CARRIER. Received " + progress + " of " + state.target + " blocks.";
  }

  return Object.freeze({
    ...state,
    status,
    remaining,
    progress,
    message,
    score,
    forecast: status === "playing" ? forecast(profile, remaining, retrained) : "",
    crcFailures,
    retrained,
  });
}
