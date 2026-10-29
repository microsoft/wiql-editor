/**
 * Source modules cache REST results in module-level singletons, so tests that need a clean cache
 * reload the module graph. All modules must be required AFTER this call so they share one registry
 * (and therefore the same getClient mock and client classes).
 */
export function freshApi() {
    jest.resetModules();
    const api = require("azure-devops-extension-api");
    const wit = require("azure-devops-extension-api/WorkItemTracking");
    const core = require("azure-devops-extension-api/Core");
    const sdk = require("azure-devops-extension-sdk");

    const getClient = api.getClient as jest.Mock;
    return {
        getClient,
        sdk,
        FieldType: wit.FieldType,
        GetFieldsExpand: wit.GetFieldsExpand,
        TreeStructureGroup: wit.TreeStructureGroup,
        /** Makes getClient(WorkItemTrackingRestClient) / getClient(CoreRestClient) return the given fakes. */
        useClients(witClient: object = {}, coreClient: object = {}) {
            getClient.mockImplementation((cls: Function) => {
                if (cls === wit.WorkItemTrackingRestClient) {
                    return witClient;
                }
                if (cls === core.CoreRestClient) {
                    return coreClient;
                }
                throw new Error("Unexpected client requested: " + (cls && cls.name));
            });
        },
    };
}

export const project = (name: string, id = `${name}-id`) => ({ name, id });
