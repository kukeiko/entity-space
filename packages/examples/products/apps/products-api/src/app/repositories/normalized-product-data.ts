import { Brand, BrandReview, Product, ProductReview, User } from "@entity-space/examples/products/libs/products-model";

const users: User[] = [
    { id: 1, name: "Susi Sonne" },
    { id: 2, name: "Karli Karotte" },
];

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

const brandReviews: BrandReview[] = [
    {
        authorId: 1,
        brandId: 1,
        id: 1,
        review: "They make good Shirts!",
    },
    {
        authorId: 1,
        brandId: 2,
        id: 2,
        review: "They are my first choice whenever I have to deal with rats eating my stock!",
    },
    {
        authorId: 2,
        brandId: 2,
        id: 3,
        review: "Nothing they make resembles carrots. 1/5",
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
    brandReviews,
};
