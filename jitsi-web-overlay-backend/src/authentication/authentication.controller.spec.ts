import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { IConferenceService } from '../conference/interfaces/conference-service.interface';
import { HttpModule } from '@nestjs/axios';
import { AuthenticationService } from './authentication.service';
import { Test, TestingModule } from '@nestjs/testing';
import { AuthenticationController } from './authentication.controller';

// Mocks
const mockAuthenticationService = {
  loginAuthorize: jest.fn(() => 'mock-url'),
  loginCallback: jest.fn(() => ({
    userinfo: { email: 'test@test.com' },
    idToken: 'idToken',
  })),
  logout: jest.fn(() => 'logout-url'),
};
const mockConferenceService = {
  whereami: jest.fn((elt: string) => elt),
  sendToken: jest.fn(() => ({ roomName: 'room', jwt: 'jwt' })),
};
const mockJwtService = {
  sign: jest.fn(() => 'signed-token'),
  decode: jest.fn(() => ({ email: 'test@test.com', idToken: 'idToken' })),
  verify: jest.fn(() => true),
};
const mockConfigService = {
  get: jest.fn(() => 'mocked'),
};

describe('AuthenticationController', () => {
  let controller: AuthenticationController;
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [HttpModule],
      controllers: [AuthenticationController],
      providers: [
        {
          provide: AuthenticationService,
          useValue: mockAuthenticationService,
        },
        {
          provide: IConferenceService,
          useValue: mockConferenceService,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    controller = module.get<AuthenticationController>(AuthenticationController);
  });

  it('whereami should return the user region header', () => {
    expect(controller.whereami('internet')).toEqual('internet');
  });

  it('loginAuthorize should return a redirect url', () => {
    // Mock response
    const response: any = { cookie: jest.fn() };
    const result = controller.loginAuthorize(response, 'room1');
    expect(result).toHaveProperty('url', 'mock-url');
    expect(response.cookie).toHaveBeenCalledWith(
      'state',
      expect.any(String),
      expect.any(Object),
    );
    expect(response.cookie).toHaveBeenCalledWith(
      'roomName',
      'room1',
      expect.any(Object),
    );
  });

  it('loginCallback should return roomName, jwt and accessToken', async () => {
    const request: any = {
      signedCookies: { state: 'state', roomName: 'room' },
    };
    const response: any = { clearCookie: jest.fn(), cookie: jest.fn() };
    const query = { code: 'code', state: 'state' };
    const result = await controller.loginCallback(query, request, response);
    expect(result).toHaveProperty('roomName', 'room');
    expect(result).toHaveProperty('jwt', 'jwt');
    expect(result).toHaveProperty('accessToken', 'signed-token');
    expect(response.clearCookie).toHaveBeenCalledWith('state');
    expect(response.clearCookie).toHaveBeenCalledWith('roomName');
    expect(response.cookie).toHaveBeenCalledWith(
      'refreshToken',
      'signed-token',
      expect.any(Object),
    );
  });

  it('logout should return a redirect url', () => {
    const request: any = { signedCookies: { refreshToken: 'refreshToken' } };
    const response: any = { cookie: jest.fn() };
    const result = controller.logout(request, response);
    expect(result).toHaveProperty('url', 'logout-url');
    expect(response.cookie).toHaveBeenCalledWith(
      'state',
      expect.any(String),
      expect.any(Object),
    );
  });

  it('logoutCallback should return root url if state matches', () => {
    const request: any = { signedCookies: { state: 'abc' } };
    const response: any = { clearCookie: jest.fn() };
    const query = { state: 'abc' };
    const result = controller.logoutCallback(query, request, response);
    expect(result).toHaveProperty('url', '/');
    expect(response.clearCookie).toHaveBeenCalledWith('refreshToken');
    expect(response.clearCookie).toHaveBeenCalledWith('state');
  });

  it('logoutCallback should throw if state does not match', () => {
    const request: any = { signedCookies: { state: 'abc' } };
    const response: any = { clearCookie: jest.fn() };
    const query = { state: 'def' };
    expect(() => controller.logoutCallback(query, request, response)).toThrow();
  });

  it('refreshToken should return accessToken', async () => {
    const request: any = { signedCookies: { refreshToken: 'refreshToken' } };
    const response: any = { cookie: jest.fn() };
    const result = await controller.refreshToken(request, response);
    expect(result).toHaveProperty('accessToken', 'signed-token');
    expect(response.cookie).toHaveBeenCalledWith(
      'refreshToken',
      'signed-token',
      expect.any(Object),
    );
  });

  it('refreshToken should throw if verify fails', async () => {
    mockJwtService.verify.mockImplementationOnce(() => {
      throw new Error('fail');
    });
    const request: any = { signedCookies: { refreshToken: 'refreshToken' } };
    const response: any = { cookie: jest.fn() };
    await expect(controller.refreshToken(request, response)).rejects.toThrow();
  });
});
