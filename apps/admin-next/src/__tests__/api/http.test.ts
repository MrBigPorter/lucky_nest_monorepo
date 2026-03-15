import {
  describe,
  it,
  expect,
  beforeAll,
  afterAll,
  afterEach,
  vi,
} from 'vitest';

import { http as mswHttp, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';

// ── mock stores ──────────────────────────────────────────────────
const mockAddToast = vi.fn();
vi.mock('@/store/useToastStore', () => ({
  useToastStore: { getState: () => ({ addToast: mockAddToast }) },
}));

// ── import HttpClient after mocks ────────────────────────────────
import { http } from '@/api/http';

// ── MSW server — 拦截真实网络层，与哪个 axios 实例无关 ─────────────
const server = setupServer();
beforeAll(() => server.listen({ onUnhandledRequest: 'bypass' }));
afterAll(() => server.close());
afterEach(() => {
  server.resetHandlers();
  mockAddToast.mockClear();
  localStorage.clear();
  // Must use a valid absolute URL as the base so that MSW's
  // toAbsoluteUrl(url, window.location.href) can resolve relative paths.
  Object.defineProperty(window, 'location', {
    writable: true,
    value: { pathname: '/', href: 'http://localhost/' },
  });
});

// ── 辅助：注册单次响应 ─────────────────────────────────────────────
function mockGet(path: string, body: object, status = 200) {
  server.use(mswHttp.get(path, () => HttpResponse.json(body, { status })));
}
function mockPost(path: string, body: object, status = 200) {
  server.use(mswHttp.post(path, () => HttpResponse.json(body, { status })));
}

// ═══════════════════════════════════════════════════════════════
// 基础
// ═══════════════════════════════════════════════════════════════
describe('http client — 基础', () => {
  it('实例存在', () => expect(http).toBeDefined());

  it('公共方法全部存在', () => {
    ['get', 'post', 'put', 'patch', 'delete', 'upload', 'download'].forEach(
      (m) => expect(typeof (http as any)[m]).toBe('function'),
    );
  });
});

// ═══════════════════════════════════════════════════════════════
// 成功响应
// ═══════════════════════════════════════════════════════════════
describe('http client — 成功响应', () => {
  it('GET 返回 data 字段', async () => {
    mockGet('http://localhost/api/users', {
      code: 10000,
      message: 'ok',
      data: [{ id: 1 }],
    });
    expect(await http.get('/users')).toEqual([{ id: 1 }]);
  });

  it('POST 返回 data 字段', async () => {
    mockPost('http://localhost/api/users', {
      code: 10000,
      message: 'ok',
      data: { id: 2 },
    });
    expect(await http.post('/users', { name: 'Bob' })).toEqual({ id: 2 });
  });

  it('code=200 也视为成功', async () => {
    mockGet('http://localhost/api/ping', {
      code: 200,
      message: 'ok',
      data: 'pong',
    });
    expect(await http.get('/ping')).toBe('pong');
  });
});

// ═══════════════════════════════════════════════════════════════
// 业务错误
// ═══════════════════════════════════════════════════════════════
describe('http client — 业务错误', () => {
  it('非 200/10000 code 时抛出并显示 toast', async () => {
    mockGet('http://localhost/api/forbidden', {
      code: 403,
      message: '没有权限',
      data: null,
    });
    await expect(http.get('/forbidden')).rejects.toBeDefined();
    expect(mockAddToast).toHaveBeenCalledWith('error', '没有权限');
  });

  it('业务 code=401 时清除 token 并跳转 /login', async () => {
    localStorage.setItem('auth_token', 'old-token');
    mockGet('http://localhost/api/secret', {
      code: 401,
      message: '未授权',
      data: null,
    });
    await expect(http.get('/secret')).rejects.toBeDefined();
    expect(localStorage.getItem('auth_token')).toBeNull();
    expect(window.location.href).toBe('/login');
  });
});

// ═══════════════════════════════════════════════════════════════
// HTTP 错误
// ═══════════════════════════════════════════════════════════════
describe('http client — HTTP 错误', () => {
  it('HTTP 500 时显示服务器错误 toast', async () => {
    server.use(
      mswHttp.get('http://localhost/api/crash', () =>
        // No `message` field → handleHttpError falls back to `服务器错误（500）`
        HttpResponse.json({ code: 500 }, { status: 500 }),
      ),
    );
    await expect(http.get('/crash')).rejects.toBeDefined();
    expect(mockAddToast).toHaveBeenCalledWith(
      'error',
      expect.stringContaining('服务器错误'),
    );
  });

  it('HTTP 401 时跳转 /login', async () => {
    server.use(
      mswHttp.get('http://localhost/api/me', () =>
        HttpResponse.json({ message: 'Unauthorized' }, { status: 401 }),
      ),
    );
    await expect(http.get('/me')).rejects.toBeDefined();
    expect(window.location.href).toBe('/login');
  });

  it('网络断开时显示网络错误 toast', async () => {
    server.use(
      mswHttp.get('http://localhost/api/offline', () => HttpResponse.error()),
    );
    await expect(http.get('/offline')).rejects.toBeDefined();
    expect(mockAddToast).toHaveBeenCalledWith('error', expect.any(String));
  });
});

// ═══════════════════════════════════════════════════════════════
// token 注入
// ═══════════════════════════════════════════════════════════════
describe('http client — token 注入', () => {
  it('有 token 时请求头带 Authorization', async () => {
    localStorage.setItem('auth_token', 'my-jwt');
    let capturedAuth = '';
    server.use(
      mswHttp.get('http://localhost/api/profile', ({ request }) => {
        capturedAuth = request.headers.get('Authorization') ?? '';
        return HttpResponse.json({
          code: 10000,
          data: { id: 1 },
          message: 'ok',
        });
      }),
    );
    await http.get('/profile');
    expect(capturedAuth).toBe('Bearer my-jwt');
  });

  it('无 token 时请求头无 Authorization', async () => {
    localStorage.removeItem('auth_token');
    let capturedAuth: string | null = 'present';
    server.use(
      mswHttp.get('http://localhost/api/open', ({ request }) => {
        capturedAuth = request.headers.get('Authorization');
        return HttpResponse.json({ code: 10000, data: 'ok', message: 'ok' });
      }),
    );
    await http.get('/open');
    expect(capturedAuth).toBeNull();
  });
});
