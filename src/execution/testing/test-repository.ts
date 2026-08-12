import { EntityServiceContainer } from "../entity-service-container";
import { CommonRepository } from "./repositories/common-repository";
import { FileSystemRepository } from "./repositories/file-system-repository";
import { MusicRepository } from "./repositories/music-repository";
import { RpgRepository } from "./repositories/rpg-repository";
import { ShapeRepository } from "./repositories/shape-repository";
import { ShoppingRepository } from "./repositories/shopping-repository";
import { TreeRepository } from "./repositories/tree-repository";

export class TestRepository {
    constructor(services: EntityServiceContainer) {
        this.#commonRepository = new CommonRepository(services);
        this.#musicRepository = new MusicRepository(services);
        this.#shoppingRepository = new ShoppingRepository(services);
        this.#rpgRepository = new RpgRepository(services);
        this.#fileSystemRepository = new FileSystemRepository(services);
        this.#treeRepository = new TreeRepository(services);
        this.#shapeRepository = new ShapeRepository(services);
    }

    readonly #commonRepository: CommonRepository;
    readonly #musicRepository: MusicRepository;
    readonly #shoppingRepository: ShoppingRepository;
    readonly #rpgRepository: RpgRepository;
    readonly #fileSystemRepository: FileSystemRepository;
    readonly #treeRepository: TreeRepository;
    readonly #shapeRepository: ShapeRepository;

    useCommon(): CommonRepository {
        return this.#commonRepository;
    }

    useMusic(): MusicRepository {
        return this.#musicRepository;
    }

    useShopping(): ShoppingRepository {
        return this.#shoppingRepository;
    }

    useRpg(): RpgRepository {
        return this.#rpgRepository;
    }

    useFileSystem(): FileSystemRepository {
        return this.#fileSystemRepository;
    }

    useShapes(): ShapeRepository {
        return this.#shapeRepository;
    }

    useTree(): TreeRepository {
        return this.#treeRepository;
    }
}
