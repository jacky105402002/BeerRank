import { Module } from "@nestjs/common";
import { AiMatchService } from "./ai-match.service";
import { AppController } from "./app.controller";
import { AuthService } from "./auth.service";
import { DatabaseService } from "./database.service";
import { ReadService } from "./read.service";
import { StorageService } from "./storage.service";
import { WriteService } from "./write.service";

@Module({
  controllers: [AppController],
  providers: [AiMatchService, AuthService, DatabaseService, ReadService, StorageService, WriteService]
})
export class AppModule {}
