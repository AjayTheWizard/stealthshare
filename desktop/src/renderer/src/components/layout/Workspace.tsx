import { tabAtom } from "@renderer/atoms/tabAtom";
import { useAtomValue } from "jotai";
import MyFiles from "../tabs/MyFiles";
import Activity from "../tabs/Activity";
import VirtualPeers from "../tabs/VirtualPeers";
import SharedWithMe from "../tabs/SharedWithMe";

const Workspace = () => {
  const tabAtomValue = useAtomValue(tabAtom);
  return (
    <div className="w-[70%] min-h-screen">
      {tabAtomValue === "my-files" && <MyFiles />}
      {tabAtomValue === "activity" && <Activity />}
      {tabAtomValue === "peers" && <VirtualPeers />}
      {tabAtomValue === "shared" && <SharedWithMe />}
    </div>
  )
}


export default Workspace;