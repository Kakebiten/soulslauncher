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
const Store = require('./store.js');
const unzipper = require('unzipper');
const currentversion = 'v0.0.9-alpha';
global.currentVersion = currentversion;
const currentversionnumber = '9';
let win = null;
let splash = null;
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
    password        : "9zOVUrtZwP9go44g",
    database        : "soulslauncher",
    port            : 3306
});

connection.connect();

connection.query('SELECT version FROM `version` ORDER BY version DESC', function(error, results) {
    if(error) throw error;
    maxversion = results[0]['version']/*.toString()*/;
});

connection.query('SELECT versionnumber FROM `version` ORDER BY version DESC', function(error, results, fields) {
    if(error) throw error;
    maxversionnumber = results[0]['versionnumber'];
});

const store = new Store({
    configName: 'user-preferences',
    defaults: {
        theme: 'dark'
    }
});

app.on('ready', () => {

    /*setInterval(() => {
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
    }, 10000);*/

    win = new BrowserWindow({ width: 1005, height: 600, icon: path.join(__dirname, "s.png"), frame: false, webPreferences: { nodeIntegration: true }, show: false, alwaysOnTop: true, minWidth: 1005, minHeight: 200, title: 'SoulsLauncher' });

    splash = new BrowserWindow({
        height: 310, width: 210, frame: false, alwaysOnTop: true, resizable: false, transparent: true, show: false, icon: path.join(__dirname, "s.png"), title: 'SoulsUpdater',webPreferences: {
            nodeIntegration: true
        }
    });

    splash.loadURL(url.format({
        pathname: path.join(__dirname, '/dist/SoulsLauncher/splash.html'),
        protocol: 'file:',
        slashes: true
    }));

    splash.once('ready-to-show', function() {
        splash.show();
        splash.focus();
        /*setTimeout(function() {
            if(currentversion != maxversion && currentversionnumber < maxversionnumber) {
                BrowserWindow.getFocusedWindow().webContents.send('update');
                global.maxVersion = maxversion;
                global.update = "true";
                global.updateDone = "no"
                do {

                } while(global.updateDone = "no");
                win.show();
                win.focus();
            }
        }, 1500);*/
    });

    win.loadURL(url.format({
        pathname: path.join(__dirname, '/dist/SoulsLauncher/index.html'),
        protocol: 'file:',
        slashes: true
    }));

    win.once('ready-to-show', () => {
        splash.focus();
        if(currentversion != maxversion && currentversionnumber < maxversionnumber) {
            splash.focus();
            BrowserWindow.getFocusedWindow().webContents.send('update');
            global.maxVersion = maxversion;
            global.update = "true";
        } else {
            splash.focus();
            let focusedWindow = BrowserWindow.getFocusedWindow();
            focusedWindow.webContents.send('ready');
            setTimeout(function() {
                splash.destroy();
                win.show();
                win.setAlwaysOnTop(false);
                win.focus();
            }, 1500);
        }
    });

    win.on('closed', () => {
        win = null;
    });

    ipcMain.on('downloadnewupdate', () => {
        splash.focus();
        let focusedWindow = BrowserWindow.getFocusedWindow();
        focusedWindow.webContents.send('downloadingupdate');
        axios({
            method: 'get',
            url: /*`http://github.com/Kakebiten/soulslauncher/releases/download/${maxversion}/update.zip`*/ 'https://sourceforge.net/projects/xampp/files/XAMPP%20Windows/7.3.7/xampp-portable-windows-x64-7.3.7-1-VC15.zip',
            responseType: 'stream',
            onDownloadProgress: function (progressEvent) {
                var percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                splash.focus();
                BrowserWindow.getFocusedWindow().webContents.send('downloadPercentage', percentCompleted);
            }
        })
            .then(function(response) {
                const stream = response.data.pipe(fs.createWriteStream('resources/app/updates/update.zip'));
                /*splash.focus();
                let focusedWindowUpdate = BrowserWindow.getFocusedWindow();
                focusedWindowUpdate.webContents.send('maxProgress', response.headers["content-length"]);
                while(response.data._readableState["length"] < response.headers["content-length"]) {
                    setTimeout(() => {
                        splash.focus();
                        focusedWindowUpdate.webContents.send('progressUpdate', response.data._readableState["length"]);
                        console.log(response.data._readableState["length"])
                    }, 300);
                }*/
                stream.on('close', () => {
                    splash.focus();
                    BrowserWindow.getFocusedWindow().webContents.send('updatedownloaded');
                });
            })
            .catch(function(err) {
                console.log(err);
            });
    });

    ipcMain.on('updateinstall', function() {
        fs.createReadStream('updates/update.zip')
            .pipe(unzipper.Extract({ path: __dirname }))
            .on('error', function(e) {
                console.log(e);
            })
            .on('close', function() {
                fs.unlink('updates/update.zip', function(err) {
                    if(err) throw err;
                    console.log('tempoary update.zip was deleted');
                });
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
    electronLogger.info(err);
    app.quit();
});

app.on('window-all-closed', () => {
    if(process.platform != 'darwin') {
        app.quit();
    }
});