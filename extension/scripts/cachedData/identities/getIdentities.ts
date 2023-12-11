
import { WebApiTeam, CoreRestClient } from "azure-devops-extension-api/Core";
import { getClient } from "azure-devops-extension-api";
import { IdentityRef } from "azure-devops-extension-api/WebApi";
import { CachedValue } from "../CachedValue";
import * as ExtensionCache from "./extensionCache";
import { throttlePromises } from "./throttlePromises";

interface ITeamIdentities {
    team: IdentityRef;
    members: IdentityRef[];
}
interface IProjectIdentities {
    id: string;
    name: string;
    teams: ITeamIdentities[];
}

async function hardGetAllIdentitiesInTeam(project: { id: string, name: string }, team: WebApiTeam): Promise<ITeamIdentities> {
    const teamIdentity = <IdentityRef> { displayName: `[${project.name}]\\${team.name}`, id: team.id, isContainer: true };
    const client = getClient(CoreRestClient);
        const members = await client.getTeamMembersWithExtendedProperties(project.id, team.id);
        const teamId: ITeamIdentities = {
            team: teamIdentity,
            members: members.map(({identity}) => identity),
        };
        return teamId;
}

async function getTeamsRest(project: string, top: number, skip: number): Promise<WebApiTeam[]> {
    const client = getClient(CoreRestClient);
    const get = client.getTeams.bind(client);
    if (get.length === 3) {
        // fallback
        return get(project, top, skip);
    }
    // latest version
    return get(project, false, top, skip);
}

async function hardGetAllIdentitiesInProject(proj: { id: string, name: string }): Promise<IProjectIdentities> {
    async function hardGetAllIdentitiesInProjectImpl(project: { id: string, name: string }, skip: number): Promise<IProjectIdentities> {
        const teamIds = await getTeamsRest(project.id, 100, skip);
        const teamPromises = throttlePromises(teamIds, (t) => hardGetAllIdentitiesInTeam(project, t), 10) as Promise<ITeamIdentities[]>;
        let moreTeamsPromise: Promise<IProjectIdentities | null> = Promise.resolve(null);
        if (teamIds.length === 100) {
            moreTeamsPromise = hardGetAllIdentitiesInProjectImpl(project, skip + 100);
        }

        const [teams, moreTeams] = await Promise.all([teamPromises, moreTeamsPromise]);
        return {
            id: project.id,
            name: project.name,
            teams: [...teams, ...(moreTeams ? moreTeams.teams : [])],
        };
    }
    return hardGetAllIdentitiesInProjectImpl(proj, 0);
}

async function hardGetAllIdentitiesInAllProjects(): Promise<IProjectIdentities[]> {
    const projects = await getClient(CoreRestClient).getProjects();
    return Promise.all(projects.map((p) => hardGetAllIdentitiesInProject(p)));
}

const identityMap: { [key: string]: CachedValue<IdentityRef[]> } = {};
const identitiesKey = "identities";
export async function getIdentities(project?: { id: string, name: string }): Promise<IdentityRef[]> {
    const key = `${identitiesKey}-${project ? project.name : ""}`;
    if (key in identityMap) {
        return identityMap[key].getValue();
    }
    async function tryGetIdentities() {
        function toIdentityArr(projects: IProjectIdentities[]): IdentityRef[] {
            const idMap: { [id: string]: IdentityRef } = {};
            for (const { teams } of projects) {
                for (const {team, members} of teams) {
                    idMap[team.id] = team;
                    for (const member of members) {
                        idMap[member.id] = member;
                    }
                }
            }
            return Object.keys(idMap).map((id) => idMap[id]);
        }
        const identities = await ExtensionCache.get<IProjectIdentities[]>(key);
        if (identities) {
            return toIdentityArr(identities);
        }
        const expiration = new Date();
        expiration.setDate(expiration.getDate() + 7);
        if (project) {
            const projectIdents = await hardGetAllIdentitiesInProject(project);
            ExtensionCache.store(key, [projectIdents]);
            return toIdentityArr([projectIdents]);
        } else {
            const projectIdents = await hardGetAllIdentitiesInAllProjects();
            ExtensionCache.store(key, projectIdents);
            return toIdentityArr(projectIdents);
        }
    }
    if (!(key in identityMap)) {
        identityMap[key] = new CachedValue(tryGetIdentities);
    }
    return identityMap[key].getValue();
}
