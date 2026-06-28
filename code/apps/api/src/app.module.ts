import { Module } from "@nestjs/common";
import { AppController } from "./app.controller";
import { DatabaseService } from "./database.service";
import { ReadService } from "./read.service";

@Module({
  controllers: [AppController],
  providers: [DatabaseService, ReadService]
})
export class AppModule {}
