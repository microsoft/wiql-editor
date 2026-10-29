import * as sdk from "azure-devops-extension-sdk";
import { trackEvent, trackPage } from "../../scripts/events";

const insights = () => ({ trackEvent: jest.fn(), trackPageView: jest.fn() });
const win = window as any;

beforeEach(() => {
    (sdk.getHost as jest.Mock).mockReturnValue({ name: "contoso" });
    delete win.appInsights;
    delete win.extensionLocation;
});

describe("trackEvent", () => {
    it("does nothing when Application Insights is not loaded", () => {
        expect(() => trackEvent("evt", { a: "1" })).not.toThrow();
        expect(sdk.getHost).not.toHaveBeenCalled();
    });

    it("forwards the event with the host and extension location added to the properties", () => {
        win.appInsights = insights();
        win.extensionLocation = "https://ext/";
        trackEvent("evt", { a: "1" }, { m: 2 });
        expect(win.appInsights.trackEvent).toHaveBeenCalledWith(
            "evt",
            { a: "1", host: "contoso", location: "https://ext/" },
            { m: 2 },
        );
    });

    it("works without properties or measurements", () => {
        win.appInsights = insights();
        trackEvent("evt");
        expect(win.appInsights.trackEvent).toHaveBeenCalledWith("evt", { host: "contoso", location: undefined }, undefined);
    });

    it("does not mutate the caller's properties", () => {
        win.appInsights = insights();
        const props = { a: "1" };
        trackEvent("evt", props);
        expect(props).toEqual({ a: "1" });
    });
});

describe("trackPage", () => {
    it("does nothing when Application Insights is not loaded", () => {
        expect(() => trackPage()).not.toThrow();
    });

    it("records a page view with the host added", () => {
        win.appInsights = insights();
        trackPage({ page: "editor" }, { load: 5 });
        expect(win.appInsights.trackPageView).toHaveBeenCalledWith(undefined, { page: "editor", host: "contoso" }, { load: 5 });
    });
});
