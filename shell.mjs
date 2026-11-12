export function newSession() {
  return { read: new Set(), hint: 0, operated: false };
}

export function runCase(mission, session, input) {
  const [command, ...args] = input.trim().split(/\s+/);
  const argument = args.join(" ");
  const files = mission.files;
  const inspected = () => mission.evidence.every(file => session.read.has(file));
  const warn = text => ({ text, kind: "warn" });

  switch (command.toLowerCase()) {
    case "help":
      return { text: [
        "ls                 List virtual case files",
        "cat <file>         Read a virtual file",
        "grep <term> <file> Search a virtual file",
        "pwd                Show the current virtual directory",
        "whoami             Show the current operator",
        "hint               Reveal the next clue",
        ...(mission.operation ? [mission.operation.command + " <id>  Apply the simulated fix"] : []),
        "submit <answer>    Close the case with your finding",
        "clear              Clear terminal output",
      ].join("\n") };
    case "ls": return { text: Object.keys(files).join("\n") };
    case "pwd": return { text: "/lab/cases/" + mission.id };
    case "whoami": return { text: "operator" };
    case "clear": return { clear: true };
    case "hint": {
      const index = Math.min(session.hint, mission.hints.length - 1);
      session.hint++;
      return { text: "Hint " + (index + 1) + "/" + mission.hints.length + " — " + mission.hints[index] };
    }
    case "cat":
      if (!Object.hasOwn(files, argument)) return warn("File unavailable. Run ls to list case files.");
      session.read.add(argument);
      return { text: readFile(mission, session, argument) };
    case "grep": {
      const file = args.pop();
      const term = args.join(" ").replace(/^(["'])(.*)\1$/, "$2").toLowerCase();
      if (!term || !Object.hasOwn(files, file)) return warn("Usage: grep <term> <file>");
      const matches = readFile(mission, session, file).split("\n").filter(line => line.toLowerCase().includes(term));
      if (matches.length) session.read.add(file);
      return { text: matches.join("\n") || "No matches." };
    }
    case "submit":
      if (!argument) return warn("Usage: submit <answer>");
      if (!inspected()) return warn("Review the evidence files from the brief before submitting.");
      if (mission.operation && !session.operated) return warn("Apply the simulated fix before submitting.");
      if (argument.toLowerCase() !== mission.answer) return warn("That finding does not match the evidence. Try hint for a clue.");
      return { text: "CASE CLOSED — " + mission.lesson, kind: "success", closed: true };
    default:
      if (command.toLowerCase() !== mission.operation?.command) return warn("Unknown command. Type help.");
      if (!inspected()) return warn("Inspect the evidence before making changes.");
      if (argument.toLowerCase() !== mission.operation.target) return warn("Change rejected. Check the target against the evidence.");
      if (session.operated) return { text: "This fix is already in effect." };
      session.operated = true;
      return { text: mission.operation.result, kind: "success" };
  }
}

function readFile(mission, session, name) {
  const contents = mission.files[name];
  if (mission.id === "access" && name === "keys.tsv" && session.operated) {
    return contents.replace("mirror-sync   enabled", "mirror-sync   revoked");
  }
  return contents;
}
