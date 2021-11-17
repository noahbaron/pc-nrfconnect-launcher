/*
 * Copyright (c) 2015 Nordic Semiconductor ASA
 *
 * SPDX-License-Identifier: LicenseRef-Nordic-4-Clause
 */

import { ElectronApplication, expect, test } from '@playwright/test';
import path from 'path';

import { version } from '../../package.json';
import { checkTitleOfWindow } from '../assertions';
import { setup, teardown } from '../setupTestApp';

test.describe('basic behaviour of the launcher', () => {
    const appsRootDir = 'launcher/fixtures/one-local-app/.nrfconnect-apps';
    let app: ElectronApplication;
    test.beforeAll(async () => {
        app = await setup({
            appsRootDir,
        });
    });

    test.afterAll(async () => {
        await teardown({
            app,
            appsRootDir,
        });
    });

    test('shows package.json version in launcher window title', () =>
        checkTitleOfWindow(app, version));
});

test.describe('automatic update check', () => {
    test.describe('When enabled', () => {
        const appsRootDir =
            'launcher/fixtures/check-for-updates-at-startup-enabled/.nrfconnect-apps';
        const settingsJsonPath =
            'launcher/fixtures/check-for-updates-at-startup-enabled/settings.json';
        let app: ElectronApplication;
        test.beforeAll(async () => {
            app = await setup({
                appsRootDir,
                settingsJsonPath,
                skipUpdateApps: false,
            });
        });

        test.afterAll(async () => {
            await teardown({
                app,
                appsRootDir,
                removeAppsRootDirAfterwards: false,
            });
        });

        test('populates apps.json in .nrfconnect-apps', async () => {
            const page = await app.firstWindow();
            await page.waitForSelector('.list-group-item');

            const appsJsonFile = path.join(
                __dirname,
                '.',
                appsRootDir,
                'apps.json'
            );

            // eslint-disable-next-line import/no-dynamic-require, global-require
            const appsJson = require(appsJsonFile);
            const appNames = Object.keys(appsJson);

            expect(appNames.length).toBeGreaterThan(0);
        });
    });

    test.describe('When disabled', () => {
        const appsRootDir =
            'launcher/fixtures/check-for-updates-at-startup-disabled/.nrfconnect-apps';
        const settingsJsonPath =
            'launcher/fixtures/check-for-updates-at-startup-disabled/settings.json';

        let app: ElectronApplication;
        test.beforeAll(async () => {
            app = await setup({
                appsRootDir,
                settingsJsonPath,
                skipUpdateApps: false,
            });
        });

        test.afterAll(async () => {
            await teardown({
                app,
                appsRootDir,
                removeAppsRootDirAfterwards: true,
            });
        });

        test('populates not apps.json in .nrfconnect-apps', async () => {
            const page = await app.firstWindow();
            await page.waitForSelector('#launcher-tabpane-apps');

            const appsJsonFile = path.join(
                __dirname,
                '.',
                appsRootDir,
                'apps.json'
            );
            // eslint-disable-next-line import/no-dynamic-require, global-require
            const appsJson = require(appsJsonFile);

            expect(appsJson).toEqual({});
        });
    });
});

test.describe('showing apps available on the server', () => {
    let app: ElectronApplication;
    const appsRootDir = 'launcher/fixtures/app-installation/.nrfconnect-apps';
    test.beforeAll(async () => {
        app = await setup({
            appsRootDir,
            skipUpdateApps: false,
        });
    });

    test.afterAll(async () => {
        await teardown({ app, appsRootDir, removeAppsRootDirAfterwards: true });
    });

    test('shows apps available on the server', async () => {
        const page = await app.firstWindow();
        await page.waitForSelector('button[title*="Install"]');
    });
});
