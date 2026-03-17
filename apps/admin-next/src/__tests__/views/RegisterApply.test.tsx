import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { framerMotionMock } from '../mocks/view-helpers';

// ── hoisted mocks ─────────────────────────────────────────────────
const mockSubmit = vi.hoisted(() => vi.fn());
const mockExecuteRecaptcha = vi.hoisted(() => vi.fn());

vi.mock('framer-motion', () => framerMotionMock);

vi.mock('next/link', () => ({
  default: ({
    href,
    children,
    ...rest
  }: React.PropsWithChildren<{ href: string; className?: string }>) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

vi.mock('react-google-recaptcha-v3', () => ({
  useGoogleReCaptcha: () => ({
    executeRecaptcha: mockExecuteRecaptcha,
  }),
}));

vi.mock('@/api', () => ({
  applicationApi: { submit: mockSubmit },
}));

// @/components/UIComponents — stub Button + Input
vi.mock('@/components/UIComponents', () => {
  /* eslint-disable @typescript-eslint/no-unused-vars */
  const Button = ({
    children,
    onClick,
    type,
    isLoading,
    disabled,
    variant: _variant,
    size: _size,
    className: _className,
    ...rest
  }: React.PropsWithChildren<{
    onClick?: () => void;
    type?: 'button' | 'submit' | 'reset';
    isLoading?: boolean;
    disabled?: boolean;
    variant?: string;
    size?: string;
    className?: string;
  }>) => (
    <button
      type={type ?? 'button'}
      onClick={onClick}
      disabled={disabled || isLoading}
      {...rest}
    >
      {isLoading ? 'Loading…' : children}
    </button>
  );

  const Input = React.forwardRef(
    (
      {
        error,
        className: _className,
        ...props
      }: React.InputHTMLAttributes<HTMLInputElement> & {
        error?: string;
        className?: string;
      },
      ref: React.Ref<HTMLInputElement>,
    ) => (
      <div>
        <input ref={ref} {...props} />
        {error && <span role="alert">{error}</span>}
      </div>
    ),
  );
  /* eslint-enable @typescript-eslint/no-unused-vars */
  Input.displayName = 'Input';

  return { Button, Input };
});

// ── subject ───────────────────────────────────────────────────────
import { RegisterApply } from '@/views/RegisterApply';

// ── helpers ───────────────────────────────────────────────────────
async function fillValidForm(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByPlaceholderText(/desired username/i), 'john_doe');
  await user.type(screen.getByPlaceholderText(/full name/i), 'John Doe');
  await user.type(
    screen.getByPlaceholderText(/email address/i),
    'john@company.com',
  );
  await user.type(screen.getByPlaceholderText(/password \(min/i), 'Pass1234');
  await user.type(screen.getByPlaceholderText(/confirm password/i), 'Pass1234');
}

describe('RegisterApply view', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockExecuteRecaptcha.mockResolvedValue('mock-recaptcha-token');
  });

  // ── rendering ──────────────────────────────────────────────────

  it('renders all required form fields', () => {
    render(<RegisterApply />);
    expect(
      screen.getByPlaceholderText(/desired username/i),
    ).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/full name/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/email address/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/password \(min/i)).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText(/confirm password/i),
    ).toBeInTheDocument();
  });

  it('renders Submit Application button', () => {
    render(<RegisterApply />);
    expect(
      screen.getByRole('button', { name: /submit application/i }),
    ).toBeInTheDocument();
  });

  it('renders "Back to Sign In" link pointing to /login', () => {
    render(<RegisterApply />);
    // Only shown in success screen; we check the "Sign in" link at bottom of form instead
    const link = screen.getByRole('link', { name: /sign in/i });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', '/login');
  });

  // ── validation ────────────────────────────────────────────────

  it('shows validation errors on empty submit', async () => {
    render(<RegisterApply />);
    fireEvent.click(
      screen.getByRole('button', { name: /submit application/i }),
    );
    await waitFor(() => {
      const alerts = screen.getAllByRole('alert');
      expect(alerts.length).toBeGreaterThan(0);
    });
  });

  it('shows error when username contains special characters', async () => {
    const user = userEvent.setup();
    render(<RegisterApply />);
    await user.type(
      screen.getByPlaceholderText(/desired username/i),
      'bad user!',
    );
    fireEvent.click(
      screen.getByRole('button', { name: /submit application/i }),
    );
    await waitFor(() =>
      expect(
        screen.getByText(/only.*letters|underscores/i),
      ).toBeInTheDocument(),
    );
  });

  it('shows error when username is too short', async () => {
    const user = userEvent.setup();
    render(<RegisterApply />);
    await user.type(screen.getByPlaceholderText(/desired username/i), 'ab');
    fireEvent.click(
      screen.getByRole('button', { name: /submit application/i }),
    );
    await waitFor(() =>
      expect(screen.getByText(/at least 3 characters/i)).toBeInTheDocument(),
    );
  });

  it('shows error when password has no number', async () => {
    const user = userEvent.setup();
    render(<RegisterApply />);
    await user.type(
      screen.getByPlaceholderText(/password \(min/i),
      'OnlyLetters',
    );
    await user.click(screen.getByPlaceholderText(/confirm password/i)); // blur
    await waitFor(() =>
      expect(
        screen.getByText(/letter and a number|must contain/i),
      ).toBeInTheDocument(),
    );
  });

  it('shows error when passwords do not match', async () => {
    const user = userEvent.setup();
    render(<RegisterApply />);
    await user.type(screen.getByPlaceholderText(/password \(min/i), 'Pass1234');
    await user.type(
      screen.getByPlaceholderText(/confirm password/i),
      'Pass9999',
    );
    fireEvent.click(
      screen.getByRole('button', { name: /submit application/i }),
    );
    await waitFor(() =>
      expect(screen.getByText(/do not match/i)).toBeInTheDocument(),
    );
  });

  it('shows error for disposable-style email (client-side format check)', async () => {
    const user = userEvent.setup();
    render(<RegisterApply />);
    await user.type(
      screen.getByPlaceholderText(/email address/i),
      'notanemail',
    );
    fireEvent.click(
      screen.getByRole('button', { name: /submit application/i }),
    );
    await waitFor(() =>
      expect(screen.getByText(/invalid email/i)).toBeInTheDocument(),
    );
  });

  // ── successful submission ─────────────────────────────────────

  it('calls applicationApi.submit with correct payload on valid form', async () => {
    mockSubmit.mockResolvedValue({ message: 'ok', id: 'app-1' });
    const user = userEvent.setup();
    render(<RegisterApply />);
    await fillValidForm(user);
    fireEvent.click(
      screen.getByRole('button', { name: /submit application/i }),
    );
    await waitFor(() =>
      expect(mockSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          username: 'john_doe',
          realName: 'John Doe',
          email: 'john@company.com',
          password: 'Pass1234',
          recaptchaToken: 'mock-recaptcha-token',
        }),
      ),
    );
  });

  it('shows success screen after successful submission', async () => {
    mockSubmit.mockResolvedValue({
      message: 'Application submitted',
      id: 'app-1',
    });
    const user = userEvent.setup();
    render(<RegisterApply />);
    await fillValidForm(user);
    fireEvent.click(
      screen.getByRole('button', { name: /submit application/i }),
    );
    await waitFor(() =>
      expect(screen.getByText(/application submitted/i)).toBeInTheDocument(),
    );
    // Form should be gone, success state visible
    expect(
      screen.queryByPlaceholderText(/desired username/i),
    ).not.toBeInTheDocument();
    // "Back to Sign In" link in success screen
    expect(
      screen.getByRole('link', { name: /back to sign in/i }),
    ).toBeInTheDocument();
  });

  it('executes reCAPTCHA with action "admin_apply" before submit', async () => {
    mockSubmit.mockResolvedValue({ message: 'ok', id: 'app-1' });
    const user = userEvent.setup();
    render(<RegisterApply />);
    await fillValidForm(user);
    fireEvent.click(
      screen.getByRole('button', { name: /submit application/i }),
    );
    await waitFor(() => expect(mockSubmit).toHaveBeenCalled());
    expect(mockExecuteRecaptcha).toHaveBeenCalledWith('admin_apply');
  });

  // ── server error ──────────────────────────────────────────────

  it('shows server error message on API failure', async () => {
    mockSubmit.mockRejectedValue({
      response: { data: { message: 'Username is already taken' } },
    });
    const user = userEvent.setup();
    render(<RegisterApply />);
    await fillValidForm(user);
    fireEvent.click(
      screen.getByRole('button', { name: /submit application/i }),
    );
    await waitFor(() =>
      expect(
        screen.getByText(/username is already taken/i),
      ).toBeInTheDocument(),
    );
  });

  it('shows server error message when API returns array of messages', async () => {
    mockSubmit.mockRejectedValue({
      response: {
        data: {
          message: ['email must be valid', 'username too short'],
        },
      },
    });
    const user = userEvent.setup();
    render(<RegisterApply />);
    await fillValidForm(user);
    fireEvent.click(
      screen.getByRole('button', { name: /submit application/i }),
    );
    await waitFor(() =>
      expect(
        screen.getByText(/email must be valid, username too short/i),
      ).toBeInTheDocument(),
    );
  });
});
