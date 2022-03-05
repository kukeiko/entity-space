import { Criterion, fromDeepBag, inSet, isValue, or } from "@entity-space/criteria";
import { Entity } from "../entity/entity";

export class EntityCompositeValueIndex {
    paths: string[] = [];

    getCriterion(entities: Entity[], mapPath: (path: string) => string = path => path): Criterion {
        const readValues = (entity: Entity): any[] => this.paths.map(path => this.walkPath(mapPath(path), entity));
        const rootMap = new Map();
        const rootBags: Record<string, any>[] = [];
        const lastPath = this.paths[this.paths.length - 1];

        for (const entity of entities) {
            const values = readValues(entity);
            let map = rootMap;

            for (let i = 0; i < values.length - 2; ++i) {
                const value = values[i];
                map = map.get(value) ?? map.set(value, new Map()).get(value);
            }

            const previousToLastValue = values[values.length - 2];
            const lastValue = values[values.length - 1];
            const mapAccessValue = previousToLastValue === void 0 ? lastValue : previousToLastValue;

            let bag = map.get(mapAccessValue);

            if (bag === void 0) {
                bag = map.set(mapAccessValue, {}).get(mapAccessValue);
                rootBags.push(bag);

                for (let i = 0; i < values.length - 1; ++i) {
                    this.writePath(this.paths[i], bag, isValue(values[i]));
                }

                this.writePath(lastPath, bag, new Set());
            }

            const set = this.walkPath<Set<any>>(lastPath, bag);
            set.add(values[values.length - 1]);
        }

        const lastPathWithoutLastSegment = lastPath.split(".").slice(0, -1).join(".");
        const lastPathLastSegment = lastPath.split(".").slice(-1)[0];

        for (const rootBag of rootBags) {
            const lastValueBag = this.walkPath(lastPathWithoutLastSegment, rootBag) as Record<string, any>;
            lastValueBag[lastPathLastSegment] = inSet(lastValueBag[lastPathLastSegment]);
        }

        const criteria = rootBags.map(rootBag => fromDeepBag(rootBag));

        if (criteria.length === 1) {
            return criteria[0];
        } else {
            return or(criteria);
        }
    }

    private walkPath<T>(path: string, object: Record<string, any>): T {
        if (path === "") return object as T;

        for (const segment of path.split(".")) {
            object = object[segment];
        }

        return object as T;
    }

    private writePath<T>(path: string, object: Record<string, any>, value: T): T {
        const segments = path.split(".");

        for (let i = 0; i < segments.length - 1; ++i) {
            const segment = segments[i];
            object = object[segment] = {};
        }

        object[segments[segments.length - 1]] = value;

        return value;
    }
}
