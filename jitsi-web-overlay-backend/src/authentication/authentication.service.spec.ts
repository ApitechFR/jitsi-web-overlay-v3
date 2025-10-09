import { Test, TestingModule } from '@nestjs/testing';
import { AuthenticationService } from './authentication.service';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';

describe('AuthenticationService', () => {
  let service: AuthenticationService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthenticationService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn(() => 'mocked'),
          },
        },
        {
          provide: HttpService,
          useValue: {
            axiosRef: {
              post: jest.fn(() =>
                Promise.resolve({
                  data: { access_token: 'token', id_token: 'idToken' },
                }),
              ),
              get: jest.fn(() =>
                Promise.resolve({ data: { email: 'test@test.com' } }),
              ),
            },
          },
        },
      ],
    }).compile();
    service = module.get<AuthenticationService>(AuthenticationService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('loginAuthorize should return a url', () => {
    const url = service.loginAuthorize('state', 'nonce');
    expect(url).toContain('state=state');
    expect(url).toContain('nonce=nonce');
  });

  it('loginCallback should throw if state mismatch', async () => {
    await expect(
      service.loginCallback('code', 'state1', 'state2'),
    ).rejects.toThrow();
  });

  it('loginCallback should return idToken and userinfo', async () => {
    const result = await service.loginCallback('code', 'state', 'state');
    expect(result).toHaveProperty('idToken', 'idToken');
    expect(result).toHaveProperty('userinfo');
  });

  it('logout should return a url', () => {
    const url = service.logout('state', 'idToken');
    expect(url).toContain('state=state');
    expect(url).toContain('id_token_hint=idToken');
  });
});
