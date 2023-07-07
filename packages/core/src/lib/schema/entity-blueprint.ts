import { Class, isDefined } from "@entity-space/utils";
import { BlueprintProperty, isProperty } from "./entity-blueprint-property";

// [todo] changed it to Symbol.for() instead of just Symbol() to fix an issue where, in a test,
// i imported the decorate via absolute path instead of relative. the test failed because of it,
// since this file actually existes twice, and there were two distinct symbols for the same blueprint.
// => i.e. i knew this was going to happen and I wanted to test it failing, now it did, so I need to
// apply Symbol.for() for all other places where symbols are used
const BLUEPRINT_METADATA_KEY = Symbol.for("blueprint-metadata");

interface BlueprintMetadata {
    id: string;
    key?: string | string[];
    indexes?: Record<string, string | string[]>;
}

// [todo] investigate alternative to using decorators: special property on each
// blueprint instance (which would then also exist on each entity). we could
// put quite a lot of useful stuff in there, like "lastCachedAt", "isPersisted" and more!
export function EntityBlueprint(options: BlueprintMetadata) {
    return (type: Class) => {
        const metadata: BlueprintMetadata = { ...options };
        Reflect.defineMetadata(BLUEPRINT_METADATA_KEY, metadata, type);
    };
}

function findBlueprintMetadata(type: Class): BlueprintMetadata | undefined {
    return Reflect.getMetadata(BLUEPRINT_METADATA_KEY, type);
}

export function getEntityBlueprintMetadata(type: Class): BlueprintMetadata {
    const metadata = findBlueprintMetadata(type);

    if (!metadata) {
        throw new Error(`no blueprint metadata found for ${type.name}, please check if the class is decorated`);
    }

    return metadata;
}

export function isEntityBlueprint(value: any): value is Class {
    return Reflect.getMetadata(BLUEPRINT_METADATA_KEY, value) !== void 0;
}

type NamedProperty = BlueprintProperty & { name: string };

export function getNamedProperties(blueprint: Class): NamedProperty[] {
    const instance = new blueprint();

    return Object.entries(instance)
        .map(([name, property]) => (isProperty(property) ? { ...property, name } : void 0))
        .filter(isDefined);
}
