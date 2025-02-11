import { auth, db } from "@renderer/lib/firebase";
import { and, collection, getDocs, onSnapshot, query, where } from "firebase/firestore";
import { useEffect, useState } from "react";
import { filesize } from "filesize"

const torrentsCol = collection(db, "torrent");

type TorrentDoc = {
  userId: string;
  folder: string;
  filePath: string;
  fileName: string;
  size: string;
  magnetURI: string;
  privateUsers: string[];
  type: "private" | "public";
}

type DownloadInfo = {
  downloadSpeed: string;
  uploadSpeed: string;
  noOfPeers: number;
  progress: number;
}

const SharedWithMe = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [userId, setUserId] = useState("");
  const [files, setFiles] = useState<TorrentDoc[]>([]);
  const [downloadInfos, setDownloadInfos] = useState<Record<string, DownloadInfo>>({});

  useEffect(() => {
    async function fetchTorrents() {
      let userIdTmp = auth.currentUser!.uid;
      setUserId(userIdTmp);
      console.log(auth.currentUser?.email);

      const privateTorrentQuery = query(torrentsCol,
        and(
          where("type", "==", "private"),
          where("privateUsers", "array-contains", auth.currentUser!.email)
        )
      );
      let fileData: TorrentDoc[] = [];

      let docs = await getDocs(privateTorrentQuery);

      docs.forEach(doc => {
        fileData.push(doc.data() as never);
      })

      let unSub = onSnapshot(privateTorrentQuery, (dataDoc) => {
        fileData = [];
        dataDoc.forEach(docs => {
          fileData.push(docs.data() as never);
        })
      })
      console.log(fileData, docs.docs);
      setFiles(fileData);
      setIsLoading(false);
      return unSub;
    }
    fetchTorrents();
  }, [])

  useEffect(() => {
    window.electron.ipcRenderer.on("download:info", (_event, path: string, info: DownloadInfo) => {
      setDownloadInfos(e => ({ ...e, [path]: info }))
    });
  }, [])

  const download = (file: TorrentDoc) => {
    window.electron.ipcRenderer.invoke("download:torrent", file);
  }

  if (isLoading) return;
  return (
    <div className="tab-body">
      <h1 className="tab-heading">Shared With Me</h1>
      {isLoading ? null : (
        <div className="flex flex-col gap-3">
          {files.map(file => (
            <div key={file.filePath} className="w-full bg-zinc-700  rounded-md px-4 py-3">
              <div className="flex w-full justify-between items-center">
                <div className="flex gap-3 items-center">
                  <h1 className="mb-2">{file.fileName}</h1>
                  <span className="bg-zinc-800 px-2 py-1">{file.type}</span>
                </div>
              </div>
              <div className="w-full flex justify-between items-center">
                <div className="flex flex-col items-center gap-2">
                  <button onClick={() => download(file)} className="px-4 py-2 bg-green-700 hover:bg-green-800 rounded-md">Download</button>
                  <h3>Upload Speed: {filesize(downloadInfos[file.filePath]?.uploadSpeed )}/s</h3>
                  <h3>Download Speed: {filesize(downloadInfos[file.filePath]?.downloadSpeed) }/s</h3>
                  <h3>No of Peers: {downloadInfos[file.filePath]?.noOfPeers ?? "0"}</h3>
                  <h3>Progress: {(downloadInfos[file.filePath]?.progress * 100).toFixed(2) ?? "0"}%</h3>
                </div>
                <h3>Size: {file.size}</h3>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )

}

export default SharedWithMe;