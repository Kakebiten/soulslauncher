var { app, BrowserWindow, ipcMain } = require('electron');
var mysql = require('mysql');
var url = require('url');
var path = require('path');
let maxversion;

const { autoUpdater } = require('electron-updater');
const connection = new mysql.createConnection({
    host            : "localhost",
    user            : "root",
    password        : "",
    database        : "soulslauncher",
    port            : 3306
});

connection.connect();

//maxversionnumber = connection.query('SELECT MAX(versionnumber) FROM soulslauncher');

connection.query('SELECT version FROM `soulslauncher` ORDER BY version DESC', function(error, results, fields) {
    if(error) throw error;
    maxversion = results[0];
});

const currentversion = 'a0.0.1';
let win = null;
let splash = null;
let newVersion = null;

app.on('ready', () => {

    win = new BrowserWindow({ width: 1005, height: 600, icon: path.join(__dirname, "s.png"), frame: false, webPreferences: { nodeIntegration: true }, show: false, alwaysOnTop: true, minWidth: 1005, minHeight: 200 });

    splash = new BrowserWindow({
        height: 310, width: 210, frame: false, alwaysOnTop: true, resizable: false, webPreferences: {
            nodeIntegration: true
        }
    });
    splash.loadURL(url.format({
        pathname: path.join(__dirname, '/dist/SoulsLauncher/splash.html'),
        protocol: 'file:',
        slashes: true
    }));

    win.loadURL(url.format({
        pathname: path.join(__dirname, '/dist/SoulsLauncher/index.html'),
        protocol: 'file:',
        slashes: true
    }));

    autoUpdater.fullChangelog = false;
    autoUpdater.checkForUpdates()

    autoUpdater.on('update-available', function(info) {
        newVersion = true;
    });

    autoUpdater.on('update-not-available', function(info) {
        newVersion = false;
    });

    win.once('ready-to-show', () => {
        splash.focus();
        let focusedWindow = BrowserWindow.getFocusedWindow();
        focusedWindow.webContents.send('ready');
        setTimeout(function() {
            splash.destroy();
            win.show();
            win.setAlwaysOnTop(false);
            win.focus();
            if(newVersion == true) {
                BrowserWindow.getFocusedWindow().webContents.send('update');
                global.update = "true";
            }
        }, 1500);
    });

    win.on('closed', () => {
        win = null;
    });
});

app.on('activate', () => {
    if (win == null)
    createWindow()
});

app.on('window-all-closed', () => {
    if(process.platform != 'darwin') {
        app.quit();
    }
});