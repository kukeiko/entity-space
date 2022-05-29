import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { EntityApi, SchemaCatalog } from "@entity-space/core";
import { inSetTemplate } from "@entity-space/criteria";
import { Song, SongLocation } from "@entity-space/examples/libs/music-model";
import { firstValueFrom } from "rxjs";

@Injectable()
export class SongLocationEntitySource extends EntityApi<SongLocation> {
    constructor(private readonly http: HttpClient, private readonly schemaCatalog: SchemaCatalog) {
        super(schemaCatalog.getSchema("song-location"));

        // this.addEndpoint(builder => builder.isLoadedBy(async () => firstValueFrom(this.http.get<Song[]>("api/songs"))));

        this.addEndpoint(builder =>
            builder
                .requiresFields({ songId: inSetTemplate(Number) })
                .isLoadedBy(query =>
                    firstValueFrom(
                        this.http.get<Song>(
                            `api/song-locations?songId=${Array.from(
                                query.getCriteria().getBag().songId.getValues()
                            ).join(",")}`
                        )
                    )
                )
        );
    }
}
