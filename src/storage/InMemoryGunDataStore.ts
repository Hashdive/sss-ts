import DataStore from './DataStore';

export default class InMemoryDataStore extends DataStore {
    private static data: any = {};

    constructor(collectionName: string) {
        super(collectionName);
        // Ensure the specific collection is initialized in the static data map
        if (!InMemoryDataStore.data[this.collectionName()]) {
            InMemoryDataStore.data[this.collectionName()] = {};
        }
    }

    async get(id: string): Promise<any> {
        return InMemoryDataStore.data[this.collectionName()][id];
    }

    async put(id: string, obj: any): Promise<void> {
        // Ensure the collection exists, or initialize if not
        if (!InMemoryDataStore.data[this.collectionName()]) {
            InMemoryDataStore.data[this.collectionName()] = {};
        }
        InMemoryDataStore.data[this.collectionName()][id] = obj;
    }

    async del(id: string): Promise<void> {
        if (InMemoryDataStore.data[this.collectionName()]) {
            delete InMemoryDataStore.data[this.collectionName()][id];
        }
    }

    async list(): Promise<any[]> {
        if (InMemoryDataStore.data[this.collectionName()]) {
            return Object.values(InMemoryDataStore.data[this.collectionName()]);
        }
        return [];
    }
}
