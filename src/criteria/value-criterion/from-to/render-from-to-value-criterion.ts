import { FromToValueCriterion } from "./from-to-value-criterion";

export function renderFromToValueCriterion(criterion: FromToValueCriterion): string {
    const shards: string[] = [];

    if (criterion.from === void 0) {
        shards.push("[...");
    } else if (criterion.from.op === ">") {
        shards.push(`(${criterion.from.value}`);
    } else {
        shards.push(`[${criterion.from.value}`);
    }

    if (criterion.to === void 0) {
        shards.push("...]");
    } else if (criterion.to.op === "<") {
        shards.push(`${criterion.to.value})`);
    } else {
        shards.push(`${criterion.to.value}]`);
    }

    return shards.join(", ");
}
