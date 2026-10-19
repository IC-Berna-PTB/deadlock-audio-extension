import {listenToExtensionMessage, observeElementEvenIfNotReady, postExtensionMessage} from "../../util/util";
import {requestSettings} from "../../common/extension-settings-client";
import {ExtensionMessageId} from "../../common/extension-message";

const WRAPPER_ID = "dlaudio_play_wrapper";


function hook(immediate: boolean) {
    observeElementEvenIfNotReady(getSuggestionContainer(), (element, disconnect) => {
        let playWrapper = document.querySelector(`#${WRAPPER_ID}`);
        // @ts-expect-error crowdin not available while programming
        if (window.crowdin.translation.file_id !== 17229) {
            disconnect();
            playWrapper?.remove();
            hook(false);
            return;
        }
        const e = element.querySelector(".string-key-container--text")
        if (e === null || !(e instanceof HTMLElement)) {
            return;
        }
        if (playWrapper === null || !(playWrapper instanceof HTMLElement)) {
            playWrapper = document.createElement("div");
            playWrapper.id = WRAPPER_ID;
            const wrapper = document.querySelector(".string-key-container--wrapper");
            playWrapper?.remove();
            wrapper.after(playWrapper);
        }
        const fileName = e.innerText;
        if ((playWrapper as HTMLElement).dataset.currentFile === fileName) {
            return;
        }
        disconnect();
        playWrapper.replaceChildren();
        const playElement = createPlayElement(e.innerText);
        (playWrapper as HTMLElement).dataset.currentFile  = fileName;
        playWrapper.replaceChildren(playElement);
        hook( false);
    }, immediate);
}

listenToExtensionMessage<string>(ExtensionMessageId.EDITOR_VIEW_CHANGED, (s) => hook( true));

function createPlayElement(fileName: string): HTMLMediaElement {
    const element = document.createElement("audio");
    element.src = `http://localhost:51072/audio/${fileName}`;
    element.controls = true;
    requestSettings().then(s => {
        element.autoplay = !!s.autoplay;
        element.volume = s.volume;
        element.addEventListener("volumechange" , () => postExtensionMessage<number>(ExtensionMessageId.SETTINGS_VOLUME_CHANGED, element.volume));
    });
    return element;
}

function getSuggestionContainer(): string {
    // @ts-ignore
    const editorView = crowdin?.editor?.mode ?? null;
    switch (editorView) {
        case "proofread":
        case "multilingual":
            return "#right_panel";
        case "translate":
        case null:
        default:
            return "#editor-center-layout";
    }
}

