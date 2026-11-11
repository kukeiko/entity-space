import {
    Entity,
    entityHasId,
    EntityRelationSelection,
    EntitySchema,
    getEntityDifference,
    relationEntries,
} from "@entity-space/elements";
import { ComplexKeyMap } from "@entity-space/utils";
import { isPlainObject } from "lodash";

export interface MatchedMutationResult {
    schema: EntitySchema;
    input: Entity;
    persisted: Entity;
}

export interface MatchMutationResultsOptions {
    /** Inputs that must not be matched, e.g. because the mutator reported them as failed. */
    isExcluded?: (input: Entity) => boolean;
    /** Pairs explicitly reported by the mutator. A missing persisted entity pairs the input with itself. */
    explicit?: ReadonlyMap<Entity, Entity | undefined>;
}

/**
 * Pairs the entities passed to a mutator with the entities it returned, including related entities of the given
 * selection. Pairs by explicit report, then by reference, then by Id, and finally by assigning the pairs with the
 * smallest difference in properties first - which makes the result independent of the order of returned entities.
 * Inputs that remain unpaired are not part of the result.
 */
export function matchMutationResults(
    schema: EntitySchema,
    selection: EntityRelationSelection,
    inputs: readonly Entity[],
    returned: readonly Entity[],
    options: MatchMutationResultsOptions = {},
): MatchedMutationResult[] {
    const pairs = matchLevel(schema, inputs, returned, options);
    const results: MatchedMutationResult[] = pairs.map(([input, persisted]) => ({ schema, input, persisted }));

    for (const [relation, relatedSchema, selected] of relationEntries(schema, selection)) {
        for (const [input, persisted] of pairs) {
            results.push(
                ...matchMutationResults(
                    relatedSchema,
                    selected,
                    relation.readValueAsArray(input),
                    persisted === input ? relation.readValueAsArray(input) : relation.readValueAsArray(persisted),
                    options,
                ),
            );
        }
    }

    return results;
}

function matchLevel(
    schema: EntitySchema,
    inputs: readonly Entity[],
    returned: readonly Entity[],
    { isExcluded = () => false, explicit = new Map() }: MatchMutationResultsOptions,
): [input: Entity, persisted: Entity][] {
    const pairs = new Map<Entity, Entity>();
    const available = new Set(returned);

    for (const input of inputs) {
        if (explicit.has(input)) {
            const persisted = explicit.get(input) ?? input;
            pairs.set(input, persisted);
            available.delete(persisted);
        }
    }

    const open = () => inputs.filter(input => !pairs.has(input) && !isExcluded(input));

    for (const input of open()) {
        if (available.has(input)) {
            pairs.set(input, input);
            available.delete(input);
        }
    }

    if (schema.hasId()) {
        const availableById = new ComplexKeyMap<Entity, Entity>(schema.getIdPaths());

        for (const candidate of available) {
            if (entityHasId(schema, candidate) && !availableById.has(candidate)) {
                availableById.set(candidate, candidate);
            }
        }

        for (const input of open().filter(input => entityHasId(schema, input))) {
            const persisted = availableById.get(input);

            if (persisted !== undefined && available.has(persisted)) {
                pairs.set(input, persisted);
                available.delete(persisted);
            }
        }
    }

    const openInputs = open();
    const openReturned = [...available];
    const scored: { input: number; returned: number; score: number }[] = [];

    for (let i = 0; i < openInputs.length; i++) {
        for (let j = 0; j < openReturned.length; j++) {
            if (entityHasId(schema, openInputs[i]) && entityHasId(schema, openReturned[j])) {
                // both have Ids, yet they did not match by Id: they are different entities
                continue;
            }

            scored.push({
                input: i,
                returned: j,
                score: countProperties(getEntityDifference(schema, openInputs[i], openReturned[j])),
            });
        }
    }

    scored.sort((a, b) => a.score - b.score || a.input - b.input || a.returned - b.returned);
    const pairedInputs = new Set<number>();
    const pairedReturned = new Set<number>();

    for (const { input, returned } of scored) {
        if (pairedInputs.has(input) || pairedReturned.has(returned)) {
            continue;
        }

        pairedInputs.add(input);
        pairedReturned.add(returned);
        pairs.set(openInputs[input], openReturned[returned]);
    }

    return inputs.filter(input => pairs.has(input)).map(input => [input, pairs.get(input)!]);
}

function countProperties(entity: Entity): number {
    let count = 0;

    for (const value of Object.values(entity)) {
        count++;

        if (Array.isArray(value)) {
            for (const item of value) {
                if (isPlainObject(item)) {
                    count += countProperties(item);
                }
            }
        } else if (isPlainObject(value)) {
            count += countProperties(value);
        }
    }

    return count;
}
