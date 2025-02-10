import { useAtomValue } from "jotai";
import Upload from "../dialogs/Upload";
import { dialogAtom } from "@renderer/atoms/tabAtom";
import Settings from "../dialogs/Settings";

const Dialog = () => {
  const dialogValue = useAtomValue(dialogAtom);
  return (
    <>
      {dialogValue === "upload" && <Upload />}
      {dialogValue === "settings" && <Settings />}
    </>
  )
}

export default Dialog;