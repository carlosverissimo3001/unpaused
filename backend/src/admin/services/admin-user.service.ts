import { Injectable } from '@nestjs/common';
import { PrismaService } from '@prisma/prisma.service';
import { AdminUserDto } from '../dto/admin-user.dto';
import { UpdateUserRoleDto } from '../dto/update-user-role.dto';

@Injectable()
export class AdminUserService {
  constructor(private readonly prisma: PrismaService) {}

  // TODO: Move to a repo layer later
  async listUsers(): Promise<AdminUserDto[]> {
    const users = await this.prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return users.map(AdminUserDto.fromEntity);
  }

  async updateUserRole(
    userId: string,
    dto: UpdateUserRoleDto,
  ): Promise<AdminUserDto> {
    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: {
        ...(dto.isTrusted !== undefined && { isTrusted: dto.isTrusted }),
        ...(dto.isAdmin !== undefined && { isAdmin: dto.isAdmin }),
      },
    });

    return AdminUserDto.fromEntity(updated);
  }
}
