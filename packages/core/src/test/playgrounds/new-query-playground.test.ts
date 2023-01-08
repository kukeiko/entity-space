import { BlueprintInstance, PackedEntitySelection, Select } from "@entity-space/common";
import { NamedCriteriaBag } from "@entity-space/criteria";
import { Class } from "@entity-space/utils";
import { CanvasBlueprint, Product, ShapeBlueprints, User, UserBlueprint } from "../content";

xdescribe("new query playground", () => {
    it("working example #1", () => {
        // [todo] i don't need "E extends Expansion<T>", but can instead just do "E = Expansion<T>" and intellisense fully works. what?
        // i want to understand why
        function query<T, E = PackedEntitySelection<T>>(
            type: T,
            criteria: NamedCriteriaBag,
            expansion: E
        ): Select<T, E> {
            return {} as any;
        }

        query({} as Product, {}, {});
        const users = query({} as User, {}, { name: true, children: { name: true } });
        users.children[0].name;
    });

    it("working example #2", () => {
        function query<T, E = PackedEntitySelection<BlueprintInstance<T>>>(
            type: Class<T>,
            criteria: NamedCriteriaBag,
            expansion: E
        ): Select<BlueprintInstance<T>, E> {
            return {} as any;
        }

        const user = query(
            UserBlueprint,
            {},
            { name: true, children: { name: true, reviews: { createdBy: { name: true } } } }
        );
        user.id;
        user.children[0].name;
        user.children[0].reviews[0].createdBy.name;
    });

    it("working example #3", () => {
        function query<
            T,
            E extends PackedEntitySelection<BlueprintInstance<T>> = PackedEntitySelection<BlueprintInstance<T>>
        >(type: Class<T>, criteria: NamedCriteriaBag, expansion: E): Select<BlueprintInstance<T>, E> {
            return {} as any;
        }

        const canvas = query(
            CanvasBlueprint,
            {},
            {
                shapes: { area: true, radius: true, length: true },
                author: { parent: { reviews: { createdBy: { children: true } } } },
            }
        );

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
        function query<U extends Class[], E = PackedEntitySelection<BlueprintInstance<InstanceType<U[number]>>>>(
            type: U,
            criteria: NamedCriteriaBag,
            expansion: E
        ): Select<BlueprintInstance<InstanceType<U[number]>>, E> {
            return {} as any;
        }

        const shape = query(ShapeBlueprints, {}, { length: true, radius: true });

        switch (shape.type) {
            case "circle":
                shape.area;
                shape.radius;
                break;

            case "square":
                shape.length;
                break;
        }

        const canvas = query([CanvasBlueprint], {}, { shapes: { area: true, radius: true, length: true } });

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

        const user = query([UserBlueprint], {}, { createdBy: { name: true } });
    });
});
