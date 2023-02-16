import { Component, OnDestroy, OnInit } from "@angular/core";
import { Song, SongLocation } from "@entity-space/examples/libs/music-model";
import { pluckId } from "@entity-space/utils";
import { PrimeNGConfig } from "primeng/api";
import { BehaviorSubject, map, skip, Subject, switchMap } from "rxjs";
import { createDefaultSongFilter, SongFilter } from "./models";
import { MusicBoxWorkspace } from "./music-box-workspace";
import { sortByName } from "./sort-by-name.fn";

@Component({
    selector: "music-box-app",
    templateUrl: "./music-box-app.component.html",
    styleUrls: ["./music-box-app.component.scss"],
})
export class MusicAppComponent implements OnInit, OnDestroy {
    constructor(private primengConfig: PrimeNGConfig, private readonly entities: MusicBoxWorkspace) {}

    private readonly destroyed$ = new Subject<void>();
    private filter$ = new BehaviorSubject<SongFilter>(createDefaultSongFilter());
    cachedQueries$ = this.entities.queryCacheChanged$();

    get filter(): SongFilter {
        return this.filter$.getValue();
    }

    set filter(value: SongFilter) {
        this.filter$.next(value);
    }

    songs$ = this.filter$.pipe(
        skip(1),
        switchMap(filter =>
            this.entities
                .fromSongs()
                .select({ locations: true })
                .where({
                    artistId: pluckId(filter.artists),
                    locations: {
                        // [todo] get rid of type assertion
                        songLocationType: pluckId(filter.locationTypes) as SongLocation["songLocationType"][],
                    },
                })
                .findAll()
        ),
        map(({ entities }) => entities),
        map(sortByName)
    );

    artists$ = this.entities
        .fromArtists()
        .findAll()
        .pipe(
            map(({ entities }) => entities),
            map(sortByName)
        );

    ngOnInit(): void {
        this.primengConfig.ripple = true;
    }

    ngOnDestroy(): void {
        this.destroyed$.next();
        this.destroyed$.complete();
    }
}
