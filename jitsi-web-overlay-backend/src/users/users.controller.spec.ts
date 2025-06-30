import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

const mockUserService = {
  createUser: jest.fn(),
  findAll: jest.fn(),
  findOne: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
};

describe('UserController', () => {
  let controller: UsersController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useValue: mockUserService,
        },
      ],
    }).compile();

    controller = module.get<UsersController>(UsersController);
    controller = module.get<UsersController>(UsersController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  const userData = {
    id: 1,
    username: 'testuser',
    email: 'test@example.com',
    password: 'password123',
    admin: false,
  };

  describe('createUser', () => {
    it('should create and return a new user', async () => {
      mockUserService.createUser.mockResolvedValue(userData);

      const result = await controller.createUser(userData);

      expect(mockUserService.createUser).toHaveBeenCalledWith(userData);
      expect(result).toEqual(userData);
    });
  });
  describe('findAll', () => {
    it('should return all users', async () => {
      const users = [
        {
          id: 1,
          username: 'user1',
          email: 'user1@example.com',
          password: 'password1',
          admin: false,
        },
        {
          id: 2,
          username: 'user2',
          email: 'user2@example.com',
          password: 'password2',
          admin: true,
        },
      ];

      mockUserService.findAll.mockResolvedValue(users);

      const result = await controller.getAllUser();

      expect(mockUserService.findAll).toHaveBeenCalled();
      expect(result).toEqual(users);
    });
  });

  describe('findOne', () => {
    it('should return a user by id', async () => {
      mockUserService.findOne.mockResolvedValue(userData);

      const result = await controller.getUserById(1);

      expect(mockUserService.findOne).toHaveBeenCalledWith(1);
      expect(result).toEqual(userData);
    });
  });

  describe('update', () => {
    it('should update and return the updated user', async () => {
      const updatedUser = {
        id: 1,
        username: 'updateduser',
        email: 'updated@example.com',
        password: 'password123',
        admin: false,
      };

      mockUserService.update.mockResolvedValue(updatedUser);

      const result = await controller.update(1, { username: 'updateduser' });

      expect(mockUserService.update).toHaveBeenCalledWith(1, {
        username: 'updateduser',
      });
      expect(result).toEqual(updatedUser);
    });
  });

  describe('delete', () => {
    it('should delete a user by id', async () => {
      mockUserService.delete.mockResolvedValue(undefined);

      await expect(controller.delete(1)).resolves.not.toThrow();
      expect(mockUserService.delete).toHaveBeenCalledWith(1);
    });
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
