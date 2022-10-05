import { enableProdMode } from "@angular/core";
import { platformBrowserDynamic } from "@angular/platform-browser-dynamic";
import { AppModule } from "./app/music-box-app.module";
import { environment } from "./environments/environment";

if (environment.production) {
    enableProdMode();
}

// [todo] added this little delay because UI sends request to API before it it can respond to it,
// causing an error that makes me have to refresh the page
setTimeout(() => {
    platformBrowserDynamic()
        .bootstrapModule(AppModule)
        .catch(err => console.error(err));
}, 1000);
