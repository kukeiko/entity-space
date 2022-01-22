import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Expansion, IEntitySchema, IEntitySource, QueriedEntities, Query, reduceExpansion } from "@entity-space/core";
import { Criterion, InNumberRangeCriterion, NamedCriteriaTemplate, or } from "@entity-space/criteria";
import { Product, ProductFilter } from "@entity-space/examples/products/libs/products-model";
import { firstValueFrom, Observable, Subject } from "rxjs";

@Injectable()
export class ProductEntitySource implements IEntitySource {
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
        const [productFilters, effectiveCriterion] = this.mapCriteriaToProductFilter(query.criteria);
        const supportedExpansion: Expansion<Product> = { reviews: true };
        const missingExpansion = reduceExpansion(query.expansion, supportedExpansion);
        const effectiveExpansion = missingExpansion === false ? {} : reduceExpansion(query.expansion, missingExpansion);

        console.log("[missing-expansion]", missingExpansion || query.expansion);
        console.log("[effective-expansion]", effectiveExpansion);

        const responses = await Promise.all(
            productFilters.map(filter =>
                firstValueFrom(
                    this.http.post<Product[]>("api/products/search", { filter, expand: effectiveExpansion || void 0 })
                )
            )
        );

        const entities = responses.reduce((acc, value) => [...acc, ...value], []);

        const effectiveQuery: Query = {
            entitySchema: query.entitySchema,
            criteria: effectiveCriterion,
            expansion: effectiveExpansion || {},
        };

        return new QueriedEntities(effectiveQuery, entities);
    }

    private mapCriteriaToProductFilter(productCriteria: Criterion): [ProductFilter[], Criterion] {
        const template = new NamedCriteriaTemplate({
            price: [InNumberRangeCriterion],
            rating: [InNumberRangeCriterion],
        });

        const [remapped, open] = productCriteria.remap([template]);

        if (remapped === false) {
            throw new Error(`failed to remap criterion`);
        }

        const filters: ProductFilter[] = [];

        for (const criterion of remapped) {
            const bag = criterion.getBag();
            const filter: ProductFilter = {};

            if (bag.price !== void 0) {
                filter.minPrice = bag.price.getFrom()?.value ?? void 0;
                filter.maxPrice = bag.price.getTo()?.value ?? void 0;
            }

            if (bag.rating !== void 0) {
                filter.minRating = bag.rating.getFrom()?.value ?? void 0;
                filter.maxRating = bag.rating.getTo()?.value ?? void 0;
            }

            filters.push(filter);
        }

        return [filters, or(remapped)];
    }
}
