import { isDefined } from "@entity-space/utils";
import { AcceptedEntityMutation } from "./accepted-entity-mutation";
import { EntityChange } from "./entity-change";

export class AcceptedEntityMutations {
    constructor(mutations: readonly AcceptedEntityMutation[]) {
        this.#mutations = mutations;
        this.#allChanges = Object.freeze(
            new Map(mutations.flatMap(mutation => mutation.getChanges().map(change => [change.getKey(), change]))),
        );
    }

    readonly #mutations: readonly AcceptedEntityMutation[];
    readonly #allChanges: ReadonlyMap<string, EntityChange>;

    getMutations(): readonly AcceptedEntityMutation[] {
        return this.#mutations;
    }

    getItem(key: string): EntityChange | undefined {
        return this.#allChanges.get(key);
    }

    getChanges(): readonly EntityChange[] {
        return [...this.#allChanges.values()];
    }

    getChangeDependencies(change: EntityChange): readonly EntityChange[] {
        const allChanges = this.getChanges();
        const outbound = change
            .getOutboundDependencies()
            .map(dependency => allChanges.find(candidate => candidate.getEntity() === dependency.getEntity()))
            .filter(isDefined);

        // [todo] ❌ would be nice if EntityChangesBuilder sets up both inbound & outbound dependencies already so that we don't have to query
        // other changes here to find them
        const inbound = allChanges.filter(candidate =>
            candidate.getInboundDependencies().some(dependency => dependency.getEntity() === change.getEntity()),
        );

        return [...outbound, ...inbound];
    }
}
