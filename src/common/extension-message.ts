export class ExtensionMessage<T> {
    identifier: ExtensionMessageId;
    message: T;

    static eventHasId(e: MessageEvent<any>, id: ExtensionMessageId): boolean {
        return e.data instanceof ExtensionMessage && e.data.identifier === id;
    }
}

export enum ExtensionMessageId {
    CROWDIN_INIT = "dlaudio-language-id",
    EDITOR_LANGUAGE_CHANGED = "dlaudio-editor-language-changed",
    NOTIFICATION_SUCCESS = "dlaudio-notification-success",
    NOTIFICATION_NOTICE = "dlaudio-notification-notice",
    NOTIFICATION_ERROR = "dlaudio-notification-error",
    SETTINGS_DIALOG_OPENED = "dlaudio-settings-dialog-opened",
    SETTINGS_IMPORT_REQUESTED = "dlaudio-settings-import-requested",
    SETTINGS_IMPORT_SUCCESSFUL = "dlaudio-settings-import-successful",
    SETTINGS_IMPORT_FAILED = "dlaudio-settings-import-failed",
    SETTINGS_EXPORT_REQUESTED = "dlaudio-settings-export-requested",
    SETTINGS_EXPORT_SUCCESSFUL = "dlaudio-settings-export-successful",
    SETTINGS_AUTOPLAY_CHANGED = "dlaudio-settings-autoplay-changed",
    SETTINGS_REQUESTED_BY_MODULE = "dlaudio-settings-requested-by-module",
    SETTINGS_RETRIEVED = "dlaudio-settings-retrieved",
    SETTINGS_ACK = "dlaudio-settings-ack",
}
