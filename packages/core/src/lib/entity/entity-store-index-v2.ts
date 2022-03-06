import {
    Criterion,
    ICriterionTemplate,
    InSetCriterion,
    inSetTemplate,
    IsValueCriterion,
    isValueTemplate,
    NamedCriteriaTemplate,
    NamedCriteriaTemplateItems,
    namedTemplate,
    RemapCriterionResult,
} from "@entity-space/criteria";
import { Entity } from "./entity";
import { IEntityIndex } from "./entity-index.interface";

export class EntityStoreIndexV2 {
    constructor(index: IEntityIndex) {
        this.index = index;
    }

    private readonly index: IEntityIndex;
    private readonly indexed = new Map();

    getIndex(): IEntityIndex {
        return this.index;
    }

    getIndexed(): Map<any, any> {
        return this.indexed;
    }

    read(entities: Entity[]): (number | undefined)[] {
        const allIndexValues = this.index.readValues(entities);
        const indexedValues: (number | undefined)[] = [];

        for (let i = 0; i < entities.length; ++i) {
            const set = this.readByIndexValues(allIndexValues[i]);

            if (set === void 0) {
                indexedValues.push(void 0);
            } else {
                // [todo] only taking the first value, which is only valid for unique indexes.
                indexedValues.push(set.values().next().value);
            }
        }

        return indexedValues;
    }

    private readByIndexValues(indexValues: (string | number | null)[]): Set<number> | undefined {
        let value = this.indexed;

        for (let i = 0; i < indexValues.length; ++i) {
            value = value.get(indexValues[i]);

            if (value === void 0) {
                return void 0;
            }
        }

        // [todo] any
        return value as any as Set<number>;
    }

    insert(entities: Entity[], values: number[]): void {
        const allIndexValues = this.index.readValues(entities);

        for (let i = 0; i < entities.length; ++i) {
            const [indexedValue, indexValues] = [values[i], allIndexValues[i]];
            let map = this.indexed;

            for (let e = 0; e < indexValues.length - 1; ++e) {
                const indexValue = indexValues[e];
                map = map.get(indexValue) ?? map.set(indexValue, new Map()).get(indexValue);
            }

            const lastIndexValue = indexValues[indexValues.length - 1];
            const set: Set<any> = map.get(lastIndexValue) ?? map.set(lastIndexValue, new Set()).get(lastIndexValue);
            set.add(indexedValue);
        }
    }

    remove(entities: Entity[], values: number[]): void {
        const allIndexValues = this.index.readValues(entities);

        for (let i = 0; i < entities.length; ++i) {
            const [indexedValue, indexValues] = [values[i], allIndexValues[i]];
            let map = this.indexed;

            for (let e = 0; e < indexValues.length - 1; ++e) {
                const indexValue = indexValues[e];
                map = map.get(indexValue);

                if (map === void 0) {
                    break;
                }
            }

            if (map === void 0) {
                continue;
            }

            const lastIndexValue = indexValues[indexValues.length - 1];
            const set: Set<any> = map.get(lastIndexValue);

            if (set === void 0) {
                continue;
            }

            set.delete(indexedValue);
        }
    }

    get(criterion: Criterion): false | { values: Set<number>; remapped: RemapCriterionResult } {
        const template = this.createCriterionTemplate();
        const remapped = template.remap(criterion);

        if (remapped === false) {
            return false;
        }

        const paths = this.index.getSchema().getPath();
        const values = new Set<number>();

        for (const remappedCriterion of remapped.getCriteria()) {
            let map = this.indexed;

            for (let i = 0; i < paths.length - 1; ++i) {
                const criterion = remappedCriterion.getByPath(paths[i].split("."));

                if (!(criterion instanceof IsValueCriterion)) {
                    throw new Error("criterion was not IsValueCriterion");
                }

                map = map.get(criterion.getValue());

                if (map === void 0) {
                    break;
                }
            }

            if (map === void 0) {
                continue;
            }

            // const indexValues = flattened[paths[paths.length - 1]] as InSetCriterion<any>;
            // const indexValues = flattened[paths[paths.length - 1]] as any[];
            const indexValuesCriterion = remappedCriterion.getByPath(paths[paths.length - 1].split("."));
            if (!(indexValuesCriterion instanceof InSetCriterion)) {
                throw new Error("criterion was not InSetCriterion");
            }

            // for (const indexValue of indexValues.getValues()) {
            for (const indexValue of indexValuesCriterion.getValues()) {
                const indexedValue = map.get(indexValue);

                if (indexedValue !== void 0) {
                    for (const foo of (indexedValue as Set<any>).values()) {
                        values.add(foo);
                    }
                }
            }
        }

        return { values, remapped };
    }

    createCriterionTemplate(): NamedCriteriaTemplate<any, any> {
        const paths = this.index.getSchema().getPath();
        const unbuiltTemplate: Record<string, any> = {};

        for (let i = 0; i < paths.length - 1; ++i) {
            this.treadPath(paths[i], unbuiltTemplate, isValueTemplate());
        }

        const lastPath = paths[paths.length - 1];
        this.treadPath(lastPath, unbuiltTemplate, inSetTemplate());

        return this.templateFromDeepBag(unbuiltTemplate);
    }

    private templateFromDeepBag(deepBag: Record<string, any>): NamedCriteriaTemplate<any, any> {
        const bag: NamedCriteriaTemplateItems = {};

        for (const key in deepBag) {
            const value = deepBag[key];

            if (this.looksLikeTemplate(value)) {
                bag[key] = value;
            } else {
                bag[key] = this.templateFromDeepBag(value);
            }
        }

        return namedTemplate(bag);
    }

    private looksLikeTemplate(value: any): value is ICriterionTemplate {
        return (value as any as ICriterionTemplate)?.remap instanceof Function;
    }

    private treadPath<T>(path: string, object: Record<string, any>, value: T): T {
        const segments = path.split(".");

        for (let i = 0; i < segments.length - 1; ++i) {
            const segment = segments[i];
            object = object[segment] ?? (object[segment] = {});
        }

        object[segments[segments.length - 1]] = value;

        return value;
    }
}
