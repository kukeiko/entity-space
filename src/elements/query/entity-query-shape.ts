import { CriterionShape } from "../criteria/criterion-shape";
import { EntitySchema } from "../entity/entity-schema";
import { EntitySelection, PackedEntitySelection } from "../selection/entity-selection";
import { selectionToString } from "../selection/selection-to-string.fn";
import { unpackSelection } from "../selection/unpack-selection.fn";
import { EntityPageShape } from "./entity-page-shape";
import { EntitySortShape } from "./entity-sort-shape";

export class EntityQueryShape {
    constructor(
        schema: EntitySchema,
        selection: PackedEntitySelection,
        criterionShape?: CriterionShape,
        parametersSchema?: EntitySchema,
        sortShape?: EntitySortShape,
        pageShape?: EntityPageShape,
    ) {
        this.#schema = schema;
        this.#selection = selection;
        this.#criterionShape = criterionShape;
        this.#parametersSchema = parametersSchema;
        this.#sortShape = sortShape;
        this.#pageShape = pageShape;
    }

    readonly #schema: EntitySchema;
    readonly #selection: PackedEntitySelection;
    readonly #criterionShape?: CriterionShape;
    readonly #parametersSchema?: EntitySchema;
    readonly #sortShape?: EntitySortShape;
    readonly #pageShape?: EntityPageShape;

    getSchema(): EntitySchema {
        return this.#schema;
    }

    getSelection(): PackedEntitySelection {
        return this.#selection;
    }

    getUnpackedSelection(): EntitySelection {
        return unpackSelection(this.#schema, this.#selection);
    }

    getCriterionShape(): CriterionShape | undefined {
        return this.#criterionShape;
    }

    getParametersSchema(): EntitySchema | undefined {
        return this.#parametersSchema;
    }

    getSortShape(): EntitySortShape | undefined {
        return this.#sortShape;
    }

    getPageShape(): EntityPageShape | undefined {
        return this.#pageShape;
    }

    with(patch: { selection?: EntitySelection }): EntityQueryShape {
        return new EntityQueryShape(
            this.#schema,
            patch.selection ?? this.#selection,
            this.#criterionShape,
            this.#parametersSchema,
        );
    }

    toString(): string {
        const parameters = this.#parametersSchema ? `<${this.#parametersSchema.getName()}>` : "";
        const criterion = this.#criterionShape !== undefined ? `(${this.#criterionShape.toString()})` : "";
        const selection = Object.keys(this.#selection).length ? `/${selectionToString(this.#selection)}` : "";

        // [todo] ❌ sort & page missing
        return [this.#schema.getName(), parameters, criterion, selection].join("");
    }
}
