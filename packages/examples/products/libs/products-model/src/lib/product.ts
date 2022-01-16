import { Brand } from ".";
import { ProductReview } from "./product-review";

export interface Product {
    id: number;
    name: string;
    brandId: number;
    brand?: Brand;
    price: number;
    rating: number;
    reviews?: ProductReview[];
}
