import { Module } from "@nestjs/common";
import { AppController } from "./app.controller";
import { DatabaseService } from "./database.service";
import { ReadService } from "./read.service";
import { WriteService } from "./write.service";

@Module({
  controllers: [AppController],
  providers: [DatabaseService, ReadService, WriteService]
})
export class AppModule {}
