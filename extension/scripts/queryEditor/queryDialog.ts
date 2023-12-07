
import { trackEvent } from "../events";
import { IContextOptions, IQuery } from "../queryContext/contextContracts";
import {
    CommonServiceIds,
    IHostPageLayoutService,
    IHostNavigationService,
    IDialogOptions,
    PanelSize,
    IPanelOptions,
} from "azure-devops-extension-api";
import * as SDK from "azure-devops-extension-sdk";





export async function save(result?: any, query?: IQuery) {
    const dialogService = await SDK.getService<IHostPageLayoutService>(CommonServiceIds.HostPageLayoutService);
    try {
    if (typeof result !== "string") {
        return;
    }
    const navigationService = await SDK.getService(CommonServiceIds.HostNavigationService) as IHostNavigationService;
    if (result === "") {
        navigationService.reload();
    } else {
        navigationService.navigate(result);
    }
} catch (error) {
    const message = saveErrorMessage(error, query);
    dialogService.openMessageDialog(message, {
        title: "Error saving query",
    });
    console.log("Test", error)
}
}




function saveErrorMessage(error: any, query: IQuery) {
    if (!isSupportedQueryId(query.id)) {
        return "Only queries in saved in My Queries or Shared Queries can be updated with this extension";
    }
    const exception = (error.serverError || error) as any;
    // tslint:disable-next-line:no-string-literal
    const message = (exception["message"] || exception["value"]["Message"]) as string;
    return message;
}

export async function showDialog(query: IQuery) {
  
    const dialogService = await SDK.getService<IHostPageLayoutService>(CommonServiceIds.HostPageLayoutService);
    let okCallback: () => Promise<any> = async () => {
   
        throw new Error("ok callback not set");
    };
    let closeDialog = (): void => {
        throw new Error("could not find close dialog function");
    };
    function close() {
        closeDialog();
    }
    async function save(result?: any) {
            try {
            if (typeof result !== "string") {
                return;
            }
            const navigationService = await SDK.getService(CommonServiceIds.HostNavigationService) as IHostNavigationService;
            if (result === "") {
                navigationService.reload();
            } else {
                navigationService.navigate(result);
            }
        } catch (error) {
            const message = saveErrorMessage(error, query);
            dialogService.openMessageDialog(message, {
                title: "Error saving query",
            });
        }
    }

    
    


    const context: IContextOptions = {
        query: query,
        initialValue: false,
         loaded: async (callbacks) => {
            okCallback = callbacks.okCallback;
        }
    }

    const panelOptions: IPanelOptions<any> = {
        title: query.name,
        configuration: context,
        size: PanelSize.Large,
        onClose: (result) => {
            if (result !== undefined) {
                // save();
            }
        }
    }
  
    const extInfo = SDK.getExtensionContext();
    const contentContribution = `${extInfo.publisherId}.${extInfo.extensionId}.contextForm`;
    dialogService.openPanel(contentContribution, panelOptions);
}

namespace WellKnownQueries {
    export const AssignedToMe = "A2108D31-086C-4FB0-AFDA-097E4CC46DF4";
    export const UnsavedWorkItems = "B7A26A56-EA87-4C97-A504-3F028808BB9F";
    export const FollowedWorkItems = "202230E0-821E-401D-96D1-24A7202330D0";
    export const CreatedBy = "53FB153F-C52C-42F1-90B6-CA17FC3561A8";
    export const SearchResults = "2CBF5136-1AE5-4948-B59A-36F526D9AC73";
    export const CustomWiql = "08E20883-D56C-4461-88EB-CE77C0C7936D";
    export const RecycleBin = "2650C586-0DE4-4156-BA0E-14BCFB664CCA";
}

const queryExclusionList = [
    WellKnownQueries.AssignedToMe,
    WellKnownQueries.UnsavedWorkItems,
    WellKnownQueries.FollowedWorkItems,
    WellKnownQueries.CreatedBy,
    WellKnownQueries.SearchResults,
    WellKnownQueries.CustomWiql,
    WellKnownQueries.RecycleBin];

export function isSupportedQueryId(id: string) {
    return queryExclusionList.indexOf(id.toUpperCase()) === -1;
}
