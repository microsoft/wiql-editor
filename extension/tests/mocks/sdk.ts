export const getService = jest.fn();
export const getHost = jest.fn(() => ({ id: "host-id", name: "contoso", isHosted: true, scheme: "https://" }));
export const getAccessToken = jest.fn(async () => "token");
export const getExtensionContext = jest.fn(() => ({ id: "ext-id", publisherId: "pub", extensionId: "wiql-editor", version: "1.0.0" }));
