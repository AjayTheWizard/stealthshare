import { app, shell, BrowserWindow, ipcMain, dialog } from 'electron'
import path, { basename, join } from 'path'
import { optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import { appendFileSync, existsSync, mkdirSync, statSync, readFile } from 'fs';
import { filesize } from "filesize"
import type WebTorrent from 'webtorrent';
import { addDoc, collection, deleteDoc, doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from './firebase';

let torrentClient: WebTorrent.Instance
let WebTorrentImp: any
  ; (async () => {
    WebTorrentImp = (await import('webtorrent')).default
    torrentClient = new WebTorrentImp()
  })()

const logDir = path.join(process.cwd(), 'logs')
if (!existsSync(logDir)) {
  mkdirSync(logDir)
}
const log = (e: any) => {
  if (Array.isArray(e)) {
    e.map((k) => {
      appendFileSync(path.join(logDir, 'main.log'), k + '\n', 'utf-8')
    })
    return
  }

  appendFileSync(path.join(logDir, 'main.log'), e + '\n', 'utf-8')
}


// import WebTorrent from 'webtorrent';

let mainWindow: BrowserWindow;

function createWindow(): void {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 900,
    height: 670,
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
    },
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })


  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

app.whenReady().then(() => {

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  ipcMain.handle("open:folder", async (_event) => {
    const { filePaths, canceled } = await dialog.showOpenDialog(mainWindow!, {
      properties: ['openDirectory']
    })
    if (canceled) {
      return "cancelled"
    }
    return filePaths[0];
  })

  ipcMain.handle("open:file", async (_event) => {
    const { filePaths, canceled } = await dialog.showOpenDialog(mainWindow!, {
      properties: ['openFile']
    })
    if (canceled) {
      return "cancelled"
    }
    const fileStat = statSync(filePaths[0]);
    return {
      filename: basename(filePaths[0]),
      path: filePaths[0],
      size: filesize(fileStat.size, { standard: "jedec" })
    };
  })

  ipcMain.handle("upload:files", async (_event, files: { filename: string, path: string, type: "private" | "public", size: string }[], userId: string, folder: string, privateUsers: string[]) => {
    const torrentsCol = collection(db, "torrent");
    const usersCol = collection(db, "users");
    let alreadyPeered: { filename: string, path: string, type: "private" | "public", size: string }[] = [];
    const userDataDoc = await getDoc(doc(usersCol, userId));
    const paths = new Set(userDataDoc.data()?.paths as string[] ?? []);

    try {
      files.map(file => {
        readFile(file.path, async (_err, dataBuffer) => {
          //@ts-ignore
          dataBuffer.name = basename(file.path);
          if (!paths.has(file.path)) {
            torrentClient.seed(dataBuffer, async (torrent) => {
              addDoc(torrentsCol, {
                userId: userId,
                folder: folder,
                filePath: file.path,
                fileName: file.filename,
                size: file.size,
                magnetURI: torrent.magnetURI,
                privateUsers: privateUsers,
                type: file.type
              });
              paths.add(file.path);
            })
          } else {
            alreadyPeered.push(file);
          }
          setDoc(
            doc(usersCol, userId),
            {
              paths: Array.from(paths.values())
            },
            { merge: true }
          )

        })
      })
      return alreadyPeered;
    } catch (e) {
      throw new Error();
    }

  })

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


  ipcMain.handle("remove:torrent", async (_event, file: TorrentDoc) => {
    const torrentsCol = collection(db, "torrent");
    log(JSON.stringify(file));
    try {
      torrentClient.torrents.map(e => {
        if (e.magnetURI === file.magnetURI) {
          e.destroy();
          log("Deleted")
        }
      })
      deleteDoc(doc(torrentsCol, file.id));
    } catch (e) {
    }
  })

  ipcMain.handle("download:torrent", async (event, file: TorrentDoc) => {

    const { canceled, filePaths } = await dialog.showOpenDialog(mainWindow!, {
      properties: ["openDirectory"]
    })
    if (canceled) {
      return "";
    }
    let folderPath = filePaths[0];
    torrentClient.add(file.magnetURI, { path: folderPath }, (torrent) => {
      log(file.magnetURI + " " + torrent.magnetURI);
      torrent.on("done", ()=>{
        event.sender.send("download:done");
      })
    
    })
  })

  createWindow()

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
