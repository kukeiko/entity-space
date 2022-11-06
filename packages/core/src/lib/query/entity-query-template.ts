import { IEntitySchema } from "@entity-space/common";
import { anyTemplate, Criterion, ICriterionTemplate, neverTemplate } from "@entity-space/criteria";
import { permutateEntries } from "@entity-space/utils";
import { EntitySelection } from "../expansion/expansion";
import { EntityQuery } from "./entity-query";

type RemappedParts = {
    options: false | Criterion[];
    criterion: false | Criterion[];
    expansion: false | EntitySelection;
};

type WithoutFalse<T> = {
    [K in keyof T]: Exclude<T[K], false>;
};

function containsNoFalse(parts: RemappedParts): parts is WithoutFalse<RemappedParts> {
    return !Object.values(parts).some(part => part === false);
}

export class EntityQueryTemplate {
    constructor({
        schema,
        options,
        criterion,
        expansion,
    }: {
        schema: IEntitySchema;
        options?: ICriterionTemplate;
        criterion?: ICriterionTemplate;
        expansion?: EntitySelection;
    }) {
        this.schema = schema;
        this.options = options ?? neverTemplate();
        this.criterion = criterion ?? anyTemplate();
        this.expansion = expansion ?? new EntitySelection({ schema, value: true });
    }

    private readonly schema: IEntitySchema;
    private readonly options: ICriterionTemplate;
    private readonly criterion: ICriterionTemplate;
    private readonly expansion: EntitySelection;

    remap(query: EntityQuery): false | EntityQuery[] {
        // [todo] can be removed if i decide to make remap() result of ICriterionTemplate just an array
        // of successfully remapped Criteria (instead of also the open ones)
        const remapCriterion = (criterion: Criterion, template: ICriterionTemplate): false | Criterion[] => {
            const remapped = template.remap(criterion);

            return remapped ? remapped.getCriteria() : false;
        };

        const remappedParts: RemappedParts = {
            options: remapCriterion(query.getOptions(), this.options),
            criterion: remapCriterion(query.getCriteria(), this.criterion),
            expansion: this.expansion.intersect(query.getExpansion()),
        };

        if (!containsNoFalse(remappedParts)) {
            return false;
        }

        const permutatedRemappedParts = permutateEntries(remappedParts);

        return permutatedRemappedParts.map(parts => {
            return new EntityQuery({
                entitySchema: this.schema,
                options: parts.options,
                criteria: parts.criterion,
                expansion: parts.expansion,
                paging: query.getPaging()
            });
        });
    }
}
