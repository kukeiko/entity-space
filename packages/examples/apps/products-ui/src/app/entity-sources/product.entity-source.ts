import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { EntityApi, IEntitySource } from "@entity-space/core";
import { inRangeTemplate, isValueTemplate } from "@entity-space/criteria";
import { Product, ProductFilter, ProductsSchemaCatalog } from "@entity-space/examples/libs/products-model";
import { firstValueFrom } from "rxjs";

@Injectable()
export class ProductEntitySource extends EntityApi<Product> implements IEntitySource {
    constructor(private readonly http: HttpClient, private readonly schemaCatalog: ProductsSchemaCatalog) {
        super(schemaCatalog.getProductSchema());

        // maps queries to API calls loading products by id
        this.addEndpoint(builder =>
            builder
                .requiresFields({
                    id: isValueTemplate(Number),
                })
                .isLoadedBy(async query => {
                    const id = query.getCriteria().getBag().id.getValue();
                    const product = await firstValueFrom(this.http.get<Product>(`api/products/${id}`));

                    return [product];
                })
        );

        // maps queries to API calls searching products by min/max price, min/max rating
        this.addEndpoint(builder =>
            builder
                .supportsFields({
                    price: inRangeTemplate(Number),
                    rating: inRangeTemplate(Number),
                })
                .supportsExpansion({
                    reviews: true,
                })
                .isLoadedBy(async query => {
                    const bag = query.getCriteria().getBag();

                    const filter: ProductFilter = {
                        minPrice: bag.price?.getFrom()?.value,
                        maxPrice: bag.price?.getTo()?.value,
                        minRating: bag.rating?.getFrom()?.value,
                        maxRating: bag.rating?.getTo()?.value,
                    };

                    return firstValueFrom(
                        this.http.post<Product[]>("api/products/search", {
                            filter,
                            expand: query.getExpansionObject(),
                        })
                    );
                })
        );

        this.addEndpoint(builder =>
            builder.isLoadedBy(async () => {
                const products = await firstValueFrom(this.http.get<Product[]>(`api/products`));

                return products;
            })
        );
    }
}
