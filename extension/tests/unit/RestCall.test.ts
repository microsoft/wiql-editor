import * as sdk from "azure-devops-extension-sdk";
import { callApi } from "../../scripts/RestCall";

const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

let ajaxSpy: jest.SpyInstance | undefined;

/** Replaces $.ajax and returns the settings it was called with. */
function captureAjax() {
    ajaxSpy = jest.spyOn($, "ajax").mockImplementation((() => undefined) as any);
    return () => ajaxSpy!.mock.calls[0][0] as any;
}

const fakeXhr = (init: { status?: number, responseJSON?: any } = {}) => {
    const headers: { [name: string]: string } = {};
    return { status: init.status, responseJSON: init.responseJSON, setRequestHeader: (n: string, v: string) => { headers[n] = v; }, headers } as any;
};

beforeEach(() => {
    (sdk.getAccessToken as jest.Mock).mockResolvedValue("tok");
});
afterEach(() => ajaxSpy && ajaxSpy.mockRestore());

describe("callApi: request", () => {
    it("waits for an access token before issuing the request", async () => {
        const settings = captureAjax();
        callApi("https://x/api", "GET", undefined, undefined, jest.fn(), jest.fn());
        expect($.ajax).not.toHaveBeenCalled();
        await flush();
        expect(settings().url).toBe("https://x/api");
        expect(settings().method).toBe("GET");
    });

    it("sends an empty body by default", async () => {
        const settings = captureAjax();
        callApi("u", "POST", undefined, undefined, jest.fn(), jest.fn());
        await flush();
        expect(settings().data).toBe("");
    });

    it("sends the given data", async () => {
        const settings = captureAjax();
        callApi("u", "POST", undefined, { a: 1 }, jest.fn(), jest.fn());
        await flush();
        expect(settings().data).toEqual({ a: 1 });
    });

    it("adds the bearer token and custom headers in beforeSend", async () => {
        const settings = captureAjax();
        callApi("u", "GET", { "X-Custom": "1" }, undefined, jest.fn(), jest.fn());
        await flush();

        const xhr = fakeXhr();
        settings().beforeSend(xhr);
        expect(xhr.headers).toEqual({ Authorization: "Bearer tok", "X-Custom": "1" });
    });

    it("passes the success callback straight to jQuery", async () => {
        const settings = captureAjax();
        const success = jest.fn();
        callApi("u", "GET", undefined, undefined, success, jest.fn());
        await flush();
        expect(settings().success).toBe(success);
    });
});

describe("callApi: errors", () => {
    async function fail(xhr: any) {
        const settings = captureAjax();
        const failure = jest.fn();
        callApi("u", "GET", undefined, undefined, jest.fn(), failure);
        await flush();
        settings().error(xhr, "error", "Thrown");
        return failure;
    }

    it("forwards the JSON error body from the server", async () => {
        const body = { message: "bad request" };
        const failure = await fail(fakeXhr({ status: 400, responseJSON: body }));
        expect(failure).toHaveBeenCalledWith(body, "Thrown", 400);
    });

    it("forwards the JSON error body even for 401/403 responses", async () => {
        const body = { message: "denied" };
        const failure = await fail(fakeXhr({ status: 401, responseJSON: body }));
        expect(failure).toHaveBeenCalledWith(body, "Thrown", 401);
    });

    it("builds a CallFailure error from non-JSON responses", async () => {
        const failure = await fail(fakeXhr({ status: 500 }));
        expect(failure).toHaveBeenCalledWith({ name: "CallFailure", message: "call failed with status code 500" }, "Thrown", 500);
    });

    it.each([401, 403])("reports an AuthorizationFailure for a %s without a body", async (status) => {
        const failure = await fail(fakeXhr({ status }));
        expect(failure).toHaveBeenCalledWith({ name: "AuthorizationFailure", message: "unauthorized call" }, "Thrown", status);
    });
});
