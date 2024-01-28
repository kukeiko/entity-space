import { Class } from "@entity-space/utils";
import { Entity } from "../common/entity.type";
import { PackedEntitySelection } from "../common/packed-entity-selection.type";
import { EntityCriteriaShapeTools } from "../criteria/entity-criteria-shape-tools";
import { EntityCriteriaTools } from "../criteria/entity-criteria-tools";
import { IEntityCriteriaTools } from "../criteria/entity-criteria-tools.interface";
import { WhereEntityTools } from "../criteria/where-entity/where-entity-tools";
import { WhereEntitySingle } from "../criteria/where-entity/where-entity.types";
import { EntityQueryTools } from "../query/entity-query-tools";
import { IEntityQueryTools } from "../query/entity-query-tools.interface";
import { EntitySelection } from "../query/entity-selection";
import { EntityBlueprintInstance } from "../schema/entity-blueprint-instance.type";
import { EntitySchemaCatalog } from "../schema/entity-schema-catalog";
import { IEntitySchema } from "../schema/schema.interface";
import { EntityQueryExecutor } from "./entity-query-executor";
import { EntityServiceContainer } from "./entity-service-container";

export class EntityWorkspace {
    constructor(private readonly services: EntityServiceContainer) {}

    private get catalog(): EntitySchemaCatalog {
        return this.services.getCatalog();
    }

    private readonly criteriaTools: IEntityCriteriaTools = new EntityCriteriaTools();
    private readonly queryTools: IEntityQueryTools = new EntityQueryTools({ criteriaTools: this.criteriaTools });

    async createOne<B>(blueprint: Class<B>, entity: EntityBlueprintInstance<B>): Promise<EntityBlueprintInstance<B>> {
        const schema = this.services.getCatalog().resolve(blueprint);
        const mutator = this.services.getMutatorFor(schema);

        return mutator.createOne(entity) as Promise<EntityBlueprintInstance<B>>;
    }

    async updateOne<B>(blueprint: Class<B>, entity: EntityBlueprintInstance<B>): Promise<EntityBlueprintInstance<B>> {
        const schema = this.services.getCatalog().resolve(blueprint);
        const mutator = this.services.getMutatorFor(schema);

        return mutator.updateOne(entity) as Promise<EntityBlueprintInstance<B>>;
    }

    async deleteOne<T>(blueprint: Class<T>, entity: EntityBlueprintInstance<T>): Promise<void> {
        const schema = this.services.getCatalog().resolve(blueprint);
        const mutator = this.services.getMutatorFor(schema);

        return mutator.deleteOne(entity);
    }

    from<T extends Entity>(blueprint: Class<T>): EntityQueryExecutor<EntityBlueprintInstance<T>> {
        return new EntityQueryExecutor(this.catalog.resolve(blueprint), this.services);
    }

    fromSchema(schema: IEntitySchema): EntityQueryExecutor {
        return new EntityQueryExecutor(schema, this.services);
    }

    invalidate<T extends Entity>(
        blueprint: Class<T>,
        args?: {
            where?: WhereEntitySingle<EntityBlueprintInstance<T>>;
            select?: PackedEntitySelection<EntityBlueprintInstance<T>>;
        }
    ): void {
        const shapeTools = new EntityCriteriaShapeTools({ criteriaTools: this.criteriaTools });
        const whereEntityTools = new WhereEntityTools(shapeTools, this.criteriaTools);
        const schema = this.services.getCatalog().resolve(blueprint);
        const criterion =
            args?.where === undefined
                ? this.criteriaTools.all()
                : whereEntityTools.toCriterionFromWhereEntitySingle(schema, args.where).simplify();
        const select = EntitySelection.unpack(schema, args?.select ?? {});

        const query = this.queryTools.createQuery({ entitySchema: schema, criteria: criterion, selection: select });
        this.services.getCache().clearByQuery(query);
    }
}
