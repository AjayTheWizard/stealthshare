import { auth, db } from "@renderer/lib/firebase";
import { and, collection, doc, getDocs, onSnapshot, query, where } from "firebase/firestore";
import { useEffect, useState } from "react";

type TorrentDoc = {
  id: string;
  userId: string;
  folder: string;
  filePath: string;
  fileName: string;
  size: string;
  magnetURI: string;
  privateUsers: string[];
  type: "private" | "public";
}


const torrentsCol = collection(db, "torrent");

const MyFiles = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [userId, setUserId] = useState("");
  const [files, setFiles] = useState<TorrentDoc[]>([]);

  useEffect(() => {
    async function fetchTorrents() {
      let userIdTmp = auth.currentUser!.uid;
      setUserId(userIdTmp);
      console.log(auth.currentUser?.email);

      const privateTorrentQuery = query(torrentsCol,
        and(
          where("type", "==", "private"),
          where("userId", "==", auth.currentUser!.uid)
        )
      );
      let fileData: TorrentDoc[] = [];

      let docs = await getDocs(privateTorrentQuery);

      docs.forEach(doc => {
        fileData.push({ ...doc.data(), id: doc.id } as never);
      })

      let unSub = onSnapshot(privateTorrentQuery, (dataDoc) => {
        fileData = [];
        dataDoc.forEach(docs => {
          fileData.push({ ...docs.data(), id: docs.id } as never);
        })
      })
      console.log(fileData, docs.docs);
      setFiles(fileData);
      setIsLoading(false);
      return unSub;
    }
    fetchTorrents();
  }, [])

  const stopSeeding = (file: TorrentDoc) => {
    window.electron.ipcRenderer.invoke("remove:torrent", file);
  }

  if (isLoading) return;
  return (
    <div className="tab-body">
      <h1 className="tab-heading">My Files</h1>
      {isLoading ? null : (
        <div className="flex flex-col gap-3">
          {files.map(file => (
            <div key={file.filePath} className="w-full bg-zinc-700  rounded-md px-4 py-3">
              <div className="flex w-full justify-between items-center">
                <div className="flex gap-3 items-center">
                  <h1 className="mb-2">{file.fileName}</h1>
                  <span className="bg-zinc-800 px-2 py-1">{file.type}</span>
                </div>
                <button onClick={() => stopSeeding(file)} className="px-4 py-2 bg-green-700 hover:bg-green-800 rounded-md">Stop</button>
              </div>
              <div className="w-full flex justify-between items-center">
                <h3 className="text-sm">{file.filePath}</h3>
                <h3>Size: {file.size}</h3>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )

}

export default MyFiles;