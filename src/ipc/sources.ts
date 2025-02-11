/*
 * Copyright (c) 2022 Nordic Semiconductor ASA
 *
 * SPDX-License-Identifier: LicenseRef-Nordic-4-Clause
 */

import { handle, invoke } from './infrastructure/rendererToMain';

export enum StandardSourceNames {
    OFFICIAL = 'official',
    LOCAL = 'local',
}

export const { LOCAL, OFFICIAL } = StandardSourceNames;
export const allStandardSourceNames: SourceName[] = [OFFICIAL, LOCAL];

const channel = {
    get: 'sources:get',
    add: 'sources:add',
    remove: 'sources:remove',
};

export type SourceName = string;
export type SourceUrl = string;
export type Sources = Record<SourceName, SourceUrl>;

// Get
type GetSources = () => Sources;

export const getSources = invoke<GetSources>(channel.get);
export const registerGetSources = handle<GetSources>(channel.get);

// Add
type AddSource = (url: string) => string;

export const addSource = invoke<AddSource>(channel.add);
export const registerAddSource = handle<AddSource>(channel.add);

// Remove
type RemoveSource = (name: string) => void;

export const removeSource = invoke<RemoveSource>(channel.remove);
export const registerRemoveSource = handle<RemoveSource>(channel.remove);
