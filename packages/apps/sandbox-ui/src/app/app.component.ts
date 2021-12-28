import { Component } from "@angular/core";
import { inRange, or } from "@entity-space/core";

@Component({
    selector: "entity-space-root",
    templateUrl: "./app.component.html",
    styleUrls: ["./app.component.scss"],
})
export class AppComponent {
    title = or([inRange(1, 7)]).toString();
}
