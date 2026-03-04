import {
    injectExtensionScript,
    listenToExtensionMessage,
    observeElementEvenIfNotReady,
    postExtensionMessage
} from "../../util/util";
import {ExtensionMessage, ExtensionMessageId} from "../../common/extension-message";
import {BooleanishNumber, ExtensionSettings,} from "../../common/extension-settings";
import {exportSettings, requestSettings, requestSettingsImport} from "../../common/extension-settings-client";


class SettingParameters {
    id: string
    label: string
    helpText?: string
    setting: (settings: ExtensionSettings) => boolean;
    messageId: ExtensionMessageId;
}

class CommonMenu {

    static INSTANCE = new CommonMenu();

    constructor() {
        observeElementEvenIfNotReady("#progress-widget", (element, disconnect) => {
            disconnect();
            const openMenuButton = CommonMenu.createMenuButtonElement();
            const dialog = CommonMenu.createSettingsDialog();

            let dialogBody = dialog.querySelector("#dlaudio-settings-dialog-body");
            
            const submitColorToggle = CommonMenu.createCheckboxSetting({
                id: "dlaudio-setting-autoplay",
                label: "Autoplay audio when changing strings",
                messageId: ExtensionMessageId.SETTINGS_AUTOPLAY_CHANGED,
                setting: (settings: ExtensionSettings) => !!settings.autoplay
            })
            dialogBody.appendChild(submitColorToggle);

            const buttonFooter = CommonMenu.createDialogButtonFooterElement();
            dialog.append(buttonFooter);

            document.body.append(dialog);
            // const menu = this.createSettingsMenu();
            // this.test(menu, "Test");

            const openMenuButtonDiv = CommonMenu.createRightSideToolbarContainer();
            openMenuButtonDiv.id = "dlaudio-settings-btn";
            openMenuButtonDiv.title = 'Open "Deadlock Audio" extension settings'

            openMenuButtonDiv.append(openMenuButton);
            openMenuButtonDiv.addEventListener("click", () => CommonMenu.toggleDialog(dialog))

            element.after(openMenuButtonDiv);
        })
    }


    private static createRightSideToolbarContainer(): HTMLDivElement {
        const divElement = document.createElement("div");
        divElement.classList.add("pull-right", "clearfix", "btn-group");
        return divElement;
    }

    private static createMenuButtonElement(): HTMLButtonElement {
        const buttonElement = document.createElement("button");
        buttonElement.classList.add("btn", "btn-icon", "dropdown-toggle");
        buttonElement.dataset.state = "closed";
        buttonElement.tabIndex = 1;

        const iconElement = document.createElement("i");
        iconElement.classList.add("static-icon-dlaudio-puzzle-piece");

        buttonElement.append(iconElement);
        return buttonElement;
    }

    private static createSettingsDialog(): HTMLDivElement {
        const dialog = document.createElement("div");
        dialog.id = "dlaudio-settings-dialog";
        dialog.classList.add(..."ui-dialog ui-widget ui-widget-content ui-corner-all ui-draggable ui-dialog-buttons".split(" "));
        dialog.role = "dialog";
        dialog.classList.add("dlaudio-dialog-hidden");

        const titleBar = document.createElement("div");
        dialog.append(titleBar);
        titleBar.classList.add(..."ui-dialog-titlebar ui-widget-header ui-corner-all ui-helper-clearfix".split(" "));

        const title = document.createElement("span");
        titleBar.append(title);
        title.classList.add("ui-dialog-title");
        title.style.width = "auto";
        title.innerText = "Enhanced Crowdin settings";

        // @ts-ignore
        const brw = typeof browser !== "undefined" ? browser : chrome;
        if (typeof brw !== "undefined") {
            const version = document.createElement("span");
            titleBar.append(version);
            version.id = "dlaudio-settings-dialog-version";
            version.classList.add("small")
            version.innerText = `version ${brw.runtime.getManifest().version}`;
        }

        const closeButton = document.createElement("a");
        titleBar.append(closeButton);
        closeButton.classList.add(..."ui-dialog-titlebar-close ui-corner-all".split(" "));
        closeButton.href = "#";
        closeButton.role = "button";
        closeButton.addEventListener("click", () => dialog.classList.add("dlaudio-dialog-hidden"));

        const closeIcon = document.createElement("span");
        closeButton.append(closeIcon);
        closeIcon.classList.add(..."ui-icon ui-icon-closethick".split(" "));

        const body = document.createElement("div");
        dialog.append(body);
        body.id = "dlaudio-settings-dialog-body";
        body.classList.add(..."ui-dialog-content ui-widget-content dlaudio-dialog-body".split(" "));

        return dialog;
    }

