import { auth, db } from "@renderer/lib/firebase";
import { and, collection, onSnapshot, query, where } from "firebase/firestore";
import { useEffect, useState } from "react";

const torrentsCol = collection(db, "torrent");

const SharedWithMe = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [userId, setUserId] = useState("");
  const [files, setFiles] = useState<[]>([]);

  useEffect(() => {
    async function fetchTorrents() {
      let userIdTmp = auth.currentUser!.uid;
      setUserId(userIdTmp);
      const privateTorrentQuery = query(torrentsCol, and(where("userId", "==", userIdTmp), where("type", "==", "private"), where("privateUsers", "array-contains", auth.currentUser!.email)));
      let unSub = onSnapshot(privateTorrentQuery, (dataDoc)=>{
        dataDoc.forEach(torrentDoc=>{
          torrentDoc.data()
        })
      })
      setIsLoading(false);
      return unSub;
    }
    fetchTorrents();
  }, [])

  if (isLoading) return;
  return (
    <div className="tab-body">
      <h1 className="tab-heading">Shared With Me</h1>
      {isLoading ? null : (
        <div>

        </div>
      )}
    </div>
  )

}

export default SharedWithMe;