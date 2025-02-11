const { Router } = require("express");
const { existsSync, mkdirSync, writeFileSync, rmSync } = require("fs");
const os = require("os");
const path = require("path");
const crypto = require("crypto");

const proxyRouter = Router();

const webTorrentTmpDir = path.join(os.tmpdir(), "webtorrent");

if (existsSync(webTorrentTmpDir)) {
  rmSync(webTorrentTmpDir, {
    recursive: true,
    force: true,
  });
  console.log(`Cleared old files in ${webTorrentTmpDir}`);
}

const tempDir = path.join(os.tmpdir(), "stealth_share", crypto.randomUUID());
mkdirSync(tempDir, { recursive: true });

function generateSaltFile(torrentPath) {
  const salt = crypto.randomBytes(16).toString("hex");
  const saltFilePath = path.join(torrentPath, ".torrent_salt");
  writeFileSync(saltFilePath, salt);
  console.log("Generated new salt:", salt);
  return saltFilePath;
}

/**
 * @type {import("webtorrent").Instance}
 */
let webTorrent;

(async () => {
  const WebTorrent = (await import("webtorrent")).default;
  webTorrent = new WebTorrent();
})();

/**
 * @type {Map<string, { filePath: string, magnetURI: string }>}
 */
let torrentData = new Map();

proxyRouter.get("/start", async (req, res) => {
  const magnetURI = decodeURIComponent(req.query.magnetURI);

  if (torrentData.has(magnetURI)) {
    const existingData = torrentData.get(magnetURI);
    const saltFilePath = generateSaltFile(existingData.filePath);
    webTorrent.seed([existingData.filePath, saltFilePath], (newTorrent) => {
      const newMagnetURI = newTorrent.magnetURI;
      torrentData.set(magnetURI, {
        filePath: existingData.filePath,
        magnetURI: newMagnetURI,
      });
      console.log("Generated new Magnet URI:", newMagnetURI);
      res.json({ magnetURL: newMagnetURI });
    });
    return;
  }

  webTorrent.add(magnetURI, { path: tempDir }, (torrent) => {
    console.log(`Downloaded: ${torrent.files.map((f) => f.path).join(", ")}`);
    const filePath = tempDir;
    torrent.on("done", () => {
      const saltFilePath = generateSaltFile(filePath);
      webTorrent.seed([filePath, saltFilePath], (newTorrent) => {
        let newMagnetURI = newTorrent.magnetURI;
        torrentData.set(magnetURI, { filePath, magnetURI: newMagnetURI });
        console.log("New Torrent Magnet URI:", newMagnetURI);
        res.json({ magnetURL: newMagnetURI });
      });
    });
  });
});

proxyRouter.get("/stop", async (req, res) => {
  const magnetURI = decodeURIComponent(req.query.magnetURI);
  let found = false;
  webTorrent.torrents.forEach((torrent) => {
    if (torrent.magnetURI === magnetURI) {
      console.log("Destroyed:", magnetURI);
      torrent.destroy(() => {
        if (torrentData.has(magnetURI)) {
          rmSync(torrentData.get(magnetURI).filePath, {
            recursive: true,
            force: true,
          });
          torrentData.delete(magnetURI);
        }
        res.json({ msg: "Success" });
      });
      found = true;
    }
  });
  if (!found) res.json({ msg: "Not Found!" });
});

module.exports.proxyRouter = proxyRouter;
