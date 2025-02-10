import { dialogAtom, tabAtom } from "@renderer/atoms/tabAtom";
import { useAtom, useSetAtom } from "jotai";

const Sidebar = () => {
  const [tabAtomValue, setTabAtom] = useAtom(tabAtom);
  const setDialogState = useSetAtom(dialogAtom);
  return (
    <div className="w-[30%] justify-between min-h-screen flex flex-col gap-4 border-r-2">
      <div className="flex flex-col gap-4">
        <h1 className="text-2xl font-semibold mt-8">StealthShare</h1>
        <div className="border-b pb-4">
          <button onClick={() => { setDialogState("upload") }} className="bg-[rgba(255,255,255,0.1)] flex gap-1 rounded-xl items-center px-5 justify-center py-3">Upload
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
          </button>
        </div>
        <div className="flex flex-col gap-1">
          <button onClick={() => {
            setTabAtom("my-files")
          }} className={`text-start text-lg hover:bg-zinc-800 cursor-pointer transition-all duration-150 px-2 py-2 ${tabAtomValue == "my-files" ? "bg-zinc-800" : ""}`}>My Files</button>
          <button onClick={() => {
            setTabAtom("shared")
          }} className={`text-start text-lg hover:bg-zinc-800 cursor-pointer transition-all duration-150 px-2 py-2 ${tabAtomValue == "shared" ? "bg-zinc-800" : ""}`}>Shared With Me</button>
          <button onClick={() => {
            setTabAtom("activity")
          }} className={`text-start text-lg hover:bg-zinc-800 cursor-pointer transition-all duration-150 px-2 py-2 ${tabAtomValue == "activity" ? "bg-zinc-800" : ""}`}>Activity</button>
          <button onClick={() => {
            setTabAtom("peers")
          }} className={`text-start text-lg hover:bg-zinc-800 cursor-pointer transition-all duration-150 px-2 py-2 ${tabAtomValue == "peers" ? "bg-zinc-800" : ""}`}>Virtual Peers</button>
        </div>
      </div>
      <div>
        <button onClick={() => { setDialogState("settings") }} className="text-xl justify-center font-semibold flex gap-2 items-center">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
          </svg>
          <span>
            Settings
          </span>
        </button>
      </div>
    </div>
  )
}

export default Sidebar;