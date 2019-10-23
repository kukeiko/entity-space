import { TypeMetadataSymbol, StaticType, Property, TypeSelector, Expandable, Iterable, InstanceOf, InstanceLoader, TypeQuery, Filterable, CriteraBuilder, SelectedType, PropertiesOf } from "@sandbox-8";

describe("instance-loader", () => {
    it("should do stuff", () => {
        class AlbumType {
            [TypeMetadataSymbol] = StaticType.Metadata.create(AlbumType);
            name: Property<"name", typeof String> = { key: "name", value: String };
            releasedAt: Property<"releasedAt", typeof String> = { key: "releasedAt", value: String };
            songs: Property<"songs", typeof SongType> & Expandable & Iterable = { key: "songs", value: SongType, expandable: true, iterable: true };
        }

        class SongType {
            [TypeMetadataSymbol] = StaticType.Metadata.create(SongType);
            album: Property<"album", typeof AlbumType> & Expandable = { key: "album", value: AlbumType, expandable: true };
            duration: Property<"duration", typeof Number> = { key: "duration", value: Number };
            name: Property<"name", typeof String> = { key: "name", value: String };
        }

        let albumTypeInstanceLoader: InstanceLoader<AlbumType> = {
            load(selected) {
                new selected[TypeMetadataSymbol].source[TypeMetadataSymbol].class();
                let metadata = selected[TypeMetadataSymbol].source[TypeMetadataSymbol].class;
                selected[TypeMetadataSymbol].source[TypeMetadataSymbol].class;
                selected.songs?.value[TypeMetadataSymbol].source;

                return new Map([
                    [1, {}]
                ]);
            }
        };

        let anyTypeInstanceLoader: InstanceLoader<AlbumType | SongType> = {
            load(selected) {
                let metadata = selected[TypeMetadataSymbol].source[TypeMetadataSymbol];

                if (metadata.class === AlbumType) {
                    new metadata.class().releasedAt.key;
                }
                // if (metadata.class === AlbumType) {

                // }
                // if (type[TypeMetadataSymbol].class === AlbumType) {
                //     // new type[TypeMetadataSymbol].class().
                // }

                return new Map([
                    [1, {}]
                ]);
            }
        };
    });
});

describe("type-query", () => {
    it("should do stuff", () => {
        // arrange
        class AlbumType {
            [TypeMetadataSymbol] = StaticType.Metadata.create(AlbumType);
            name: Property<"name", typeof String> & Filterable = { key: "name", value: String, filterable: true };
            releasedAt: Property<"releasedAt", typeof String> = { key: "releasedAt", value: String };
            songs: Property<"songs", typeof SongType> & Expandable & Iterable = { key: "songs", value: SongType, expandable: true, iterable: true };
        }

        class SongType {
            [TypeMetadataSymbol] = StaticType.Metadata.create(SongType);
            album: Property<"album", typeof AlbumType> & Expandable = { key: "album", value: AlbumType, expandable: true };
            duration: Property<"duration", typeof Number> = { key: "duration", value: Number };
            name: Property<"name", typeof String> = { key: "name", value: String };
        }

        let typeQuery = new TypeQuery(new AlbumType());

        typeQuery
            .select(s => s
                .select(x => x.name)

            )
            .where(c => c

            )
            ;

        let filtersName = (cb: CriteraBuilder<SelectedType<AlbumType>>) => {
            cb.equals("foo", x => x.name);
        };
    });
});
