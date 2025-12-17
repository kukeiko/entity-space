import { EntityBlueprint } from "@entity-space/elements";
import { Product, ProductBlueprint, WashingMachine, WashingMachineBlueprint } from "@entity-space/elements/testing";
import { vi } from "vitest";
import { EntityServiceContainer } from "../../entity-service-container";
import { CreateEntityFn } from "../../mutation/entity-mutation-function.type";
import { InMemoryRepository } from "./in-memory-repository";

type ShoppingEntities = {
    products: Product[];
    washingMachines: WashingMachine[];
};

function filterById<T extends { id: string | number }>(id: string | number): (entity: T) => boolean {
    return entity => entity.id === id;
}

export class ShoppingRepository extends InMemoryRepository<ShoppingEntities> {
    constructor(services: EntityServiceContainer) {
        super();
        this.#services = services;
    }

    readonly #services: EntityServiceContainer;

    useLoadProductById() {
        const load = vi.fn((id: number) => this.filter("products", filterById(id)));

        this.#services.for(ProductBlueprint).addSource({
            where: { id: { $equals: true } },
            load: ({ criteria: { id } }) => load(id.value),
        });

        return load;
    }

    useCreateProduct() {
        const create = vi.fn<CreateEntityFn<ProductBlueprint>>(({ entity: product }) => {
            const nextId = this.nextId("products");

            const created: EntityBlueprint.Instance<ProductBlueprint> = {
                id: nextId,
                name: product.name,
                price: product.price,
            };

            this.entities.products = [...(this.entities.products ?? []), created];

            return Promise.resolve(created);
        });

        this.#services.for(ProductBlueprint).addCreateOneMutator({ create });

        return create;
    }

    useLoadAllWashingMachines() {
        const load = vi.fn(() => this.filter("washingMachines"));

        this.#services.for(WashingMachineBlueprint).addSource({ load });

        return load;
    }

    useCreateWashingMachine() {
        const create = vi.fn<CreateEntityFn<WashingMachineBlueprint>>(({ entity: washingMachine }) => {
            const created: EntityBlueprint.Instance<WashingMachineBlueprint> = {
                id: washingMachine.id,
                maxLoadKg: washingMachine.maxLoadKg,
            };

            this.entities.washingMachines = [...(this.entities.washingMachines ?? []), created];

            return Promise.resolve(created);
        });

        this.#services.for(WashingMachineBlueprint).addCreateOneMutator({ create });

        return create;
    }
}
