import { Criterion } from "../criterion";
import { EntityCriterion } from "../entity-criterion";
import { invertCriterion } from "../invert/invert-criterion.fn";
import { OrCriterion } from "../or-criterion";
import { subtractCriterion } from "./subtract-criterion.fn";

export function subtractByEntityCriterion(entityCriterion: EntityCriterion, what: Criterion): boolean | Criterion {
    if (what instanceof EntityCriterion) {
        // same subtraction mechanics as found in and-criteria.ts
        const otherBag = what.getCriteria();
        const subtractions: (
            | {
                  result: Criterion | true;
                  key: string;
                  inverted?: never;
              }
            | {
                  result: false;
                  key: string;
                  inverted: Criterion;
              }
        )[] = [];

        const otherKeys = new Set(Object.keys(otherBag));
        let didInvert = false;

        for (const [key, mine] of Object.entries(entityCriterion.getCriteria())) {
            otherKeys.delete(key);
            const otherCriterion = otherBag[key];

            if (otherCriterion === undefined) {
                const inverted = invertCriterion(mine);
                didInvert = true;
                subtractions.push({ key, result: false, inverted });
            } else {
                const result = subtractCriterion(otherCriterion, mine);

                if (result === false) {
                    return false;
                }

                subtractions.push({ key, result });
            }
        }

        if (subtractions.every(x => x.result === false) && !didInvert) {
            return false;
        } else if (subtractions.every(x => x.result === true)) {
            return true;
        }

        // we want items that did an actual subtraction to be put first
        subtractions.sort((a, b) => {
            if (a.result !== false && b.result === false) {
                return -1;
            } else if (a.result === false && b.result !== false) {
                return 1;
            } else {
                return 0;
            }
        });

        const accumulator: Record<string, Criterion> = { ...what.getCriteria() };
        const built: Record<string, Criterion>[] = [];

        for (const { key, result, inverted } of subtractions) {
            if (result === true) {
                continue;
            } else if (result === false) {
                built.push({ ...accumulator, [key]: inverted });
                accumulator[key] = entityCriterion.getCriteria()[key]!;
            } else {
                built.push({ ...accumulator, [key]: result });
                accumulator[key] = entityCriterion.getCriteria()[key]!;
            }
        }

        return built.length === 1
            ? new EntityCriterion(built[0])
            : new OrCriterion(built.map(bag => new EntityCriterion(bag)));
    }

    return false;
}
