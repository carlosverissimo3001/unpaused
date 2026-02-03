import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { Message } from "@prisma/client";
import { CreateMessageDto } from "../game/dto/create-message.dto";
import { UpdateMessageDto } from "../game/dto/update-message.dto";

@Injectable()
export class MessageRepository {
    constructor(
        private readonly prismaService: PrismaService
    ) { }

    async create(params: CreateMessageDto): Promise<Message> {
        return await this.prismaService.message.create({
            data: params
        });
    }

    async findAll(): Promise<Message[]> {
        return await this.prismaService.message.findMany();
    }

    async update(id: string, params: UpdateMessageDto): Promise<Message> {
        return await this.prismaService.message.update({
            where: { id },
            data: params
        });
    }

    async delete(id: string): Promise<void> {
        await this.prismaService.message.delete({
            where: { id }
        });
    }
}