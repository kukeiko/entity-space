import { CriterionShape } from "../criteria/criterion-shape";
import { EntitySchema } from "../entity/entity-schema";
import { EntitySelection, PackedEntitySelection } from "../selection/entity-selection";
import { selectionToString } from "../selection/selection-to-string.fn";
import { unpackSelection } from "../selection/unpack-selection.fn";

export class EntityQueryShape {
    constructor(
        schema: EntitySchema,
        selection: PackedEntitySelection,
        criterionShape?: CriterionShape,
        parametersSchema?: EntitySchema,
    ) {
        this.#schema = schema;
        this.#selection = selection;
        this.#criterionShape = criterionShape;
        this.#parametersSchema = parametersSchema;
    }

    readonly #schema: EntitySchema;
    readonly #selection: PackedEntitySelection;
    readonly #criterionShape?: CriterionShape;
    readonly #parametersSchema?: EntitySchema;

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

    toString(): string {
        const parameters = this.#parametersSchema ? `<${this.#parametersSchema.getName()}>` : "";
        const criterion = this.#criterionShape !== undefined ? `(${this.#criterionShape.toString()})` : "";
        const selection = Object.keys(this.#selection).length ? `/${selectionToString(this.#selection)}` : "";

        return [this.#schema.getName(), parameters, criterion, selection].join("");
    }
}
