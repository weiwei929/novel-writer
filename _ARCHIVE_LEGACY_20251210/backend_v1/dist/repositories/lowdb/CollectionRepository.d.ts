import { Low } from 'lowdb';
import { Collection } from '../../types/index.js';
import { ICollectionRepository } from '../interfaces.js';
import { DatabaseData } from './types.js';
export declare class LowDBCollectionRepository implements ICollectionRepository {
    private db;
    constructor(db: Low<DatabaseData>);
    create(input: {
        name: string;
        description?: string;
        tags?: string[];
    }): Promise<Collection>;
    findById(id: string): Promise<Collection | null>;
    findAll(): Promise<Collection[]>;
    update(id: string, input: Partial<Omit<Collection, 'id' | 'createdAt'>>): Promise<Collection | null>;
    delete(id: string): Promise<boolean>;
    search(query: string): Promise<Collection[]>;
    getProjectCount(collectionId: string): Promise<number>;
}
//# sourceMappingURL=CollectionRepository.d.ts.map