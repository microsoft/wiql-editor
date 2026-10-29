import { CommonServiceIds, getClient } from "azure-devops-extension-api";
import { CoreRestClient } from "azure-devops-extension-api/Core";
import { FieldType, TreeStructureGroup, WorkItemTrackingRestClient } from "azure-devops-extension-api/WorkItemTracking";
import * as sdk from "azure-devops-extension-sdk";
import { callApi } from "../../scripts/RestCall";
import { sampleFields } from "./fixtures";

/**
 * In-memory stand-in for the Azure DevOps services the extension talks to.
 * The test file must `jest.mock("../../scripts/RestCall", ...)` (the tags endpoint goes through it).
 */

const node = (name: string, children: any[] = []) => ({ name, children });
const transitions = (map: { [from: string]: string[] }) =>
    Object.keys(map).reduce((acc: any, from) => ({ ...acc, [from]: map[from].map((to) => ({ to })) }), {});

export const backendData = {
    projects: [
        { id: "a-id", name: "Alpha" },
        { id: "b-id", name: "Beta" },
    ],
    workItemTypes: {
        Alpha: [
            {
                name: "Bug",
                description: "Tracks defects",
                transitions: transitions({ "": ["New"], New: ["Active"], Active: ["Resolved"], Resolved: ["Closed"] }),
                fieldInstances: [{ referenceName: "System.Title", helpText: "Short summary" }],
            },
            {
                name: "Task",
                description: "Tracks work",
                transitions: transitions({ "": ["To Do"], "To Do": ["Doing"], Doing: ["Done"] }),
                fieldInstances: [{ referenceName: "System.Title", helpText: "Short summary" }],
            },
        ],
        Beta: [
            {
                name: "Bug",
                description: "Beta defects",
                transitions: transitions({ "": ["Proposed"], Proposed: ["Committed"], Committed: ["Done"] }),
                fieldInstances: [{ referenceName: "System.Title", helpText: "Short summary" }],
            },
            { name: "Epic", description: "Big things", transitions: {}, fieldInstances: [] },
        ],
    } as { [project: string]: any[] },
    categories: {
        Alpha: [{ referenceName: "Microsoft.BugCategory" }, { referenceName: "Microsoft.TaskCategory" }],
        Beta: [{ referenceName: "Microsoft.EpicCategory" }],
    } as { [project: string]: any[] },
    iterations: {
        Alpha: node("Alpha", [node("Sprint 1"), node("Sprint 2")]),
        Beta: node("Beta", [node("Release 1")]),
    } as { [project: string]: any },
    areas: {
        Alpha: node("Alpha", [node("Web"), node("API")]),
        Beta: node("Beta", [node("Mobile")]),
    } as { [project: string]: any },
    teams: {
        "a-id": [{ id: "t-alpha", name: "Alpha Team" }, { id: "t-web", name: "Web" }],
        "b-id": [{ id: "t-beta", name: "Beta Team" }],
    } as { [projectId: string]: any[] },
    members: {
        "t-alpha": [{ id: "u-ada", displayName: "Ada Lovelace", uniqueName: "ada@example.com" }],
        "t-web": [{ id: "u-grace", displayName: "Grace Hopper", uniqueName: "grace@example.com" }],
        "t-beta": [{ id: "u-linus", displayName: "Linus T", uniqueName: "linus@example.com" }],
    } as { [teamId: string]: any[] },
    tags: {
        "a-id": ["bug", "ui"],
        "b-id": ["mobile"],
    } as { [projectId: string]: string[] },
    relationTypes: [
        { referenceName: "System.LinkTypes.Related", attributes: { usage: "workItemLink" } },
        { referenceName: "System.LinkTypes.Hierarchy-Forward", attributes: { usage: "workItemLink" } },
        { referenceName: "ArtifactLink", attributes: { usage: "resourceLink" } },
    ],
};

/** Wires the mocked SDK, REST clients and tagging endpoint to `backendData`. Returns spies to inspect traffic. */
export function installBackend(options: { currentProject?: { id: string, name: string }, services?: { [serviceId: string]: any } } = {}) {
    const currentProject = options.currentProject || backendData.projects[0];
    const calls = { getFields: 0, getProjects: 0, getWorkItemTypes: [] as string[], tagRequests: [] as string[] };

    const witClient: any = {
        getFields: function (_project?: any, _expand?: any) {
            calls.getFields++;
            return Promise.resolve(sampleFields());
        },
        getWorkItemTypes: async (project: string) => {
            calls.getWorkItemTypes.push(project);
            return backendData.workItemTypes[project] || [];
        },
        getWorkItemTypeCategories: async (project: string) => backendData.categories[project] || [],
        getClassificationNode: async (project: string, group: TreeStructureGroup) =>
            (group === TreeStructureGroup.Iterations ? backendData.iterations : backendData.areas)[project],
        getRelationTypes: async () => backendData.relationTypes,
    };

    const coreClient = {
        getProjects: async () => {
            calls.getProjects++;
            return backendData.projects;
        },
        getTeams: function (project: string, _includeMembers: boolean, _top: number, skip: number) {
            // The real service accepts either the project id or its (case-insensitive) name.
            const found = backendData.projects.find((p) => p.id === project || p.name.toLowerCase() === project.toLowerCase());
            return Promise.resolve(skip === 0 && found ? backendData.teams[found.id] || [] : []);
        },
        getTeamMembersWithExtendedProperties: async (_projectId: string, teamId: string) =>
            (backendData.members[teamId] || []).map((identity) => ({ identity })),
    };

    (getClient as jest.Mock).mockImplementation((cls: Function) => {
        if (cls === WorkItemTrackingRestClient) {
            return witClient;
        }
        if (cls === CoreRestClient) {
            return coreClient;
        }
        throw new Error("Unexpected client: " + (cls && cls.name));
    });

    (callApi as jest.Mock).mockImplementation((url: string, _m: string, _h: any, _d: any, success: Function, failure: Function) => {
        const match = url.match(/scopes\/([^/]+)\/tags/);
        if (!match) {
            failure({ name: "CallFailure", message: "unexpected url " + url });
            return;
        }
        calls.tagRequests.push(match[1]);
        success({ count: 0, value: (backendData.tags[match[1]] || []).map((name) => ({ name })) });
    });

    (sdk.getHost as jest.Mock).mockReturnValue({ name: "contoso" });
    (sdk.getExtensionContext as jest.Mock).mockReturnValue({ id: "ext-id", publisherId: "pub", extensionId: "wiql-editor" });

    const extensionData = {
        getExtensionDataManager: async () => ({
            getDocument: () => Promise.reject({ status: 404 }),
            setDocument: async () => undefined,
        }),
    };
    (sdk.getService as jest.Mock).mockImplementation(async (id: string) => {
        if (options.services && id in options.services) {
            return options.services[id];
        }
        switch (id) {
            case CommonServiceIds.ProjectPageService:
                return { getProject: async () => currentProject };
            case CommonServiceIds.ExtensionDataService:
                return extensionData;
            case CommonServiceIds.LocationService:
                return { getServiceLocation: async () => "https://dev.azure.com/org/" };
            default:
                throw new Error("Unexpected service: " + id);
        }
    });

    return { calls, witClient, coreClient };
}

export { FieldType };
