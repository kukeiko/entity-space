import { ICriterionTemplate, namedTemplate, or, orTemplate, RemapCriterionResult } from "@entity-space/criteria";
import { size } from "lodash";
import { Observable, Subject } from "rxjs";
import { Entity, EntitySet, IEntitySource, IEntityStore } from "../entity";
import { IEntitySchema } from "../schema";
import { EntityApiEndpoint } from "./entity-api-endpoint";
import { EntityApiEndpointBuilder } from "./entity-api-endpoint-builder";
import { Query } from "./query";

// [todo] remove in favor of "EntityController"
export class EntityApi<T = Record<string, any>> implements IEntitySource, IEntityStore {
    constructor(entitySchema: IEntitySchema) {
        this.entitySchema = entitySchema;
    }

    private readonly entitySchema: IEntitySchema;
    private readonly endpoints: EntityApiEndpoint[] = [];

    private queryIssued = new Subject<Query>();

    onQueryIssued(): Observable<Query> {
        return this.queryIssued.asObservable();
    }

    getEntitySchema(): IEntitySchema {
        return this.entitySchema;
    }

    addEndpoint(mapping: (builder: EntityApiEndpointBuilder<T>) => EntityApiEndpointBuilder): this {
        const mapper = mapping(new EntityApiEndpointBuilder()).build();
        this.endpoints.push(mapper);

        return this;
    }

    getEndpointCriteriaTemplates(): Map<EntityApiEndpoint, ICriterionTemplate> {
        const endpointCriteriaTemplates = new Map<EntityApiEndpoint, ICriterionTemplate>();

        for (const endpoint of this.endpoints) {
            const requiredFields = endpoint.getRequiredFields();
            const optionalFields = endpoint.getOptionalFields();

            // [todo] hacky hotfix: enable an endpoint that does not require any criteria (e.g. load all entities)
            // [todo] now products query always uses the "any" endpoint, in addition to more narrowing ones (e.g. rating: [3,5]),
            // because it always matches. maybe we need to keep those two kinds of endpoints separate, and only invoke "any"
            // if we have a) not found any matching endpoint or b) after remapping, we have open criteria.
            if (Object.keys(requiredFields).length == 0 && Object.keys(optionalFields).length == 0) {
                continue;
                // endpointCriteriaTemplates.set(endpoint, anyTemplate());
            } else {
                endpointCriteriaTemplates.set(endpoint, namedTemplate(requiredFields, optionalFields));
            }
        }

        return endpointCriteriaTemplates;
    }

    async query(query: Query): Promise<false | EntitySet[]> {
        if (query.getEntitySchema().getId() !== this.entitySchema.getId()) {
            return false;
        }

        const endpointCriteriaTemplates = this.getEndpointCriteriaTemplates();
        const template = orTemplate(Array.from(endpointCriteriaTemplates.values()));
        let remapped = template.remap(query.getCriteria());

        if (remapped === false) {
            const anyEndpoint = this.endpoints.find(
                endpoint => size(endpoint.getRequiredFields()) === 0 && size(endpoint.getOptionalFields()) === 0
            );

            if (anyEndpoint) {
                remapped = orTemplate(anyEndpoint.toCriteriaTemplate()).remap(query.getCriteria());
                endpointCriteriaTemplates.set(anyEndpoint, anyEndpoint.toCriteriaTemplate());
            } else {
                console.warn("could not remap to specific and found no 'any' endpoint");
            }
        } else if (remapped.getOpen().length > 0) {
            const anyEndpoint = this.endpoints.find(
                endpoint => size(endpoint.getRequiredFields()) === 0 && size(endpoint.getOptionalFields()) === 0
            );

            if (anyEndpoint) {
                const openRemapped = orTemplate(anyEndpoint.toCriteriaTemplate()).remap(or(remapped.getOpen()));

                if (openRemapped !== false) {
                    remapped = new RemapCriterionResult([...remapped.getCriteria(), ...openRemapped.getCriteria()]);
                    endpointCriteriaTemplates.set(anyEndpoint, anyEndpoint.toCriteriaTemplate());
                }
            }
        }

        if (remapped === false) {
            console.log(`failed to remap query criteria`);
            return false;
        }

        const operations: Promise<EntitySet>[] = [];

        for (const orCriteria of remapped.getCriteria()) {
            for (const criterion of orCriteria.getItems()) {
                for (const [endpoint, template] of endpointCriteriaTemplates) {
                    if (!template.matches(criterion)) {
                        continue;
                    }

                    const effectiveExpansion = query.getExpansion().intersect(endpoint.getSupportedExpansion());

                    if (!effectiveExpansion) {
                        continue;
                    }

                    const effectiveQuery = new Query(this.entitySchema, criterion, effectiveExpansion);
                    this.queryIssued.next(effectiveQuery);

                    operations.push(
                        endpoint
                            .load(effectiveQuery)
                            .then(entities => new EntitySet({ query: effectiveQuery, entities }))
                    );

                    break;
                }
            }
        }

        const queriedEntities = await Promise.all(operations);

        return queriedEntities;
    }

    async create(entities: Entity[], schema: IEntitySchema): Promise<false | Entity[]> {
        return false;
    }

    async update(entities: Entity[], schema: IEntitySchema): Promise<false | Entity[]> {
        return false;
    }

    async delete(entities: Entity[], schema: IEntitySchema): Promise<boolean> {
        return false;
    }
}
