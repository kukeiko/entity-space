import { Component, OnDestroy, OnInit } from "@angular/core";
import { EntityQuery, EntityWorkspace } from "@entity-space/core";
import { matches, some } from "@entity-space/criteria";
import { ArtistBlueprint, SongBlueprint, SongLocation } from "@entity-space/examples/libs/music-model";
import { pluckId } from "@entity-space/utils";
import { PrimeNGConfig } from "primeng/api";
import { map, Subject, switchMap, takeUntil } from "rxjs";
import { createDefaultSongFilter } from "./models";

@Component({
    selector: "music-box-app",
    templateUrl: "./music-box-app.component.html",
    styleUrls: ["./music-box-app.component.scss"],
})
export class MusicAppComponent implements OnInit, OnDestroy {
    constructor(private primengConfig: PrimeNGConfig, private readonly entities: EntityWorkspace) {}

    private readonly destroyed$ = new Subject<void>();

    cachedQueries: EntityQuery[] = [];
    filter = createDefaultSongFilter();
    searchTrigger$ = new Subject<void>();

    songs$ = this.searchTrigger$.pipe(
        switchMap(() =>
            this.entities.scope(SongBlueprint).many(
                {
                    artistId: pluckId(this.filter.artists),
                    locations: some(matches<SongLocation>({ songLocationType: pluckId(this.filter.locationTypes) })),
                },
                { id: true, artistId: true, duration: true, name: true, locations: { songLocationType: true } }
            )
        ),
        map(songs => songs.slice().sort((a, b) => a.name.localeCompare(b.name)))
    );

    artists$ = this.entities
        .scope(ArtistBlueprint)
        .all()
        .pipe(map(artists => artists.slice().sort((a, b) => a.name.localeCompare(b.name))));

    ngOnInit(): void {
        this.primengConfig.ripple = true;

        this.entities
            .queryCacheChanged$()
            .pipe(takeUntil(this.destroyed$))
            .subscribe(cachedQueries => (this.cachedQueries = cachedQueries));
    }

    ngOnDestroy(): void {
        this.destroyed$.next();
        this.destroyed$.complete();
    }

    onFilterChange(): void {
        this.searchTrigger$.next();
    }
}
