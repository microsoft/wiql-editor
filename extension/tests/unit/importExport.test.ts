import { getClient } from "azure-devops-extension-api";
import * as sdk from "azure-devops-extension-sdk";
import { trackEvent } from "../../scripts/events";
import { getHostUrl, getProject } from "../../scripts/getProject";
import { handleSaveResult } from "../../scripts/queryEditor/queryDialog";
import { exportWiq, importWiq, saveQuery } from "../../scripts/wiqlEditor/importExport";
import { appliedText, fakeEditor } from "../helpers/fixtures";

jest.mock("../../scripts/events", () => ({ __esModule: true, trackEvent: jest.fn() }));
jest.mock("../../scripts/getProject", () => ({ __esModule: true, getHostUrl: jest.fn(), getProject: jest.fn() }));
jest.mock("../../scripts/queryEditor/queryDialog", () => ({ __esModule: true, handleSaveResult: jest.fn() }));

const WIQL = "SELECT [System.Id] FROM workitems WHERE [System.Title] < 'a&b'";

function readBlob(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsText(blob);
    });
}

async function until(condition: () => boolean) {
    for (let i = 0; i < 100 && !condition(); i++) {
        await new Promise((r) => setTimeout(r, 5));
    }
    if (!condition()) {
        throw new Error("condition not met in time");
    }
}

beforeEach(() => {
    (getHostUrl as jest.Mock).mockResolvedValue("https://dev.azure.com/org/");
    (getProject as jest.Mock).mockResolvedValue({ id: "pid", name: "Proj" });
    document.body.innerHTML = "";
});

describe("exportWiq", () => {
    let downloads: Array<{ download: string, href: string, attached: boolean }>;
    let blobs: Blob[];

    beforeEach(() => {
        downloads = [];
        blobs = [];
        (window.URL as any).createObjectURL = jest.fn((blob: Blob) => { blobs.push(blob); return "blob:mock"; });
        jest.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(function (this: HTMLAnchorElement) {
            downloads.push({ download: this.download, href: this.href, attached: document.body.contains(this) });
        });
        window.prompt = jest.fn();
    });
    afterEach(() => (HTMLAnchorElement.prototype.click as jest.Mock).mockRestore());

    const run = (name?: string) => exportWiq(fakeEditor(WIQL), name);

    it("downloads a .wiq file named after the prompt answer", async () => {
        (window.prompt as jest.Mock).mockReturnValue("my query");
        await run();
        expect(downloads).toEqual([{ download: "my query.wiq", href: "blob:mock", attached: true }]);
    });

    it("keeps an existing .wiq extension, ignoring case", async () => {
        (window.prompt as jest.Mock).mockReturnValue("Report.WIQ");
        await run();
        expect(downloads[0].download).toBe("Report.WIQ");
    });

    it("falls back to 'query' when the name is left empty", async () => {
        (window.prompt as jest.Mock).mockReturnValue("");
        await run();
        expect(downloads[0].download).toBe("query.wiq");
    });

    it("prefers the explicit query name over the prompt answer", async () => {
        (window.prompt as jest.Mock).mockReturnValue("typed");
        await run("Saved Query");
        expect(downloads[0].download).toBe("Saved Query.wiq");
    });

    it("does not download anything when the prompt is cancelled", async () => {
        const log = jest.spyOn(console, "log").mockImplementation(() => undefined);
        (window.prompt as jest.Mock).mockReturnValue(null);
        await run();
        expect(downloads).toEqual([]);
        expect(trackEvent).not.toHaveBeenCalled();
        expect(log).toHaveBeenCalledWith("Export cancelled");
        log.mockRestore();
    });

    it("removes the temporary link from the page", async () => {
        (window.prompt as jest.Mock).mockReturnValue("x");
        await run();
        expect(document.querySelectorAll("a")).toHaveLength(0);
    });

    it("writes a WorkItemQuery document with host, project and the query text", async () => {
        (window.prompt as jest.Mock).mockReturnValue("x");
        await run();

        const text = await readBlob(blobs[0]);
        const doc = new DOMParser().parseFromString(text, "text/xml");
        expect(doc.documentElement.nodeName).toBe("WorkItemQuery");
        expect(doc.documentElement.getAttribute("Version")).toBe("1");
        expect(doc.querySelector("TeamFoundationServer")!.textContent).toBe("https://dev.azure.com/org/");
        expect(doc.querySelector("TeamProject")!.textContent).toBe("Proj");
        expect(doc.querySelector("Wiql")!.textContent).toBe(WIQL);
    });

    it("escapes XML special characters in the query", async () => {
        (window.prompt as jest.Mock).mockReturnValue("x");
        await run();
        const text = await readBlob(blobs[0]);
        expect(text).toContain("&lt;");
        expect(text).toContain("&amp;");
    });

    it("tracks the export with the document length", async () => {
        (window.prompt as jest.Mock).mockReturnValue("x");
        await run();
        const text = await readBlob(blobs[0]);
        expect(trackEvent).toHaveBeenCalledWith("exportWiq", { wiqlLength: String(text.length) });
    });
});

