import { Entity } from "../../../src";
import { Album } from "./album";
import { Review } from "./review";

@Entity()
export class AlbumReview {
    @Entity.PrimaryKey()
    id: number = null;

    @Entity.ReferenceKey()
    albumId: number = null;

    @Entity.Reference({ key: "albumId", other: () => Album })
    album: Album = null;

    @Entity.ReferenceKey()
    get reviewId(): string {
        return `${this.reviewExternalId}@${this.systemId}`;
    }

    @Entity.Reference({ key: "reviewId", other: () => Review, virtual: true })
    review: Review = null;

    @Entity.Primitive()
    reviewExternalId: string = null;

    @Entity.Primitive()
    systemId: number = null;

    constructor(args?: Partial<AlbumReview>) {
        Object.assign(this, args || {});
    }
}
