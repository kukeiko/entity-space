import { IEntitySchemaIndex } from "../schema/public";
import { Entity } from "./entity";
import { IEntityReader } from "./entity-reader.interface";

type IndexSingleValue = string | number;
export type IndexValue = IndexSingleValue | IndexSingleValue[];

export class EntityStoreIndex implements IEntitySchemaIndex {
    constructor(schemaIndex: IEntitySchemaIndex, entityReader: IEntityReader) {
        this.schemaIndex = schemaIndex;
        this.entityReader = entityReader;
    }

    private readonly entityReader: IEntityReader;
    private readonly schemaIndex: IEntitySchemaIndex;
    private store = new Map();

    // [todo] instead have "insert()", "update()" and "upsert()"
    add(item: Record<string, any>, recordIndex: number): void {
        const indexValue = this.readOne(item);

        this.addToIndex(indexValue, recordIndex);
    }

    clear(): void {
        this.store = new Map();
    }

    get(indexValues: IndexValue[]): number[] {
        const recordIndexes: number[] = [];

        for (let indexValue of indexValues) {
            if (typeof indexValue === "string" || typeof indexValue === "number") {
                indexValue = [indexValue];
            }

            let map = this.store;

            for (let i = 0; i < indexValue.length; ++i) {
                const value = indexValue[i];

                if (i < indexValue.length - 1) {
                    map = map.get(value);

                    if (map === void 0) {
                        break;
                    }
                } else {
                    let indexedValues = map.get(value);

                    if (indexedValues === void 0) {
                        break;
                    }

                    if (typeof indexedValues === "number") {
                        indexedValues = [indexedValues];
                    }

                    recordIndexes.push(...indexedValues);
                }
            }
        }

        return recordIndexes;
    }

    getName(): string {
        return this.schemaIndex.getName();
    }

    getPath(): string[] {
        return this.schemaIndex.getPath();
    }

    isUnique(): boolean {
        return this.schemaIndex.isUnique();
    }

    read(entities: Entity[]): IndexValue[] {
        return this.entityReader.readIndex(this.schemaIndex, entities);
    }

    readOne(entity: Entity): IndexValue {
        return this.entityReader.readIndexFromOne(this.schemaIndex, entity);
    }

    remove(item: Record<string, any>, recordIndex: number): void {
        this.removeFromIndex(this.readOne(item), recordIndex);
    }

    // [todo] not yet used, but we definitely need to
    update(newItem: Record<string, any>, olditem: Record<string, any>, newIndex: number, oldRecordIndex: number): void {
        this.remove(olditem, oldRecordIndex);
        this.add(newItem, newIndex);
    }

    private addToIndex(indexValue: IndexValue, itemsIndex: number): void {
        if (typeof indexValue === "string" || typeof indexValue === "number") {
            indexValue = [indexValue];
        }

        let map = this.store;

        for (let i = 0; i < indexValue.length; ++i) {
            const value = indexValue[i];

            if (i === indexValue.length - 1) {
                if (this.isUnique()) {
                    // [todo] should probably throw if its already occupied?
                    // should check how indexeddb handles it
                    map.set(value, itemsIndex);
                } else {
                    if (!map.has(value)) {
                        map.set(value, []);
                    }

                    // [todo] linear lookup is slow
                    if (!(map.get(value) as any[]).includes(itemsIndex)) {
                        map.get(value).push(itemsIndex);
                    }
                }
            } else {
                if (!map.has(value)) {
                    map.set(value, new Map());
                }

                map = map.get(value);
            }
        }
    }

    private removeFromIndex(indexValue: IndexValue, itemsIndex: number): void {
        if (typeof indexValue === "string" || typeof indexValue === "number") {
            indexValue = [indexValue];
        }

        let map = this.store;

        for (let i = 0; i < indexValue.length; ++i) {
            const value = indexValue[i];

            if (i === indexValue.length - 1) {
                if (this.isUnique()) {
                    // [todo] should probably throw if its already occupied?
                    // should check how indexeddb handles it
                    map.delete(value);
                } else {
                    if (!map.has(value)) {
                        return;
                    }

                    map.set(
                        value,
                        map.get(value).filter((item: any) => item !== itemsIndex)
                    );
                }
            } else {
                if (!map.has(value)) {
                    map.set(value, new Map());
                }

                map = map.get(value);
            }
        }
    }
}
