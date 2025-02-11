const express = require("express");
const nanoid = require("nanoid-cjs");
const os = require("os");
const path = require("path");
const fs = require("fs");

const peerRouter = express.Router();
const tempDir = os.tmpdir();

/** @typedef {Object} VirtualPeer
 *  @property {string} id
 *  @property {import("webtorrent").Instance} client
 *  @property {Date} startTime
 *  @property {Date} [endTime]
 *  @property {string} status // "active" | "stopped"
 *  @property {Function} cleanup
 */

/** @type {Map<string, VirtualPeer>} */
const virtualPeers = new Map();

peerRouter.get("/list", (_req, res) => {
  res.json({ peers: Array.from(virtualPeers.keys()) });
});

peerRouter.get("/start", async (req, res) => {
  if (!req.query.magnetURI) {
    return res
      .status(400)
      .json({ error: "Missing magnetURI in query parameters" });
  }

  const { default: WebTorrent } = await import("webtorrent");
  const magnetURI = decodeURIComponent(req.query.magnetURI);
  console.log("Starting virtual peer for:", magnetURI);

  const peerId = nanoid.nanoid();
  const client = new WebTorrent();
  const currTempDir = path.join(tempDir, peerId);
  fs.mkdirSync(currTempDir, { recursive: true });

  const virtualPeer = {
    id: peerId,
    client,
    startTime: new Date(),
    status: "active",
    cleanup: () => {
      fs.rmSync(currTempDir, { recursive: true, force: true });
    },
  };

  virtualPeers.set(peerId, virtualPeer);

  client.add(magnetURI, { path: currTempDir }, (torrent) => {
    console.log("Virtual peer started for:", torrent.name);
  });

  client.on("error", (err) => {
    console.error("WebTorrent error:", err);
    virtualPeer.status = "error";
  });

  res.json({ id: peerId, startTime: virtualPeer.startTime.toISOString() });
});

peerRouter.get("/stop/:peerId", (req, res) => {
  const peerId = req.params.peerId;
  if (!virtualPeers.has(peerId)) {
    return res.status(404).json({ error: "Peer not found" });
  }

  const peer = virtualPeers.get(peerId);
  peer.client.destroy(() => {
    console.log(`Stopped virtual peer: ${peerId}`);
  });
  peer.cleanup();
  peer.endTime = new Date();
  peer.status = "stopped";
  virtualPeers.delete(peerId);

  res.json({
    message: "Peer stopped",
    peerId,
    duration: (peer.endTime - peer.startTime) / 1000,
  });
});

module.exports.peerRouter = peerRouter;
