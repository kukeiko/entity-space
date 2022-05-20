import { Entity, EntitySchema, IEntitySource, IEntityStore, Query } from "@entity-space/core";
import { inRange, matches } from "@entity-space/criteria";
import { Song } from "@entity-space/examples/libs/music-model";
import { FileOnDiskBasedEntitySource } from "@entity-space/node";
import { Injectable } from "@nestjs/common";

@Injectable()
export class DiskDbService {
    constructor() {
        this.entitySource = new FileOnDiskBasedEntitySource(this.filePath);
    }

    private readonly entitySource: IEntitySource & IEntityStore;
    private readonly filePath = "./assets/entities.json";

    async loadSongs(): Promise<Song[]> {
        const results = await this.entitySource.query(
            new Query(
                new EntitySchema("song"),
                // [todo] hack: can not create empty criteria yet
                matches({ id: inRange(0, 1000) })
            )
        );

        if (!results) {
            return [];
        }

        return results.reduce((acc, value) => [...acc, ...value.getEntities()], [] as Entity[]) as Song[];
    }

    async createSong(song: Song): Promise<Song> {
        const schema = new EntitySchema("song");
        const created = await this.entitySource.create([song], schema);

        return created[0] as Song;
    }
}
