// [todo] naming conflict w/ model/property
interface Property {
    key: string;
    // type: "number" | "string" | "boolean";
}

export interface Metadata<T> {
    // in open-api context, its the uri. in indexeddb, its going to be the object store name.
    // we may want to split it up at some point - let's see.
    name: string;
    properties: Record<keyof T, Property>;
    key: string[];
    indexes?: string[];
}

interface Brand {
    id: number;
    name: string;
}

interface Product {
    id: number;
    name: string;
    price: number;
    rating?: number;
    brand: Brand;
    reviews?: ProductReview[];
}

interface ProductReview {
    id: number;
    productId?: number;
    reviewText?: string;
    product?: Product;
}

type BrandMetadata = Metadata<Brand>;

type EntityOf<M> = M extends Metadata<infer T> ? T : never;

type EntityBrand = EntityOf<Metadata<Brand>>;

const brandMetadata: Metadata<Brand> = {
    key: [],
    name: "",
    properties: {} as any,
};

function getEntityMetadata(): any {}

function getBrandMetadata(): Metadata<Brand> {
    return brandMetadata;
}

xdescribe("playground: metadata", () => {
    it("foo", () => {});
});
