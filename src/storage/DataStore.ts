export interface IDataStore {
    get(id: string): Promise<any>;
    put(id: string, obj: any): Promise<any>;
    del(id: string): Promise<void>;
    list(): Promise<any[]>;
    collectionName(): string;
    newId(): string;
}

export default class DataStore implements IDataStore {
    private _collectionName: string;

    constructor(collectionName: string) {
        this._collectionName = collectionName;
    }

    public async get(id: string): Promise<any> {
        throw new Error('Method not implemented.');
    }

    public async put(id: string, obj: any): Promise<any> {
        throw new Error('Method not implemented.');
    }

    public async del(id: string): Promise<void> {
        throw new Error('Method not implemented.');
    }

    public async list(): Promise<any[]> {
        throw new Error('Method not implemented.');
    }

    public newId(): string {
        return this._collectionName.toLowerCase().slice(0, 5) + '_' + Math.random().toString(36).substring(2);
    }

    public collectionName(): string {
        return this._collectionName;
    }
}

export type DataStoreClass = typeof DataStore;