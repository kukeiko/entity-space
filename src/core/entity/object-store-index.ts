type IndexSingleValue = string | number;
export type IndexValue = IndexSingleValue | IndexSingleValue[];

// [todo] not happy with various method/variable/type names, revisit.
export class ObjectStoreIndex {
    constructor(name: string, key: string[], options?: { unique?: boolean }) {
        this.name = name;
        this.key = key;
        this.unique = options?.unique ?? false;
    }

    readonly name: string;
    readonly key: string[];
    private readonly unique: boolean;
    private index = new Map();

    getKeyPath() : string[] {
        return this.key;
    }

    // [todo] instead have "insert()", "update()" and "upsert()"
    insert(item: Record<string, any>, recordIndex: number): void {
        const indexValue = this.read(item);
        this.addToIndex(indexValue, recordIndex);
    }

    // [todo] not yet used, but we definitely need to
    update(newItem: Record<string, any>, olditem: Record<string, any>, newIndex: number, oldRecordIndex: number): void {
        this.remove(olditem, oldRecordIndex);
        this.insert(newItem, newIndex);
    }

    remove(item: Record<string, any>, recordIndex: number): void {
        this.removeFromIndex(this.read(item), recordIndex);
    }

    get(indexValues: IndexValue[]): number[] {
        const recordIndexes: number[] = [];

        for (let indexValue of indexValues) {
            if (typeof indexValue === "string" || typeof indexValue === "number") {
                indexValue = [indexValue];
            }

            let map = this.index;

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
        this.index = new Map();
    }

    private read(item: Record<string, any>): IndexValue {
        const key: IndexValue = [];

        for (const keyPath of this.key) {
            key.push(this.readOne(item, keyPath));
        }

        return key;
    }

    private readOne(item: Record<string, any>, key: string): string | number {
        const parts = key.split(".");
        let value = item;

        for (const part of parts) {
            value = value[part];
        }

        if (typeof value !== "string" && typeof value !== "number") {
            throw new Error(`index "${key}" did not evaluate to a string or number`);
        }

        return value;
    }

    private addToIndex(indexValue: IndexValue, itemsIndex: number): void {
        if (typeof indexValue === "string" || typeof indexValue === "number") {
            indexValue = [indexValue];
        }

        let map = this.index;

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

        let map = this.index;

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
