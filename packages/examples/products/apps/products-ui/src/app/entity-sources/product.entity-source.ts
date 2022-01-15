import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import {
    Criterion,
    Entity,
    IEntitySource,
    InNumberRangeCriterion,
    NamedCriteriaTemplate,
    Query,
} from "@entity-space/core";
import { Product, ProductFilter } from "@entity-space/examples/products/libs/products-model";
import { firstValueFrom, Observable, Subject } from "rxjs";

@Injectable()
export class ProductEntitySource implements IEntitySource {
    constructor(private readonly http: HttpClient) {}

    private queryIssued = new Subject<Query>();

    onQueryIssued(): Observable<Query> {
        return this.queryIssued.asObservable();
    }

    async query(query: Query): Promise<Entity[]> {
        this.queryIssued.next(query);
        const productFilters = this.mapCriteriaToProductFilter(query.criteria);

        const responses = await Promise.all(
            productFilters.map(filter => firstValueFrom(this.http.post<Product[]>("api/products/search", filter)))
        );

        const flattenedResponses = responses.reduce((acc, value) => [...acc, ...value], []);

        return flattenedResponses;
    }

    private mapCriteriaToProductFilter(productCriteria: Criterion): ProductFilter[] {
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

        return filters;
    }
}
