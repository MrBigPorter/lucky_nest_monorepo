import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { framerMotionMock } from '../mocks/view-helpers';

// ── hoisted mock variables ────────────────────────────────────────
const mockRouterPush = vi.hoisted(() => vi.fn());
const mockLogin = vi.hoisted(() => vi.fn());
const mockAddToast = vi.hoisted(() => vi.fn());
const mockAuthLogin = vi.hoisted(() => vi.fn());

// ── mocks ────────────────────────────────────────────────────────
vi.mock('framer-motion', () => framerMotionMock);
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockRouterPush }),
}));
vi.mock('@/store/useAuthStore', () => ({
  useAuthStore: (sel: (s: { login: typeof mockLogin }) => unknown) =>
    sel({ login: mockLogin }),
}));
vi.mock('@/store/useToastStore', () => ({
  useToastStore: (sel: (s: { addToast: typeof mockAddToast }) => unknown) =>
    sel({ addToast: mockAddToast }),
}));
vi.mock('@/api', () => ({
  authApi: { login: mockAuthLogin },
}));

// ── subject ──────────────────────────────────────────────────────
import { Login } from '@/views/Login';

describe('Login page', () => {
  beforeEach(() => vi.clearAllMocks());

  it('renders username and password inputs', () => {
    render(<Login />);
    expect(screen.getByPlaceholderText('Username')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Password')).toBeInTheDocument();
  });

  it('renders Sign In button', () => {
    render(<Login />);
    expect(
      screen.getByRole('button', { name: /sign in/i }),
    ).toBeInTheDocument();
  });

  it('shows validation errors when submitting empty form', async () => {
    render(<Login />);
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));
    await waitFor(() =>
      expect(screen.getByText(/username is required/i)).toBeInTheDocument(),
    );
  });

  it('shows password length error for short password', async () => {
    const user = userEvent.setup();
    render(<Login />);
    await user.type(screen.getByPlaceholderText('Username'), 'admin');
    await user.type(screen.getByPlaceholderText('Password'), '123');
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));
    await waitFor(() =>
      expect(screen.getByText(/at least 6 characters/i)).toBeInTheDocument(),
    );
  });

  it('calls authApi.login with correct credentials on valid submit', async () => {
    mockAuthLogin.mockResolvedValue({ tokens: { accessToken: 'test-token' } });
    const user = userEvent.setup();
    render(<Login />);
    await user.type(screen.getByPlaceholderText('Username'), 'admin');
    await user.type(screen.getByPlaceholderText('Password'), 'password123');
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));
    await waitFor(() =>
      expect(mockAuthLogin).toHaveBeenCalledWith({
        username: 'admin',
        password: 'password123',
      }),
    );
  });

  it('stores token and redirects to / on success', async () => {
    mockAuthLogin.mockResolvedValue({ tokens: { accessToken: 'jwt-abc' } });
    const user = userEvent.setup();
    render(<Login />);
    await user.type(screen.getByPlaceholderText('Username'), 'admin');
    await user.type(screen.getByPlaceholderText('Password'), 'secret99');
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));
    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('jwt-abc');
      expect(mockAddToast).toHaveBeenCalledWith(
        'success',
        expect.stringContaining('Welcome'),
      );
      expect(mockRouterPush).toHaveBeenCalledWith('/');
    });
  });

  it('shows error toast on login failure (no access token)', async () => {
    mockAuthLogin.mockResolvedValue({ tokens: { accessToken: '' } });
    const user = userEvent.setup();
    render(<Login />);
    await user.type(screen.getByPlaceholderText('Username'), 'admin');
    await user.type(screen.getByPlaceholderText('Password'), 'badpass1');
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));
    await waitFor(() =>
      expect(mockAddToast).toHaveBeenCalledWith(
        'error',
        expect.stringContaining('No access token'),
      ),
    );
  });
});
