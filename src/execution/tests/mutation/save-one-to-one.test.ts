import { Product, ProductBlueprint, WashingMachine, WashingMachineBlueprint } from "@entity-space/elements/testing";
import { beforeEach, describe, expect, it } from "vitest";
import { EntityWorkspace } from "../../entity-workspace";
import { CreateEntityFn } from "../../mutation/entity-mutation-function.type";
import { TestFacade, TestRepository } from "../../testing";

describe("save()", () => {
    let facade: TestFacade;
    let repository: TestRepository;
    let workspace: EntityWorkspace;

    beforeEach(() => {
        facade = new TestFacade();
        repository = facade.getTestRepository();
        workspace = facade.getWorkspace();
    });

    it("can create one-to-one relations: washingMachine.product", async () => {
        // arrange
        const washingMachine: WashingMachine = {
            id: 0,
            maxLoadKg: 64,
            product: {
                id: 0,
                name: "HydroSpin 2000",
                price: 699,
            },
        };

        const expected: WashingMachine = {
            id: 1,
            maxLoadKg: 64,
            product: {
                id: 1,
                name: "HydroSpin 2000",
                price: 699,
            },
        };

        const createProduct = repository.useCreateProduct();
        const createWashingMachine = repository.useCreateWashingMachine();

        // act
        const actual = await workspace.in(WashingMachineBlueprint).select({ product: true }).save(washingMachine);

        // assert
        expect(actual).toEqual(expected);
        expect(createProduct).toHaveBeenCalledTimes(1);
        expect(createWashingMachine).toHaveBeenCalledTimes(1);
        expect(createProduct).toHaveBeenCalledWith<Parameters<CreateEntityFn<ProductBlueprint>>>({
            selection: {},
            entity: { name: "HydroSpin 2000", price: 699 },
        });
        expect(createWashingMachine).toHaveBeenCalledWith<Parameters<CreateEntityFn<WashingMachineBlueprint>>>({
            selection: {},
            entity: { id: 1, maxLoadKg: 64 },
        });
    });

    it("can create one-to-one relations: product.washingMachine", async () => {
        // arrange
        const product: Product = {
            id: 0,
            name: "HydroSpin 2000",
            price: 699,
            washingMachine: {
                id: 0,
                maxLoadKg: 64,
            },
        };

        const expected: Product = {
            id: 1,
            name: "HydroSpin 2000",
            price: 699,
            washingMachine: {
                id: 1,
                maxLoadKg: 64,
            },
        };

        const createProduct = repository.useCreateProduct();
        const createWashingMachine = repository.useCreateWashingMachine();

        // act
        const actual = await workspace.in(ProductBlueprint).select({ washingMachine: true }).save(product);

        // assert
        expect(actual).toEqual(expected);
        expect(createProduct).toHaveBeenCalledTimes(1);
        expect(createWashingMachine).toHaveBeenCalledTimes(1);
        expect(createProduct).toHaveBeenCalledWith<Parameters<CreateEntityFn<ProductBlueprint>>>({
            selection: {},
            entity: { name: "HydroSpin 2000", price: 699 },
        });
        expect(createWashingMachine).toHaveBeenCalledWith<Parameters<CreateEntityFn<WashingMachineBlueprint>>>({
            selection: {},
            entity: { id: 1, maxLoadKg: 64 },
        });
    });
});
