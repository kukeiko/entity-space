import { permutateEntries } from "@entity-space/utils";
import { AllCriterionShape } from "../criteria/vnext/all/all-criterion-shape";
import { ICriterionShape } from "../criteria/vnext/criterion-shape.interface";
import { ICriterion } from "../criteria/vnext/criterion.interface";
import { EntityCriteriaTools } from "../criteria/vnext/entity-criteria-tools";
import { IEntityCriteriaTools } from "../criteria/vnext/entity-criteria-tools.interface";
import { NeverCriterionShape } from "../criteria/vnext/never/never-criterion-shape";
import { IEntitySchema } from "../schema/schema.interface";
import { EntityQueryTools } from "./entity-query-tools";
import { IEntityQuery } from "./entity-query.interface";
import { EntitySelection } from "./entity-selection";

type RemappedParts = {
    options: false | ICriterion[];
    criterion: false | ICriterion[];
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
        options?: ICriterionShape<ICriterion, unknown>;
        criterion?: ICriterionShape<ICriterion, unknown>;
        selection: EntitySelection;
    }) {
        this.schema = schema;
        this.options = options ?? new NeverCriterionShape({ tools: this.criteriaTools });
        this.criterion = criterion ?? new AllCriterionShape({ tools: this.criteriaTools });
        this.selection = selection;
    }

    private readonly criteriaTools: IEntityCriteriaTools = new EntityCriteriaTools();
    private readonly schema: IEntitySchema;
    private readonly options: ICriterionShape<ICriterion, unknown>;
    private readonly criterion: ICriterionShape<ICriterion, unknown>;
    private readonly selection: EntitySelection;

    reshape(query: IEntityQuery): false | IEntityQuery[] {
        // [todo] can be removed if i decide to make remap() result of ICriterionTemplate just an array
        // of successfully remapped Criteria (instead of also the open ones)
        const reshapeCriterion = (
            criterion: ICriterion,
            template: ICriterionShape<ICriterion, unknown>
        ): false | ICriterion[] => {
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
            return new EntityQueryTools({ criteriaTools: new EntityCriteriaTools() }).createQuery({
                entitySchema: this.schema,
                options: parts.options,
                criteria: parts.criterion,
                selection: parts.selection,
                paging: query.getPaging(),
            });
        });
    }
}
