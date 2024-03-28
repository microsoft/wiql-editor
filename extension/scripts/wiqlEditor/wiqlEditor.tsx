import * as React from "react";
import * as ReactDom from "react-dom";
import * as VSS from "azure-devops-extension-sdk";
import { CommonServiceIds, IHostNavigationService, ILocationService } from "azure-devops-extension-api";
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
import { ReturnMatchingChildren } from "./compiler/symbols";


const linkStyle: React.CSSProperties = {
    color: "var(--communication-tint-10,rgba(43, 136, 216))",
  };
  

const styles: React.CSSProperties = {
    backgroundColor: "var(--communication-tint-10,rgba(43, 136, 216))",
    color: "var(--neutral-2,rgba(248, 248, 248))",
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
    fontFamily: "sans-serif",
  };
  

function renderToolbar(isPanel: boolean, callback: () => void) {
 
    const elem = document.getElementById("header-bar");
    if (!elem) {
        return;
    }
    ReactDom.render(
        <div className="header">
            <span className="bowtie">
                <input className="wiq-input" accept=".wiq" type="file" hidden />
                <button onClick={() => $(".wiq-input").click()} style={styles}>Import</button>
                <button className="wiq-export" style={styles}>Export</button>
                {isPanel && (
                    <button onClick={() => $("#save").click()} id="saveQueryBtn" className="saveQueryBtn" style={styles}>Save query</button>

                )}
                {!isPanel ? (
                    <button className="open-in-queries" hidden style={styles}> Open in queries </button>

                ) : null}
            </span>
            <span className="links">
                <a href="https://marketplace.visualstudio.com/items?itemName=ms-devlabs.wiql-editor" target="_blank" style={linkStyle}>Review</a>{" | "}
                <a href="https://github.com/microsoft/wiql-editor/issues" target="_blank" style={linkStyle}>Report an issue</a>
            </span>
        </div>
        , elem, callback);
}

export function setupEditor(target: HTMLElement, onChange?: (errorCount: number) => void, intialValue?: string, queryName?: string, configuration?: any, isPanel?: boolean): monaco.editor.IStandaloneCodeEditor {
    //set isPanel default value to false if not provided
 
       
    renderToolbar(isPanel, async () => {
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
        fontSize: 14, // Set the font size to 14
        lineHeight: 20, // Set the line height to 20
        minimap: { enabled: false }, // Disable the minimap
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

