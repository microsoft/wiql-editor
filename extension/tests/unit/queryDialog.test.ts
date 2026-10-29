import * as sdk from "azure-devops-extension-sdk";
import { CommonServiceIds, PanelSize } from "azure-devops-extension-api";
import { handleSaveResult, isSupportedQueryId, showDialog } from "../../scripts/queryEditor/queryDialog";

jest.mock("../../scripts/events", () => ({ __esModule: true, trackEvent: jest.fn() }));

const layout = { openMessageDialog: jest.fn(), openPanel: jest.fn() };
const navigation = { reload: jest.fn(), navigate: jest.fn() };

const supportedQuery: any = { id: "d5b30e10-1ec4-4ec9-8e3b-3a1a3e1a9d2f", name: "Mine", path: "My Queries/Mine" };
const AssignedToMe = "A2108D31-086C-4FB0-AFDA-097E4CC46DF4";

beforeEach(() => {
    (sdk.getService as jest.Mock).mockImplementation(async (id: string) =>
        id === CommonServiceIds.HostNavigationService ? navigation : layout,
    );
});

describe("isSupportedQueryId", () => {
    it.each([
        "A2108D31-086C-4FB0-AFDA-097E4CC46DF4",
        "B7A26A56-EA87-4C97-A504-3F028808BB9F",
        "202230E0-821E-401D-96D1-24A7202330D0",
        "53FB153F-C52C-42F1-90B6-CA17FC3561A8",
        "2CBF5136-1AE5-4948-B59A-36F526D9AC73",
        "08E20883-D56C-4461-88EB-CE77C0C7936D",
        "2650C586-0DE4-4156-BA0E-14BCFB664CCA",
    ])("rejects the built-in query %s", (id) => {
        expect(isSupportedQueryId(id)).toBe(false);
    });

    it("compares ids case-insensitively", () => {
        expect(isSupportedQueryId(AssignedToMe.toLowerCase())).toBe(false);
    });

    it("accepts user queries", () => {
        expect(isSupportedQueryId("11111111-2222-3333-4444-555555555555")).toBe(true);
    });
});

describe("handleSaveResult", () => {
    it("navigates to the saved query when given a url", async () => {
        await handleSaveResult("https://web/query", supportedQuery);
        expect(navigation.navigate).toHaveBeenCalledWith("https://web/query");
        expect(layout.openMessageDialog).not.toHaveBeenCalled();
    });

    it("reloads the page when the result is an empty string", async () => {
        await handleSaveResult("", supportedQuery);
        expect(navigation.reload).toHaveBeenCalled();
        expect(navigation.navigate).not.toHaveBeenCalled();
    });

    it("ignores results that are not strings", async () => {
        await handleSaveResult({ saved: true }, supportedQuery);
        expect(navigation.navigate).not.toHaveBeenCalled();
        expect(navigation.reload).not.toHaveBeenCalled();
        expect(layout.openMessageDialog).not.toHaveBeenCalled();
    });

    describe("failures", () => {
        it("shows a generic message when saving returned nothing", async () => {
            await handleSaveResult(null, supportedQuery);
            expect(layout.openMessageDialog).toHaveBeenCalledWith("Failed to save query", { title: "Error saving query" });
        });

        it("treats undefined like null", async () => {
            await handleSaveResult(undefined, supportedQuery);
            expect(layout.openMessageDialog).toHaveBeenCalledWith("Failed to save query", { title: "Error saving query" });
        });

        it("shows the server's message from an error", async () => {
            await handleSaveResult(null, supportedQuery, { message: "TF401256: not allowed" } as any);
            expect(layout.openMessageDialog).toHaveBeenCalledWith("TF401256: not allowed", { title: "Error saving query" });
        });

        it("unwraps serverError", async () => {
            await handleSaveResult(null, supportedQuery, { serverError: { message: "inner" } } as any);
            expect(layout.openMessageDialog.mock.calls[0][0]).toBe("inner");
        });

        it("falls back to value.Message", async () => {
            await handleSaveResult(null, supportedQuery, { value: { Message: "legacy" } } as any);
            expect(layout.openMessageDialog.mock.calls[0][0]).toBe("legacy");
        });

        it("explains when the query is a built-in one that cannot be updated", async () => {
            await handleSaveResult(null, { ...supportedQuery, id: AssignedToMe }, { message: "ignored" } as any);
            expect(layout.openMessageDialog).toHaveBeenCalledWith(
                "Only queries in saved in My Queries or Shared Queries can be updated with this extension",
                { title: "Error saving query" },
            );
        });

        it("does not navigate", async () => {
            await handleSaveResult(null, supportedQuery);
            expect(navigation.navigate).not.toHaveBeenCalled();
            expect(navigation.reload).not.toHaveBeenCalled();
        });
    });
});

describe("showDialog", () => {
    it("opens the context form panel for the current extension", async () => {
        await showDialog(supportedQuery);

        expect(layout.openPanel).toHaveBeenCalledTimes(1);
        const [contribution, options] = layout.openPanel.mock.calls[0];
        expect(contribution).toBe("pub.wiql-editor.contextForm");
        expect(options.title).toBe("Mine");
        expect(options.size).toBe(PanelSize.Large);
        expect(options.configuration.query).toBe(supportedQuery);
        expect(options.configuration.initialValue).toBe(false);
    });

    it("accepts the callbacks registered by the panel", async () => {
        await showDialog(supportedQuery);
        const { configuration } = layout.openPanel.mock.calls[0][1];
        await expect(configuration.loaded({ okCallback: async () => undefined })).resolves.toBeUndefined();
    });

    it("tolerates being closed with or without a result", async () => {
        await showDialog(supportedQuery);
        const { onClose } = layout.openPanel.mock.calls[0][1];
        expect(() => onClose(undefined)).not.toThrow();
        expect(() => onClose({ saved: true })).not.toThrow();
    });
});
