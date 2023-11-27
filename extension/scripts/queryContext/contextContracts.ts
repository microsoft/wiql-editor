export interface IQuery {
    id: string;
    name: string;
    isPublic: boolean;
    wiql: string;
    path: string;
}

export interface IContextOptions {
    query: IQuery;
    initialValue: boolean;
    save: () => void;
    loaded: (callbacks: ICallbacks) => Promise<void>;
}

export interface ICallbacks {
    /** To be set by consumer and read by provider */
    okCallback: () => Promise<any>;
}
