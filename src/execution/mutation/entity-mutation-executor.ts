import { Entity, subtractSelection } from "@entity-space/elements";
import { EntityServiceContainer } from "../entity-service-container";
import { AcceptedEntityMutation } from "./accepted-entity-mutation";
import { DescribedEntityMutation } from "./described-entity-mutation";
import { MutationOperation } from "./mutation-operation";

export class EntityMutationExecutor {
    constructor(services: EntityServiceContainer) {
        this.#services = services;
    }

    readonly #services: EntityServiceContainer;

    async executeMutation<T>(operation: MutationOperation): Promise<T[]> {
        const described = this.describeMutation(operation);

        if (described === false) {
            throw new Error(`no mutators found to execute mutation ${operation.toString()}`);
        }

        return this.executeDescribedMutation(described) as Promise<T[]>;
    }

    describeMutation(operation: MutationOperation): DescribedEntityMutation | false {
        const mutators = this.#services.getMutatorsFor(operation.getSchema());
        let openSelection = operation.getSelection();
        const acceptedMutations: AcceptedEntityMutation[] = [];

        for (const mutator of mutators) {
            const accepted = mutator.accept(operation.getSchema(), operation.getType(), openSelection);

            if (accepted === false) {
                continue;
            }

            const nextOpenSelection = subtractSelection(openSelection, accepted.getSelection());

            if (nextOpenSelection === false) {
                throw new Error("bad mutator implementation");
            }

            acceptedMutations.push(accepted);

            if (nextOpenSelection !== true) {
                openSelection = nextOpenSelection;
            } else {
                return new DescribedEntityMutation(acceptedMutations, operation.getEntities());
            }
        }

        return false;
    }

    async executeDescribedMutation(describedMutation: DescribedEntityMutation): Promise<Entity[]> {
        let entities = describedMutation.getEntities().slice();

        for (const mutation of describedMutation.getAcceptedMutations()) {
            entities = await mutation.mutate(entities);
        }

        return entities;
    }
}
