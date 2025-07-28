import { EntitySchema, EntitySelection, intersectSelection, isSelectionSubsetOf } from "@entity-space/elements";
import { AcceptedEntityHydration, HydrateEntitiesFunction } from "./accepted-entity-hydration";
import { EntityHydrator } from "./entity-hydrator";

export class ExplicitEntityHydrator extends EntityHydrator {
    constructor(
        schema: EntitySchema,
        requiredSelection: EntitySelection,
        hydratedSelection: EntitySelection,
        hydrateFn: HydrateEntitiesFunction,
    ) {
        super();
        this.#schema = schema;
        this.#requiredSelection = requiredSelection;
        this.#hydratedSelection = hydratedSelection;
        this.#hydrateFn = hydrateFn;
    }

    readonly #schema: EntitySchema;
    readonly #requiredSelection: EntitySelection;
    readonly #hydratedSelection: EntitySelection;
    readonly #hydrateFn: HydrateEntitiesFunction;

    override accept(
        schema: EntitySchema,
        availableSelection: EntitySelection,
        openSelection: EntitySelection,
    ): AcceptedEntityHydration | false {
        if (this.#schema.getName() !== schema.getName()) {
            return false;
        }

        if (!isSelectionSubsetOf(this.#requiredSelection, availableSelection)) {
            return false;
        }

        const acceptedSelection = intersectSelection(this.#hydratedSelection, openSelection);

        if (acceptedSelection === false) {
            throw new Error("bad selection logic");
        }

        return new AcceptedEntityHydration(
            acceptedSelection,
            this.#requiredSelection,
            async (entities, selection, context) => {
                await this.#hydrateFn(entities, selection, context);
            },
        );
    }
}
