import * as SDK from "azure-devops-extension-sdk";
import {
    CommonServiceIds,
    ILocationService,
    IProjectPageService
} from "azure-devops-extension-api";

export async function getProject() {
    const projectService = await SDK.getService<IProjectPageService>(
        CommonServiceIds.ProjectPageService
    );
    return projectService.getProject();
}

export async function getHostUrl() {

    const locationService = await SDK.getService<ILocationService>(
        CommonServiceIds.LocationService
    );

    const host = SDK.getHost();
    const location = await locationService.getServiceLocation()
    const url = `${location}${host.name}`;
    return url;

}
