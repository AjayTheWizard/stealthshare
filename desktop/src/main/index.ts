import { app, shell, BrowserWindow, ipcMain, dialog } from 'electron'
import path, { basename, join } from 'path'
import { optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import { appendFileSync, existsSync, mkdirSync, statSync, readFile } from 'fs'
import { filesize } from 'filesize'
import type WebTorrent from 'webtorrent'
import { addDoc, collection, deleteDoc, doc, getDoc, setDoc } from 'firebase/firestore'
import { db } from './firebase'

let torrentClient: WebTorrent.Instance
let WebTorrentImp: any
;(async () => {
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

let mainWindow: BrowserWindow

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
      sandbox: false
    }
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

  ipcMain.handle('open:folder', async (_event) => {
    const { filePaths, canceled } = await dialog.showOpenDialog(mainWindow!, {
      properties: ['openDirectory']
    })
    if (canceled) {
      return 'cancelled'
    }
    return filePaths[0]
  })

  ipcMain.handle('open:file', async (_event) => {
    const { filePaths, canceled } = await dialog.showOpenDialog(mainWindow!, {
      properties: ['openFile']
    })
    if (canceled) {
      return 'cancelled'
    }
    const fileStat = statSync(filePaths[0])
    return {
      filename: basename(filePaths[0]),
      path: filePaths[0],
      size: filesize(fileStat.size, { standard: 'jedec' })
    }
  })

  ipcMain.handle(
    'upload:files',
    async (
      _event,
      files: { filename: string; path: string; type: 'private' | 'public'; size: string }[]
    ) => {
      let alreadyPeered: {
        filename: string
        path: string
        type: 'private' | 'public'
        size: string
      }[] = []

      try {
        const results = await Promise.all(
          files.map((file) => {
            return new Promise<{ filename: string; magnetURI: string; path: string, size: string } | null>(
              (resolve) => {
                readFile(file.path, (_err, dataBuffer) => {
                  log(file.path)
                  //@ts-ignore
                  dataBuffer.name = basename(file.path)
                  torrentClient.seed(dataBuffer, (torrent) => {
                    resolve({
                      filename: file.filename,
                      magnetURI: torrent.magnetURI,
                      path: file.path,
                      size: file.size
                    })
                  })
                })
              }
            )
          })
        )



        return results.filter((result) => result !== null) // Return seeded files with magnetURIs
      } catch (e) {
        console.error('Error seeding files:', e)
        throw new Error('Seeding failed.')
      }
    }
  )

  type TorrentDoc = {
    id: string
    userId: string
    folder: string
    filePath: string
    fileName: string
    size: string
    magnetURI: string
    privateUsers: string[]
    type: 'private' | 'public'
  }

  ipcMain.handle('remove:torrent', async (_event, file: TorrentDoc) => {
    const torrentsCol = collection(db, 'torrent')
    log(JSON.stringify(file))
    try {
      torrentClient.torrents.map((e) => {
        if (e.magnetURI === file.magnetURI) {
          e.destroy()
          log('Deleted')
        }
      })
      deleteDoc(doc(torrentsCol, file.id))
    } catch (e) {}
  })

  ipcMain.handle('download:torrent', async (event, file: TorrentDoc) => {
    const { canceled, filePaths } = await dialog.showOpenDialog(mainWindow!, {
      properties: ['openDirectory']
    })
    if (canceled) {
      return ''
    }
    let folderPath = filePaths[0]
    // const newMagnetURlResp = await fetch(`http://localhost:5000/proxy/start?magnetURI=${file.magnetURI}`);
    // if (!newMagnetURlResp.ok) {
    //   return "Failed";
    // }
    // const newMagnetURLJson = await newMagnetURlResp.json();
    type DownloadInfo = {
      downloadSpeed: number
      uploadSpeed: number
      noOfPeers: number
      progress: number
    }
    log('Hii' + file.magnetURI)
    torrentClient.add(file.magnetURI, { path: folderPath }, (torrent) => {
      log(file.magnetURI + ' ' + torrent.magnetURI)
      torrent.on('done', () => {
        event.sender.send('download:done')
      })

      torrent.on('download', () => {
        let info: DownloadInfo = {
          noOfPeers: torrent.numPeers,
          uploadSpeed: torrent.uploadSpeed,
          downloadSpeed: torrent.downloadSpeed,
          progress: torrent.progress
        }
        event.sender.send('download:info', file.filePath, info)
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
