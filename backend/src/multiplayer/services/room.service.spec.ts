import { Test, TestingModule } from '@nestjs/testing';
import {
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { RoomStatus } from '@prisma/client';
import { RoomService } from './room.service';
import { RoomRepository } from '../repositories/room.repository';
import { AuthService } from '../../auth/services/auth.service';
import { TrackPoolService } from './track-pool.service';

describe('RoomService', () => {
  let service: RoomService;

  const HOST_SESSION = 'session-host';
  const PLAYER_SESSION = 'session-player';
  const HOST_USER_ID = 'user-host';
  const PLAYER_USER_ID = 'user-player';
  const ROOM_ID = 'room-123';
  const INVITE_CODE = 'ABCD1234';

  const makeRoom = (overrides?: Record<string, unknown>) => ({
    id: ROOM_ID,
    inviteCode: INVITE_CODE,
    hostId: HOST_USER_ID,
    roundCount: 5,
    status: RoomStatus.WAITING,
    trackIds: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    startedAt: null,
    completedAt: null,
    players: [
      {
        id: 'player-1',
        roomId: ROOM_ID,
        userId: HOST_USER_ID,
        totalScore: 0,
        joinedAt: new Date(),
        user: { displayName: 'Host', avatarUrl: null },
      },
    ],
    ...overrides,
  });

  const mockAuthService = {
    getUserBySessionId: jest.fn(),
  };

  const mockRoomRepository = {
    createRoom: jest.fn(),
    findById: jest.fn(),
    findByInviteCode: jest.fn(),
    findPlayerInRoom: jest.fn(),
    addPlayer: jest.fn(),
    removePlayer: jest.fn(),
    updateStatus: jest.fn(),
    inviteCodeExists: jest.fn(),
  };

  const mockTrackPoolService = {
    selectTracksForRoom: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RoomService,
        { provide: AuthService, useValue: mockAuthService },
        { provide: RoomRepository, useValue: mockRoomRepository },
        { provide: TrackPoolService, useValue: mockTrackPoolService },
      ],
    }).compile();

    service = module.get<RoomService>(RoomService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createRoom', () => {
    it('should create a room and return RoomDto', async () => {
      mockAuthService.getUserBySessionId.mockResolvedValue({
        id: HOST_USER_ID,
      });
      mockRoomRepository.inviteCodeExists.mockResolvedValue(false);
      mockRoomRepository.createRoom.mockResolvedValue(makeRoom());

      const result = await service.createRoom(HOST_SESSION, { roundCount: 5 });

      expect(result.id).toBe(ROOM_ID);
      expect(result.hostId).toBe(HOST_USER_ID);
      expect(result.roundCount).toBe(5);
      expect(mockRoomRepository.createRoom).toHaveBeenCalledWith(
        HOST_USER_ID,
        expect.any(String),
        5,
      );
    });
  });

  describe('joinRoom', () => {
    it('should join a WAITING room', async () => {
      mockAuthService.getUserBySessionId.mockResolvedValue({
        id: PLAYER_USER_ID,
      });
      mockRoomRepository.findByInviteCode.mockResolvedValue(makeRoom());
      mockRoomRepository.findPlayerInRoom.mockResolvedValue(null);
      mockRoomRepository.addPlayer.mockResolvedValue({});
      mockRoomRepository.findById.mockResolvedValue(
        makeRoom({
          players: [
            {
              id: 'player-1',
              roomId: ROOM_ID,
              userId: HOST_USER_ID,
              totalScore: 0,
              joinedAt: new Date(),
              user: { displayName: 'Host', avatarUrl: null },
            },
            {
              id: 'player-2',
              roomId: ROOM_ID,
              userId: PLAYER_USER_ID,
              totalScore: 0,
              joinedAt: new Date(),
              user: { displayName: 'Player', avatarUrl: null },
            },
          ],
        }),
      );

      const result = await service.joinRoom(PLAYER_SESSION, INVITE_CODE);

      expect(result.players).toHaveLength(2);
      expect(mockRoomRepository.addPlayer).toHaveBeenCalledWith(
        ROOM_ID,
        PLAYER_USER_ID,
      );
    });

    it('should be idempotent when already in room', async () => {
      mockAuthService.getUserBySessionId.mockResolvedValue({
        id: HOST_USER_ID,
      });
      mockRoomRepository.findByInviteCode.mockResolvedValue(makeRoom());
      mockRoomRepository.findPlayerInRoom.mockResolvedValue({
        id: 'player-1',
      });

      const result = await service.joinRoom(HOST_SESSION, INVITE_CODE);

      expect(result.id).toBe(ROOM_ID);
      expect(mockRoomRepository.addPlayer).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException for invalid invite code', async () => {
      mockAuthService.getUserBySessionId.mockResolvedValue({
        id: PLAYER_USER_ID,
      });
      mockRoomRepository.findByInviteCode.mockResolvedValue(null);

      await expect(service.joinRoom(PLAYER_SESSION, 'INVALID')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw BadRequestException when room is PLAYING', async () => {
      mockAuthService.getUserBySessionId.mockResolvedValue({
        id: PLAYER_USER_ID,
      });
      mockRoomRepository.findByInviteCode.mockResolvedValue(
        makeRoom({ status: RoomStatus.PLAYING }),
      );

      await expect(
        service.joinRoom(PLAYER_SESSION, INVITE_CODE),
      ).rejects.toThrow(BadRequestException);
    });

    it('should uppercase the invite code', async () => {
      mockAuthService.getUserBySessionId.mockResolvedValue({
        id: PLAYER_USER_ID,
      });
      mockRoomRepository.findByInviteCode.mockResolvedValue(null);

      await expect(
        service.joinRoom(PLAYER_SESSION, 'abcd1234'),
      ).rejects.toThrow(NotFoundException);

      expect(mockRoomRepository.findByInviteCode).toHaveBeenCalledWith(
        'ABCD1234',
      );
    });
  });

  describe('startGame', () => {
    it('should let host start a WAITING room with track pooling', async () => {
      mockAuthService.getUserBySessionId.mockResolvedValue({
        id: HOST_USER_ID,
      });
      mockRoomRepository.findById.mockResolvedValue(makeRoom());
      mockTrackPoolService.selectTracksForRoom.mockResolvedValue([
        'track-1',
        'track-2',
        'track-3',
        'track-4',
        'track-5',
      ]);
      mockRoomRepository.updateStatus.mockResolvedValue(
        makeRoom({ status: RoomStatus.PLAYING }),
      );

      const result = await service.startGame(HOST_SESSION, ROOM_ID);

      expect(result.status).toBe(RoomStatus.PLAYING);
      expect(mockTrackPoolService.selectTracksForRoom).toHaveBeenCalledWith(
        [HOST_USER_ID],
        5,
      );
      expect(mockRoomRepository.updateStatus).toHaveBeenCalledWith(
        ROOM_ID,
        RoomStatus.PLAYING,
        {
          startedAt: expect.any(Date),
          trackIds: ['track-1', 'track-2', 'track-3', 'track-4', 'track-5'],
        },
      );
    });

    it('should throw ForbiddenException when non-host tries to start', async () => {
      mockAuthService.getUserBySessionId.mockResolvedValue({
        id: PLAYER_USER_ID,
      });
      mockRoomRepository.findById.mockResolvedValue(makeRoom());

      await expect(service.startGame(PLAYER_SESSION, ROOM_ID)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should throw BadRequestException when room is already PLAYING', async () => {
      mockAuthService.getUserBySessionId.mockResolvedValue({
        id: HOST_USER_ID,
      });
      mockRoomRepository.findById.mockResolvedValue(
        makeRoom({ status: RoomStatus.PLAYING }),
      );

      await expect(service.startGame(HOST_SESSION, ROOM_ID)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw NotFoundException for non-existent room', async () => {
      mockAuthService.getUserBySessionId.mockResolvedValue({
        id: HOST_USER_ID,
      });
      mockRoomRepository.findById.mockResolvedValue(null);

      await expect(
        service.startGame(HOST_SESSION, 'nonexistent'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('leaveRoom', () => {
    it('should expire room when host leaves', async () => {
      mockAuthService.getUserBySessionId.mockResolvedValue({
        id: HOST_USER_ID,
      });
      mockRoomRepository.findById.mockResolvedValue(makeRoom());

      await service.leaveRoom(HOST_SESSION, ROOM_ID);

      expect(mockRoomRepository.updateStatus).toHaveBeenCalledWith(
        ROOM_ID,
        RoomStatus.EXPIRED,
      );
      expect(mockRoomRepository.removePlayer).not.toHaveBeenCalled();
    });

    it('should remove player when non-host leaves', async () => {
      mockAuthService.getUserBySessionId.mockResolvedValue({
        id: PLAYER_USER_ID,
      });
      mockRoomRepository.findById.mockResolvedValue(
        makeRoom({
          players: [
            {
              id: 'player-1',
              roomId: ROOM_ID,
              userId: HOST_USER_ID,
              totalScore: 0,
              joinedAt: new Date(),
              user: { displayName: 'Host', avatarUrl: null },
            },
            {
              id: 'player-2',
              roomId: ROOM_ID,
              userId: PLAYER_USER_ID,
              totalScore: 0,
              joinedAt: new Date(),
              user: { displayName: 'Player', avatarUrl: null },
            },
          ],
        }),
      );

      await service.leaveRoom(PLAYER_SESSION, ROOM_ID);

      expect(mockRoomRepository.removePlayer).toHaveBeenCalledWith(
        ROOM_ID,
        PLAYER_USER_ID,
      );
      expect(mockRoomRepository.updateStatus).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when user is not in room', async () => {
      mockAuthService.getUserBySessionId.mockResolvedValue({
        id: 'stranger',
      });
      mockRoomRepository.findById.mockResolvedValue(makeRoom());

      await expect(
        service.leaveRoom('session-stranger', ROOM_ID),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
