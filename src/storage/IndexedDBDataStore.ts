import { IDataStore } from "./DataStore";


export default class IndexedDBDataStore implements IDataStore {
    private db!: IDBDatabase;
    private _collectionName: string;
    
    constructor(collectionName: string) {
        this._collectionName = collectionName;
        this.openDatabase(); // Call the openDatabase method in the constructor
    }

    public async openDatabase(): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            const request = indexedDB.open('my_database', 1);

            request.onerror = () => {
                reject(request.error);
            };

            request.onsuccess = () => {
                this.db = request.result;
                resolve();
            };

            request.onupgradeneeded = () => {
                this.db = request.result;
                if (!this.db.objectStoreNames.contains(this._collectionName)) {
                    this.db.createObjectStore(this._collectionName, { keyPath: 'id' });
                }
            };
        });
    }

    public async get(id: string): Promise<any> {
        return new Promise<any>((resolve, reject) => {
            const transaction = this.db.transaction(this._collectionName, 'readonly');
            const objectStore = transaction.objectStore(this._collectionName);
            const request = objectStore.get(id);
            request.onerror = () => {
                reject(request.error);
            };
            request.onsuccess = () => {
                resolve(request.result);
            };
        });
    }

    public async put(id: string, obj: any): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            const transaction = this.db.transaction(this._collectionName, 'readwrite');
            const objectStore = transaction.objectStore(this._collectionName);
            const request = objectStore.put({ id, ...obj });
            request.onerror = () => {
                reject(request.error);
            };
            request.onsuccess = () => {
                resolve();
            };
        });
    }

    public async del(id: string): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            const transaction = this.db.transaction(this._collectionName, 'readwrite');
            const objectStore = transaction.objectStore(this._collectionName);
            const request = objectStore.delete(id);
            request.onerror = () => {
                reject(request.error);
            };
            request.onsuccess = () => {
                resolve();
            };
        });
    }

    public async list(): Promise<any[]> {
        return new Promise<any[]>((resolve, reject) => {
            const transaction = this.db.transaction(this._collectionName, 'readonly');
            const objectStore = transaction.objectStore(this._collectionName);
            const request = objectStore.getAll();
            request.onerror = () => {
                reject(request.error);
            };
            request.onsuccess = () => {
                resolve(request.result);
            };
        });
    }

    public collectionName(): string {
        return this._collectionName;
    }

    public newId(): string {
        return Math.random().toString(36).substring(2);
    }
}
