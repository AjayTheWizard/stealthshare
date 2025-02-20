import { initializeApp, applicationDefault } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import express from "express";
import cookieParser from "cookie-parser";
import Tracker from "bittorrent-tracker";

// 🔥 Initialize Firebase Admin (for Firestore access)
initializeApp({ credential: applicationDefault() });
const db = getFirestore();

const app = express();
app.use(cookieParser());

// 📌 Secure Tracker - Verify Access Before Allowing Peers
const server = new Tracker.Server({
  http: true,
  filter: async (infoHash, params, cb) => {
    try {
      const { req } = params;
      const userId = req.cookies.userId; // Extract userId from cookies
      const torrentId = infoHash.toString("hex"); // Torrent hash

      if (!userId) {
        console.log("❌ No userId in cookies. Blocking peer.");
        return cb(false);
      }

      // 🔎 Query Firestore for this torrent's privateUsers list
      const torrentRef = db.collection("torrent").doc(torrentId);
      const torrentDoc = await torrentRef.get();

      if (!torrentDoc.exists) {
        console.log(`❌ Torrent ${torrentId} not found.`);
        return cb(false);
      }

      const { privateUsers, magnetURI } = torrentDoc.data();

      if (!privateUsers.includes(userId)) {
        console.log(`❌ User ${userId} not authorized for ${torrentId}`);
        return cb(false);
      }

      console.log(`✅ User ${userId} authorized for ${torrentId}`);
      cb(true); // Allow peer
    } catch (error) {
      console.error("⚠️ Error in tracker authentication:", error);
      cb(false);
    }
  },
});

// 🌍 Start HTTP Tracker
server.listen(3000, () => {
  console.log("🚀 Secure Tracker running at http://localhost:3000/announce");
});

// 🎫 API to Set Authentication Cookie
app.post("/set-cookie", (req, res) => {
  const { userId } = req.body;
  if (!userId) return res.status(400).json({ error: "Missing userId" });

  res.cookie("userId", userId, { httpOnly: true, secure: true });
  res.json({ message: "Cookie set successfully" });
});

// 📌 Start Express Server
app.listen(4000, () => console.log("🌍 Token server running on port 4000"));
