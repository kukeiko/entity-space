import { EntityCache } from "../../cache/entity-cache";
import { EntityServiceContainer } from "../../entity-service-container";
import { EntityMutator } from "../entity-mutator";
import { AcceptedEntityMutation } from "../structures/accepted-entity-mutation";
import { AcceptedEntityMutations } from "../structures/accepted-entity-mutations";
import { EntityChange } from "../structures/entity-change";
import { EntityChanges } from "../structures/entity-changes";
import { EntityMutation } from "../structures/entity-mutation";
import { generatePathedMutators } from "./generate-pathed-mutators.fn";
import { sortAcceptedMutationsByDependency } from "./sort-accepted-mutations-by-dependency.fn";
import { toEntityChanges } from "./to-entity-changes.fn";

/**
 * Detects the changes of a mutation, assigns them to mutators and builds the per-entity dependency graph.
 * Does not invoke any mutators. Throws if a change is not accepted by any registered mutator.
 */
export function planChanges(
    services: EntityServiceContainer,
    mutation: EntityMutation,
    previousCache: EntityCache,
): AcceptedEntityMutations {
    const entityChanges = toEntityChanges(mutation, previousCache);

    if (entityChanges === undefined) {
        return new AcceptedEntityMutations([]);
    }

    const accepted = acceptChanges(services, mutation, entityChanges);
    const items: EntityChange[] = [];

    const mutations = accepted.map(acceptedMutation => {
        const batchItems = acceptedMutation.getChanges();
        items.push(...batchItems);

        return acceptedMutation;
    });

    return new AcceptedEntityMutations(mutations);
}

function acceptChanges(
    services: EntityServiceContainer,
    mutation: EntityMutation,
    entityChanges: EntityChanges,
): AcceptedEntityMutation[] {
    const mutators: EntityMutator[] = [
        ...services.getExplicitMutatorsFor(mutation.getSchema()),
        ...generatePathedMutators(services, mutation.getSchema(), mutation.getSelection() ?? {}),
    ];
    let open: EntityChanges | undefined = entityChanges;
    const allAccepted: AcceptedEntityMutation[] = [];

    for (const mutator of mutators) {
        const [accepted, nextOpen] = mutator.accept(open, undefined);

        if (accepted === undefined) {
            continue;
        }

        allAccepted.push(accepted);
        open = nextOpen;

        if (open === undefined) {
            break;
        }
    }

    if (open !== undefined) {
        const unaccepted = open.getChanges().map(change => change.toString());
        throw new Error(`not all mutations have been accepted, no mutator found for: ${unaccepted.join(", ")}`);
    }

    const sortedByDependency = sortAcceptedMutationsByDependency(allAccepted);

    return sortedByDependency;
}
