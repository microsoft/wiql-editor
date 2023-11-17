import * as VSS from "azure-devops-extension-sdk";
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
        // if (!actionContext || !actionContext.query) {
        //     return {};
        // }
        // return {
        //     text: "Edit query wiql",
        //     // icon: getCurrentTheme() === "dark" ? "img/smallDarkThemeLogo.png" : "img/smallLogo.png",
        //     action: (actionContext) => {
                
        //     },
        // };
    },
};

const queryMenuAction = {
    execute: async (actionContext: IQuery) => {
       showDialog(actionContext);
    }
}

// place VSS.getExtensionContext in a a ready function to wait until VSS.Init is called
// $(document).ready(() => {
//     const extensionContext = VSS.getExtensionContext();

// const extensionContext = VSS.getExtensionContext();
VSS.register(`query-menu`, queryMenuAction);
VSS.register(`query-results-menu`, queryMenuAction);
VSS.init();