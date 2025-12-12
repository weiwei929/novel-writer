import { v4 as uuidv4 } from 'uuid';
export class LowDBCollectionRepository {
    constructor(db) {
        this.db = db;
    }
    async create(input) {
        await this.db.read();
        const collection = {
            id: uuidv4(),
            name: input.name,
            description: input.description || '',
            tags: input.tags || [],
            projectCount: 0,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        this.db.data.collections.push(collection);
        await this.db.write();
        return collection;
    }
    async findById(id) {
        await this.db.read();
        return this.db.data.collections.find(c => c.id === id) || null;
    }
    async findAll() {
        await this.db.read();
        return [...this.db.data.collections];
    }
    async update(id, input) {
        await this.db.read();
        const collectionIndex = this.db.data.collections.findIndex(c => c.id === id);
        if (collectionIndex === -1)
            return null;
        const existingCollection = this.db.data.collections[collectionIndex];
        const updatedCollection = {
            ...existingCollection,
            ...input,
            id, // 确保ID不变
            updatedAt: new Date().toISOString()
        };
        this.db.data.collections[collectionIndex] = updatedCollection;
        await this.db.write();
        return updatedCollection;
    }
    async delete(id) {
        await this.db.read();
        const initialLength = this.db.data.collections.length;
        this.db.data.collections = this.db.data.collections.filter(c => c.id !== id);
        const deleted = this.db.data.collections.length < initialLength;
        if (deleted) {
            await this.db.write();
        }
        return deleted;
    }
    async search(query) {
        await this.db.read();
        if (!query.trim()) {
            return [...this.db.data.collections];
        }
        const lowerQuery = query.toLowerCase();
        return this.db.data.collections.filter(c => c.name.toLowerCase().includes(lowerQuery) ||
            c.description?.toLowerCase().includes(lowerQuery) ||
            c.tags.some(tag => tag.toLowerCase().includes(lowerQuery)));
    }
    async getProjectCount(collectionId) {
        await this.db.read();
        return this.db.data.projects.filter(p => p.collectionId === collectionId).length;
    }
}
//# sourceMappingURL=CollectionRepository.js.map