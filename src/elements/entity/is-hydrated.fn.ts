import { EntitySelection } from "../selection/entity-selection";
import { Entity } from "./entity";

export function isHydrated(entity: Entity, selection: EntitySelection): boolean {
    for (const [key, value] of Object.entries(selection)) {
        if (!value) {
            continue;
        } else if (entity[key] === undefined) {
            return false;
        } else if (value !== true && entity[key] !== null) {
            if (Array.isArray(entity[key])) {
                if (!(entity[key] as Entity[]).every(entity => isHydrated(entity, value))) {
                    return false;
                }
            } else {
                if (!isHydrated(entity[key] as Entity, value)) {
                    return false;
                }
            }
        }
    }

    return true;
}
