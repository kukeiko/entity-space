import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { EntityApi, IEntitySource } from "@entity-space/core";
import { isValueTemplate } from "@entity-space/criteria";
import { Brand, ProductsSchemaCatalog } from "@entity-space/examples/libs/products-model";
import { firstValueFrom } from "rxjs";

@Injectable()
export class BrandEntitySource extends EntityApi<Brand> implements IEntitySource {
    constructor(private readonly http: HttpClient, private readonly schemaCatalog: ProductsSchemaCatalog) {
        super(schemaCatalog.getBrandSchema());

        this.addEndpoint(builder =>
            builder
                .requiresFields({ id: isValueTemplate(Number) })
                .supportsExpansion({ reviews: true })
                .isLoadedBy(async query => {
                    const id = query.getCriteria().getBag().id.getValue();
                    const brand = await firstValueFrom(
                        this.http.post<Brand>(`api/brands/${id}`, { expand: query.getExpansionObject() })
                    );

                    return [brand];
                })
        );
    }
}