import { CommonServiceIds } from "azure-devops-extension-api";
import { exportWiq, importWiq, saveQuery } from "../../scripts/wiqlEditor/importExport";
import { installBackend } from "../helpers/fakeBackend";
import { appliedText, fakeEditor } from "../helpers/fixtures";

jest.mock("../../scripts/RestCall", () => ({ callApi: jest.fn() }));

const layout = { openMessageDialog: jest.fn() };
const navigation = { navigate: jest.fn(), reload: jest.fn() };
let backend: ReturnType<typeof installBackend>;

beforeAll(() => {
    backend = installBackend({
        services: {
            [CommonServiceIds.HostPageLayoutService]: layout,
            [CommonServiceIds.HostNavigationService]: navigation,
        },
    });
    backend.witClient.updateQuery = jest.fn();
    backend.witClient.createQuery = jest.fn();
});

const WIQL = "SELECT [System.Id]\nFROM workitems\nWHERE [System.Title] CONTAINS 'a < b & c'";

function readBlob(blob: Blob): Promise<string> {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.readAsText(blob);
    });
}
async function until(condition: () => boolean) {
    for (let i = 0; i < 100 && !condition(); i++) {
        await new Promise((r) => setTimeout(r, 5));
    }
}

describe("export -> import round trip", () => {
    let exported: string;

    beforeAll(async () => {
        const blobs: Blob[] = [];
        (window.URL as any).createObjectURL = jest.fn((blob: Blob) => { blobs.push(blob); return "blob:x"; });
        jest.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => undefined);
        window.prompt = jest.fn(() => "roundtrip");

        await exportWiq(fakeEditor(WIQL));
        exported = await readBlob(blobs[0]);
    });
    afterAll(() => (HTMLAnchorElement.prototype.click as jest.Mock).mockRestore());

    it("records the server and the current project from the host services", () => {
        const doc = new DOMParser().parseFromString(exported, "text/xml");
        expect(doc.querySelector("TeamFoundationServer")!.textContent).toBe("https://dev.azure.com/org/");
        expect(doc.querySelector("TeamProject")!.textContent).toBe("Alpha");
    });

    it("imports back exactly the exported query, including line breaks and special characters", async () => {
        document.body.innerHTML = `<input class="wiq-input" type="file">`;
        const input = document.querySelector(".wiq-input") as HTMLInputElement;
        Object.defineProperty(input, "files", { value: [new File([exported], "roundtrip.wiq")] });
        const editor = fakeEditor("old");

        await importWiq(editor);
        await until(() => editor.model.pushEditOperations.mock.calls.length > 0);

        expect(appliedText(editor.model)).toBe(WIQL);
    });
});

describe("saveQuery with the real result handling", () => {
    const existing = { id: "11111111-2222-3333-4444-555555555555", path: "My Queries/Mine", name: "Mine" };
    const editor = { getValue: () => WIQL };

    it("navigates to the updated query", async () => {
        backend.witClient.updateQuery.mockResolvedValue({ _links: { html: { href: "https://web/query/1" } } });
        await saveQuery(editor, { query: existing });

        expect(backend.witClient.updateQuery).toHaveBeenCalledWith(
            { wiql: WIQL, path: existing.path, name: existing.name }, "Alpha", existing.id,
        );
        expect(navigation.navigate).toHaveBeenCalledWith("https://web/query/1");
    });

    it("reloads the page when the server returns no link", async () => {
        backend.witClient.updateQuery.mockResolvedValue({});
        await saveQuery(editor, { query: existing });
        expect(navigation.reload).toHaveBeenCalled();
    });

    it("shows the server's error message when the update fails", async () => {
        backend.witClient.updateQuery.mockRejectedValue({ serverError: { message: "TF401256: no permission" } });
        await saveQuery(editor, { query: existing });
        expect(layout.openMessageDialog).toHaveBeenCalledWith("TF401256: no permission", { title: "Error saving query" });
    });

    it("explains that built-in queries cannot be saved", async () => {
        backend.witClient.updateQuery.mockRejectedValue({ message: "ignored" });
        await saveQuery(editor, { query: { ...existing, id: "a2108d31-086c-4fb0-afda-097e4cc46df4" } });
        expect(layout.openMessageDialog).toHaveBeenCalledWith(
            expect.stringContaining("Only queries in saved in My Queries or Shared Queries"),
            { title: "Error saving query" },
        );
    });

    it("creates a new query in My Queries and navigates to it", async () => {
        window.prompt = jest.fn(() => "Fresh");
        backend.witClient.createQuery.mockResolvedValue({ _links: { html: { href: "https://web/query/2" } } });

        await saveQuery(editor, { query: { ...existing, id: undefined } });

        expect(backend.witClient.createQuery).toHaveBeenCalledWith(
            { wiql: WIQL, path: existing.path, name: "Fresh" }, "Alpha", "My Queries",
        );
        expect(navigation.navigate).toHaveBeenCalledWith("https://web/query/2");
    });
});
