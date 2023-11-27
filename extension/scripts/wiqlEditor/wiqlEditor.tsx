import * as React from "react";
import * as ReactDom from "react-dom";
import * as VSS from "azure-devops-extension-sdk";
import { CommonServiceIds,IHostNavigationService } from "azure-devops-extension-api";
import { trackEvent } from "../events";
import { getCurrentTheme } from "../getCurrentTheme";
import { parse } from "./compiler/parser";
import { completionProvider } from "./completion/completion";
import { ErrorChecker } from "./errorCheckers/ErrorChecker";
import { format } from "./formatter";
import { getHoverProvider } from "./hoverProvider";
import { exportWiq, importWiq, saveQuery } from "./importExport";
import * as Wiql from "./wiqlDefinition";
import * as monaco from 'monaco-editor';
import { getProject } from "../getProject";


const styles = {backgroundColor: "#0078D7", color: "white", margin: "5px", outline: "none" , padding: "8px 12px", borderRadius: "5px" , border: "  none" }

// const saveQueryBtn = async () => {
//     const host = VSS.getHost(); 
//     const project = await getProject();
//     const currentUrl = window.location.href;
//     const targetUrl = `https://dev.azure.com/${host.name}/${project.id}/_queries/query-edit/`;

// if(targetUrl.includes("_queries/query-edit/")){
//   return  <button  
//         onClick={() => $("#save").click()} 
//         id="save" 
//         className="save" 
//         style={styles}
//     >
//         Save query
//     </button>
//    }
// }


function renderToolbar(callback: () => void) {
    const elem = document.getElementById("header-bar");
    if (!elem) {
        return;
    }
    ReactDom.render(
            <div className="header">
                <span className="bowtie">
                    <input className="wiq-input" accept=".wiq" type="file"  hidden />
                    <button onClick={() => $(".wiq-input").click()} style={styles}>Import</button>
                    <button className="wiq-export" style={styles}>Export</button>
          
             <button  onClick={() => $("#save").click()} id="saveQueryBtn" className="saveQueryBtn" style={styles}>Save query</button> ,
                    <button className="open-in-queries" hidden style={styles}>Open in queries</button>
                </span>
                <span className="links">
                    <a href="https://marketplace.visualstudio.com/items?itemName=ms-devlabs.wiql-editor" target="_blank">Review</a>{" | "}
                    <a href="https://github.com/microsoft/wiql-editor/issues" target="_blank">Report an issue</a>
                </span>
            </div>
        , elem, callback);
}

export function setupEditor(target: HTMLElement, onChange?: (errorCount: number) => void, intialValue?: string, queryName?: string, configuration?: any): monaco.editor.IStandaloneCodeEditor {
    renderToolbar(async () => {
        if (queryName) {
            return;
        }
        const project = await getProject();
        const navigationService = await VSS.getService(CommonServiceIds.HostNavigationService) as IHostNavigationService;
        $(".open-in-queries").show().click(() => {
            const wiql = editor.getModel().getValue();
            // trackEvent("openInQueries", {wiqlLength: String(wiql.length)});
            const host = VSS.getHost(); // this is actually org name
            //TODO: Url should not be static
            const url = `https://dev.azure.com/${host.name}/${project.id}/_queries/query/?wiql=${encodeURIComponent(wiql)}`;
            navigationService.openNewWindow(url, "");

      

        });
    });
    monaco.languages.register(Wiql.def);
    monaco.languages.onLanguage(Wiql.def.id, () => {
        monaco.languages.setMonarchTokensProvider(Wiql.def.id, Wiql.language);
        monaco.languages.setLanguageConfiguration(Wiql.def.id, Wiql.conf);
    });
    const defaultVal =
        `SELECT
        [System.Id],
        [System.WorkItemType],
        [System.Title],
        [System.State],
        [System.AreaPath],
        [System.IterationPath]
FROM workitems
WHERE
        [System.TeamProject] = @project
ORDER BY [System.ChangedDate] DESC
`;
    const editor = monaco.editor.create(target, {
        language: Wiql.def.id,
        value: intialValue || defaultVal,
        automaticLayout: true,
        wordWrap: "on",
        theme: getCurrentTheme() === "dark" ? "vs-dark" : "vs",
    });

    format(editor);
    editor.addAction({
        id: "format",
        contextMenuGroupId: "1_modification",
        label: "Format",
        keybindings: [
            monaco.KeyMod.Alt | monaco.KeyMod.Shift | monaco.KeyCode.KEY_F,
            monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.KEY_F,
        ],
        run: () => { format(editor); return null as any; },
    });
    $(".wiq-input").change(() => importWiq(editor));
    $(".wiq-export").click(() => exportWiq(editor, queryName));
    $("#saveQueryBtn").click(() => saveQuery(editor, configuration));
    monaco.languages.registerHoverProvider(Wiql.def.id, getHoverProvider());
    monaco.languages.registerCompletionItemProvider(Wiql.def.id, completionProvider);

    const model = editor.getModel();
    const errorChecker = new ErrorChecker();
    let oldDecorations: string[] = [];

    function checkErrors(): Promise<number> {
        const lines = model.getLinesContent();
        const parseResult = parse(lines);
        return errorChecker.check(parseResult).then((errors) => {
            oldDecorations = model.deltaDecorations(oldDecorations, errors);
            return errors.length;
        });
    }
    checkErrors();

    


    //TODO: Need to re-rewrite this part
    // const updateErrors = new DelayedFunction(null, 200, "CheckErrors", () => {
    //     checkErrors().then((errorCount) => {
    //         if (onChange) {
    //             onChange(errorCount);
    //         }
    //     });
    // });
    // editor.onDidChangeModelContent(() => {
    //     updateErrors.reset();
    // });

    editor.focus();
    return editor;
}

