import { relayCase } from "./relay-case.mjs";

export const retroCases = [
  {
    id: "dialup", host: "modem-rack", title: "One Ring Short", topic: "Dial-up BBS", level: "Intro",
    brief: "It’s 1998 and the Rainline BBS stopped answering after its modem profile was reset. Inspect the caller transcript and rack notes, re-enable auto-answer, and dial in. Submit the board name printed on the welcome screen.",
    files: {
      "caller.log": "23:58:09 ATDT5550142\n23:58:11 RINGBACK\n23:58:17 RINGBACK\n23:59:00 NO CARRIER",
      "rack-notes.txt": "Rainline line 2 • 604-555-0142\nS0=0 disables automatic answering.\nFor this rack, set S0=1 to answer after one ring.\nUse dial 5550142 for the lab’s local test call.",
    },
    hints: ["The caller hears ringback, but the modem never answers. Check the S0 register.", "Run modem s0=1, then dial 5550142."],
    evidence: ["caller.log", "rack-notes.txt"],
    answer: "rainline",
    operation: { command: "modem", target: "s0=1", result: "ATS0=1\nOK" },
    dial: {
      number: "5550142",
      banner: "ATDT5550142\nCONNECT 28800\n\n+-----------------------------------+\n| R A I N L I N E   •   B B S       |\n| Vancouver, BC  /  Since 1994      |\n+-----------------------------------+\nBoard name: Rainline\nType board to read the message board.",
      messages: "RAINLINE / PUBLIC MESSAGES\n\n[001] sysop: Who reset the modem profile? Leave S0 at 1 on line 2.\n[002] nightowl: New Linux HOWTO mirror is up. Please wait until after midnight for large downloads.\n[003] packetfox: The new issue of West Coast Web is in the file area. Bring your own unzip."
    },
    lesson: "Ringback alone doesn’t mean a modem has answered. The S0 register controls how many rings the modem waits before auto-answering."
  },
  {
    id: "packets", host: "packet-bench", title: "The Missing SYN-ACK", topic: "Packet trace", level: "Intermediate",
    brief: "A dial-up user can resolve the co-op’s web mirror, but their browser never connects. Correlate a recorded packet trace with the gateway’s rule log. Submit the ID of the rule that dropped the reply.",
    files: {
      "capture.txt": "23:42:10.010 client → resolver  UDP DNS query mirror.rainline.test\n23:42:10.020 resolver → client  UDP DNS answer 192.0.2.80\n23:42:10.032 198.51.100.27:49152 → 192.0.2.80:80  TCP SYN\n23:42:10.054 192.0.2.80:80 → 198.51.100.27:49152  TCP SYN,ACK [gateway WAN]\n23:42:11.031 198.51.100.27:49152 → 192.0.2.80:80  TCP SYN (retry)",
      "gateway.log": "23:42:10.020 ACCEPT rule=R08 UDP src=resolver dst=client\n23:42:10.054 DROP rule=R17 TCP src=192.0.2.80:80 dst=198.51.100.27:49152 state=ESTABLISHED\n23:42:10.101 DROP rule=R04 TCP src=203.0.113.99:39200 dst=198.51.100.27:23 state=NEW",
    },
    hints: ["DNS completed successfully. Follow the TCP conversation using both endpoint ports.", "Match the timestamp and ports of the SYN-ACK against gateway.log."],
    evidence: ["capture.txt", "gateway.log"], answer: "r17",
    lesson: "The gateway saw the SYN-ACK on its WAN side and dropped it under R17. Match timestamps and both endpoints to distinguish that reply from unrelated traffic."
  },
  {
    id: "webring", host: "offline-mirror", title: "Next Site in the Ring", topic: "Web archaeology", level: "Intermediate",
    brief: "It’s 1999. The West Coast Webring’s next-site link is broken, and you need to find the zine’s last issue. Open the local mirror and follow the trail. Submit the issue’s filename, including its extension.",
    files: {
      "mirror-index.txt": "Offline entry point: index.htm\nUse browse <page> to open pages from this mirror.\nThe directory retains files that are no longer linked from the homepage.",
    },
    pages: {
      "index.htm": "RAINLINE PERSONAL HOMEPAGE\nUnder construction since 1996!\n\n[ Next in the West Coast Webring → next.htm ]\n[ Sign my guestbook → guestbook.htm ]",
      "next.htm": "404 — This link was retired when the webring moved.\nIf you’re looking for the zine, check the guestbook.",
      "guestbook.htm": "GUESTBOOK\n1999-10-17 • sysop: The zine moved. The old downloads page is gone, but I left a note in links.htm.\n1999-10-19 • nightowl: Great site. Works fine in Lynx.",
      "links.htm": "LINKS & MIRRORS\nWest Coast Web back issues → files.htm\nThe November issue was the final one.",
      "files.htm": "WEST COAST WEB / DOWNLOADS\n1999-09  wcw09.zip\n1999-10  wcw10.zip\n1999-11  wcw11.zip",
    },
    hints: ["Start at browse index.htm. The guestbook is still in the mirror.", "Browse guestbook.htm, then links.htm, then files.htm."],
    evidence: ["mirror-index.txt", "guestbook.htm", "links.htm", "files.htm"], answer: "wcw11.zip",
    lesson: "Guestbooks and links pages can preserve migration clues. An offline mirror can also retain pages after their original navigation disappears."
  },
  relayCase,
];
