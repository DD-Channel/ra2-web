import React from 'react';
import classNames from 'classnames';
import { HtmlReactElement } from '../HtmlReactElement'; // Assuming path
import { Dialog, type DialogProps } from './Dialog'; // Removed DialogButton type import for now
import { GameResForm, type GameResFormProps } from './GameResForm'; // Assuming path and props type
import { FileSystemUtil } from '../../engine/gameRes/FileSystemUtil'; // Adjusted path
import type { Viewport } from '../Viewport'; // Assuming Viewport interface/type
import type { Strings } from '../../data/Strings';

// Define a more specific type for fsAccessLib if possible, using 'any' for now
interface FsAccessLibraryShim {
    polyfillDataTransferItem: () => Promise<void>;
    showDirectoryPicker: (options?: any) => Promise<FileSystemDirectoryHandle>; 
    // Add other methods if used by FileSystemUtil.showArchivePicker
}

// The type of value returned by promptForGameRes
export type GameResSourceSelection = FileSystemDirectoryHandle | FileSystemFileHandle | URL | undefined;

export class GameResBoxApi {
    private viewport: Viewport; // This needs to be observable or have an onChange handler
    private strings: Strings;
    private rootEl: HTMLElement;
    private fsAccessLib: FsAccessLibraryShim; 

    constructor(viewport: Viewport, strings: Strings, rootEl: HTMLElement, fsAccessLib: FsAccessLibraryShim) {
        this.viewport = viewport;
        this.strings = strings;
        this.rootEl = rootEl;
        this.fsAccessLib = fsAccessLib;
    }

    async promptForGameRes(defaultArchiveUrl?: string, closable?: boolean): Promise<GameResSourceSelection> {
        console.log('[GameResBoxApi] promptForGameRes called with:', { defaultArchiveUrl, closable });
        await this.fsAccessLib.polyfillDataTransferItem();
        
        return new Promise<GameResSourceSelection>((resolve) => {
            let dialogElement: HtmlReactElement<DialogProps> | undefined;

            const handleResolve = (selection: GameResSourceSelection) => {
                console.log('[GameResBoxApi] Resolving with selection:', selection);
                cleanup();
                resolve(selection);
            };

            const dialogProps: DialogProps = {
                className: classNames("game-res-box"),
                buttons: [] as any[],  // Changed DialogButton[] to any[]
                children: React.createElement(GameResForm, {
                    defaultArchiveUrl: defaultArchiveUrl,
                    closable: closable,
                    strings: this.strings,
                    onDrop: async (dataTransfer: DataTransfer) => {
                        console.log('[GameResBoxApi] onDrop called');
                        if (dataTransfer.items && dataTransfer.items.length > 0) {
                            try {
                                // Attempt to get FileSystemHandle from the first item
                                const handle = await (dataTransfer.items[0] as any).getAsFileSystemHandle();
                                if (!handle) return;
                                handleResolve(handle as FileSystemDirectoryHandle | FileSystemFileHandle);
                            } catch (e) {
                                console.error("Error getting handle from drop:", e);
                                // Optionally provide user feedback here
                            }
                        }
                    },
                    onBrowseFolder: async () => {
                        console.log('[GameResBoxApi] onBrowseFolder called');
                        try {
                            const handle = await this.fsAccessLib.showDirectoryPicker({ _preferPolyfill: true });
                            handleResolve(handle);
                        } catch (e) {
                            console.error("Error browsing folder:", e); // User likely cancelled or an error occurred
                        }
                    },
                    onBrowseArchive: async () => {
                        console.log('[GameResBoxApi] onBrowseArchive called');
                        try {
                            const handle = await FileSystemUtil.showArchivePicker(this.fsAccessLib as any);
                            handleResolve(handle as FileSystemFileHandle);
                        } catch (e) {
                            console.error("Error browsing archive:", e);
                        }
                    },
                    onDownloadArchive: async (url: URL) => {
                        console.log('[GameResBoxApi] onDownloadArchive called with:', url);
                        handleResolve(url);
                    },
                    onClose: () => {
                        console.log('[GameResBoxApi] onClose called');
                        handleResolve(undefined); // User closed the dialog
                    },
                } as GameResFormProps),
                viewport: (this.viewport as any).value || { x:0, y:0, width: '100%', height: '100%' }, // Placeholder for viewport prop
                // zIndex might be needed as well
            };

            console.log('[GameResBoxApi] Creating dialog element with props:', dialogProps);
            dialogElement = HtmlReactElement.factory(Dialog, dialogProps);
            
            // Viewport change subscription - simplified or assuming Dialog handles responsiveness
            // const viewportChangeHandler = (vpValue: any) => {
            //    dialogElement?.setSize(vpValue.width, vpValue.height);
            //    dialogElement?.applyOptions((currentProps: any) => ({ ...currentProps, viewport: vpValue }));
            // };
            // (this.viewport as any).onChange?.subscribe(viewportChangeHandler);

            const cleanup = () => {
                console.log('[GameResBoxApi] Cleanup called');
                // (this.viewport as any).onChange?.unsubscribe(viewportChangeHandler);
                if (dialogElement) {
                    const element = dialogElement.getElement();
                    if (element && this.rootEl.contains(element)) {
                        this.rootEl.removeChild(element);
                    }
                    dialogElement.unrender();
                    dialogElement = undefined;
                }
            };
            
            // Initial render
            if (dialogElement) {
                console.log('[GameResBoxApi] Rendering dialog element');
                // Set explicit size to make dialog visible
                const viewportValue = (this.viewport as any).value || { width: window.innerWidth, height: window.innerHeight };
                dialogElement.setSize(viewportValue.width, viewportValue.height);
                dialogElement.render();
                const elementToAppend = dialogElement.getElement();
                if (elementToAppend) {
                    console.log('[GameResBoxApi] Appending dialog element to root:', elementToAppend);
                    this.rootEl.appendChild(elementToAppend);
                } else {
                    console.error("GameResBoxApi: Dialog element not created for appending.");
                    handleResolve(undefined); // Fail safe
                }
            } else {
                console.error("GameResBoxApi: Dialog could not be created.");
                handleResolve(undefined); // Fail safe
            }
        });
    }
} 