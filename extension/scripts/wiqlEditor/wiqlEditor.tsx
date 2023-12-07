import * as React from "react";
import * as ReactDom from "react-dom";
import * as VSS from "azure-devops-extension-sdk";
import { CommonServiceIds,IHostNavigationService, ILocationService } from "azure-devops-extension-api";
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
import { getHostUrl, getProject } from "../getProject";
//TODO: If needed switch over to azure-devops-ui
//import "azure-devops-ui/Core/override.css";

 const styles:  React.CSSProperties = {
    backgroundColor: "rgba(var(--palette-neutral-4,244, 244, 244),1)",
    border: "none",
    padding: "10px 20px",
    borderRadius: "2px",
    fontSize: "14px",
    cursor: "pointer",
    textAlign: "center",
    display: "inline-block",
    boxShadow: "0 1px 4px rgba(0, 0, 0, 0.2)",
    transition: "background-color 0.2s ease",
    margin: "12px 10px",
    fontWeight: "bold",
   };

 const saveQueryBtmstyles : React.CSSProperties = {
    backgroundColor:  "#0078d4",
    color: "white",
    border: "none",
    padding: "10px 20px",
    borderRadius: "2px",
    fontSize: "14px",
    cursor: "pointer",
    textAlign: "center",
    display: "inline-block",
    boxShadow: "0 1px 4px rgba(0, 0, 0, 0.2)",
    transition: "background-color 0.2s ease",
    fontWeight: "bold",
   
};


const stylesr ="background-color:rgba(var(--palette-neutral-4,244, 244, 244),1); border: none; padding: 10px 20px; border-radius: 2px; font-size: 14px; cursor: pointer; text-align: center; display: inline-block; box-shadow: 0 1px 4px rgba(0, 0, 0, 0.2); transition: background-color 0.2s ease; margin: 0 10px; font-weight: bold;"

function renderToolbar(isPanel: boolean,callback: () => void) {
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

            {isPanel && (
                    <button onClick={ () => $("#save").click() } id="saveQueryBtn" className="saveQueryBtn" style={ saveQueryBtmstyles }>Save query</button> 

            ) }

         {!isPanel ?(
               <button className="open-in-queries" hidden style={ styles }> Open in queries </button>   

            ) : null }
              
                </span>
                <span className="links">
                    <a href="https://marketplace.visualstudio.com/items?itemName=ms-devlabs.wiql-editor" target="_blank">Review</a>{" | "}
                    <a href="https://github.com/microsoft/wiql-editor/issues" target="_blank">Report an issue</a>
                </span>
            </div>
        , elem, callback);
}

export function setupEditor(target: HTMLElement, onChange?: (errorCount: number) => void, intialValue?: string, queryName?: string, configuration?: any, isPanel?: boolean): monaco.editor.IStandaloneCodeEditor {
    //set isPanel default value to false if not provided
    renderToolbar(isPanel,async () => {
        if (queryName) {
            return;
        }

        const baseUrl = await getHostUrl();
        const project = await getProject();
        const navigationService = await VSS.getService(CommonServiceIds.HostNavigationService) as IHostNavigationService;
        $(".open-in-queries").show().click(() => {
            const wiql = editor.getModel().getValue();
            const url = `${baseUrl}${project.id}/_queries/query/?wiql=${encodeURIComponent(wiql)}`;
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


    editor.onDidChangeModelContent(() => {
        checkErrors().then((errorCount) => {
                if (onChange) {
                    onChange(errorCount);
                }
            });
    });

    



    editor.focus();
    return editor;
}

