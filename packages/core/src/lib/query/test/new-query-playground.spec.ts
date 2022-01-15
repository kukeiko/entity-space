import { Class } from "@entity-space/utils";
import { Criterion, NamedCriteriaBag } from "../../criteria/public";
import { Instance } from "../../entity/blueprint/instance";
import { define } from "../../entity/blueprint/property";
import { Expand, Expansion } from "../../expansion/public";

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

interface Query {
    criteria?: Criterion;
    // model: Class[];
    expansion: Expansion;
}

const fooQuery: Query = {
    expansion: { moo: true },
};

class UserModel {
    id = define(Number, { required: true });
    name = define(String);
    createdBy = define(UserModel);
    children = define(UserModel, { array: true });
    reviews = define(ReviewModel, { array: true });
}

class ReviewModel {
    id = define(Number, { required: true });
    reviewText = define(String);
    createdBy = define(UserModel);
}

class SquareModel {
    id = define(Number, { required: true });
    area = define(Number);
    length = define(Number);
    type = define("square" as const, { required: true });
}

class CircleModel {
    id = define(Number, { required: true });
    area = define(Number);
    radius = define(Number);
    type = define("circle" as const, { required: true });
}

const ShapeModels = [SquareModel, CircleModel];

class CanvasModel {
    id = define(Number, { required: true });
    name = define(String);
    shapes = define(ShapeModels, { array: true });
}

xdescribe("new query playground", () => {
    it("working example #1", () => {
        // [todo] i don't need "E extends Expansion<T>", but can instead just do "E = Expansion<T>" and intellisense fully works. what?
        // i want to understand why
        function query<T, E = Expansion<T>>(type: T, criteria: NamedCriteriaBag, expansion: E): Expand<T, E> {
            return {} as any;
        }

        query({} as Product, {}, {});
        const users = query({} as Instance<UserModel>, {}, { name: true, children: { name: true } });
        users.children[0].name;
    });

    it("working example #2", () => {
        function query<T, E = Expansion<Instance<T>>>(
            type: Class<T>,
            criteria: NamedCriteriaBag,
            expansion: E
        ): Expand<Instance<T>, E> {
            return {} as any;
        }

        const user = query(
            UserModel,
            {},
            { name: true, children: { name: true, reviews: { createdBy: { name: true } } } }
        );
        user.id;
        user.children[0].name;
        user.children[0].reviews[0].createdBy.name;
    });

    it("working example #3", () => {
        function query<T, E = Expansion<Instance<T>>>(
            type: Class<T>,
            criteria: NamedCriteriaBag,
            expansion: E
        ): Expand<Instance<T>, E> {
            return {} as any;
        }

        const canvas = query(CanvasModel, {}, { shapes: { area: true, radius: true, length: true } });

        for (const shape of canvas.shapes) {
            switch (shape.type) {
                case "circle":
                    shape.area;
                    shape.radius;
                    break;

                case "square":
                    shape.area;
                    shape.length;
                    break;
            }
        }
    });

    it("working example #4", () => {
        function query<U extends Class[], E = Expansion<Instance<InstanceType<U[number]>>>>(
            type: U,
            criteria: NamedCriteriaBag,
            expansion: E
        ): Expand<Instance<InstanceType<U[number]>>, E> {
            return {} as any;
        }

        const shape = query([SquareModel, CircleModel], {}, { length: true, radius: true });

        switch (shape.type) {
            case "circle":
                shape.area;
                shape.radius;
                break;

            case "square":
                shape.length;
                break;
        }

        const canvas = query([CanvasModel], {}, { shapes: { area: true, radius: true, length: true } });

        for (const shape of canvas.shapes) {
            switch (shape.type) {
                case "circle":
                    shape.area;
                    shape.radius;
                    break;

                case "square":
                    shape.area;
                    shape.length;
                    break;
            }
        }

        const user = query([UserModel], {}, { createdBy: { name: true } });
    });
});
