const { Router } = require("express");
const { existsSync, mkdirSync, writeFileSync, rmSync } = require("fs");
const path = require("path");
const crypto = require("crypto");

const proxyRouter = Router();
const UPLOAD_PATH = process.env.UPLOAD_PATH || path.join(__dirname, "uploads");

if (!existsSync(UPLOAD_PATH)) {
  mkdirSync(UPLOAD_PATH, { recursive: true });
}

function generateSaltFile(torrentPath) {
  const salt = crypto.randomBytes(16).toString("hex");
  const saltFilePath = path.join(torrentPath, `.torrent_salt_${Date.now()}`);
  writeFileSync(saltFilePath, salt);
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
  const torrentPath = path.join(UPLOAD_PATH, crypto.randomUUID());
  mkdirSync(torrentPath, { recursive: true });

  if (torrentData.has(magnetURI)) {
    const existingData = torrentData.get(magnetURI);
    const saltFilePath = generateSaltFile(existingData.filePath);
    webTorrent.seed([existingData.filePath, saltFilePath], (newTorrent) => {
      const newMagnetURI = newTorrent.magnetURI;
      torrentData.set(magnetURI, {
        filePath: existingData.filePath,
        magnetURI: newMagnetURI,
      });
      res.json({ magnetURL: newMagnetURI });
    });
    return;
  }

  webTorrent.add(magnetURI, { path: torrentPath }, (torrent) => {
    torrent.on("wire", () => {
      const saltFilePath = generateSaltFile(torrentPath);
      webTorrent.seed([torrentPath, saltFilePath], (newTorrent) => {
        let newMagnetURI = newTorrent.magnetURI;
        torrentData.set(magnetURI, {
          filePath: torrentPath,
          magnetURI: newMagnetURI,
        });
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
