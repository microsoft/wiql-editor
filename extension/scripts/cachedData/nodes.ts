import { TeamProjectReference } from "azure-devops-extension-api/Core";
import { TreeStructureGroup, WorkItemClassificationNode } from "azure-devops-extension-api/WorkItemTracking";
import { getClient } from "azure-devops-extension-api";
import { WorkItemTrackingRestClient } from "azure-devops-extension-api/WorkItemTracking";

import { CachedValue } from "./CachedValue";
import { projectsVal } from "./projects";

export interface IProjectNodes {
    project: TeamProjectReference;
    iterationNode: WorkItemClassificationNode;
}
export const iterationNodesByProject: CachedValue<IProjectNodes[]> = new CachedValue(() => getTreeNodes(TreeStructureGroup.Iterations));
export const areaNodesByProject: CachedValue<IProjectNodes[]> = new CachedValue(() => getTreeNodes(TreeStructureGroup.Areas));
async function getTreeNodes(type: TreeStructureGroup): Promise<IProjectNodes[]> {
    const projs = await projectsVal.getValue();
    const projPromises = projs.map(async (project): Promise<IProjectNodes> =>
        getClient(WorkItemTrackingRestClient).getClassificationNode(project.name, type, undefined, 2147483647).then(
            (iterationNode): IProjectNodes => ({project, iterationNode}),
        ),
    );
    return Promise.all(projPromises);
}

export const iterationStrings: CachedValue<string[]> = new CachedValue(() => getTreeStrings(iterationNodesByProject));
export const areaStrings: CachedValue<string[]> = new CachedValue(() => getTreeStrings(areaNodesByProject));
async function getTreeStrings(nodes: CachedValue<IProjectNodes[]>) {
    interface IQueuedNode {
        path: string;
        node: WorkItemClassificationNode;
    }
    return nodes.getValue().then((nodesByProj) => {
        const paths: {[iteration: string]: void} = {};
        const toProcess: IQueuedNode[] = [];
        for (const {iterationNode} of nodesByProj) {
            toProcess.push({path: iterationNode.name, node: iterationNode});
        }
        while (toProcess.length > 0) {
            const {path, node} = toProcess.pop() as IQueuedNode;
            paths[path] = undefined;
            for (const child of node.children || []) {
                toProcess.push({
                    path: `${path}\\${child.name}`,
                    node: child,
                });
            }
        }
        return Object.keys(paths);
    });
}
