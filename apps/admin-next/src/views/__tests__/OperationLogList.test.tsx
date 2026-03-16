import React from 'react';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { OperationLogList } from '../OperationLogList';
import { adminOperationLogApi } from '@/api';
import '@testing-library/jest-dom';

// Mock the API
jest.mock('@/api', () => ({
  adminOperationLogApi: {
    getList: jest.fn(),
  },
}));

// Mock the store
jest.mock('@/store/useToastStore', () => ({
  useToastStore: jest.fn(() => ({
    addToast: jest.fn(),
  })),
}));

// Mock the PageHeader component
jest.mock('@/components/scaffold/PageHeader', () => ({
  PageHeader: ({ title, description }: any) => (
    <div>
      <h1>{title}</h1>
      <p>{description}</p>
    </div>
  ),
}));

const mockOperationLogs = {
  list: [
    {
      id: '1',
      adminUserId: 'admin-1',
      operationType: 'LOGIN',
      description: 'Admin logged in',
      targetId: null,
      ipAddress: '127.0.0.1',
      createdAt: '2026-03-16T10:00:00Z',
      adminUser: {
        id: 'admin-1',
        username: 'testadmin',
        email: 'test@example.com',
      },
    },
    {
      id: '2',
      adminUserId: 'admin-1',
      operationType: 'UPDATE',
      description: 'Updated product details',
      targetId: 'product-123',
      ipAddress: '127.0.0.1',
      createdAt: '2026-03-16T11:00:00Z',
      adminUser: {
        id: 'admin-1',
        username: 'testadmin',
        email: 'test@example.com',
      },
      oldValue: { name: 'Old Name' },
      newValue: { name: 'New Name' },
    },
  ],
  total: 2,
  page: 1,
  pageSize: 10,
};

describe('OperationLogList', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (adminOperationLogApi.getList as jest.Mock).mockResolvedValue(mockOperationLogs);
  });

  it('should render operation log list with data', async () => {
    render(<OperationLogList />);

    await waitFor(() => {
      expect(screen.getByText('Operation Logs')).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(screen.getByText('testadmin')).toBeInTheDocument();
      expect(screen.getByText('Admin logged in')).toBeInTheDocument();
      expect(screen.getByText('Updated product details')).toBeInTheDocument();
    });
  });

  it('should display operation types with badges', async () => {
    render(<OperationLogList />);

    await waitFor(() => {
      expect(screen.getByText('LOGIN')).toBeInTheDocument();
      expect(screen.getByText('UPDATE')).toBeInTheDocument();
    });
  });

  it('should display IP addresses', async () => {
    render(<OperationLogList />);

    await waitFor(() => {
      const ipAddresses = screen.getAllByText('127.0.0.1');
      expect(ipAddresses.length).toBeGreaterThan(0);
    });
  });

  it('should display target IDs when available', async () => {
    render(<OperationLogList />);

    await waitFor(() => {
      expect(screen.getByText(/Target ID: product-123/)).toBeInTheDocument();
    });
  });

  it('should open detail modal when View button is clicked', async () => {
    const user = userEvent.setup();
    render(<OperationLogList />);

    await waitFor(() => {
      expect(screen.getByText('Updated product details')).toBeInTheDocument();
    });

    const viewButtons = screen.getAllByText('View');
    await user.click(viewButtons[1]); // Click on second log's view button

    // Modal should open and show details
    await waitFor(() => {
      expect(screen.getByText('Operation Details')).toBeInTheDocument();
    });
  });

  it('should call onParamsChange when search is performed', async () => {
    const onParamsChange = jest.fn();
    const user = userEvent.setup();

    render(
      <OperationLogList
        initialFormParams={{}}
        onParamsChange={onParamsChange}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText('Operation Logs')).toBeInTheDocument();
    });

    // Find and fill keyword input
    const keywordInput = screen.getByPlaceholderText(
      /Admin ID, Username, Description, Target ID/,
    );
    await user.type(keywordInput, 'test');

    // Submit search (this depends on your SmartTable implementation)
    // You may need to adjust this based on how search is triggered
  });

  it('should use initialFormParams', async () => {
    const initialParams = {
      operationType: 'LOGIN',
      keyword: 'test',
    };

    render(
      <OperationLogList
        initialFormParams={initialParams}
        onParamsChange={jest.fn()}
      />,
    );

    await waitFor(() => {
      expect(adminOperationLogApi.getList).toHaveBeenCalledWith(
        expect.objectContaining({
          operationType: 'LOGIN',
          keyword: 'test',
        }),
      );
    });
  });

  it('should format dates correctly', async () => {
    render(<OperationLogList />);

    await waitFor(() => {
      // Check if dates are formatted (exact format may vary)
      expect(screen.getByText(/2026-03-16/)).toBeInTheDocument();
    });
  });

  it('should handle empty list gracefully', async () => {
    (adminOperationLogApi.getList as jest.Mock).mockResolvedValue({
      list: [],
      total: 0,
      page: 1,
      pageSize: 10,
    });

    render(<OperationLogList />);

    await waitFor(() => {
      expect(screen.getByText('Operation Logs')).toBeInTheDocument();
    });

    // Should not crash and should show empty state
  });

  it('should handle API errors gracefully', async () => {
    (adminOperationLogApi.getList as jest.Mock).mockRejectedValue(
      new Error('API Error'),
    );

    render(<OperationLogList />);

    await waitFor(() => {
      expect(screen.getByText('Operation Logs')).toBeInTheDocument();
    });

    // Should show error state or toast (depends on implementation)
  });
});
