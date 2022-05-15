import { Component } from "@angular/core";
import { PrimeNGConfig } from "primeng/api";

@Component({
    selector: "entity-space-root",
    templateUrl: "./app.component.html",
    styleUrls: ["./app.component.scss"],
})
export class AppComponent {
    constructor(private primengConfig: PrimeNGConfig) {}

    ngOnInit(): void {
        this.primengConfig.ripple = true;
    }

    title = "examples-apps-music-box-ui";
    sliderValue = 7;
}
