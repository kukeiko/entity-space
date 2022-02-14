import { Entity } from "../entity/entity";
import { Expansion } from "../expansion/expansion";
import { Query } from "./query";

// [todo] T is unused
export class QueryMapper<T = Record<string, any>, R = {}, O = {}, E = {}> {
    constructor(
        requiredFields: R,
        optionalFields: O,
        supportedExpansion: E,
        load: (query: Query) => Promise<Entity[]>
    ) {
        this.requiredFields = requiredFields;
        this.optionalFields = optionalFields;
        this.supportedExpansion = new Expansion(supportedExpansion);
        this.loadEntities = load;
    }

    private readonly requiredFields: R;
    private readonly optionalFields: O;
    private readonly supportedExpansion: Expansion<E>;
    private readonly loadEntities: (query: Query) => Promise<Entity[]>;

    getRequiredFields(): R {
        return this.requiredFields;
    }

    getOptionalFields(): O {
        return this.optionalFields;
    }

    getSupportedExpansion(): Expansion {
        return this.supportedExpansion;
    }

    load(query: Query): Promise<Entity[]> {
        return this.loadEntities(query);
    }
}
