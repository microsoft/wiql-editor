import { getClient } from "azure-devops-extension-api";
import { WorkItemTrackingRestClient } from "azure-devops-extension-api/WorkItemTracking";

import { CachedValue } from "./CachedValue";

export const relationTypes = new CachedValue(getRelationTypes);

function getRelationTypes() {
    const client = getClient(WorkItemTrackingRestClient);
    return client.getRelationTypes();
}
