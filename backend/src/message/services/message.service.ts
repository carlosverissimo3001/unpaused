import { Injectable } from '@nestjs/common';
import { MessageRepository } from '../repositories/message.repository';
import { Message } from '@prisma/client';
import { CreateMessageDto } from '../dto/create-message.dto';
import { UpdateMessageDto } from '../dto/update-message.dto';

@Injectable()
export class MessageService {
  constructor(private readonly messageRepository: MessageRepository) {}

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
