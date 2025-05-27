import { DescribedEntityHydration } from "./hydration/described-entity-hydration";
import { DescribedEntitySourcing } from "./sourcing/described-entity-sourcing";

export class DescribedEntityQueryExecution {
    constructor(describedSourcing: DescribedEntitySourcing, describedHydration?: DescribedEntityHydration) {
        this.#describedSourcing = describedSourcing;
        this.#describedHydration = describedHydration;
    }

    readonly #describedSourcing: DescribedEntitySourcing;
    readonly #describedHydration: DescribedEntityHydration | undefined;

    getDescribedSourcing(): DescribedEntitySourcing {
        return this.#describedSourcing;
    }

    getDescribedHydration(): DescribedEntityHydration | undefined {
        return this.#describedHydration;
    }
}
