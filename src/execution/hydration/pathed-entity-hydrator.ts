import { Entity, EntitySchema, EntitySelection } from "@entity-space/elements";
import { Path, readPath, writePath } from "@entity-space/utils";
import { AcceptedEntityHydration } from "./accepted-entity-hydration";
import { EntityHydrator } from "./entity-hydrator";

export class PathedEntityHydrator extends EntityHydrator {
    constructor(hydrator: EntityHydrator, schema: EntitySchema, path: Path, pathedSchema: EntitySchema) {
        super();
        this.#hydrator = hydrator;
        this.#schema = schema;
        this.#path = path;
        this.#pathedSchema = pathedSchema;
    }

    readonly #hydrator: EntityHydrator;
    readonly #schema: EntitySchema;
    readonly #path: Path;
    readonly #pathedSchema: EntitySchema;

    override accept(
        schema: EntitySchema,
        availableSelection: EntitySelection,
        openSelection: EntitySelection,
    ): AcceptedEntityHydration | false {
        if (this.#schema.getName() !== schema.getName()) {
            return false;
        }

        const cutTargetSelection = readPath<EntitySelection>(this.#path, openSelection);

        if (cutTargetSelection === undefined) {
            return false;
        }

        const cutAvailableSelection = readPath<EntitySelection>(this.#path, availableSelection);

        if (cutAvailableSelection === undefined) {
            return false;
        }

        const accepted = this.#hydrator.accept(this.#pathedSchema, cutAvailableSelection, cutTargetSelection);

        if (accepted === false) {
            return false;
        }

        const pathedAcceptedSelection = writePath(this.#path, {} as EntitySelection, accepted.getAcceptedSelection());
        const pathedRequiredSelection = writePath(this.#path, {} as EntitySelection, accepted.getRequiredSelection());

        return new AcceptedEntityHydration(
            pathedAcceptedSelection,
            pathedRequiredSelection,
            async (entities, _, context) => {
                const pathedEntities = readPath<Entity>(this.#path, entities);
                await accepted.hydrateEntities(pathedEntities, context);
            },
        );
    }
}
