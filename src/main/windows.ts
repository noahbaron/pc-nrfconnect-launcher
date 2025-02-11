/*
 * Copyright (c) 2015 Nordic Semiconductor ASA
 *
 * SPDX-License-Identifier: LicenseRef-Nordic-4-Clause
 */

import {
    app as electronApp,
    BrowserWindow,
    Rectangle,
    screen,
    WebContents,
} from 'electron';
import fs from 'fs';
import path from 'path';
import { OpenAppOptions } from 'pc-nrfconnect-shared/main';

import { AppDetails } from '../ipc/appDetails';
import { AppSpec, isInstalled, LaunchableApp } from '../ipc/apps';
import { registerLauncherWindowFromMain as registerLauncherWindow } from '../ipc/infrastructure/mainToRenderer';
import { LOCAL } from '../ipc/sources';
import { getDownloadableApps, getLocalApps } from './apps';
import * as browser from './browser';
import bundledJlinkVersion from './bundledJlinkVersion';
import { getConfig, getElectronResourcesDir } from './config';
import * as settings from './settings';

let launcherWindow: BrowserWindow | undefined;
const appWindows: {
    browserWindow: BrowserWindow;
    app: LaunchableApp;
}[] = [];

const getDefaultIconPath = () =>
    path.join(
        getElectronResourcesDir(),
        process.platform === 'win32' ? 'icon.ico' : 'icon.png'
    );

export const ifExists = (filePath: string) =>
    fs.existsSync(filePath) ? filePath : undefined;

const getAppIcon = (app: LaunchableApp) =>
    ifExists(path.join(app.path, 'resources', 'icon.png')) ??
    getDefaultIconPath();

export const openLauncherWindow = () => {
    if (launcherWindow) {
        launcherWindow.show();
    } else {
        launcherWindow = createLauncherWindow();
    }
};

const createLauncherWindow = () => {
    const window = browser.createWindow({
        title: `nRF Connect for Desktop v${getConfig().version}`,
        url: `file://${getElectronResourcesDir()}/launcher.html`,
        icon: getDefaultIconPath(),
        width: 760,
        height: 600,
        center: true,
        splashScreen: !getConfig().isSkipSplashScreen,
    });

    registerLauncherWindow(window);

    window.on('close', event => {
        if (appWindows.length > 0) {
            event.preventDefault();
            window.hide();
        }
    });

    // @ts-expect-error Custom event
    window.on('restart-window', () => window.reload());

    return window;
};

export const hideLauncherWindow = () => {
    launcherWindow?.hide();
};

export const openAppWindow = (
    app: LaunchableApp,
    openAppOptions: OpenAppOptions = {}
) => {
    const { lastWindowState } = settings.get();

    let { x, y } = lastWindowState;
    const { width, height } = lastWindowState;

    if (x && y) {
        const { bounds } = screen.getDisplayMatching(
            lastWindowState as Rectangle
        );
        const left = Math.max(x, bounds.x);
        const top = Math.max(y, bounds.y);
        const right = Math.min(x + width, bounds.x + bounds.width);
        const bottom = Math.min(y + height, bounds.y + bounds.height);
        if (left > right || top > bottom) {
            // the window would be off screen, let's open it where the launcher is
            x = undefined;
            y = undefined;
        }
    }

    const { device } = openAppOptions;
    const additionalArguments: string[] = [];
    if (device != null) {
        additionalArguments.push('--deviceSerial', device.serialNumber);

        if (device.serialPortPath != null) {
            additionalArguments.push('--comPort', device.serialPortPath);
        }
    }

    const appWindow = browser.createWindow(
        {
            title: `${app.displayName || app.name} v${app.currentVersion}`,
            url: `file://${getElectronResourcesDir()}/app.html?appPath=${
                app.path
            }`,
            icon: getAppIcon(app),
            x,
            y,
            width,
            height,
            minHeight: 500,
            minWidth: 760,
            show: true,
            backgroundColor: '#fff',
        },
        additionalArguments
    );

    appWindows.push({
        browserWindow: appWindow,
        app,
    });

    appWindow.webContents.on('did-finish-load', () => {
        if (lastWindowState.maximized) {
            appWindow.maximize();
        }
    });

    appWindow.on('close', () => {
        const bounds = appWindow.getBounds();
        settings.setLastWindowState({
            x: bounds.x,
            y: bounds.y,
            width: bounds.width,
            height: bounds.height,
            maximized: appWindow.isMaximized(),
        });
    });

    let reloading = false;

    appWindow.on('closed', () => {
        const index = appWindows.findIndex(
            appWin => appWin.browserWindow === appWindow
        );
        if (index > -1) {
            appWindows.splice(index, 1);
        }
        if (
            appWindows.length === 0 &&
            !launcherWindow?.isVisible() &&
            !reloading
        ) {
            electronApp.quit();
        }
    });

    // @ts-expect-error Custom event
    appWindow.once('restart-window', () => {
        reloading = true;
        appWindow.close();
        appWindow.once('closed', () => {
            openAppWindow(app);
            reloading = false;
        });
    });
};

export const openApp = (app: AppSpec, openAppOptions?: OpenAppOptions) => {
    if (app.source === LOCAL) {
        openLocalAppWindow(app.name, openAppOptions);
    } else {
        openDownloadableAppWindow(app, openAppOptions);
    }
};

export const openDownloadableAppWindow = (
    appSpec: AppSpec,
    openAppOptions?: OpenAppOptions
) => {
    const downloadableApp = getDownloadableApps().apps.find(
        app => app.name === appSpec.name && app.source === appSpec.source
    );

    if (downloadableApp != null && isInstalled(downloadableApp)) {
        openAppWindow(downloadableApp, openAppOptions);
    } else {
        throw new Error(
            `Tried to open app ${appSpec.name} from source ${appSpec.source}, but it is not installed`
        );
    }
};

export const openLocalAppWindow = (
    appName: string,
    openAppOptions?: OpenAppOptions
) => {
    const localApp = getLocalApps(false).find(app => app.name === appName);

    if (localApp) {
        openAppWindow(localApp, openAppOptions);
    } else {
        throw new Error(
            `Tried to open local app ${appName}, but it is not installed`
        );
    }
};

const getAppWindow = (sender: WebContents) => {
    const parentWindow = BrowserWindow.fromWebContents(sender);
    return appWindows.find(appWin => appWin.browserWindow === parentWindow);
};

export const getAppDetails = (webContents: WebContents): AppDetails => {
    const appWindow = getAppWindow(webContents);

    if (appWindow == null) {
        throw new Error(
            `No app window found for webContents '${webContents.getTitle()}' ${webContents.getURL()}`
        );
    }

    const config = getConfig();

    return {
        coreVersion: config.version,
        corePath: electronApp.getAppPath(),
        homeDir: electronApp.getPath('home'),
        tmpDir: electronApp.getPath('temp'),
        bundledJlink: bundledJlinkVersion,
        ...appWindow.app,
    };
};
