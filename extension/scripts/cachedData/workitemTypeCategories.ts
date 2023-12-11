import { WorkItemTypeCategory } from "azure-devops-extension-api/WorkItemTracking";
import { getClient } from "azure-devops-extension-api";
import { WorkItemTrackingRestClient } from "azure-devops-extension-api/WorkItemTracking";
import { CachedValue } from "./CachedValue";
import { projectsVal } from "./projects";

const categoryMap: {[project: string]: CachedValue<WorkItemTypeCategory[]>} = {};

async function getCategoriesForProject(project: string): Promise<WorkItemTypeCategory[]> {
    if (!(project in categoryMap)) {
        categoryMap[project] = new CachedValue(() => 
        getClient(WorkItemTrackingRestClient).getWorkItemTypeCategories(project));
    }
    return categoryMap[project].getValue();
}

async function getCategoriesImpl(projects: string[]) {
    const categoriesArr = await Promise.all(projects.map((p) => getCategoriesForProject(p)));
    const categories: WorkItemTypeCategory[] = [];
    for (const arr of categoriesArr) {
        categories.push(...arr);
    }
    return categories;
}

export async function getCategories(searchProjects: string[] = []): Promise<WorkItemTypeCategory[]> {
    if (searchProjects.length === 0) {
        return getCategoriesImpl((await projectsVal.getValue()).map((p) => p.name));
    }
    return getCategoriesImpl(searchProjects);
}