describe("importWiq", () => {
    const addInput = (files: File[] | null) => {
        const input = document.createElement("input");
        input.type = "file";
        input.className = "wiq-input";
        Object.defineProperty(input, "files", { value: files });
        document.body.appendChild(input);
        return input;
    };
    const file = (content: string) => new File([content], "query.wiq");

    it("does nothing when no file was chosen", async () => {
        addInput(null);
        const editor = fakeEditor("");
        await importWiq(editor);
        expect(editor.model.pushEditOperations).not.toHaveBeenCalled();
    });

    it("does nothing for an empty file list", async () => {
        addInput([]);
        const editor = fakeEditor("");
        await importWiq(editor);
        expect(editor.model.pushEditOperations).not.toHaveBeenCalled();
    });

    it("loads the query from a WorkItemQuery document", async () => {
        const xml = `<WorkItemQuery Version="1"><TeamProject>P</TeamProject><Wiql>SELECT a FROM workitems WHERE a &lt; 1</Wiql></WorkItemQuery>`;
        addInput([file(xml)]);
        const editor = fakeEditor("old text");

        await importWiq(editor);
        await until(() => editor.model.pushEditOperations.mock.calls.length > 0);

        expect(appliedText(editor.model)).toBe("SELECT a FROM workitems WHERE a < 1");
    });

    it("replaces the whole document", async () => {
        addInput([file("SELECT a FROM workitems")]);
        const editor = fakeEditor("old text\nmore");

        await importWiq(editor);
        await until(() => editor.model.pushEditOperations.mock.calls.length > 0);

        const [, [edit]] = editor.model.pushEditOperations.mock.calls[0];
        expect(edit.range).toEqual(editor.model.getFullModelRange());
        expect(edit.forceMoveMarkers).toBe(true);
    });

    it("accepts the legacy format that was just the query text", async () => {
        addInput([file("SELECT a FROM workitems")]);
        const editor = fakeEditor("");

        await importWiq(editor);
        await until(() => editor.model.pushEditOperations.mock.calls.length > 0);

        expect(appliedText(editor.model)).toBe("SELECT a FROM workitems");
    });

    it("clears the file input so the same file can be chosen again", async () => {
        const input = addInput([file("SELECT a FROM workitems")]);
        const valSpy = jest.spyOn($.fn, "val");
        await importWiq(fakeEditor(""));
        expect(valSpy).toHaveBeenCalledWith("");
        expect(input.value).toBe("");
        valSpy.mockRestore();
    });

    it("shows an error dialog when the file cannot be parsed", async () => {
        const dialog = { openMessageDialog: jest.fn() };
        (sdk.getService as jest.Mock).mockResolvedValue(dialog);
        addInput([file("<WorkItemQuery")]);
        const editor = fakeEditor("");

        await importWiq(editor);
        await until(() => dialog.openMessageDialog.mock.calls.length > 0);

        expect(dialog.openMessageDialog).toHaveBeenCalledWith(expect.stringContaining("Invalid XML"), { title: "Error importing query" });
        expect(editor.model.pushEditOperations).not.toHaveBeenCalled();
    });
});

