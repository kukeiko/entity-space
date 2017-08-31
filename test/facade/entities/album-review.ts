import { EntityClass, Property } from "../../../src";
import { Album } from "./album";
import { Review } from "./review";

@EntityClass()
export class AlbumReview {
    @Property.Id()
    id: number = null;

    @Property.Key()
    albumId: number = null;

    @Property.Reference({ key: "albumId", other: () => Album })
    album: Album = null;

    @Property.Key()
    get reviewId(): string {
        return `${this.reviewExternalId}@${this.systemId}`;
    }

    @Property.Reference({ key: "reviewId", other: () => Review, virtual: true })
    review: Review = null;

    @Property.Primitive()
    reviewExternalId: string = null;

    @Property.Primitive()
    systemId: number = null;

    constructor(args?: Partial<AlbumReview>) {
        Object.assign(this, args || {});
    }
}
