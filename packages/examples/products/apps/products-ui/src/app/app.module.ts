import { HttpClientModule } from "@angular/common/http";
import { NgModule } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { BrowserModule } from "@angular/platform-browser";
import { AppComponent } from "./app.component";
import { ProductEntitySource } from "./entity-sources/product.entity-source";

@NgModule({
    declarations: [AppComponent],
    imports: [BrowserModule, HttpClientModule, FormsModule],
    providers: [ProductEntitySource],
    bootstrap: [AppComponent],
})
export class AppModule {}
