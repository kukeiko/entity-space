import { Module } from "@nestjs/common";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { DiskDbService } from "./disk-db.service";

@Module({
    imports: [],
    controllers: [AppController],
    providers: [AppService, DiskDbService],
})
export class AppModule {}
