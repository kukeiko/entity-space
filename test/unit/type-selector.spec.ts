import { Type, Property, WithAttribute, TypeSelector, TypeSymbol, SelectionSymbol } from "@sandbox-8";

describe("type-selector", () => {
    it("should create a selection as expected", () => {
        // arrange
        class AlbumType {
            [TypeSymbol] = Type.Metadata.create(AlbumType);
            name: Property<"name", typeof String> = { key: "name", value: String, primitive: true };
            releasedAt: Property<"releasedAt", typeof String> = { key: "releasedAt", value: String, primitive: true };
            songs: Property<"songs", typeof SongType> & WithAttribute<"iterable"> = { key: "songs", value: SongType, iterable: true, primitive: false };
        }

        class SongType {
            [TypeSymbol] = Type.Metadata.create(SongType);
            album: Property<"album", typeof AlbumType> = { key: "album", value: AlbumType, primitive: false };
            duration: Property<"duration", typeof Number> = { key: "duration", value: Number, primitive: true };
            name: Property<"name", typeof String> = { key: "name", value: String, primitive: true };
        }

        let sourceType = new AlbumType();
        let songType = new SongType();
        let typeSelector = new TypeSelector(sourceType);

        // act
        let selectedType = typeSelector
            .select(x => x.name)
            .select(x => x.songs, q => q
                .select(x => x.name)
                .select(x => x.duration)
                .select(x => x.album, q => q
                    .select(x => x.releasedAt)
                )
            )
            .build();

        // assert
        let sourceMetadata = selectedType[SelectionSymbol].type[TypeSymbol];

        expect(sourceMetadata.class).toBe(AlbumType, "source metadata class was expected to be 'AlbumType'");
        expect(selectedType.name).not.toBe(sourceType.name, "expected property to be cloned: name");
        expect(selectedType.name).toEqual(sourceType.name, "expected property to equal the one from source: name");

        expect(selectedType.songs).not.toBe(sourceType.songs as any, "expected property to be cloned: songs");
        expect(selectedType.songs.value instanceof Function).toBe(false, "expanded type was still a class: songs");

        expect(selectedType.songs.value.duration).not.toBe(songType.duration, "expected property to be cloned: songs.duration");
        expect(selectedType.songs.value.duration).toEqual(songType.duration, "expected property to equal the one from source:  songs.duration");

        expect(selectedType.songs.value.album).not.toBe(selectedType as any, "unexpected type recursion: songs.album");
        expect(selectedType.songs.value.album).not.toEqual(selectedType as any, "unexpected type recursion: songs.album");
    });
});
