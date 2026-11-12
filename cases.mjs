export const cases = [
  {
    id: "dns", host: "resolver", title: "The :50 Sweep", topic: "DNS", level: "Intro",
    brief: "Every hour at :50, the resolver gets hit with a burst of reverse lookups. Use the DNS and DHCP logs to identify the device making the queries. Submit its hostname.",
    files: {
      "dns.log": "02:50:00 query[PTR] 1.10.77.10.in-addr.arpa from 10.77.10.42\n02:50:00 query[PTR] 2.10.77.10.in-addr.arpa from 10.77.10.42\n02:50:01 query[PTR] 3.10.77.10.in-addr.arpa from 10.77.10.42\n02:52:10 query[A] wiki.lab.test from 10.77.10.13",
      "dhcp.leases": "10.77.10.13  workbench\n10.77.10.42  home-assistant\n10.77.10.54  backup-nas",
    },
    hints: ["Look for the IP that appears on several consecutive PTR requests.", "Match the client IP in dns.log to the hostname in dhcp.leases."],
    evidence: ["dns.log", "dhcp.leases"], answer: "home-assistant",
    lesson: "Join DNS client addresses against lease records before blaming the resolver. The sweep originated on the Home Assistant host."
  },
  {
    id: "web", host: "web-edge", title: "The Missing Hand-off", topic: "Apache / PHP", level: "Intro",
    brief: "Static files load, but PHP pages return 503. Compare Apache’s configured socket with the one PHP-FPM is actually listening on. Submit the correct socket path.",
    files: {
      "apache-error.log": "AH02454: FCGI: attempt to connect to Unix domain socket /run/php/legacy.sock failed\nAH01079: failed to make connection to backend",
      "vhost.conf": "<FilesMatch \\.php$>\n    SetHandler \"proxy:unix:/run/php/legacy.sock|fcgi://localhost/\"\n</FilesMatch>",
      "fpm-pool.conf": "[www]\nlisten = /run/php/hackme.sock\nlisten.owner = www-data",
    },
    hints: ["The Apache error names the endpoint Apache tried to reach.", "The listen setting in fpm-pool.conf is the socket you need."],
    evidence: ["vhost.conf", "fpm-pool.conf"], answer: "/run/php/hackme.sock",
    lesson: "Apache and PHP-FPM must agree on the Unix socket path. A static page can still work while that hand-off is broken."
  },
  {
    id: "route", host: "looking-glass", title: "The Border Detour", topic: "Routing", level: "Intermediate",
    brief: "A Vancouver-to-Toronto path appears to leave Canada. Compare the simulated trace to the lab’s location inventory. Submit the city of the first documented US hop.",
    files: {
      "trace.txt": "1  van-edge.lab.test  1 ms\n2  transit-a.lab.test  8 ms\n3  transit-b.lab.test  19 ms\n4  * * *\n5  tor-edge.lab.test  57 ms",
      "pop-inventory.csv": "hostname,city,country\nvan-edge.lab.test,Vancouver,CA\ntransit-a.lab.test,Surrey,CA\ntransit-b.lab.test,Seattle,US\ntor-edge.lab.test,Toronto,CA",
    },
    hints: ["The trace shows hop order. The inventory supplies the locations.", "Check transit-b.lab.test. The silent hop tells you nothing about its location."],
    evidence: ["trace.txt", "pop-inventory.csv"], answer: "seattle",
    lesson: "A known exchange or inventory record provides stronger location evidence than latency or an unverified hostname."
  },
  {
    id: "archive", host: "archive", title: "The Last Good Copy", topic: "Backups", level: "Intermediate",
    brief: "A file in the archive has changed unexpectedly. Compare each backup’s checksum with the trusted manifest, then run a simulated restore. Submit the snapshot ID you restored from.",
    files: {
      "manifest.sha256": "a1e2637d9a9f02502f986a0e3a9fdb695732240a05b546f34f12fab4e9ea3922  dialup-notes.txt",
      "snapshots.txt": "snap-01  267b629688d013278c7585cbdac947013a02a89207c79c4572d3882cd923241d\nsnap-02  a1e2637d9a9f02502f986a0e3a9fdb695732240a05b546f34f12fab4e9ea3922\nsnap-03  3dd1771e7a627c4117455100a5b6d71a63e7614b01f8b66e004e5f119bd3152",
    },
    hints: ["Newest and newest verified are different questions. Match the whole digest.", "Run restore snap-02, then submit snap-02."],
    evidence: ["manifest.sha256", "snapshots.txt"], answer: "snap-02",
    operation: { command: "restore", target: "snap-02", result: "Restored dialup-notes.txt to the lab workspace. Checksum matches the trusted manifest." },
    lesson: "An archive is useful when you can restore its contents and verify them against a trusted reference."
  },
  {
    id: "access", host: "bastion", title: "The Stale Key", topic: "Access review", level: "Intermediate",
    brief: "A retired service account has a key that still works on the bastion. Match the account roster, SSH log, and key inventory. Revoke only the matching key, then submit its ID.",
    files: {
      "auth.log": "03:08:22 Accepted publickey for mirror-sync from 10.77.10.61 key=key-41\n03:14:09 Accepted publickey for backup-robot from 10.77.10.54 key=key-16",
      "accounts.tsv": "mirror-sync   retired\nbackup-robot  active",
      "keys.tsv": "key-41  mirror-sync   enabled\nkey-16  backup-robot  enabled",
    },
    hints: ["Check the status of each account before touching its key.", "Run revoke key-41, then submit key-41."],
    evidence: ["auth.log", "accounts.tsv", "keys.tsv"], answer: "key-41",
    operation: { command: "revoke", target: "key-41", result: "Revoked key-41 on the simulated bastion. Backup access remains active." },
    lesson: "Correlating account lifecycle and authentication records helps you revoke stale access without breaking active jobs."
  },
];
