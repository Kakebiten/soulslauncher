const { app, BrowserWindow, ipcMain } = require('electron');
const electronLogger = require('electron-log');
const child_process = require('child_process');
const mysql = require('mysql');
const url = require('url');
const path = require('path');
const http = require('http');
const fs = require('fs');
const zlib = require('zlib');
const unzipper = require('unzipper');
let maxversion = null;

const { autoUpdater } = require('electron-updater');
/*const connection = new mysql.createConnection({
    host            : "nl1-wss3.a2hosting.com",
    user            : "souln_soulslnchr",
    password        : "Xgmu96^8",
    database        : "soulnetw_users_kae",
    port            : 3306,
});*/

const connection = new mysql.createConnection({
    host            : "90.149.113.127",
    user            : "readonly",
    password        : "NVtMq31GJCeEq8Ax",
    database        : "soulslauncher",
    port            : 15603,
});

connection.connect();

//maxversionnumber = connection.query('SELECT MAX(versionnumber) FROM soulslauncher');

connection.query('SELECT version FROM `soulslauncher` ORDER BY version DESC', function(error, results) {
    if(error) throw error;
    maxversion = results[0]['version']/*.toString()*/;
});

connection.query('SELECT versionnumber FROM `soulslauncher` ORDER BY version DESC', function(error, results, fields) {
    if(error) throw error;
    maxversionnumber = results[0]['versionnumber'];
});

const currentversion = 'a0.0.3';
global.currentVersion = currentversion;
const currentversionnumber = '3';
let win = null;
let splash = null;
let newVersion = null;

app.on('ready', () => {

    win = new BrowserWindow({ width: 1005, height: 600, icon: path.join(__dirname, "s.png"), frame: false, webPreferences: { nodeIntegration: true }, show: false, alwaysOnTop: true, minWidth: 1005, minHeight: 200 });

    splash = new BrowserWindow({
        height: 310, width: 210, frame: false, alwaysOnTop: true, resizable: false, show: false, webPreferences: {
            nodeIntegration: true
        }
    });

    splash.once('ready-to-show', function() {
        splash.show();
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
//    autoUpdater.checkForUpdates()

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
            if(currentversion != maxversion && currentversionnumber < maxversionnumber) {
                BrowserWindow.getFocusedWindow().webContents.send('update');
                global.maxVersion = maxversion;
                global.update = "true";
            }
        }, 1500);
    });

    win.on('closed', () => {
        win = null;
    });

    ipcMain.on('downloadnewupdate', () => {
        let focusedWindow = BrowserWindow.getFocusedWindow();
        focusedWindow.webContents.send('downloadingupdate');
        try {
        const file = fs.createWriteStream("updates/update.zip");
        const request = http.get('http://github.com/Kakebiten/soulslauncher/releases/download/v0.0.3-alpha/update.zip', function(response) {
            response.pipe(file);
            file.on('finish', function() {
                file.close();
                win.focus();
                BrowserWindow.getFocusedWindow();
                focusedWindow.webContents.send('updateDownloaded');
            }).on('error', function(err) {
                console.log(err);
            });
            
        });
        }catch(err) {
            console.log(err);
            electronLogger.error(err);
        }
    });

    ipcMain.on('updateinstall', function() {
        child_process.exec('node update.js', function(error, stdout, stderr) {
            console.log(`${stdout}`);
            console.log(`${stderr}`);
            if(error !== null) {
                console.log(`exec error: ${error}`);
            }
            app.relaunch();
            app.quit();
        });
    });
});

app.on('activate', () => {
    if (win == null)
    createWindow()
});

process.on('uncaughtException', (err) => {
    console.log(err);
    app.quit();
});

app.on('window-all-closed', () => {
    if(process.platform != 'darwin') {
        app.quit();
    }
});