    private static createCheckboxSetting(settingParameters: SettingParameters) {
        const controlGroup = document.createElement("div");
        controlGroup.classList.add("control-group", "margin-top");

        const label = document.createElement("label");
        controlGroup.append(label);
        label.textContent = settingParameters.label;
        label.classList.add("checkbox");

        const input = document.createElement("input");
        label.append(input);
        input.id = settingParameters.id;
        input.type = "checkbox";
        input.name = settingParameters.id;

        requestSettings().then(s => input.checked = settingParameters.setting(s));

        if (settingParameters.helpText) {
            const helpBlock = this.createHelpBlock(settingParameters.helpText)
            controlGroup.append(helpBlock);
        }

        input.addEventListener("change", () => {
            const enabled = input.checked;
            postExtensionMessage<BooleanishNumber>(settingParameters.messageId, enabled ? 1 : 0);
        })

        listenToExtensionMessage<ExtensionSettings>(ExtensionMessageId.SETTINGS_IMPORT_SUCCESSFUL, es => {
            input.checked = !!settingParameters.setting(es);
        });

        return controlGroup;
    }

    private static toggleDialog(dialog: HTMLDivElement): void {
        dialog.classList.toggle("dlaudio-dialog-hidden");
        if (dialog.checkVisibility()) {
            postMessage({
                identifier: ExtensionMessageId.SETTINGS_DIALOG_OPENED,
                message: `#${dialog.id}`
            } as ExtensionMessage<string>);
        }
    }
    private static createHelpBlock(text: string): HTMLDivElement {
        const helpBlock = document.createElement("div");
        helpBlock.classList.add("help-block", "small", "no-margin");
        helpBlock.textContent = text;
        return helpBlock;
    }


    private static createDialogButtonFooterElement(): HTMLDivElement {
        const outerDiv = document.createElement("div");
        outerDiv.classList.add(..."ui-dialog-buttonpane ui-widget-content ui-helper-clearfix".split(" "))

        const innerDiv = document.createElement("div");
        outerDiv.append(innerDiv);
        innerDiv.classList.add("ui-dialog-buttonset");

        const importButton = this.createDialogButton("⤵️ Import from clipboard", "dlaudio-settings-btn-import");
        innerDiv.append(importButton);
        importButton.addEventListener("click", this.importSettingsFromClipboard)


        const exportButton = this.createDialogButton("⤴️ Export to clipboard", "dlaudio-settings-btn-export");
        innerDiv.append(exportButton);
        exportButton.addEventListener("click", this.exportSettingsToClipboard)

        return outerDiv;
    }

    private static createDialogButton(labelText: string, buttonElementId: string): HTMLButtonElement {
        const button = document.createElement("button");
        button.id = buttonElementId;
        button.type = "button";
        button.role = "button";
        button.ariaDisabled = "false";
        button.classList.add(..."ui-button ui-widget ui-state-default ui-corner-all ui-button-text-only".split(" "));
        button.addEventListener("mouseenter", () => button.classList.add("ui-state-hover"));
        button.addEventListener("mouseleave", () => button.classList.remove("ui-state-hover"));
        button.addEventListener("mousedown", () => button.classList.add("ui-state-active"));
        button.addEventListener("mouseup", () => button.classList.remove("ui-state-active"));

        const labelSpan = document.createElement("span");
        button.appendChild(labelSpan);
        labelSpan.classList.add("ui-button-text");
        labelSpan.textContent = labelText;

        return button;
    }

    private static importSettingsFromClipboard() {
        navigator.clipboard.readText()
            .then(text => requestSettingsImport(text))
            .then(successful => postExtensionMessage(
                successful ? ExtensionMessageId.NOTIFICATION_SUCCESS : ExtensionMessageId.NOTIFICATION_ERROR,
                successful ? "Import successful!" : "Import failed!"
            ))
            .catch(() => postExtensionMessage(ExtensionMessageId.NOTIFICATION_ERROR, "Import failed!"))
    }

    private static exportSettingsToClipboard() {
        exportSettings()
            .then(text => navigator.clipboard.writeText(text))
            .then(() => postMessage({
                identifier: ExtensionMessageId.NOTIFICATION_SUCCESS,
                message: "Settings exported to clipboard!"
            } as ExtensionMessage<string>))
            .catch(() => postExtensionMessage(ExtensionMessageId.NOTIFICATION_ERROR, "Failed to export settings!"))
    }
}

injectExtensionScript('extension-settings-menu-inject.js');
