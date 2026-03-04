import {observeElementEvenIfNotReady} from "../../util/util";
import {requestSettings} from "../../common/extension-settings-client";

observeElementEvenIfNotReady(".string-key-container--text", (e, disconnect) => {
    const wrapperId = "dlaudio-play-wrapper";
    let playWrapper = document.querySelector(`#${wrapperId}`);
    if (playWrapper === undefined || playWrapper === null) {
       playWrapper = document.createElement("div");
       playWrapper.id = wrapperId;
        const wrapper = document.querySelector(".string-key-container--wrapper");
        wrapper.after(playWrapper);
    }
    const element = playElement(e.innerText);
    playWrapper.replaceChildren(element);
}, true);

function playElement(fileName: string): HTMLMediaElement {
    const element = document.createElement("audio");
    element.src = `http://localhost:51072/${fileName}`;
    element.controls = true;
    requestSettings().then(s => element.autoplay = !!s.autoplay);
    return element;
}
