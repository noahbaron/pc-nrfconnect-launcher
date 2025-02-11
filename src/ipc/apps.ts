/*
 * Copyright (c) 2022 Nordic Semiconductor ASA
 *
 * SPDX-License-Identifier: LicenseRef-Nordic-4-Clause
 */

import { handle, invoke } from './infrastructure/rendererToMain';
import { LOCAL, SourceName } from './sources';

export interface AppSpec {
    name: string;
    source: SourceName;
}

export interface DownloadableAppInfoBase {
    displayName: string;
    description: string;
    url: string;
    homepage?: string;
}

export interface DownloadableAppInfo extends AppSpec, DownloadableAppInfoBase {}

interface BaseApp {
    name: string;
    displayName: string;
    description: string;
    iconPath?: string;
}

interface InstalledApp extends BaseApp {
    currentVersion: string;
    path: string;
    shortcutIconPath: string;
    engineVersion?: string;
    repositoryUrl?: string;
}

export interface LocalApp extends InstalledApp {
    source: typeof LOCAL;
    iconPath: string;
}
export interface UninstalledDownloadableApp
    extends BaseApp,
        DownloadableAppInfo {
    source: SourceName;
    latestVersion: string;
    releaseNote?: string;
    currentVersion: undefined;
}

export interface InstalledDownloadableApp
    extends InstalledApp,
        DownloadableAppInfo {
    source: SourceName;
    iconPath: string;
    latestVersion: string;
    releaseNote?: string;
}

export interface WithdrawnApp extends InstalledApp, DownloadableAppInfo {
    url: '';
    source: SourceName;
    iconPath: string;
}

export type DownloadableApp =
    | InstalledDownloadableApp
    | UninstalledDownloadableApp
    | WithdrawnApp;

export type LaunchableApp = LocalApp | InstalledDownloadableApp | WithdrawnApp;

export type App = LocalApp | DownloadableApp;

export interface AppWithError extends AppSpec {
    reason: unknown;
    path: string;
}

export const isDownloadable = (app: App): app is DownloadableApp =>
    app.source !== LOCAL;

export const isInstalled = (app: App): app is LaunchableApp =>
    app.currentVersion != null;

export const isWithdrawn = (app: App): app is WithdrawnApp =>
    isDownloadable(app) && !('latestVersion' in app);

export const updateAvailable = (app: InstalledDownloadableApp) =>
    app.currentVersion !== app.latestVersion;

const channel = {
    downloadAllAppsJsonFiles: 'apps:download-all-apps-json-files',
    getLocalApps: 'apps:get-local-apps',
    getDownloadableApps: 'apps:get-downloadable-apps',
    downloadReleaseNotes: 'apps:download-release-notes',
    downloadAppIcon: 'apps:download-app-icon',
    installDownloadableApp: 'apps:install-downloadable-app',
    installLocalApp: 'apps:install-local-app',
    removeLocalApp: 'apps:remove-local-app',
    removeDownloadableApp: 'apps:remove-downloadable-app',
};

// downloadAllAppsJsonFiles

type DownloadAllAppsJsonFiles = () => void;

export const downloadAllAppsJsonFiles = invoke<DownloadAllAppsJsonFiles>(
    channel.downloadAllAppsJsonFiles
);
export const registerDownloadAllAppsJsonFiles =
    handle<DownloadAllAppsJsonFiles>(channel.downloadAllAppsJsonFiles);

// getLocalApps

type GetLocalApps = () => LocalApp[];

export const getLocalApps = invoke<GetLocalApps>(channel.getLocalApps);
export const registerGetLocalApps = handle<GetLocalApps>(channel.getLocalApps);

// getDownloadableApps

type GetDownloadableApps = () => {
    apps: DownloadableApp[];
    appsWithErrors: AppWithError[];
};

export const getDownloadableApps = invoke<GetDownloadableApps>(
    channel.getDownloadableApps
);
export const registerGetDownloadableApps = handle<GetDownloadableApps>(
    channel.getDownloadableApps
);

// downloadReleaseNotes
type DownloadReleaseNotes = (app: DownloadableApp) => string | undefined;

export const downloadReleaseNotes = invoke<DownloadReleaseNotes>(
    channel.downloadReleaseNotes
);
export const registerDownloadReleaseNotes = handle<DownloadReleaseNotes>(
    channel.downloadReleaseNotes
);

// downloadAppIcon
type DownloadAppIcon = (app: DownloadableApp) => string | undefined;

export const downloadAppIcon = invoke<DownloadAppIcon>(channel.downloadAppIcon);
export const registerDownloadAppIcon = handle<DownloadAppIcon>(
    channel.downloadAppIcon
);

// installDownloadableApp
type InstallDownloadableApp = (
    app: DownloadableAppInfo,
    version: string
) => DownloadableApp;

export const installDownloadableApp = invoke<InstallDownloadableApp>(
    channel.installDownloadableApp
);
export const registerInstallDownloadableApp = handle<InstallDownloadableApp>(
    channel.installDownloadableApp
);

// installLocalApp

export const successfulInstall = (app: LocalApp) =>
    ({
        type: 'success',
        app,
    } as const);

export const failureReadingFile = (errorMessage: string, error?: unknown) =>
    ({
        type: 'failure',
        errorType: 'error reading file',
        errorMessage,
        error,
    } as const);

export const appExists = (appName: string, appPath: string) =>
    ({
        type: 'failure',
        errorType: 'error because app exists',
        appName,
        appPath,
    } as const);

export type InstallResult =
    | ReturnType<typeof successfulInstall>
    | ReturnType<typeof failureReadingFile>
    | ReturnType<typeof appExists>;

type InstallLocalApp = (path: string) => InstallResult;

export const installLocalApp = invoke<InstallLocalApp>(channel.installLocalApp);
export const registerInstallLocalApp = handle<InstallLocalApp>(
    channel.installLocalApp
);

// removeLocalApp
type RemoveLocalApp = (appName: string) => void;

export const removeLocalApp = invoke<RemoveLocalApp>(channel.removeLocalApp);
export const registerRemoveLocalApp = handle<RemoveLocalApp>(
    channel.removeLocalApp
);

// removeDownloadableApp
type RemoveDownloadableApp = (app: AppSpec) => void;

export const removeDownloadableApp = invoke<RemoveDownloadableApp>(
    channel.removeDownloadableApp
);
export const registerRemoveDownloadableApp = handle<RemoveDownloadableApp>(
    channel.removeDownloadableApp
);
