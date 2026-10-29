// Values copied from azure-devops-extension-api/WorkItemTracking.
export enum FieldType {
    String = 0,
    Integer = 1,
    DateTime = 2,
    PlainText = 3,
    Html = 4,
    TreePath = 5,
    History = 6,
    Double = 7,
    Guid = 8,
    Boolean = 9,
    Identity = 10,
    PicklistString = 11,
    PicklistInteger = 12,
    PicklistDouble = 13,
}

export enum GetFieldsExpand {
    None = 0,
    ExtensionFields = 1,
    IncludeDeleted = 2,
}

export enum TreeStructureGroup {
    Areas = 0,
    Iterations = 1,
}

/** Used only as a lookup key for the mocked getClient(). */
export class WorkItemTrackingRestClient { }
