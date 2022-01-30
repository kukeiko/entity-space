import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { IEntitySource, QueryDispatcher } from "@entity-space/core";
import { inRangeTemplate, isValueTemplate } from "@entity-space/criteria";
import { Product, ProductFilter, ProductsSchemaCatalog } from "@entity-space/examples/products/libs/products-model";
import { firstValueFrom } from "rxjs";

@Injectable()
export class ProductEntitySource extends QueryDispatcher<Product> implements IEntitySource {
    constructor(private readonly http: HttpClient, private readonly schemaCatalog: ProductsSchemaCatalog) {
        super(schemaCatalog.getProductSchema());

        this.addMapping(builder =>
            builder.requiresFields({ id: isValueTemplate(Number) }).isLoadedBy(async query => {
                const id = query.criteria.getBag().id.getValue();
                const product = await firstValueFrom(this.http.get<Product>(`api/products/${id}`));

                return [product];
            })
        );

        this.addMapping(builder =>
            builder
                .supportsFields({ price: inRangeTemplate(Number), rating: inRangeTemplate(Number) })
                .supportsExpansion({ reviews: true })
                .isLoadedBy(async query => {
                    const bag = query.criteria.getBag();

                    const filter: ProductFilter = {
                        minPrice: bag.price?.getFrom()?.value ?? void 0,
                        maxPrice: bag.price?.getTo()?.value ?? void 0,
                        minRating: bag.rating?.getFrom()?.value ?? void 0,
                        maxRating: bag.rating?.getTo()?.value ?? void 0,
                    };

                    return firstValueFrom(
                        this.http.post<Product[]>("api/products/search", {
                            filter,
                            expand: query.expansion,
                        })
                    );
                })
        );
    }
}
