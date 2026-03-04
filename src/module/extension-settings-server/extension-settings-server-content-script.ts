import {base64ToObject, listenToExtensionMessage, postExtensionMessage} from "../../util/util";
import {ExtensionMessageId} from "../../common/extension-message";
import {BooleanishNumber, ExtensionSettings} from "../../common/extension-settings";
import {plainToInstance} from "class-transformer";

listenToExtensionMessage<unknown>(ExtensionMessageId.SETTINGS_REQUESTED_BY_MODULE, () => {
    getSettings().then(settings => postExtensionMessage(ExtensionMessageId.SETTINGS_RETRIEVED, settings))
})

let extensionSettings: ExtensionSettings | undefined = undefined;

function isBooleanishNumber(n: number): boolean {
    return [0, 1].includes(n);
}

async function getSettings(): Promise<ExtensionSettings> {
    if (!extensionSettings) {
        if (typeof chrome !== 'undefined' && chrome && chrome.storage && chrome.storage.sync) {
            return await chrome.storage.sync.get(null)
                .then(data => data as ExtensionSettings)
                .then(async savedSettings => {
                    if (savedSettings) {
                        extensionSettings = plainToInstance<ExtensionSettings, unknown>(ExtensionSettings, savedSettings);
                        await chrome.storage.sync.set(extensionSettings);
                    } else {
                        extensionSettings = new ExtensionSettings();
                        await chrome.storage.sync.set(extensionSettings);
                    }
                })
                .then(() => extensionSettings)
        } else {
            return new ExtensionSettings();
        }
    } else {
        return extensionSettings;
    }
}

void getSettings();

function propagateUpdate(s: ExtensionSettings) {
    void chrome.storage.sync.set(s);
    postExtensionMessage(ExtensionMessageId.SETTINGS_RETRIEVED, s);
}

function listenToBooleanSettingChange(messageId: ExtensionMessageId, apply: (newOption: BooleanishNumber, settings: ExtensionSettings) => ExtensionSettings) {
    listenToExtensionMessage<number>(messageId, m => {
        const newOption = m as BooleanishNumber;
        if (!isBooleanishNumber(newOption)) {
            return;
        }
        getSettings()
            .then(s => apply(newOption, s))
            .then(propagateUpdate)
    })
}

listenToBooleanSettingChange(ExtensionMessageId.SETTINGS_AUTOPLAY_CHANGED, (no, s) => {
   s.autoplay = no;
   return s;
});

listenToExtensionMessage<string>(
    ExtensionMessageId.SETTINGS_IMPORT_REQUESTED,
    s => importSettings(s));

async function importSettings(base64: string): Promise<void> {
    const instance = base64ToObject(base64, ExtensionSettings);
    if (instance instanceof ExtensionSettings) {
        extensionSettings = instance;
        await chrome.storage.sync.set(extensionSettings);
        postExtensionMessage(ExtensionMessageId.SETTINGS_IMPORT_SUCCESSFUL, extensionSettings);
    } else {
        postExtensionMessage<string>(ExtensionMessageId.SETTINGS_IMPORT_FAILED, "Could not import settings!")
    }
}
