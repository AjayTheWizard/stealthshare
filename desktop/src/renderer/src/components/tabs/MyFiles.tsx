import { auth } from "@renderer/lib/firebase";
import { useEffect, useState } from "react";

const MyFiles = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [userId, setUserId] = useState("");
  const [] = useState();

  useEffect(() => {
    setUserId(auth.currentUser!.uid);
    setIsLoading(false);
  }, [])

  if (isLoading) return;
  return (
    <div className="tab-body">
      <h1 className="tab-heading">My Files</h1>
    </div>
  )
}

export default MyFiles;