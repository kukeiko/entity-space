import { Entity } from "../../../src";
import { Album } from "./album";
import { Review } from "./review";

@Entity()
export class AlbumReview {
    @Entity.PrimaryKey()
    id: number;

    @Entity.ReferenceKey()
    albumId: number;

    @Entity.Reference({ key: "albumId", other: () => Album })
    album: Album;

    @Entity.ReferenceKey()
    get reviewId(): string {
        return `${this.reviewExternalId}@${this.systemId}`;
    }

    @Entity.Reference({ key: "reviewId", other: () => Review })
    review: Review;

    @Entity.Primitive()
    reviewExternalId: string;

    @Entity.Primitive()
    systemId: number;
}
