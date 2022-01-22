import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Expansion, IEntitySchema, IEntitySource, QueriedEntities, Query, reduceExpansion } from "@entity-space/core";
import { Criterion, InNumberSetCriterion, NamedCriteriaTemplate, or } from "@entity-space/criteria";
import { Brand } from "@entity-space/examples/products/libs/products-model";
import { firstValueFrom, Observable, Subject } from "rxjs";

@Injectable()
export class BrandEntitySource implements IEntitySource {
    constructor(private readonly http: HttpClient) {}

    private queryIssued = new Subject<Query>();

    // [todo] workaround that needs to be resolved at some point
    schema_TMP!: IEntitySchema;

    onQueryIssued(): Observable<Query> {
        return this.queryIssued.asObservable();
    }

    async query(query: Query): Promise<false | QueriedEntities> {
        if (query.entitySchema.getId() !== this.schema_TMP.getId()) {
            return false;
        }

        this.queryIssued.next(query);
        const [filters, effectiveCriterion] = this.mapCriteriaToByIdFilter(query.criteria);
        // [todo] whoops! brand source can expand reviews, but not reviews.author. what to do?
        const supportedExpansion: Expansion<Brand> = { reviews: true };

        let missingExpansion = reduceExpansion(query.expansion, supportedExpansion) || query.expansion;
        let effectiveExpansion = reduceExpansion(query.expansion, missingExpansion) || supportedExpansion;

        if (Object.keys(effectiveExpansion).length === 0) {
            effectiveExpansion = supportedExpansion;
        }
        // if ((query.expansion as any).reviews.author) {
        //     missingExpansion = {
        //         reviews: { author: true },
        //     };
        // }

        console.log("[brand-missing-expansion]", missingExpansion || query.expansion);
        console.log("[brand-effective-expansion]", effectiveExpansion);

        const responses = await Promise.all(
            filters.map(id =>
                firstValueFrom(this.http.post<Brand>(`api/brands/${id}`, { expand: effectiveExpansion || void 0 }))
            )
        );

        const effectiveQuery: Query = {
            entitySchema: query.entitySchema,
            criteria: effectiveCriterion,
            expansion: effectiveExpansion || {},
        };

        return new QueriedEntities(effectiveQuery, responses);
    }

    private mapCriteriaToByIdFilter(criteria: Criterion): [number[], Criterion] {
        const template = new NamedCriteriaTemplate({
            id: [InNumberSetCriterion],
        });

        const [remapped, open] = criteria.remap([template]);

        if (remapped === false) {
            throw new Error(`failed to remap criterion`);
        }

        const filters: number[] = [];

        for (const criterion of remapped) {
            const bag = criterion.getBag();

            if (bag.id !== void 0) {
                filters.push(...bag.id.getValues());
            }
        }

        return [Array.from(new Set(filters)), or(remapped)];
    }
}
