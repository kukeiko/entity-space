import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { EntityApi } from "@entity-space/core";
import { Artist, MusicSchemaCatalog } from "@entity-space/examples/libs/music-model";
import { firstValueFrom } from "rxjs";

@Injectable()
export class ArtistEntitySource extends EntityApi<Artist> {
    constructor(private readonly http: HttpClient, private readonly schemaCatalog: MusicSchemaCatalog) {
        super(schemaCatalog.getArtistSchema());

        this.addEndpoint(builder =>
            builder.isLoadedBy(async () => firstValueFrom(this.http.get<Artist[]>("api/artists")))
        );
    }
}
