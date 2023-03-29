import { permutateEntries } from "@entity-space/utils";
import { AllCriterionShape } from "../criteria/all/all-criterion-shape";
import { ICriterionShape } from "../criteria/criterion-shape.interface";
import { ICriterion } from "../criteria/criterion.interface";
import { EntityCriteriaTools } from "../criteria/entity-criteria-tools";
import { IEntityCriteriaTools } from "../criteria/entity-criteria-tools.interface";
import { EntityTools } from "../entity/entity-tools";
import { IEntitySchema } from "../schema/schema.interface";
import { EntityQueryTools } from "./entity-query-tools";
import { IEntityQuery } from "./entity-query.interface";
import { EntitySelection } from "./entity-selection";

type ReshapedParts = {
    criterion: false | ICriterion[];
    selection: false | EntitySelection;
};

type WithoutFalse<T> = {
    [K in keyof T]: Exclude<T[K], false>;
};

export interface EntityQueryParametersShape {
    schema: IEntitySchema;
    required: boolean;
}

function containsNoFalse(parts: ReshapedParts): parts is WithoutFalse<ReshapedParts> {
    return !Object.values(parts).some(part => part === false);
}

export class EntityQueryShape {
    constructor({
        schema,
        criterion,
        parameters,
        selection,
    }: {
        schema: IEntitySchema;
        criterion?: ICriterionShape;
        parameters?: EntityQueryParametersShape;
        selection: EntitySelection;
    }) {
        this.schema = schema;
        this.criterion = criterion ?? new AllCriterionShape({ tools: this.criteriaTools });
        this.parameters = parameters;
        this.selection = selection;
    }

    private readonly criteriaTools: IEntityCriteriaTools = new EntityCriteriaTools();
    private readonly schema: IEntitySchema;
    private readonly parameters?: EntityQueryParametersShape;
    private readonly criterion: ICriterionShape;
    private readonly selection: EntitySelection;
    private readonly entityTools = new EntityTools();

    reshape(query: IEntityQuery): false | IEntityQuery[] {
        const parameters = query.getParameters();

        if (parameters && !this.parameters) {
            return false;
        } else if (!parameters && this.parameters?.required) {
            return false;
        } else if (
            parameters &&
            this.parameters &&
            !this.entityTools.matchesSchema(parameters, this.parameters.schema)
        ) {
            return false;
        }

        // [todo] can be removed if i decide to make reshape() result of ICriterionShape just an array
        // of successfully reshaped Criteria (instead of also the open ones)
        const reshapeCriterion = (criterion: ICriterion, shape: ICriterionShape): false | ICriterion[] => {
            const reshaped = shape.reshape(criterion);

            return reshaped ? reshaped.getReshaped() : false;
        };

        const reshapedParts: ReshapedParts = {
            criterion: reshapeCriterion(query.getCriteria(), this.criterion),
            selection: this.selection.intersect(query.getSelection()),
        };

        if (!containsNoFalse(reshapedParts)) {
            return false;
        }

        const permutatedReshapedParts = permutateEntries(reshapedParts);

        return permutatedReshapedParts.map(parts => {
            return new EntityQueryTools({ criteriaTools: new EntityCriteriaTools() }).createQuery({
                entitySchema: this.schema,
                criteria: parts.criterion,
                selection: parts.selection,
                parameters,
            });
        });
    }
}
