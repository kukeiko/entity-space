import { IEntitySchema } from "@entity-space/common";
import { anyShape, Criterion, ICriterionShape, neverShape } from "@entity-space/criteria";
import { permutateEntries } from "@entity-space/utils";
import { EntitySelection } from "./entity-selection";
import { EntityQuery } from "./entity-query";

type RemappedParts = {
    options: false | Criterion[];
    criterion: false | Criterion[];
    selection: false | EntitySelection;
};

type WithoutFalse<T> = {
    [K in keyof T]: Exclude<T[K], false>;
};

function containsNoFalse(parts: RemappedParts): parts is WithoutFalse<RemappedParts> {
    return !Object.values(parts).some(part => part === false);
}

export class EntityQueryShape {
    constructor({
        schema,
        options,
        criterion,
        selection,
    }: {
        schema: IEntitySchema;
        options?: ICriterionShape;
        criterion?: ICriterionShape;
        selection?: EntitySelection;
    }) {
        this.schema = schema;
        this.options = options ?? neverShape();
        this.criterion = criterion ?? anyShape();
        this.selection = selection ?? new EntitySelection({ schema, value: true });
    }

    private readonly schema: IEntitySchema;
    private readonly options: ICriterionShape;
    private readonly criterion: ICriterionShape;
    private readonly selection: EntitySelection;

    reshape(query: EntityQuery): false | EntityQuery[] {
        // [todo] can be removed if i decide to make remap() result of ICriterionTemplate just an array
        // of successfully remapped Criteria (instead of also the open ones)
        const reshapeCriterion = (criterion: Criterion, template: ICriterionShape): false | Criterion[] => {
            const reshaped = template.reshape(criterion);

            return reshaped ? reshaped.getReshaped() : false;
        };

        const remappedParts: RemappedParts = {
            options: reshapeCriterion(query.getOptions(), this.options),
            criterion: reshapeCriterion(query.getCriteria(), this.criterion),
            selection: this.selection.intersect(query.getSelection()),
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
                selection: parts.selection,
                paging: query.getPaging(),
            });
        });
    }
}
