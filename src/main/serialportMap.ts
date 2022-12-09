/*
 * Copyright (c) 2022 Nordic Semiconductor ASA
 *
 * SPDX-License-Identifier: LicenseRef-Nordic-4-Clause
 */

import { AutoDetectTypes } from '@serialport/bindings-cpp';
import { WebContents } from 'electron';
import { SerialPort, SerialPortOpenOptions } from 'serialport';

export type Renderer = Pick<WebContents, 'on' | 'send' | 'id'>;
export type OpenPort = {
    serialPort: SerialPort;
    renderers: Renderer[];
    settingsLocked: boolean;
    opening: boolean;
    options: SerialPortOpenOptions<AutoDetectTypes>;
};

const mapPath = (path: string) =>
    process.platform === 'win32' ? path.toLowerCase() : path;

class SerialPortMap {
    map = new Map<string, OpenPort>();

    set = (path: string, value: OpenPort) => {
        this.map.set(mapPath(path), value);
    };

    get = (path: string) => this.map.get(mapPath(path));

    has = (path: string) => this.map.has(mapPath(path));

    delete = (path: string) => this.map.delete(mapPath(path));

    clear = () => {
        this.map.clear();
    };

    broadCast = (path: string, channel: string, ...args: unknown[]) => {
        this.get(path)?.renderers.forEach(renderer => {
            renderer.send(channel, ...args);
        });
    };
}

export const serialPorts = new SerialPortMap();
