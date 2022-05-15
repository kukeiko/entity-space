import { NgModule } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { BrowserModule } from "@angular/platform-browser";
import { BrowserAnimationsModule } from "@angular/platform-browser/animations";
import { SliderModule } from "primeng/slider";
import { AppComponent } from "./app.component";

@NgModule({
    imports: [BrowserModule, BrowserAnimationsModule, FormsModule, SliderModule],
    declarations: [AppComponent],
    providers: [],
    bootstrap: [AppComponent],
})
export class AppModule {}
