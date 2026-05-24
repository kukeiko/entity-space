import { EntityPage } from "./entity-page";

export function slicePage<T>(items: readonly T[], page: EntityPage): T[] {
    const top = page.getTop();
    const end = top === undefined ? undefined : page.getSkip() + top;

    return items.slice(page.getSkip(), end);
}
