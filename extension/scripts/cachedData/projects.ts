import { TeamProjectReference } from "azure-devops-extension-api/Core";
import { getClient } from "azure-devops-extension-api";
import { CoreRestClient } from "azure-devops-extension-api/Core";

import { CachedValue } from "./CachedValue";

export const projectsVal: CachedValue<TeamProjectReference[]> = new CachedValue(getProjects);

async function getProjects(skip = 0): Promise<TeamProjectReference[]> {
    const projects: TeamProjectReference[] = [];
    while (true) {
        const batch = await getClient(CoreRestClient).getProjects(undefined, 100, skip);
        projects.push(...batch);
        if (batch.length !== 100) {
            break;
        }
        skip += 100;
    }
    return projects;
}
