export const relayCase = {
  id: "relay",
  host: "mail-relay",
  title: "The Midnight Mailbag",
  topic: "BBS echomail",
  level: "Intermediate",
  brief: "November 1999. Rainline’s Linux discussion reaches the local board, but the overnight copy never reaches the other coastal BBSes. Trace the queued packet through the poll log and compare the configured route with the current node list. Submit the node ID of the correct next hop.",
  files: {
    "spool.lst": [
      "RAINLINE / OUTBOUND ECHOMAIL / 1999-11-18",
      "packet       area            author       subject",
      "COAST118.PKT COAST.LINUX     packetfox    Re: getting PLIP to work",
      "COAST119.PKT COAST.SWAP      nightowl     10Base-T hub, free to a good home",
      "COAST120.PKT COAST.SYSOPS    sysop        Sunday poll window"
    ].join("\n"),
    "poll.log": [
      "00:00:08 area=COAST.SWAP peer=G07 CONNECT 28800",
      "00:00:11 packet=COAST119.PKT ZMODEM transfer complete",
      "00:05:03 area=COAST.LINUX peer=V04 NO CARRIER",
      "00:05:03 packet=COAST118.PKT held for retry",
      "00:11:19 area=COAST.SYSOPS peer=S03 BUSY",
      "00:11:19 packet=COAST120.PKT held for retry"
    ].join("\n"),
    "echo.cfg": [
      "# area         next-hop",
      "COAST.LINUX    V04",
      "COAST.SWAP     G07",
      "COAST.SYSOPS   S03"
    ].join("\n"),
    "nodes.nov": [
      "COASTNET NODE LIST / REVISION 1999-11-15",
      "ID   Board               Status   Carries",
      "V04  Second Narrows      retired  —",
      "G07  Island Exchange     active   COAST.SWAP",
      "S03  Summit Board        active   COAST.SYSOPS",
      "C12  Strait Signal       active   COAST.LINUX"
    ].join("\n")
  },
  hints: [
    "Find the packet for COAST.LINUX in spool.lst and follow its ID in poll.log. A completed transfer for another area doesn’t clear this queue.",
    "echo.cfg still points the Linux area at a retired node. Use nodes.nov to find the active node that carries that exact area."
  ],
  evidence: ["spool.lst", "poll.log", "echo.cfg", "nodes.nov"],
  answer: "c12",
  lesson: "Rainline queued the post correctly and kept it after the failed call. The relay’s route still pointed to retired node V04. The current node list puts COAST.LINUX on C12."
};
