import { EntityBlueprint, EntitySchema } from "@entity-space/elements";
import { Class } from "@entity-space/utils";
import { EntityServiceContainer } from "../entity-service-container";
import { EntityWorkspace } from "../entity-workspace";
import { TestRepository } from "./test-repository";

export class TestFacade {
    constructor() {}

    readonly #services = new EntityServiceContainer();
    readonly #workspace = new EntityWorkspace(this.#services);
    readonly #repository = new TestRepository(this.#services);

    getServices(): EntityServiceContainer {
        return this.#services;
    }

    getWorkspace(): EntityWorkspace {
        return this.#workspace;
    }

    getTestRepository(): TestRepository {
        return this.#repository;
    }

    enableConsoleTracing(flag?: boolean): this {
        this.#services.getTracing().enableConsole(flag);
        return this;
    }

    // [todo] ❌ use this method in all tests where we currently call "face.getServices().getCatalog().getSchemaByBlueprint(...)"
    getSchemaByBlueprint(blueprint: Class): EntitySchema {
        return this.#services.getCatalog().getSchemaByBlueprint(blueprint);
    }

    constructDefault<B>(blueprint: Class<B>): EntityBlueprint.Type<B> {
        return this.#workspace.from(blueprint).constructDefault();
    }
}
