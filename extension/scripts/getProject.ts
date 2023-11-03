import * as VSS from "azure-devops-extension-sdk";
import {
    CommonServiceIds,
    IProjectPageService
} from "azure-devops-extension-api";

export async function getProject() {
    const projectService = await VSS.getService<IProjectPageService>(
        CommonServiceIds.ProjectPageService
    );
    return projectService.getProject();
}
