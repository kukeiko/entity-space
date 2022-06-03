import { User } from "@entity-space/examples/libs/common-model";
import { Brand } from "./brand";

export interface BrandReview {
    id: number;
    brandId: number;
    brand?: Brand;
    review: string;
    authorId: number;
    author?: User;
}
