export const recordTargets = Object.freeze([
  "hackme.ca",
  "superapp.ca",
  "interweb.international",
]);

export const dnsTypes = Object.freeze(["A", "AAAA", "MX", "NS", "TXT", "CAA", "HTTPS"]);

const recordTypeNames = {
  1: "A",
  2: "NS",
  5: "CNAME",
  6: "SOA",
  15: "MX",
  16: "TXT",
  28: "AAAA",
  39: "DNAME",
  64: "SVCB",
  65: "HTTPS",
  257: "CAA",
};
const errorStatuses = {
  1: "FORMERR — the resolver rejected the query format",
  2: "SERVFAIL — the resolver could not complete the lookup",
  3: "NXDOMAIN — the resolver says the name does not exist",
  4: "NOTIMP — the resolver does not support this query",
  5: "REFUSED — the resolver declined the query",
};
const maxAnswers = 24;

export function normalizeTarget(input) {
  if (typeof input !== "string") return null;
  const hostname = input.trim().replace(/\.$/, "");
  if (!/^[A-Za-z0-9.-]+$/.test(hostname)) return null;
  const lower = hostname.toLowerCase();
  return recordTargets.includes(lower) ? lower : null;
}

// Keep each value on one display line, including TXT records with control characters.
function oneLine(value, limit) {
  const clean = value.slice(0, limit).replace(/[\u0000-\u001f\u007f-\u009f\u061c\u200e\u200f\u2028-\u202e\u2066-\u2069]/g, " ");
  return clean + (value.length > limit ? "…" : "");
}

export function summarizeDns(payload, hostname, type) {
  const target = normalizeTarget(hostname);
  const queryType = typeof type === "string" ? type.toUpperCase() : "";
  if (!target || !dnsTypes.includes(queryType)) return "Lookup is outside the workbench scope.";

  const lines = [target + "  /  " + queryType];
  const status = payload?.Status;
  if (!Number.isInteger(status) || status < 0 || status > 4095) {
    return lines.concat("The resolver returned an invalid DNS response.").join("\n");
  }
  if (status !== 0) {
    return lines.concat(errorStatuses[status] ?? "DNS response code " + status + ".").join("\n");
  }

  const answers = payload.Answer;
  if (answers !== undefined && !Array.isArray(answers)) {
    return lines.concat("The resolver returned an invalid answer list.").join("\n");
  }
  if (payload.TC === true) lines.push("The resolver marked this response as truncated.");
  if (payload.AD === true) lines.push("The resolver marked the response DNSSEC-authenticated.");
  if (!answers?.length) {
    return lines.concat("No " + queryType + " records in this response.").join("\n");
  }

  let displayed = 0;
  let foundType = false;
  for (const answer of answers.slice(0, maxAnswers)) {
    if (typeof answer?.name !== "string" || typeof answer?.data !== "string") continue;
    if (!Number.isInteger(answer.type) || answer.type < 1 || answer.type > 65535) continue;
    const label = recordTypeNames[answer.type] ?? "TYPE" + answer.type;
    const ttl = Number.isInteger(answer.TTL) && answer.TTL >= 0 && answer.TTL <= 0xffffffff
      ? "  " + answer.TTL + "s"
      : "";
    lines.push(oneLine(answer.name, 254) + "  " + label + ttl + "  " + oneLine(answer.data, 500));
    displayed++;
    if (label === queryType) foundType = true;
  }
  if (answers.length > maxAnswers) lines.push("Showing records from the first " + maxAnswers + " answer entries.");
  if (!displayed) lines.push("The resolver returned no readable answer records.");
  if (displayed && !foundType && answers.length <= maxAnswers) {
    lines.push("No " + queryType + " records in this response.");
  }
  return lines.join("\n");
}

export function domainLinks(hostname) {
  const target = normalizeTarget(hostname);
  if (!target) return [];
  const domain = encodeURIComponent(target);
  const registration = target.endsWith(".ca")
    ? { label: "CIRA WHOIS", url: "https://www.cira.ca/en/ca-domains/whois/?domain=" + domain + "&whois=true" }
    : { label: "ICANN Lookup (enter " + target + ")", url: "https://lookup.icann.org/en/" };
  return [
    { label: "Wayback Machine snapshots", url: "https://web.archive.org/web/*/https://" + domain + "/" },
    { label: "Certificate transparency search", url: "https://crt.sh/?q=" + domain },
    registration,
  ];
}
