const express = require("express");
const { nanoid } = require("nanoid-cjs");

const peerRouter = express.Router();

/** @type {Map<string, Map<string, { client: any, startTime: Date, magnetURI: string }>>} */
const virtualPeers = new Map();

peerRouter.get("/list/:userId", (req, res) => {
  const userId = req.params.userId;
  if (!virtualPeers.has(userId)) {
    return res.json({ peers: [] });
  }
  res.json({
    peers: Array.from(virtualPeers.get(userId).entries()).map(
      ([peerId, data]) => ({ peerId, magnetURI: data.magnetURI })
    ),
  });
});

peerRouter.get("/start/:userId", async (req, res) => {
  const userId = req.params.userId;
  const magnetURI = decodeURIComponent(req.query.magnetURI);

  if (!magnetURI) {
    return res.status(400).json({ error: "Missing magnetURI" });
  }

  if (!virtualPeers.has(userId)) {
    virtualPeers.set(userId, new Map());
  }

  const userPeers = virtualPeers.get(userId);
  const peerId = nanoid();

  const WebTorrent = (await import("webtorrent")).default;
  const client = new WebTorrent();
  userPeers.set(peerId, { client, startTime: new Date(), magnetURI });

  client.add(magnetURI);

  res.json({ message: "Seeding started", peerId, magnetURI });
});

peerRouter.get("/stop/:userId/:peerId", (req, res) => {
  const userId = req.params.userId;
  const peerId = req.params.peerId;

  if (!virtualPeers.has(userId) || !virtualPeers.get(userId).has(peerId)) {
    return res.status(404).json({ error: "Peer not found" });
  }

  const { client, magnetURI } = virtualPeers.get(userId).get(peerId);
  client.destroy();
  virtualPeers.get(userId).delete(peerId);

  if (virtualPeers.get(userId).size === 0) {
    virtualPeers.delete(userId);
  }

  res.json({ message: "Stopped seeding", peerId, magnetURI });
});

module.exports.peerRouter = peerRouter;
