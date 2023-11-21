import * as SDK from "azure-devops-extension-sdk";
import "promise-polyfill/src/polyfill";
import { trackEvent } from "../events";
import { getCurrentTheme } from "../getCurrentTheme";
import { showDialog } from "../queryEditor/queryDialog";
import { IQuery } from "./contextContracts";



// trackEvent("pageLoad");
// const menuAction: Partial<IContributedMenuSource> = {
//     getMenuItems: (context: {query: IQuery}): IContributedMenuItem[] => {
//         if (!context || !context.query) {
//             return [];
//         }
//         return [<IContributedMenuItem> {
//             text: "Edit query wiql",
//             icon: getCurrentTheme() === "dark" ? "img/smallDarkThemeLogo.png" : "img/smallLogo.png",
//             action: (actionContext) => {
//                 showDialog(actionContext.query);
//             },
//         }];
//     },
// };

const menuAction =  {
    execute: (actionContext: { query: IQuery }) => {
        showDialog(actionContext.query);
        if (!actionContext || !actionContext.query) {
            return {};
        }
        return {
            action: (actionContext) => {
                console.log("actionContext", actionContext);
                showDialog(actionContext.query);
            },
        };
    },
};

// const extensionContext = VSS.getExtensionContext();
// VSS.register(`${extensionContext.publisherId}.${extensionContext.extensionId}.query-menu`, menuAction);
// VSS.register(`${extensionContext.publisherId}.${extensionContext.extensionId}.query-results-menu`, menuAction);
// SDK.register(`query-menu`, menuAction);
// SDK.register(`query-results-menu`, function (actionContext ){
//     return  {
//         execute: function (actionContext) {
//             showDialog(actionContext);
//         }
//     }});


SDK.register("query-menu", menuAction);
SDK.register("query-results-menu", menuAction);
SDK.init();