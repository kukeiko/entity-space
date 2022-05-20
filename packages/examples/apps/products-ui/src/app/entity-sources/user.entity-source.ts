import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { EntityApi, IEntitySource } from "@entity-space/core";
import { isValueTemplate } from "@entity-space/criteria";
import { CommonModelSchemaCatalog, User } from "@entity-space/examples/libs/common-model";
import { firstValueFrom } from "rxjs";

@Injectable()
export class UserEntitySource extends EntityApi<User> implements IEntitySource {
    constructor(private readonly http: HttpClient, private readonly schemaCatalog: CommonModelSchemaCatalog) {
        super(schemaCatalog.getUserSchema());

        this.addEndpoint(builder =>
            builder.requiresFields({ id: isValueTemplate(Number) }).isLoadedBy(async query => {
                const id = query.getCriteria().getBag().id;
                const user = await firstValueFrom(this.http.get<User>(`api/users/${id}`));

                return [user];
            })
        );
    }
}
