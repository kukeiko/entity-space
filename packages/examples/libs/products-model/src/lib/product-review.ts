import { Product } from "./product";
import { User } from "./user";

export interface ProductReview {
    id: number;
    productId: number;
    product?: Product;
    review: string;
    authorId: number;
    author?: User;
    rating: number;
}
