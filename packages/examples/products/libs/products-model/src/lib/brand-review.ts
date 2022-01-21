import { Brand } from "./brand";
import { User } from "./user";

export interface BrandReview {
    id: number;
    brandId: number;
    brand?: Brand;
    review: string;
    authorId: number;
    author?: User;
}
