import { TestBed } from "@angular/core/testing";
import { MusicAppComponent } from "./music-box-app.component";

describe("MusicAppComponent", () => {
    beforeEach(async () => {
        await TestBed.configureTestingModule({ declarations: [MusicAppComponent] }).compileComponents();
    });

    it("should create the app", () => {
        const fixture = TestBed.createComponent(MusicAppComponent);
        const app = fixture.componentInstance;
        expect(app).toBeTruthy();
    });

    // it(`should have as title 'examples-apps-music-box-ui'`, () => {
    //     const fixture = TestBed.createComponent(AppComponent);
    //     const app = fixture.componentInstance;
    //     expect(app.title).toEqual("examples-apps-music-box-ui");
    // });

    // it("should render title", () => {
    //     const fixture = TestBed.createComponent(AppComponent);
    //     fixture.detectChanges();
    //     const compiled = fixture.nativeElement as HTMLElement;
    //     expect(compiled.querySelector("h1")?.textContent).toContain("Welcome examples-apps-music-box-ui");
    // });
});
