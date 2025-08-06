import { Criterion } from "../criteria/criterion";
import { EntitySchema } from "../entity/entity-schema";
import { EntitySelection } from "../selection/entity-selection";
import { selectionToString } from "../selection/selection-to-string.fn";
import { packEntitySelection } from "../selection/pack-entity-selection.fn";
import { EntityQueryParameters } from "./entity-query-parameters";

export class EntityQuery {
    constructor(
        schema: EntitySchema,
        selection: EntitySelection,
        criterion?: Criterion,
        parameters?: EntityQueryParameters,
    ) {
        this.#schema = schema;
        this.#selection = selection;
        this.#criterion = criterion;
        this.#parameters = parameters;
    }

    readonly #schema: EntitySchema;
    readonly #selection: EntitySelection;
    readonly #criterion?: Criterion;
    readonly #parameters?: EntityQueryParameters;

    getSchema(): EntitySchema {
        return this.#schema;
    }

    getSelection(): EntitySelection {
        return this.#selection;
    }

    getCriterion(): Criterion | undefined {
        return this.#criterion;
    }

    getParameters(): EntityQueryParameters | undefined {
        return this.#parameters;
    }

    with(patch: { criterion?: Criterion; selection?: EntitySelection }): EntityQuery {
        return new EntityQuery(
            this.#schema,
            patch.selection ?? this.#selection,
            patch.criterion ?? this.#criterion,
            this.#parameters,
        );
    }

    toString(): string {
        const parameters = this.#parameters
            ? `<${this.#parameters.getSchema().getName()}:${JSON.stringify(this.#parameters.getValue())}>`
            : "";
        const criterion = this.#criterion !== undefined ? `(${this.#criterion.toString()})` : "";
        const packedSelection = packEntitySelection(this.#schema, this.#selection);
        const selection = Object.keys(packedSelection).length ? `/${selectionToString(packedSelection)}` : "";

        return [this.#schema.getName(), parameters, criterion, selection].join("");
    }
}
