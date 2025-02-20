import { atom } from 'jotai'

export type TabState = "my-files" | "activity" | "peers" | "shared";

export const tabAtom = atom<TabState>("my-files");

export type DialogState = "none" | "upload" | "settings";

export const dialogAtom = atom<DialogState>("none");

export const folderPathAtom = atom("/");
