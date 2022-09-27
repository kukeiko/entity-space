import { anyTemplate, ICriterionTemplate, NamedCriteriaTemplateItems, namedTemplate } from "@entity-space/criteria";
import { isNotNullsy } from "@entity-space/utils";
import { size } from "lodash";
import { Entity } from "../entity";
import { Expansion } from "../expansion";
import { Query } from "./query";

// [todo] T is unused
export class EntityApiEndpoint<
    T = Record<string, any>,
    R extends NamedCriteriaTemplateItems = {},
    O extends NamedCriteriaTemplateItems = {},
    E = {}
> {
    constructor(
        requiredFields: R,
        optionalFields: O,
        supportedExpansion: E,
        load: (query: Query) => Promise<Entity[] | Entity>
    ) {
        this.requiredFields = requiredFields;
        this.optionalFields = optionalFields;
        this.supportedExpansion = new Expansion(supportedExpansion);
        this.loadEntities = load;
    }

    private readonly requiredFields: R;
    private readonly optionalFields: O;
    private readonly supportedExpansion: Expansion<E>;
    private readonly loadEntities: (query: Query) => Promise<Entity[] | Entity>;

    getRequiredFields(): R {
        return this.requiredFields;
    }

    getOptionalFields(): O {
        return this.optionalFields;
    }

    getSupportedExpansion(): Expansion {
        return this.supportedExpansion;
    }

    async load(query: Query): Promise<Entity[]> {
        const entities = await this.loadEntities(query);

        return Array.isArray(entities) ? entities : [entities].filter(isNotNullsy);
    }

    toCriteriaTemplate(): ICriterionTemplate {
        if (size(this.getRequiredFields()) == 0 && size(this.getOptionalFields()) == 0) {
            return anyTemplate();
        }

        return namedTemplate(this.getRequiredFields(), this.getOptionalFields());
    }
}
