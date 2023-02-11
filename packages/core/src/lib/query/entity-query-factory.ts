import { IEntityCriteriaFactory } from "../criteria/vnext/entity-criteria-factory.interface";
import { EntityQuery } from "./entity-query";
import { EntityQueryCreate, IEntityQueryFactory } from "./entity-query-factory.interface";
import { IEntityQuery } from "./entity-query.interface";
import { EntitySelection } from "./entity-selection";

export class EntityQueryFactory implements IEntityQueryFactory {
    constructor({ criteriaFactory }: { criteriaFactory: IEntityCriteriaFactory }) {
        this.criteriaFactory = criteriaFactory;
    }

    private readonly criteriaFactory: IEntityCriteriaFactory;

    createQuery(args: Omit<EntityQueryCreate, "factory">): IEntityQuery {
        let { entitySchema, criteria, options, paging, selection } = args;

        return new EntityQuery({
            factory: this,
            entitySchema,
            criteria: criteria ?? this.criteriaFactory.all(),
            options: options ?? this.criteriaFactory.never(),
            paging,
            selection:
                selection === void 0
                    ? new EntitySelection({ schema: entitySchema, value: entitySchema.getDefaultSelection() })
                    : selection instanceof EntitySelection
                    ? selection
                    : new EntitySelection({ schema: entitySchema, value: selection }),
        });
    }
}
