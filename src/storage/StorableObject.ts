import { IDataStore, DataStoreClass } from "./DataStore";


export interface IStorableObject {
    get(id: string): Promise<any>;
    put(id: string, obj: any): Promise<any>;
    list(): Promise<any[]>;
    type: string;
    store: IDataStore;
}

export default class StorableObject implements IStorableObject {
    protected datastore: IDataStore;
    protected datastoreClass: DataStoreClass;
    protected collectionName: string;

    constructor(store: DataStoreClass, collectionName: string) {
        this.datastore = new store(collectionName);
        this.datastoreClass = store;
        this.collectionName = collectionName;
    }

    get type() {
        return this.collectionName;
    }

    async get(id: string) {
        return this.datastore.get(id);
    }

    async put(id: string, obj: any): Promise<any> {
        return this.datastore.put(id, obj);
    }

    async list(): Promise<any[]> {
        return this.datastore.list();
    }

    get store(): IDataStore {
        return this.datastore;
    }
}
