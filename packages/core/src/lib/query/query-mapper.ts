import { Entity } from "../entity/entity";
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
        this.supportedExpansion = supportedExpansion;
        this.loadEntities = load;
    }

    private readonly requiredFields: R;
    private readonly optionalFields: O;
    private readonly supportedExpansion: E;
    private readonly loadEntities: (query: Query) => Promise<Entity[]>;

    getRequiredFields(): R {
        return this.requiredFields;
    }

    getOptionalFields(): O {
        return this.optionalFields;
    }

    getSupportedExpansion(): E {
        return this.supportedExpansion;
    }

    load(query: Query): Promise<Entity[]> {
        return this.loadEntities(query);
    }
}
