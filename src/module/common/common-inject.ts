import {ExtensionMessageId} from "../../common/extension-message";
import {listenToExtensionMessage} from "../../util/util";

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

