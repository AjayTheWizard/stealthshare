const express = require("express");
const { proxyRouter } = require("./proxyRouter");
const { peerRouter } = require("./peerRouter");

// const WebTorrent = (await import("webtorrent")).default;
// const webTorrent = new WebTorrent();

const PORT = process.env.PORT || 5000;

const app = express();
app.use(express.json());
app.use("/proxy", proxyRouter);
app.use("/peer", peerRouter);

app.listen(PORT, () => {
  console.log("Server listening at http://localhost:" + PORT);
});
