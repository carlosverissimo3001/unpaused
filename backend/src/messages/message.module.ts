import { Module } from "@nestjs/common";
import { MessageRepository } from "./message.repository";
import { MessageService } from "./message.service";
import { PrismaModule } from "../prisma/prisma.module";

@Module({
  imports: [PrismaModule],
  providers: [MessageRepository, MessageService],
  exports: [MessageService],
})
export class MessageModule { }