/*
 * Copyright (c) 2015 Nordic Semiconductor ASA
 *
 * SPDX-License-Identifier: LicenseRef-Nordic-4-Clause
 */

import React from 'react';
import Button from 'react-bootstrap/Button';

import {
    isDownloadable,
    isInstalled,
    isWithdrawn,
    updateAvailable,
} from '../../../../ipc/apps';
import { useLauncherDispatch } from '../../../util/hooks';
import { show as showReleaseNotes } from '../../releaseNotes/releaseNotesDialogSlice';
import { DisplayedApp, isInProgress } from '../appsSlice';

const UpdateApp: React.FC<{ app: DisplayedApp }> = ({ app }) => {
    const dispatch = useLauncherDispatch();

    if (
        isWithdrawn(app) ||
        !isInstalled(app) ||
        !isDownloadable(app) ||
        !updateAvailable(app)
    )
        return null;

    return (
        <Button
            variant="outline-primary"
            title={`Update ${app.displayName}`}
            disabled={isInProgress(app)}
            onClick={() => dispatch(showReleaseNotes(app))}
        >
            {app.progress.isUpdating ? 'Updating...' : 'Update'}
        </Button>
    );
};

export default UpdateApp;
