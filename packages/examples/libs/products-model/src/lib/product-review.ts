import { User } from "@entity-space/examples/libs/common-model";
import { Product } from "./product";

export interface ProductReview {
    id: number;
    productId: number;
    product?: Product;
    review: string;
    authorId: number;
    author?: User;
    rating: number;
}
