import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { IEntitySource, QueryDispatcher } from "@entity-space/core";
import { isValueTemplate } from "@entity-space/criteria";
import { Brand, ProductsSchemaCatalog } from "@entity-space/examples/products/libs/products-model";
import { firstValueFrom } from "rxjs";

@Injectable()
export class BrandEntitySource extends QueryDispatcher<Brand> implements IEntitySource {
    constructor(private readonly http: HttpClient, private readonly schemaCatalog: ProductsSchemaCatalog) {
        super(schemaCatalog.getBrandSchema());

        this.addMapping(builder =>
            builder
                .requiresFields({ id: isValueTemplate(Number) })
                .supportsExpansion({ reviews: true })
                .isLoadedBy(async query => {
                    const id = query.criteria.getBag().id.getValue();
                    const brand = await firstValueFrom(
                        this.http.post<Brand>(`api/brands/${id}`, { expand: query.expansion })
                    );

                    return [brand];
                })
        );
    }
}
