export const getClient = jest.fn();

export enum CommonServiceIds {
    ExtensionDataService = "ms.vss-features.extension-data-service",
    HostNavigationService = "ms.vss-features.host-navigation-service",
    HostPageLayoutService = "ms.vss-features.host-page-layout-service",
    LocationService = "ms.vss-features.location-service",
    ProjectPageService = "ms.vss-tfs-web.tfs-page-data-service",
}

export enum PanelSize {
    Small = 0,
    Medium = 1,
    Large = 2,
}
