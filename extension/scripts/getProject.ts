import * as SDK from "azure-devops-extension-sdk";
import {
    CommonServiceIds,
    IProjectPageService
} from "azure-devops-extension-api";

export async function getProject() {
    const projectService = await SDK.getService<IProjectPageService>(
        CommonServiceIds.ProjectPageService
    );
    return projectService.getProject();
}

export async function getHostUrl() {

    const host = SDK.getHost();

    let url;
    if (host.isHosted) {
        // Azure DevOps Server (on-premises)
        url = `http://${host.name}`;
    } else {
        // Azure DevOps Services (cloud)
        url = `https://dev.azure.com/${host.name}`;
    }

    return url;

}
