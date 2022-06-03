import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { BlueprintResolver, EntityApi } from "@entity-space/core";
import { Artist, ArtistBlueprint } from "@entity-space/examples/libs/music-model";
import { firstValueFrom } from "rxjs";

@Injectable()
export class ArtistEntitySource extends EntityApi<Artist> {
    constructor(private readonly http: HttpClient, blueprintResolver: BlueprintResolver) {
        super(blueprintResolver.resolve(ArtistBlueprint));

        this.addEndpoint(builder =>
            builder.isLoadedBy(async () => firstValueFrom(this.http.get<Artist[]>("api/artists")))
        );
    }
}
