import * as VSS from "azure-devops-extension-sdk";
import {
    CommonServiceIds,
    IHostPageLayoutService,
    getClient,
} from "azure-devops-extension-api";


import { trackEvent } from "../events";
import * as monaco from 'monaco-editor';
import { getHostUrl, getProject } from "../getProject";
import { QueryHierarchyItem, WorkItemTrackingRestClient } from "azure-devops-extension-api/WorkItemTracking";
import { handleSaveResult } from "../queryEditor/queryDialog";

async function toDocument(wiql: string) {
    const rootDoc = jQuery.parseXML(`<WorkItemQuery Version="1"/>`);
    const root = rootDoc.documentElement as HTMLElement;
    
    const host = await getHostUrl()
    const server = rootDoc.createElement("TeamFoundationServer");
    server.appendChild(rootDoc.createTextNode(host));
    root.appendChild(server);

    const project = rootDoc.createElement("TeamProject");
    const getProjectName = await getProject();
    project.appendChild(rootDoc.createTextNode(getProjectName.name));
    root.appendChild(project);

    const wiqlNode = rootDoc.createElement("Wiql");
    wiqlNode.appendChild(rootDoc.createTextNode(wiql));
    root.appendChild(wiqlNode);

    return new XMLSerializer().serializeToString(rootDoc);
}

function fromDocument(documentStr: string) {
    if (documentStr[0] !== "<") {
        // v1.5.1 format was just the wiql string
        return documentStr;
    }
    return $(jQuery.parseXML(documentStr)).find("Wiql").text();
}

export async function importWiq(editor: monaco.editor.IStandaloneCodeEditor) {
        const files = ($(".wiq-input")[0] as HTMLInputElement).files;
        if (!files || files.length === 0) {
            return;
        }
        const reader = new FileReader();
        const model = editor.getModel();
        reader.onload = async () => {
            try {
                const documentText: string  = reader.result as string;
                const wiql = fromDocument(documentText);
                const edit = <monaco.editor.IIdentifiedSingleEditOperation> {
                    text: wiql,
                    range: model.getFullModelRange(),
                    forceMoveMarkers: true,
                };
                model.pushEditOperations(editor.getSelections(), [edit], () => [new monaco.Selection(1, 1, 1, 1)]);
            } catch (e) {
                const dialogService = await VSS.getService<IHostPageLayoutService>(CommonServiceIds.HostPageLayoutService);
                const message = e.message || e + "";
                dialogService.openMessageDialog(message, {
                    title: "Error importing query",
                });
            }
        };
        reader.readAsText(files[0]);
        $(".wiq-input").val("");
}
export async function exportWiq(editor: monaco.editor.IStandaloneCodeEditor, queryName?: string) {
    const documentStr = await toDocument(editor.getModel().getValue());
    const blob = new Blob([documentStr], {type: "text/plain;charset=utf-8;"});
    const check =  prompt("Enter file name") 
    let name = queryName ||check|| "query";

    if (check === null) {
        console.log("Export cancelled");
        return; // This will exit the function early
    
    }
  
    if ( name.toLocaleLowerCase().indexOf(".wiq", name.length - 4) < 0) {
        name += ".wiq";
    }
    trackEvent("exportWiq", {wiqlLength: String(documentStr.length)});

    // IE workaround
    //Remove temporarily IE support
    // if (window.navigator.msSaveBlob) {
    //     navigator.msSaveBlob(blob, name);
    // } else {
        const a = document.createElement("a");
        a.href = window.URL.createObjectURL(blob);
        a.download = name;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    // }
    
}

export async function saveQuery(editor, configuration): Promise<void> {
    
    const client = getClient(WorkItemTrackingRestClient);
    const project = await getProject();
    const queryItem = <QueryHierarchyItem>{
        wiql: editor.getValue(),
        path: configuration.query.path,
        name: configuration.query.name,
    };

    let result = null;
    if (configuration.query.id && configuration.query.id !== "00000000-0000-0000-0000-000000000000") {
        try {
            const updated = await client.updateQuery(queryItem, project.name, configuration.query.id);
            const html = updated._links ? updated._links.html : null;
            result = html ? html.href : "";
            await handleSaveResult(result, configuration.que);
        } catch (err) {
            await handleSaveResult(null, configuration.query, err);
            
        }
    } else {
        const path = configuration.query.isPublic ? "Shared Queries" : "My Queries";
        const name = prompt("Enter name for query");
 
        if (name) {
       
            try {
                queryItem.name = name;
                const created = await client.createQuery(queryItem, project.name, path);
                const html = created._links ? created._links.html : null;
                result = html ? html.href : "";
                await handleSaveResult(result);
            } catch (err) {
                console.error("Error creating query:", err);
                await handleSaveResult(null, configuration.query, err);
            }
        }
    }
}
