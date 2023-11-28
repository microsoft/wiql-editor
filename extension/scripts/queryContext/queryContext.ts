import * as SDK from "azure-devops-extension-sdk";
import "promise-polyfill/src/polyfill";
import { showDialog } from "../queryEditor/queryDialog";
import { IQuery } from "./contextContracts";
import '../../../extension/styles/wiqlEditor.scss';

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

SDK.register("query-menu", menuAction);
SDK.register("query-results-menu", menuAction);
SDK.init();