import * as SDK from "azure-devops-extension-sdk";
import "promise-polyfill/src/polyfill";
import { setupEditor } from "../wiqlEditor/wiqlEditor";
import * as monaco from "monaco-editor";
import {save} from "../queryEditor/queryDialog";



SDK.init().then(() => {
    const configuration: any = SDK.getConfiguration();
    const target = document.getElementById("wiql-box");
    if (!target) {
        throw new Error("Could not find wiql editor div");
    }
    const isPanel = true;
    const editor = setupEditor(target, undefined, configuration.query.wiql, configuration.query.name, configuration, isPanel);
    editor.addAction({
        id: "save",
        contextMenuGroupId: "modification",
        label: "Save",
        keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.KEY_S],
        run: () => {
            save();
            return null as any;
        },
    });
    editor.addAction({
        id: "exit",
        contextMenuGroupId: "navigation",
        label: "Exit",
        run: () => {
            configuration.close();
            return null as any;
        },
    });
});
