import { CriterionShape } from "../criteria/criterion-shape";
import { EntitySchema } from "../entity/entity-schema";
import { EntitySelection, selectionToString } from "../selection/entity-selection";
import { packEntitySelection } from "../selection/pack-entity-selection.fn";

export class EntityQueryShape {
    constructor(
        schema: EntitySchema,
        selection: EntitySelection,
        criterionShape?: CriterionShape,
        parametersSchema?: EntitySchema,
    ) {
        this.#schema = schema;
        this.#selection = selection;
        this.#criterionShape = criterionShape;
        this.#parametersSchema = parametersSchema;
    }

    readonly #schema: EntitySchema;
    readonly #selection: EntitySelection;
    readonly #criterionShape?: CriterionShape;
    readonly #parametersSchema?: EntitySchema;

    getSchema(): EntitySchema {
        return this.#schema;
    }

    getSelection(): EntitySelection {
        return this.#selection;
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
        const packedSelection = packEntitySelection(this.#schema, this.#selection);
        const selection = Object.keys(packedSelection).length ? `/${selectionToString(packedSelection)}` : "";

        return [this.#schema.getName(), parameters, criterion, selection].join("");
    }
}
