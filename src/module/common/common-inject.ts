import {ExtensionMessageId} from "../../common/extension-message";
import {listenToExtensionMessage, postExtensionMessage} from "../../util/util";

let currentEditorView: string | null;

listenToExtensionMessage<string>(ExtensionMessageId.NOTIFICATION_NOTICE, m => {
    // @ts-ignore
    $.jGrowl(m, {theme: "jGrowl-notice"});
});

listenToExtensionMessage<string>(ExtensionMessageId.NOTIFICATION_SUCCESS, m => {
    // @ts-ignore
    $.jGrowl(m, {theme: "jGrowl-success"});
})

listenToExtensionMessage<string>(ExtensionMessageId.NOTIFICATION_ERROR, m => {
    // @ts-ignore
    $.jGrowl(m, {theme: "jGrowl-error"});
})

// @ts-ignore
window.navigation.addEventListener("navigate", () => {
    checkViewChange();
})

export function checkViewChange() {
    const searchParams = new URLSearchParams(window.location.search);
    const newEditorView = searchParams.get("view");
    if (newEditorView !== currentEditorView) {
        currentEditorView = newEditorView;
        postExtensionMessage<string>(ExtensionMessageId.EDITOR_VIEW_CHANGED, newEditorView);
    }
}
