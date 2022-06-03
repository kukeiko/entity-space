import { HttpClientModule } from "@angular/common/http";
import { NgModule } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { MatButtonModule } from "@angular/material/button";
import { MatCheckboxModule } from "@angular/material/checkbox";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { MatTableModule } from "@angular/material/table";
import { BrowserModule } from "@angular/platform-browser";
import { BrowserAnimationsModule } from "@angular/platform-browser/animations";
import { CommonModelSchemaCatalog } from "@entity-space/examples/libs/common-model";
import { ProductsSchemaCatalog } from "@entity-space/examples/libs/products-model";
import { AppComponent } from "./app.component";
import { BrandEntitySource } from "./entity-sources/brand.entity-source";
import { ProductEntitySource } from "./entity-sources/product.entity-source";
import { UserEntitySource } from "./entity-sources/user.entity-source";

@NgModule({
    declarations: [AppComponent],
    imports: [
        BrowserAnimationsModule,
        BrowserModule,
        FormsModule,
        HttpClientModule,
        MatButtonModule,
        MatCheckboxModule,
        MatFormFieldModule,
        MatInputModule,
        MatTableModule,
    ],
    providers: [
        ProductEntitySource,
        BrandEntitySource,
        UserEntitySource,
        // [todo] custom provider because we don't yet have @Injectable() in client/server shared model lib
        { provide: ProductsSchemaCatalog, useClass: ProductsSchemaCatalog },
        { provide: CommonModelSchemaCatalog, useClass: CommonModelSchemaCatalog },
    ],
    bootstrap: [AppComponent],
})
export class AppModule {}
