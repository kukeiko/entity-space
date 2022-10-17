import { Entity } from "@entity-space/common";
import { QueryPaging } from "../../query/query-paging";

export class PagedEntityIdCache {
    private ids: (Entity | undefined)[] = [];

    add(entities: Entity[], page: QueryPaging): void {
        const from = page.getFrom() ?? 0;
        const to = page.getTo() ?? from + entities.length;

        for (let i = from; i <= to; ++i) {
            this.ids[i] = entities[i - from];
        }
    }

    get(page: QueryPaging): (Entity | undefined)[] {
        const from = page.getFrom() ?? 0;
        const to = (page.getTo() ?? this.ids.length) + 1;

        return this.ids.slice(from, to);
    }
}
