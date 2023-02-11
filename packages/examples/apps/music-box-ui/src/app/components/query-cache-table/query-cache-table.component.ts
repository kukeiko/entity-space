import { ChangeDetectionStrategy, Component, Input } from "@angular/core";
import { IEntityQuery } from "@entity-space/core";

@Component({
    selector: "query-cache-table",
    templateUrl: "./query-cache-table.component.html",
    styleUrls: ["./query-cache-table.component.scss"],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class QueryCacheTableComponent {
    @Input()
    queries: IEntityQuery[] = [];

    columns: { field: string; header: string }[] = [{ field: "full", header: "toString()" }];
}
