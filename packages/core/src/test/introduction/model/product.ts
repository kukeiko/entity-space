import { ProductReview } from "./product-review";

export interface Product {
    id: number;
    name: string;
    price: number;
    rating: number;
    reviews?: ProductReview[];
}
