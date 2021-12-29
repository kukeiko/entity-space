import { SchemaIndexV1 } from "./metadata/schema-v1-index";

type IndexSingleValue = string | number;
export type IndexValue = IndexSingleValue | IndexSingleValue[];

// [todo] not happy with various method/variable/type names, revisit.
export class ObjectStoreIndex {
    constructor(schemaIndex: SchemaIndexV1) {
        this.schemaIndex = schemaIndex;
    }

    private readonly schemaIndex: SchemaIndexV1;
    private store = new Map();

    get name(): string {
        return this.schemaIndex.name;
    }

    get path(): readonly string[] {
        return this.schemaIndex.path;
    }

    get unique(): boolean {
        return this.schemaIndex.unique;
    }

    // [todo] instead have "insert()", "update()" and "upsert()"
    add(item: Record<string, any>, recordIndex: number): void {
        const indexValue = this.readOne(item);

        this.addToIndex(indexValue, recordIndex);
    }

    // [todo] not yet used, but we definitely need to
    update(newItem: Record<string, any>, olditem: Record<string, any>, newIndex: number, oldRecordIndex: number): void {
        this.remove(olditem, oldRecordIndex);
        this.add(newItem, newIndex);
    }

    remove(item: Record<string, any>, recordIndex: number): void {
        this.removeFromIndex(this.readOne(item), recordIndex);
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

    clear(): void {
        this.store = new Map();
    }

    read(items: any[]): IndexValue[] {
        return this.schemaIndex.read(items);
    }

    readOne(item: Record<string, any>): IndexValue {
        return this.schemaIndex.read([item])[0];
    }

    private addToIndex(indexValue: IndexValue, itemsIndex: number): void {
        if (typeof indexValue === "string" || typeof indexValue === "number") {
            indexValue = [indexValue];
        }

        let map = this.store;

        for (let i = 0; i < indexValue.length; ++i) {
            const value = indexValue[i];

            if (i === indexValue.length - 1) {
                if (this.unique) {
                    // [todo] should probably throw if its already occupied?
                    // should check how indexeddb handles it
                    map.set(value, itemsIndex);
                } else {
                    if (!map.has(value)) {
                        map.set(value, []);
                    }

                    map.get(value).push(itemsIndex);
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
                if (this.unique) {
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
