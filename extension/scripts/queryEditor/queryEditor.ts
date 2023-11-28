import * as SDK from "azure-devops-extension-sdk";
import "promise-polyfill/src/polyfill";
import { getClient } from "azure-devops-extension-api";
import { WorkItemTrackingRestClient } from "azure-devops-extension-api/WorkItemTracking";
import { QueryHierarchyItem } from "azure-devops-extension-api/WorkItemTracking";
import { ICallbacks } from "../queryContext/contextContracts";
import { setupEditor } from "../wiqlEditor/wiqlEditor";
import * as monaco from "monaco-editor"
import { getProject } from "../getProject";


SDK.init().then(() => {
    const configuration: any = SDK.getConfiguration();
    const target = document.getElementById("wiql-box");
    if (!target) {
        throw new Error("Could not find wiql editor div");
    }
    
    const editor = setupEditor(target, undefined, configuration.query.wiql, configuration.query.name, configuration);
    editor.addAction({
        id: "save",
        contextMenuGroupId: "modification",
        label: "Save",
        keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.KEY_S],
        run: () => {
            configuration.save();
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

                
    
    // async  function saveQuery(): Promise<string | null> {
        
    //     const client = getClient(WorkItemTrackingRestClient);
    //     const project = await getProject();
    //     const queryItem = <QueryHierarchyItem>{
    //         wiql: editor.getValue(),
    //         path: configuration.query.path,
    //         name: configuration.query.name,
    //     };

    //     let result = null;
    //     if (configuration.query.id && configuration.query.id !== "00000000-0000-0000-0000-000000000000") {
    //         try {
    //             const updated = await client.updateQuery(queryItem, project.name, configuration.query.id);
    //             const html = updated._links ? updated._links.html : null;
    //             result = html ? html.href : "";
    //             await configuration.save(result);
    //             return result;
    //         } catch (err) {
    //             console.error("Error updating query:", err);
    //         }
    //     } else {
    //         const path = configuration.query.isPublic ? "Shared Queries" : "My Queries";
    //         const name = prompt("Enter name for query");

    //         if (name) {
    //             try {
    //                 queryItem.name = name;
    //                 const created = await client.createQuery(queryItem, project.name, path);
    //                 const html = created._links ? created._links.html : null;
    //                 result = html ? html.href : "";
    //                 await configuration.save(result);
    //                 return result;
    //             } catch (err) {
    //                 console.error("Error creating query:", err);
    //             }
    //         }
    //     }
    //     await configuration.save(result);
    //     return null;

    // }

    // const callbacks: ICallbacks = {
    //     okCallback: saveQuery,
    // };

    // configuration.loaded(callbacks);

});
