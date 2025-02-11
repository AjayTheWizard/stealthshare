import { dialogAtom } from "@renderer/atoms/tabAtom";
import { auth, db } from "@renderer/lib/firebase";
import { collection, doc, getDoc } from "firebase/firestore";
import { useSetAtom } from "jotai";
import { useEffect, useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";
import { useOnClickOutside } from "usehooks-ts";

type FileType = "public" | "private";

const userCol = collection(db, "users");

const validateEmail = (email) => {
  return String(email)
    .toLowerCase()
    .match(
      /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|.(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
    );
};

const Upload = () => {
  const [privateUsers, setPrivateUsers] = useState<string[]>([])
  const dialogRef = useRef(null);
  const setDialogValue = useSetAtom(dialogAtom);
  const [isLoading, setIsLoading] = useState(true);
  const [privateField, setPrivateField] = useState("")
  const [uploadPath, setUploadPath] = useState("");

  const [files, setFiles] = useState<{ filename: string, path: string, type: FileType, size: string }[]>([]);

  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    async function fetchSettings() {
      const userId = auth.currentUser?.uid;
      let userSettingsDoc = await getDoc(doc(userCol, userId));
      let userData = userSettingsDoc.data()!;
      if (userData?.uploadPath) {
        setUploadPath(userData?.uploadPath);
      }
      setIsLoading(false);
    }

    fetchSettings();
  }, [])


  const onPrivateFieldType = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      let trimed = privateField.trim();
      setPrivateField("");

      if (!validateEmail(trimed)) {
        toast.error("Please enter valid Email!");
        return;
      }
      if (trimed !== "") {
        setPrivateUsers(e => [...e, trimed]);
      }
    }
    if (e.key === ",") {
      e.preventDefault();
      let trimed = privateField.trim();
      setPrivateField("");
      if (!validateEmail(trimed)) {
        toast.error("Please enter valid Email!");
        return;
      }
      if (trimed !== "") {
        setPrivateUsers(e => [...e, trimed]);
      }
    }
  }

  useOnClickOutside(dialogRef, () => {
    if (isUploading) {
      return;
    }
    setDialogValue("none");
  })

  const addNewFile = async () => {
    window.electron.ipcRenderer.invoke("open:file", uploadPath).then((file: { filename: string, path: string, size: string }) => {
      if (typeof file === "string") {
        return;
      }
      let doesExist = false;
      for (let tFile of files) {
        if (tFile.path === file.path) {
          doesExist = true;
          break;
        }
      }

      if (doesExist) {
        toast.error("Duplicate Files");
        return;
      }

      setFiles(files => [...files, { filename: file.filename, path: file.path, type: "public", size: file.size }])
    });
  }

  const isPrivate = useMemo(() => {
    let isP = false;
    for (let file of files) {
      if (file.type === "private") {
        isP = true;
        break;
      }
    }
    return isP;
  }, [files]);

  const uploadFile = () => {
    setIsUploading(true);
    if (isUploading) {
      window.electron.ipcRenderer.invoke("upload:files", files, auth.currentUser?.uid, "/", privateUsers).then((exFiles: {
        filename: string;
        path: string;
        type: "private" | "public";
        size: string;
      }[]) => {
        exFiles.map(exFile => {
          toast.error(`Path ${exFile.path} is already seeding`)
        })
        setDialogValue("none");
        setIsUploading(false);
      }).catch(_ => {
        toast.error("Something went wrong!")
        setIsUploading(false);
      });
    }
  }

  return (
    <div ref={dialogRef} className="absolute left-1/2 p-5 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[80ch] h-[90%] bg-zinc-800 rounded-2xl shadow-md">
      {isLoading ? <></> :
        <>
          <h1 className="h-[5%] text-2xl">Upload Files</h1>
          {files.length === 0 ?
            <>
              <div onClick={addNewFile} className="w-full h-[90%] flex justify-center items-center">
                <button className="w-[60%] h-[40%] flex gap-2 items-center justify-center bg-zinc-600 rounded-2xl">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m3.75 9v6m3-3H9m1.5-12H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                  </svg>
                  Upload New
                </button>
              </div>
              <div className="h-[7%] w-full flex justify-between">
                <span />
                <button disabled className="px-5 rounded-lg bg-zinc-700 py-2">Upload</button>
              </div>
            </>
            :
            <div className="h-[95%] flex-col justify-between w-full">
              <div className="flex h-[93%] flex-col gap-3 px-3">
                <div className="flex w-full items-center justify-between">
                  <h2>Files ({files.length})</h2>
                  <button
                    hidden={isUploading}
                    onClick={() => setFiles([])}
                    className="text-green-600 hover:underline hover:decoration-green-600 transition-all duration-300"
                  >Clear All</button>
                </div>
                <div className="flex flex-col gap-3 overflow-y-auto mb-1">
                  {files.map(file => (
                    <div key={file.path} className="w-full bg-zinc-700  rounded-md px-4 py-3">
                      <div className="flex w-full justify-between items-center">
                        <div className="flex gap-3 items-center">
                          <h1 className="mb-2">{file.filename}</h1>
                          <select className="bg-zinc-800 px-2 py-1 outline-none" value={file.type} onChange={(e) => {
                            setFiles(prevFiles => prevFiles.map(prevFile => {
                              let newValue = e.target.value as FileType;
                              if (prevFile.path === file.path) {
                                return {
                                  ...prevFile,
                                  type: newValue
                                }
                              }
                              return prevFile;
                            }))
                          }}
                          >
                            <option value="public">Public</option>
                            <option value="private">Private</option>
                          </select>
                        </div>
                        <button hidden={isUploading} onClick={() => {
                          setFiles(files => files.filter(e => e.path != file.path))
                        }}>
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                      <div className="w-full flex justify-between items-center">
                        <h3 className="text-sm">{file.path}</h3>
                        <h3>Size: {file.size}</h3>
                      </div>
                    </div>
                  ))}
                </div>
                {isPrivate &&
                  (


                    <div className="mb-5">
                      <h1>Private</h1>
                      <input
                        type="text"
                        value={privateField}
                        onChange={e => setPrivateField(e.target.value)}
                        onKeyDown={onPrivateFieldType}
                        className="px-2 outline-none mb-2 py-1 border"
                      />
                      {privateUsers.length > 0 &&
                        (
                          <div className="flex gap-2">
                            {privateUsers.map((e, idx) =>
                              <button
                                onClick={() => setPrivateUsers(users => [...users.slice(0, idx), ...users.slice(idx + 1)])}
                                className="px-2 py-1 border"
                                key={e}
                              >
                                {e}
                              </button>)
                            }
                          </div>
                        )
                      }
                    </div>
                  )
                }
              </div>
              <div className="flex h-[7%] w-full justify-between">
                <button onClick={addNewFile} className="flex gap-2 px-5 py-6 hover:bg-zinc-700 items-center justify-center bg-zinc-600 rounded-2xl">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m3.75 9v6m3-3H9m1.5-12H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                  </svg>
                  New
                </button>
                <button data-uploading={isUploading} onClick={uploadFile} className="px-5 hover:data-[uploading]:bg-green-700 rounded-lg hover:bg-green-900 bg-green-700 py-2">{isUploading ? "Uploading..." : "Upload"}</button>
              </div>
            </div>
          }
        </>
      }

    </div>
  )
}

export default Upload;