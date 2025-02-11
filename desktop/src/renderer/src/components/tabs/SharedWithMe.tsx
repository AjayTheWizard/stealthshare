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
                <div className="flex items-center gap-4">
                  <button onClick={() => download(file)} className="px-4 py-2 bg-green-700 hover:bg-green-800 rounded-md">Download</button>
                  <h3 className="flex gap-1 items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6">
                      <path strokeLinecap="round" strokeLinejoin="round" d="m15 11.25-3-3m0 0-3 3m3-3v7.5M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                    </svg>
                    {filesize(downloadInfos[file.filePath]?.uploadSpeed ?? 0)}/s</h3>
                  <h3 className="flex gap-1 items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6">
                      <path strokeLinecap="round" strokeLinejoin="round" d="m9 12.75 3 3m0 0 3-3m-3 3v-7.5M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                    </svg>
                    {filesize(downloadInfos[file.filePath]?.downloadSpeed ?? 0)}/s</h3>
                  <h3 className="flex gap-1 items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                    </svg>
                    {downloadInfos[file.filePath]?.noOfPeers ?? "0"}</h3>
                  <h3 className="flex gap-1 items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9.75v6.75m0 0-3-3m3 3 3-3m-8.25 6a4.5 4.5 0 0 1-1.41-8.775 5.25 5.25 0 0 1 10.233-2.33 3 3 0 0 1 3.758 3.848A3.752 3.752 0 0 1 18 19.5H6.75Z" />
                    </svg>
                    {(downloadInfos[file.filePath]?.progress * 100).toFixed(2) ?? "0"}%</h3>
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