describe("saveQuery", () => {
    const existingId = "11111111-2222-3333-4444-555555555555";
    const client = { updateQuery: jest.fn(), createQuery: jest.fn() };
    const editor = { getValue: () => WIQL };
    const config = (query: object) => ({ query: { path: "Shared Queries/Folder", name: "Mine", ...query } });

    beforeEach(() => {
        (getClient as jest.Mock).mockReturnValue(client);
        window.prompt = jest.fn();
    });

    describe("existing query", () => {
        it("updates it with the editor text", async () => {
            client.updateQuery.mockResolvedValue({ _links: { html: { href: "https://web/query" } } });
            await saveQuery(editor, config({ id: existingId }));

            expect(client.updateQuery).toHaveBeenCalledWith(
                { wiql: WIQL, path: "Shared Queries/Folder", name: "Mine" }, "Proj", existingId,
            );
            expect(handleSaveResult).toHaveBeenCalledWith("https://web/query", undefined);
        });

        it("reports an empty result (reload) when the response has no html link", async () => {
            client.updateQuery.mockResolvedValue({});
            await saveQuery(editor, config({ id: existingId }));
            expect((handleSaveResult as jest.Mock).mock.calls[0][0]).toBe("");
        });

        it("reports failures with the original query", async () => {
            const error = new Error("conflict");
            client.updateQuery.mockRejectedValue(error);
            const configuration = config({ id: existingId });
            await saveQuery(editor, configuration);
            expect(handleSaveResult).toHaveBeenCalledWith(null, configuration.query, error);
        });
    });

    describe("new query", () => {
        it.each([
            ["no id", {}],
            ["an empty guid", { id: "00000000-0000-0000-0000-000000000000" }],
        ])("creates a query when there is %s", async (_label, extra) => {
            (window.prompt as jest.Mock).mockReturnValue("Brand new");
            client.createQuery.mockResolvedValue({ _links: { html: { href: "https://web/new" } } });

            await saveQuery(editor, config(extra));

            expect(client.updateQuery).not.toHaveBeenCalled();
            expect(client.createQuery).toHaveBeenCalledWith(
                { wiql: WIQL, path: "Shared Queries/Folder", name: "Brand new" }, "Proj", "My Queries",
            );
            expect(handleSaveResult).toHaveBeenCalledWith("https://web/new");
        });

        it("saves public queries under Shared Queries", async () => {
            (window.prompt as jest.Mock).mockReturnValue("Pub");
            client.createQuery.mockResolvedValue({});
            await saveQuery(editor, config({ isPublic: true }));
            expect(client.createQuery.mock.calls[0][2]).toBe("Shared Queries");
        });

        it("does nothing when the name prompt is cancelled or empty", async () => {
            for (const answer of [null, ""]) {
                (window.prompt as jest.Mock).mockReturnValue(answer);
                await saveQuery(editor, config({}));
            }
            expect(client.createQuery).not.toHaveBeenCalled();
            expect(handleSaveResult).not.toHaveBeenCalled();
        });

        it("reports creation failures", async () => {
            const log = jest.spyOn(console, "error").mockImplementation(() => undefined);
            (window.prompt as jest.Mock).mockReturnValue("Pub");
            const error = new Error("forbidden");
            client.createQuery.mockRejectedValue(error);
            const configuration = config({});

            await saveQuery(editor, configuration);

            expect(handleSaveResult).toHaveBeenCalledWith(null, configuration.query, error);
            expect(log).toHaveBeenCalled();
            log.mockRestore();
        });
    });
});
