import { Class, isDefined } from "@entity-space/utils";
import { BlueprintProperty, isProperty } from "./blueprint-property";

const BLUEPRINT_METADATA_KEY = Symbol("blueprint-metadata");

interface BlueprintMetadata {
    id: string;
}

export function Blueprint(args: { id: string }) {
    return (type: Class) => {
        const metadata: BlueprintMetadata = { id: args.id };
        Reflect.defineMetadata(BLUEPRINT_METADATA_KEY, metadata, type);
    };
}

function findBlueprintMetadata(type: Class): BlueprintMetadata | undefined {
    return Reflect.getMetadata(BLUEPRINT_METADATA_KEY, type);
}

export function getBlueprintMetadata(type: Class): BlueprintMetadata {
    const metadata = findBlueprintMetadata(type);

    if (!metadata) {
        throw new Error(`no blueprint metadata found for ${type.name}`);
    }

    return metadata;
}

export function isBlueprint(value: any): value is Class {
    return Reflect.getMetadata(BLUEPRINT_METADATA_KEY, value) !== void 0;
}

type NamedProperty = BlueprintProperty & { name: string };

export function getNamedProperties(blueprint: Class): NamedProperty[] {
    const instance = new blueprint();

    return Object.entries(instance)
        .map(([name, property]) => (isProperty(property) ? { ...property, name } : void 0))
        .filter(isDefined);
}
