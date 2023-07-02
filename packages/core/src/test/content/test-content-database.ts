import { cloneDeep } from "lodash";
import { Review } from "./common/review.model";
import { User } from "./common/user.model";
import { Brand } from "./products/brand.model";
import { Product } from "./products/product.model";

export interface TestContentData {
    brands?: Brand[];
    users?: User[];
    reviews?: Review[];
    products?: Product[];
}

export class TestContentDatabase {
    constructor(data: TestContentData = {}) {
        this.data = data;
    }

    private readonly data: TestContentData = {};

    set<K extends keyof TestContentData>(key: K, entities: TestContentData[K]): this {
        this.data[key] = entities;
        return this;
    }

    get<K extends keyof TestContentData>(key: K): Exclude<TestContentData[K], undefined> {
        return cloneDeep(this.data[key] ?? ([] as any));
    }
}
