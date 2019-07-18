const { app, BrowserWindow, ipcMain } = require('electron');
const electronLogger = require('electron-log');
const child_process = require('child_process');
const mysql = require('mysql');
const url = require('url');
const path = require('path');
const https = require('https');
const axios = require('axios');
const fs = require('fs');
const zlib = require('zlib');
const unzipper = require('unzipper');
let maxversion = null;
let maxversionnumber = null;

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

connection.query('SELECT version FROM `soulslauncher` ORDER BY version DESC', function(error, results) {
    if(error) throw error;
    maxversion = results[0]['version']/*.toString()*/;
});

connection.query('SELECT versionnumber FROM `soulslauncher` ORDER BY version DESC', function(error, results, fields) {
    if(error) throw error;
    maxversionnumber = results[0]['versionnumber'];
});

const currentversion = 'v0.0.7-alpha';
global.currentVersion = currentversion;
const currentversionnumber = '7';
let win = null;
let splash = null;
let newVersion = null;

app.on('ready', () => {

    setInterval(() => {
        connection.query('SELECT version FROM `soulslauncher` ORDER BY version DESC', function(error, results) {
            if(error) throw error;
            maxversion = results[0]['version'];
        });
        
        connection.query('SELECT versionnumber FROM `soulslauncher` ORDER BY version DESC', function(error, results, fields) {
            if(error) throw error;
            maxversionnumber = results[0]['versionnumber'];
        });

        if(currentversion != maxversion && currentversionnumber < maxversionnumber) {
            global.maxVersion = maxversion;
            global.update = "true";
        } else {
            global.update = "false";
        }
    }, 10000);

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
        axios({
            method: 'get',
            url: `http://github.com/Kakebiten/soulslauncher/releases/download/${maxversion}/update.zip`,
            responseType: 'stream'
        })
            .then(function(response) {
                response.data.pipe(fs.createWriteStream('updates/update.zip'));
                win.focus();
                BrowserWindow.getFocusedWindow().webContents.send('updatedownloaded');
            })
            .catch(function(err) {
                console.log(err);
            });
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

/*process.on('uncaughtException', (err) => {
    console.log(err);
    app.quit();
});*/

app.on('window-all-closed', () => {
    if(process.platform != 'darwin') {
        app.quit();
    }
});