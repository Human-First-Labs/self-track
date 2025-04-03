import { app, shell, BrowserWindow, ipcMain, screen, dialog } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import { startSession, endSession, detectOS } from './logic'
import { basePath, DataWriter } from './data-consolidation'
import { RendererToMainChannel, MainToRendererChannel } from './events'
import { PermissionChecker, PermissionChecks } from './permission-checker'
import os from 'os'
// import { ElevatePrivileges } from './admin-privilages'

let mainWindow: BrowserWindow
let permissionChecks: PermissionChecks

const createWindow = (): void => {
  const display = screen.getPrimaryDisplay()

  const screenWidth = display.workAreaSize.width
  const screenHeight = display.workAreaSize.height

  const width = 300
  const height = 300

  // Create the browser window.
  mainWindow = new BrowserWindow({
    alwaysOnTop: true,
    autoHideMenuBar: true,
    width,
    height,
    show: false,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      nodeIntegration: true,
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    },
    x: process.platform !== 'linux' ? screenWidth - width : undefined,
    y: process.platform !== 'linux' ? screenHeight - height : undefined
  })

  mainWindow.loadFile(join(__dirname, 'index.html'))
  // Send the application version to the render

  mainWindow.on('ready-to-show', async () => {
    try {
      permissionChecks = await PermissionChecker.checkPermissions()
    } catch (e) {
      console.error(e)
    }
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  // Set app user model id for windows
  electronApp.setAppUserModelId('com.electron')

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // Renderer to Main Calls
  const event1: RendererToMainChannel = 'start-tracking'
  ipcMain.handle(event1, async () => {
    await startSession({
      mainWindow,
      permissionChecks
    })
  })

  const event2: RendererToMainChannel = 'stop-tracking'
  ipcMain.handle(event2, endSession)

  const event3: RendererToMainChannel = 'request-version'
  ipcMain.handle(event3, () => {
    const version = app.getVersion()
    const event: MainToRendererChannel = 'send-app-version'
    mainWindow.webContents.send(event, version)
  })

  const event4: RendererToMainChannel = 'request-os'
  ipcMain.handle(event4, () => {
    try {
      const platform = detectOS()
      const event: MainToRendererChannel = 'send-os'
      mainWindow.webContents.send(event, platform)
    } catch (e) {
      console.error(e)
      dialog
        .showMessageBox({
          type: 'warning',
          title: 'Self Track does not support this OS',
          message: `We've detected that you are using an unsupported OS (${os.platform()}). Please use Linux or Windows to run this application.`,
          detail:
            "If you'd like us to support your OS, please open an issue on GitHub (https://github.com/MomoRazor/self-track/issues). We'll try our best!",
          buttons: ['Close App']
        })
        .then((response) => {
          if (response.response === 0) {
            app.quit()
          }
        })
    }
  })

  const event5: RendererToMainChannel = 'open-exports-directory'
  ipcMain.handle(event5, () => {
    shell.openPath(basePath)
  })

  DataWriter.createDirectories()

  createWindow()

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('quit', () => {
  endSession()
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
