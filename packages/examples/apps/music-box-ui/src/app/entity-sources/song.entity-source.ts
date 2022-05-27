import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { EntityApi, IEntitySchema } from "@entity-space/core";
import { isValueTemplate } from "@entity-space/criteria";
import { MusicSchemaCatalog, Song } from "@entity-space/examples/libs/music-model";
import { firstValueFrom } from "rxjs";

@Injectable()
export class SongEntitySource extends EntityApi<Song> {
    constructor(private readonly http: HttpClient, private readonly schemaCatalog: MusicSchemaCatalog) {
        super(schemaCatalog.getSongSchema());

        this.addEndpoint(builder =>
            builder
                .requiresFields({ id: isValueTemplate(Number) })
                .isLoadedBy(query =>
                    firstValueFrom(this.http.get<Song>(`api/songs/${query.getCriteria().getBag().id.getValue()}`))
                )
        );

        this.addEndpoint(builder => builder.isLoadedBy(async () => firstValueFrom(this.http.get<Song[]>("api/songs"))));
    }

    override async update(entities: Song[], schema: IEntitySchema): Promise<false | Song[]> {
        return Promise.all(
            entities.map(entity => firstValueFrom(this.http.patch<Song>(`api/songs/${entity.id}`, entity)))
        );
    }
}
