import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { IEntitySource, QueryDispatcher } from "@entity-space/core";
import { isValueTemplate } from "@entity-space/criteria";
import { ProductsSchemaCatalog, User } from "@entity-space/examples/products/libs/products-model";
import { firstValueFrom } from "rxjs";

@Injectable()
export class UserEntitySource extends QueryDispatcher<User> implements IEntitySource {
    constructor(private readonly http: HttpClient, private readonly schemaCatalog: ProductsSchemaCatalog) {
        super(schemaCatalog.getUserSchema());

        this.addMapping(builder =>
            builder.requiresFields({ id: isValueTemplate(Number) }).isLoadedBy(async query => {
                const id = query.getCriteria().getBag().id;
                const user = await firstValueFrom(this.http.get<User>(`api/users/${id}`));

                return [user];
            })
        );
    }
}
