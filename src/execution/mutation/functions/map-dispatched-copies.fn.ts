import { Entity, EntityRelationProperty, EntitySchema, EntitySelection } from "@entity-space/elements";

export interface DispatchedCopies {
    /** Maps every copied entity (including nested ones) to the entity it was copied from. */
    readonly originalOf: Map<Entity, Entity>;
    /** Maps every nested copied entity to the copied entity containing it. */
    readonly parentOf: Map<Entity, Entity>;
}

/**
 * Walks copies made by copyEntities() in parallel with their originals, using the same selection and predicate.
 */
export function mapDispatchedCopies(
    schema: EntitySchema,
    selection: EntitySelection,
    copies: readonly Entity[],
    originals: readonly Entity[],
    relatedPredicate: (relation: EntityRelationProperty, entity: Entity) => boolean,
    result: DispatchedCopies = { originalOf: new Map(), parentOf: new Map() },
    parent?: Entity,
): DispatchedCopies {
    for (let i = 0; i < copies.length; i++) {
        const [copy, original] = [copies[i], originals[i]];
        result.originalOf.set(copy, original);

        if (parent !== undefined) {
            result.parentOf.set(copy, parent);
        }

        for (const [key, selected] of Object.entries(selection)) {
            if (!schema.isRelation(key) || selected === true) {
                continue;
            }

            const relation = schema.getRelation(key);
            const [copyValue, originalValue] = [copy[key], original[key]];

            if (copyValue == null || originalValue == null) {
                continue;
            }

            const relatedOriginals = (relation.isArray() ? (originalValue as Entity[]) : [originalValue]).filter(
                entity => relatedPredicate(relation, entity),
            );
            const relatedCopies = relation.isArray() ? (copyValue as Entity[]) : [copyValue];

            mapDispatchedCopies(
                relation.getRelatedSchema(),
                selected,
                relatedCopies,
                relatedOriginals,
                relatedPredicate,
                result,
                copy,
            );
        }
    }

    return result;
}
