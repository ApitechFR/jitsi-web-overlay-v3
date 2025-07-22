import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { Repository } from 'typeorm';
import { User } from './entities/users.entity';
import { getRepositoryToken } from '@nestjs/typeorm';
import { InternalServerErrorException } from '@nestjs/common';

const mockUserRepository = {
  create: jest.fn(),
  save: jest.fn(),
  find: jest.fn(),
  findOne: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
};

describe('UserService', () => {
  let service: UsersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepository,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    service = module.get<UsersService>(UsersService);
  });
  afterEach(() => {
    jest.clearAllMocks();
  });

  const userData = {
    id: 1,
    username: 'testuser',
    email: 'test@test.com',
    password: '1234',
    admin: false,
    created_at: new Date(),
    update_at: new Date(),
  };

  describe('createUser', () => {
    it('should create and return a new user', async () => {
      mockUserRepository.create.mockReturnValue(userData);
      mockUserRepository.save.mockResolvedValue(userData);

      const result = await service.createUser(userData);

      expect(mockUserRepository.create).toHaveBeenCalledWith(userData);
      expect(mockUserRepository.save).toHaveBeenCalledWith(userData);
      expect(result).toEqual(userData);
    });

    it('should throw an error if user creation fails', async () => {
      mockUserRepository.save.mockRejectedValue(
        new InternalServerErrorException(),
      );

      await expect(service.createUser({})).rejects.toThrow(
        new InternalServerErrorException(),
      );
    });
  });

  describe('findAll', () => {
    it('should return all users', async () => {
      const users = [
        {
          id: 1,
          username: 'user1',
          email: 'user1@test.com',
          password: '1234',
          admin: false,
        },
        {
          id: 2,
          username: 'user2',
          email: 'user2@test.com',
          password: '5678',
          admin: true,
        },
      ];

      mockUserRepository.find.mockResolvedValue(users);

      const result = await service.findAll();

      expect(mockUserRepository.find).toHaveBeenCalled();
      expect(result).toEqual(users);
    });

    it('should throw an error if finding users fails', async () => {
      mockUserRepository.find.mockRejectedValue(
        new InternalServerErrorException(),
      );

      await expect(service.findAll()).rejects.toThrow(
        new InternalServerErrorException(),
      );
    });
  });

  describe('findOne', () => {
    it('should return a user by id', async () => {
      mockUserRepository.findOne.mockResolvedValue(userData);

      const result = await service.findOne(1);

      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
      });
      expect(result).toEqual(userData);
    });

    it('should throw an error if finding user fails', async () => {
      mockUserRepository.findOne.mockRejectedValue(new Error());

      await expect(service.findOne(1)).rejects.toThrow(
        new InternalServerErrorException('Cannot find user'),
      );
    });
  });

  describe('update', () => {
    it('should update and return the updated user', async () => {
      const updatedUser = { ...userData, username: 'updateduser' };

      mockUserRepository.update.mockResolvedValue(null);
      mockUserRepository.findOne.mockResolvedValue(updatedUser);

      const result = await service.update(1, { username: 'updateduser' });

      expect(mockUserRepository.update).toHaveBeenCalledWith(1, {
        username: 'updateduser',
      });
      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
      });
      expect(result).toEqual(updatedUser);
    });

    it('should throw an error if update fails', async () => {
      mockUserRepository.update.mockRejectedValue(new Error());

      await expect(service.update(1, {})).rejects.toThrow(
        new InternalServerErrorException('Cannot update user'),
      );
    });
  });

  describe('delete', () => {
    it('should delete a user by id', async () => {
      mockUserRepository.delete.mockResolvedValue(null);

      await expect(service.delete(1)).resolves.not.toThrow();
      expect(mockUserRepository.delete).toHaveBeenCalledWith(1);
    });

    it('should throw an error if delete fails', async () => {
      mockUserRepository.delete.mockRejectedValue(new Error());

      await expect(service.delete(1)).rejects.toThrow(
        new InternalServerErrorException('Cannot delete user'),
      );
    });
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
