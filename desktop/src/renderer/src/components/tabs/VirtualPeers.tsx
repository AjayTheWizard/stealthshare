import { useEffect, useState } from "react";
import { auth, db } from "@renderer/lib/firebase";
import { collection, query, where, and, getDocs } from "firebase/firestore";

type Peer = {
  peerId: string;
  magnetURI: string;
};

type TorrentDoc = {
  id: string;
  fileName: string;
  magnetURI: string;
  progress: number;
};

const torrentsCol = collection(db, "torrent");

const VirtualPeers: React.FC = () => {
  const [peers, setPeers] = useState<Peer[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [files, setFiles] = useState<TorrentDoc[]>([]);
  const [selectedFile, setSelectedFile] = useState<string>("");
  const [changes, setChanges] = useState(0)
  useEffect(() => {
    async function fetchPeers() {
      try {
        const response = await fetch(`http://localhost:5000/peer/list/${auth.currentUser?.uid}`);
        const data = await response.json();
        console.log(data)
        setPeers(data.peers);
      } catch (error) {
        console.error("Error fetching virtual peers:", error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchPeers();
  }, [changes]);

  useEffect(() => {
    async function fetchFiles() {
      const privateTorrentQuery = query(
        torrentsCol,
        and(where("type", "==", "private"), where("userId", "==", auth.currentUser?.uid))
      );
      const docs = await getDocs(privateTorrentQuery);
      const fileData = docs.docs.map((doc) => ({ ...doc.data(), id: doc.id }) as TorrentDoc);
      setFiles(fileData);
    }
    fetchFiles();
  }, []);

  const stopPeer = async (peerId: string) => {
    try {
      await fetch(`http://localhost:5000/peer/stop/${auth.currentUser?.uid}/${peerId}`);
      setPeers((prevPeers) => prevPeers.filter((peer) => peer.peerId !== peerId));
    } catch (error) {
      console.error("Error stopping peer:", error);
    }
  };

  const startPeer = async () => {
    if (!selectedFile) return;
    try {
      setChanges(e => e + 1);
      const response = await fetch(`http://localhost:5000/peer/start/${auth.currentUser?.uid}?magnetURI=${encodeURIComponent(selectedFile)}`);
      const data = await response.json();
      setPeers((prevPeers) => [...prevPeers, { peerId: data.peerId, magnetURI: data.magnetURI }]);
      setSelectedFile("");
    } catch (error) {
      console.error("Error starting peer:", error);
    }
  };

  if (isLoading) return <div>Loading...</div>;

  return (
    <div className="tab-body">
      <h1 className="tab-heading">Virtual Peers</h1>
      <div className="flex gap-3 mb-4">
        <select
          value={selectedFile}
          onChange={(e) => setSelectedFile(e.target.value)}
          className="px-4 py-2 border rounded-md w-full bg-zinc-800 text-white"
        >
          <option value="">Select a file to start</option>
          {files.map((file) => (
            <option className="px-4 py-2" key={file.id} value={file.magnetURI}>{file.fileName}</option>
          ))}
        </select>
        <button
          onClick={startPeer}
          className="px-4 py-2 bg-blue-700 hover:bg-blue-800 rounded-md"
          disabled={!selectedFile}
        >
          Start Peer
        </button>
      </div>
      {peers.length === 0 ? (
        <p>No active virtual peers.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {peers.map((peer) => (
            <div key={peer.peerId} className="w-full bg-zinc-700 rounded-md px-4 py-3">
              <div className="flex w-full justify-between items-center">
                <h1 className="mb-2">Peer ID: {peer.peerId}</h1>
                <button
                  onClick={() => stopPeer(peer.peerId)}
                  className="px-4 py-2 bg-red-700 hover:bg-red-800 rounded-md"
                >
                  Stop
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default VirtualPeers;