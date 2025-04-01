import { vi, describe, it, expect, beforeEach } from 'vitest';
import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Modal } from '../Modal';

describe('Modal Component', () => {
  const mockOnClose = vi.fn();

  beforeEach(() => {
    mockOnClose.mockClear();
  });

  it('renders children when open', () => {
    render(
      <Modal open={true} onClose={mockOnClose}>
        <div data-testid="modal-content">Test Content</div>
      </Modal>
    );
    
    expect(screen.getByTestId('modal-content')).toBeInTheDocument();
    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });

  it('does not render when closed', () => {
    render(
      <Modal open={false} onClose={mockOnClose}>
        <div data-testid="modal-content">Test Content</div>
      </Modal>
    );
    
    expect(screen.queryByTestId('modal-content')).not.toBeInTheDocument();
  });

  it('calls onClose when backdrop is clicked', async () => {
    const user = userEvent.setup();
    
    render(
      <Modal open={true} onClose={mockOnClose}>
        <div data-testid="modal-content">Test Content</div>
      </Modal>
    );
    
    // Find the backdrop (MUI adds a backdrop div with role="presentation")
    // Use { hidden: true } to find elements that are hidden from accessibility tree
    const modalElement = screen.getByRole('presentation', { hidden: true });
    const backdrop = modalElement.querySelector('.MuiBackdrop-root');
    expect(backdrop).toBeInTheDocument();
    
    // Click the backdrop
    await user.click(backdrop as HTMLElement);
    
    // Check if onClose was called
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });
});
