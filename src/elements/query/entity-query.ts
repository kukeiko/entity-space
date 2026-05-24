import { Criterion } from "../criteria/criterion";
import { EntitySchema } from "../entity/entity-schema";
import { EntitySort } from "../entity/entity-sort";
import { EntitySelection } from "../selection/entity-selection";
import { packEntitySelection } from "../selection/pack-entity-selection.fn";
import { selectionToString } from "../selection/selection-to-string.fn";
import { EntityPage } from "./entity-page";
import { EntityQueryParameters } from "./entity-query-parameters";

export class EntityQuery {
    constructor(
        schema: EntitySchema,
        selection: EntitySelection,
        criterion?: Criterion,
        parameters?: EntityQueryParameters,
        sort?: EntitySort,
        page?: EntityPage,
    ) {
        this.#schema = schema;
        this.#selection = selection;
        this.#criterion = criterion;
        this.#parameters = parameters;
        this.#sort = sort;
        this.#page = page;
    }

    readonly #schema: EntitySchema;
    readonly #selection: EntitySelection;
    readonly #criterion?: Criterion;
    readonly #parameters?: EntityQueryParameters;
    readonly #sort?: EntitySort;
    readonly #page?: EntityPage;

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

    getSort(): EntitySort | undefined {
        return this.#sort;
    }

    getPage(): EntityPage | undefined {
        return this.#page;
    }

    with(patch: {
        criterion?: Criterion | null;
        selection?: EntitySelection;
        sort?: EntitySort | null;
        page?: EntityPage | null;
    }): EntityQuery {
        return new EntityQuery(
            this.#schema,
            patch.selection ?? this.#selection,
            patch.criterion === null ? undefined : (patch.criterion ?? this.#criterion),
            this.#parameters,
            patch.sort === null ? undefined : (patch.sort ?? this.#sort),
            patch.page === null ? undefined : (patch.page ?? this.#page),
        );
    }

    toString(): string {
        const parameters = this.#parameters
            ? `<${this.#parameters.getSchema().getName()}:${JSON.stringify(this.#parameters.getValue())}>`
            : "";
        const criterion = this.#criterion !== undefined ? `(${this.#criterion.toString()})` : "";
        const sort = this.#sort !== undefined ? this.#sort.toString() : "";
        const page = this.#page !== undefined ? this.#page.toString() : "";

        let sortAndPage = "";

        if (sort.length) {
            if (page.length) {
                sortAndPage = `[${sort}, ${page}]`;
            } else {
                sortAndPage = `[${sort}]`;
            }
        }

        const packedSelection = packEntitySelection(this.#schema, this.#selection);
        const selection = Object.keys(packedSelection).length ? `/${selectionToString(packedSelection)}` : "";

        return [this.#schema.getName(), parameters, criterion, sortAndPage, selection].join("");
    }
}
