import { dialogAtom } from "@renderer/atoms/tabAtom";
import { auth, db } from "@renderer/lib/firebase";
import { collection, doc, getDoc, setDoc } from "firebase/firestore";
import { useSetAtom } from "jotai";
import { useEffect, useRef, useState } from "react";
import { useOnClickOutside } from "usehooks-ts";

const userCol = collection(db, "users");

const Settings = () => {
  const dialogRef = useRef(null);
  const setDialogValue = useSetAtom(dialogAtom)
  const [downloadPath, setDownloadPath] = useState("");
  const [uploadPath, setUploadPath] = useState("");
  const [userName, setUserName] = useState("");
  const [isDirty, setIsDirty] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  useEffect(() => {
    async function fetchSettings() {
      const userId = auth.currentUser?.uid;
      let userSettingsDoc = await getDoc(doc(userCol, userId));
      let userData = userSettingsDoc.data()!;
      if (userData?.uploadPath) {
        setUploadPath(userData?.uploadPath);
      }
      if (userData?.downloadPath) {
        setDownloadPath(userData?.downloadPath);
      }
      setUserName(userData?.username);
      console.log(userData, userId)
      setIsLoading(false);
    }

    fetchSettings();
  }, [])

  const saveSettings = () => {
    if (isDirty) {
      const userId = auth.currentUser?.uid;
      setDoc(doc(userCol, userId), {
        uploadPath,
        downloadPath,
        username: userName
      }, { merge: true });
      setIsDirty(false);
    }
  }

  useOnClickOutside(dialogRef, () => {
    setDialogValue("none");
  })

  return (
    <div ref={dialogRef} className="absolute left-1/2 p-10 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[80ch] h-[90%] bg-zinc-800 rounded-2xl shadow-md">
      <h1 className="h-[5%] mb-5 text-3xl">Settings</h1>
      {isLoading ?
        <></>
        : (
          <>
            <div className="h-[90%] overflow-y-auto">
              <h1 className="mb-2 text-md font-semibold">General</h1>
              <div className="flex mb-4 w-full gap-2 items-center">
                <h1 className="flex-1">Display Name</h1>
                <input
                  className="px-3 flex-4 py-2 border flex gap-2 w-full rounded-md"
                  type="text"
                  value={userName}
                  onChange={(e) => {
                    if (!isDirty) {
                      setIsDirty(true)
                    }
                    setUserName(e.target.value);
                  }} />
              </div>
              <div className="flex mb-4 w-full gap-2 items-center">
                <h1 className="flex-1">
                  Dowloads Folder
                </h1>
                <button onClick={() => {
                  window.electron.ipcRenderer.invoke("open:folder").then((res) => {
                    setDownloadPath(res);
                    setIsDirty(true);
                  })
                }} className="px-3 flex-4 py-2 border flex gap-2 w-full rounded-md">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 0 1 4.5 9.75h15A2.25 2.25 0 0 1 21.75 12v.75m-8.69-6.44-2.12-2.12a1.5 1.5 0 0 0-1.061-.44H4.5A2.25 2.25 0 0 0 2.25 6v12a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9a2.25 2.25 0 0 0-2.25-2.25h-5.379a1.5 1.5 0 0 1-1.06-.44Z" />
                  </svg>
                  {downloadPath}</button>
              </div>
              <div className="flex w-full gap-2 items-center">
                <h1 className="flex-1">
                  Uploads Folder
                </h1>
                <button onClick={() => {
                  window.electron.ipcRenderer.invoke("open:folder").then(res => {
                    setUploadPath(res);
                    setIsDirty(true);
                  })
                }} className="px-3 flex-4 py-2 border flex gap-2 w-full rounded-md">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 0 1 4.5 9.75h15A2.25 2.25 0 0 1 21.75 12v.75m-8.69-6.44-2.12-2.12a1.5 1.5 0 0 0-1.061-.44H4.5A2.25 2.25 0 0 0 2.25 6v12a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9a2.25 2.25 0 0 0-2.25-2.25h-5.379a1.5 1.5 0 0 1-1.06-.44Z" />
                  </svg>
                  {uploadPath}</button>
              </div>
            </div>
            <div className="h-[5%] w-full flex justify-between">
              <span />
              <button disabled={!isDirty} onClick={saveSettings} className="px-5 disabled:pointer-events-none disabled:bg-gray-700 hover:bg-green-600 bg-green-700 py-2 rounded-md">Save</button>
            </div>
          </>
        )
      }
    </div>
  )
}

export default Settings;