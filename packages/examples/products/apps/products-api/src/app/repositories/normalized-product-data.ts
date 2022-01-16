import { Brand, Product, ProductReview, User } from "@entity-space/examples/products/libs/products-model";

const brands: Brand[] = [
    {
        id: 1,
        name: "Shirt Factory",
    },
    {
        id: 2,
        name: "Rat-Stick INC.",
    },
];

const products: Product[] = [
    {
        id: 1,
        name: "A really nice Shirt",
        brandId: 1,
        price: 1337,
        rating: 5,
    },
    {
        id: 2,
        name: "A decent Shirt",
        brandId: 1,
        price: 200,
        rating: 3,
    },
    {
        id: 3,
        name: "A kind of unsightly Shirt",
        brandId: 1,
        price: 100,
        rating: 2,
    },
    {
        id: 4,
        name: "Rat-Stick w/ Titanium Nails 2000",
        brandId: 2,
        price: 640,
        rating: 4,
    },
];

const users: User[] = [
    { id: 1, name: "Susi Sonne" },
    { id: 2, name: "Karli Karotte" },
];

const reviews: ProductReview[] = [
    {
        id: 1,
        productId: 1,
        review: "This shirt is really nice!",
        authorId: 1,
        rating: 5,
    },
    {
        id: 2,
        productId: 1,
        review: "Doesn't smell of carrots - 2/5 stars.",
        authorId: 2,
        rating: 2,
    },
    {
        id: 3,
        productId: 4,
        authorId: 1,
        rating: 5,
        review: "It really does the trick!",
    },
];

export default {
    brands,
    users,
    products,
    reviews,
};
