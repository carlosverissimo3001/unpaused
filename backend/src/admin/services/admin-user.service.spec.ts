import { Test, TestingModule } from '@nestjs/testing';
import { AdminUserService } from './admin-user.service';
import { PrismaService } from '@prisma/prisma.service';

describe('AdminUserService', () => {
  let service: AdminUserService;

  const mockUsers = [
    {
      id: 'user-1',
      spotifyUserId: 'spotify-1',
      displayName: 'Alice',
      avatarUrl: 'https://example.com/alice.jpg',
      encryptedRefreshToken: 'secret-token',
      isTrusted: false,
      isAdmin: true,
      createdAt: new Date('2025-01-01'),
      updatedAt: new Date('2025-06-01'),
      streakFreezes: 2,
      answeredQuestionIds: ['q1'],
    },
    {
      id: 'user-2',
      spotifyUserId: 'spotify-2',
      displayName: 'Bob',
      avatarUrl: null,
      encryptedRefreshToken: null,
      isTrusted: true,
      isAdmin: false,
      createdAt: new Date('2025-03-01'),
      updatedAt: new Date('2025-06-01'),
      streakFreezes: 0,
      answeredQuestionIds: [],
    },
  ];

  const mockPrisma = {
    user: {
      findMany: jest.fn().mockResolvedValue(mockUsers),
      update: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminUserService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<AdminUserService>(AdminUserService);
    jest.clearAllMocks();
  });

  describe('listUsers', () => {
    it('should return all users mapped to AdminUserDto', async () => {
      mockPrisma.user.findMany.mockResolvedValue(mockUsers);

      const result = await service.listUsers();

      expect(mockPrisma.user.findMany).toHaveBeenCalledWith({
        orderBy: { createdAt: 'desc' },
      });
      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        id: 'user-1',
        spotifyUserId: 'spotify-1',
        displayName: 'Alice',
        avatarUrl: 'https://example.com/alice.jpg',
        isTrusted: false,
        isAdmin: true,
        createdAt: mockUsers[0].createdAt,
        updatedAt: mockUsers[0].updatedAt,
      });
      // Sensitive fields should not be present
      expect(result[0]).not.toHaveProperty('encryptedRefreshToken');
      expect(result[0]).not.toHaveProperty('streakFreezes');
    });

    it('should return avatarUrl as undefined when null', async () => {
      mockPrisma.user.findMany.mockResolvedValue(mockUsers);

      const result = await service.listUsers();

      expect(result[1].avatarUrl).toBeUndefined();
    });
  });

  describe('updateUserRole', () => {
    it('should update isTrusted flag', async () => {
      const updatedUser = { ...mockUsers[1], isTrusted: false };
      mockPrisma.user.update.mockResolvedValue(updatedUser);

      const result = await service.updateUserRole('user-2', {
        isTrusted: false,
      });

      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-2' },
        data: { isTrusted: false },
      });
      expect(result.isTrusted).toBe(false);
    });

    it('should update isAdmin flag', async () => {
      const updatedUser = { ...mockUsers[1], isAdmin: true };
      mockPrisma.user.update.mockResolvedValue(updatedUser);

      const result = await service.updateUserRole('user-2', {
        isAdmin: true,
      });

      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-2' },
        data: { isAdmin: true },
      });
      expect(result.isAdmin).toBe(true);
    });

    it('should update both flags at once', async () => {
      const updatedUser = {
        ...mockUsers[1],
        isTrusted: true,
        isAdmin: true,
      };
      mockPrisma.user.update.mockResolvedValue(updatedUser);

      const result = await service.updateUserRole('user-2', {
        isTrusted: true,
        isAdmin: true,
      });

      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-2' },
        data: { isTrusted: true, isAdmin: true },
      });
      expect(result.isTrusted).toBe(true);
      expect(result.isAdmin).toBe(true);
    });

    it('should not include undefined fields in update data', async () => {
      mockPrisma.user.update.mockResolvedValue(mockUsers[0]);

      await service.updateUserRole('user-1', {});

      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: {},
      });
    });
  });
});
