/*
 * Copyright (c) 2015 Nordic Semiconductor ASA
 *
 * SPDX-License-Identifier: LicenseRef-Nordic-4-Clause
 */

import React, { useRef } from 'react';

import { useLauncherDispatch } from '../../util/hooks';
import { installLocalApp } from '../apps/appsEffects';
import DropZoneInfo from './DropZoneInfo';
import { hideDropZone, showDropZone } from './localAppInstallSlice';

const DropZoneForLocalApps: React.FC = ({ children }) => {
    const dispatch = useLauncherDispatch();
    const enterCounter = useRef(0);

    const installAppPackage: React.DragEventHandler = event => {
        event.preventDefault();

        [...event.dataTransfer.files].forEach(file =>
            dispatch(installLocalApp(file.path))
        );

        enterCounter.current = 0;
        dispatch(hideDropZone());
    };

    const showAddCursor: React.DragEventHandler = event => {
        event.preventDefault();
        event.dataTransfer.dropEffect = 'copy';
    };

    const maybeShowDropZone: React.DragEventHandler = () => {
        if (enterCounter.current === 0) {
            dispatch(showDropZone());
        }
        enterCounter.current += 1;
    };

    const maybeHideDropZone: React.DragEventHandler = () => {
        enterCounter.current -= 1;
        if (enterCounter.current === 0) {
            dispatch(hideDropZone());
        }
    };

    return (
        <div
            data-testid="app-install-drop-zone"
            onDrop={installAppPackage}
            onDragOver={showAddCursor}
            onDragEnter={maybeShowDropZone}
            onDragLeave={maybeHideDropZone}
        >
            {children}

            <DropZoneInfo />
        </div>
    );
};

export default DropZoneForLocalApps;
