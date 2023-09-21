import { getClient as getWitClient } from "TFS/WorkItemTracking/RestClient";
import { CachedValue } from "./CachedValue";
export var relationTypes = new CachedValue(getRelationTypes);
function getRelationTypes() {
    return getWitClient().getRelationTypes();
}
//# sourceMappingURL=relationTypes.js.map