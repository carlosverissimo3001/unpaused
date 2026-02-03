import { Injectable } from "@nestjs/common";
import { MessageRepository } from "./message.repository";
import { Message } from "@prisma/client";
import { CreateMessageDto } from "../game/dto/create-message.dto";
import { UpdateMessageDto } from "../game/dto/update-message.dto";

@Injectable()
export class MessageService {
    constructor(
        private readonly messageRepository: MessageRepository
    ) { }

    async create(params: CreateMessageDto): Promise<Message> {
        return await this.messageRepository.create(params);
    }

    async findAll(): Promise<Message[]> {
        return await this.messageRepository.findAll();
    }

    async update(id: string, params: UpdateMessageDto): Promise<Message> {
        return await this.messageRepository.update(id, params);
    }

    async delete(id: string): Promise<void> {
        await this.messageRepository.delete(id);
    }
}