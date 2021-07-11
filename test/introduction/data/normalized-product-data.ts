import { Product, ProductReview } from "../model";

const products: Product[] = [
    {
        id: 1,
        name: "A really nice Shirt",
        price: 1337,
        rating: 5,
    },
    {
        id: 3,
        name: "A decent Shirt",
        price: 200,
        rating: 3,
    },
    {
        id: 3,
        name: "A really ugly Shirt",
        price: 100,
        rating: 2,
    },
];

const reviews: ProductReview[] = [
    {
        id: 1,
        productId: 1,
        review: "This shirt is really nice!",
    },
];

export default {
    products,
    reviews
};
