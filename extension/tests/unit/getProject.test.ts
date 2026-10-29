import * as sdk from "azure-devops-extension-sdk";
import { CommonServiceIds } from "azure-devops-extension-api";
import { getHostUrl, getProject } from "../../scripts/getProject";

describe("getProject", () => {
    it("asks the project page service for the current project", async () => {
        const project = { id: "1", name: "Proj" };
        (sdk.getService as jest.Mock).mockResolvedValue({ getProject: jest.fn(async () => project) });

        expect(await getProject()).toBe(project);
        expect(sdk.getService).toHaveBeenCalledWith(CommonServiceIds.ProjectPageService);
    });

    it("returns undefined when the host has no current project", async () => {
        (sdk.getService as jest.Mock).mockResolvedValue({ getProject: jest.fn(async () => undefined) });
        expect(await getProject()).toBeUndefined();
    });

    it("propagates service failures", async () => {
        (sdk.getService as jest.Mock).mockRejectedValue(new Error("no service"));
        await expect(getProject()).rejects.toThrow("no service");
    });
});

describe("getHostUrl", () => {
    it("returns the service location as a string", async () => {
        (sdk.getService as jest.Mock).mockResolvedValue({ getServiceLocation: jest.fn(async () => "https://dev.azure.com/org/") });

        expect(await getHostUrl()).toBe("https://dev.azure.com/org/");
        expect(sdk.getService).toHaveBeenCalledWith(CommonServiceIds.LocationService);
    });
});
