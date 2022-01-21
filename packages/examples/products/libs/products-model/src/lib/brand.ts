import { BrandReview } from "./brand-review";

export interface Brand {
    id: number;
    name: string;
    reviews?: BrandReview[];
}
