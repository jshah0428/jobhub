import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import JobForm from './JobForm';

const ACCESS_TOKEN = 'test-token';

const baseProps = {
  mode: 'create',
  job: undefined,
  accessToken: ACCESS_TOKEN,
  onClose: jest.fn(),
  onSaved: jest.fn(),
};

beforeEach(() => {
  jest.clearAllMocks();
  global.fetch = jest.fn(() =>
    Promise.resolve({
      ok: true,
      json: () => Promise.resolve({ id: 'new-job', title: 'Engineer', company: 'Acme' }),
    })
  );
  process.env.REACT_APP_BACKEND_URL = 'http://localhost:8000';
});

afterEach(() => {
  delete process.env.REACT_APP_BACKEND_URL;
});

// --- Rendering ---

test('renders create form with all fields', () => {
  render(<JobForm {...baseProps} />);

  expect(screen.getByRole('dialog')).toBeInTheDocument();
  expect(screen.getByText('Add Job Application')).toBeInTheDocument();
  expect(screen.getByLabelText(/job title/i)).toBeInTheDocument();
  expect(screen.getByLabelText(/company/i)).toBeInTheDocument();
  expect(screen.getByLabelText(/location/i)).toBeInTheDocument();
  expect(screen.getByLabelText(/status/i)).toBeInTheDocument();
  expect(screen.getByLabelText(/applied date/i)).toBeInTheDocument();
  expect(screen.getByLabelText(/job description/i)).toBeInTheDocument();
  expect(screen.getByLabelText(/notes/i)).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /add job/i })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
});

test('renders edit form with pre-filled values', () => {
  const job = {
    id: 'job-1',
    title: 'Software Engineer',
    company: 'Acme Corp',
    location: 'Remote',
    status: 'interview',
    applied_date: '2026-03-15',
    description: 'Build cool things',
    notes: 'Call on Monday',
  };

  render(<JobForm {...baseProps} mode="edit" job={job} />);

  expect(screen.getByText('Edit Application')).toBeInTheDocument();
  expect(screen.getByDisplayValue('Software Engineer')).toBeInTheDocument();
  expect(screen.getByDisplayValue('Acme Corp')).toBeInTheDocument();
  expect(screen.getByDisplayValue('Remote')).toBeInTheDocument();
  expect(screen.getByDisplayValue('Interview')).toBeInTheDocument();
  expect(screen.getByDisplayValue('2026-03-15')).toBeInTheDocument();
  expect(screen.getByDisplayValue('Build cool things')).toBeInTheDocument();
  expect(screen.getByDisplayValue('Call on Monday')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /save changes/i })).toBeInTheDocument();
});

test('status dropdown contains all expected options', () => {
  render(<JobForm {...baseProps} />);
  const select = screen.getByLabelText(/status/i);
  const options = Array.from(select.options).map((o) => o.value);
  expect(options).toEqual(
    expect.arrayContaining(['interested', 'applied', 'interview', 'offer', 'rejected', 'archived'])
  );
});

// --- Validation ---

test('shows validation errors when submitting empty required fields', async () => {
  render(<JobForm {...baseProps} />);
  fireEvent.click(screen.getByRole('button', { name: /add job/i }));

  await waitFor(() => {
    expect(screen.getByText(/job title is required/i)).toBeInTheDocument();
    expect(screen.getByText(/company is required/i)).toBeInTheDocument();
  });

  expect(global.fetch).not.toHaveBeenCalled();
});

test('clears field error when user types', async () => {
  render(<JobForm {...baseProps} />);
  fireEvent.click(screen.getByRole('button', { name: /add job/i }));

  await waitFor(() => {
    expect(screen.getByText(/job title is required/i)).toBeInTheDocument();
  });

  await userEvent.type(screen.getByLabelText(/job title/i), 'Engineer');

  await waitFor(() => {
    expect(screen.queryByText(/job title is required/i)).not.toBeInTheDocument();
  });
});

// --- Create submit ---

test('POSTs to /jobs on create and calls onSaved + onClose', async () => {
  render(<JobForm {...baseProps} />);

  await userEvent.type(screen.getByLabelText(/job title/i), 'Frontend Engineer');
  await userEvent.type(screen.getByLabelText(/company/i), 'TechCo');

  fireEvent.click(screen.getByRole('button', { name: /add job/i }));

  await waitFor(() => {
    expect(global.fetch).toHaveBeenCalledWith(
      'http://localhost:8000/jobs',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          Authorization: `Bearer ${ACCESS_TOKEN}`,
          'Content-Type': 'application/json',
        }),
      })
    );
  });

  const body = JSON.parse(global.fetch.mock.calls[0][1].body);
  expect(body.title).toBe('Frontend Engineer');
  expect(body.company).toBe('TechCo');

  await waitFor(() => {
    expect(baseProps.onSaved).toHaveBeenCalledTimes(1);
    expect(baseProps.onClose).toHaveBeenCalledTimes(1);
  });
});

// --- Edit submit ---

test('PUTs to /jobs/:id on edit and calls onSaved + onClose', async () => {
  const job = {
    id: 'job-42',
    title: 'Old Title',
    company: 'Old Corp',
    location: '',
    status: 'applied',
    applied_date: null,
    description: '',
    notes: '',
  };

  render(<JobForm {...baseProps} mode="edit" job={job} />);

  const titleInput = screen.getByLabelText(/job title/i);
  await userEvent.clear(titleInput);
  await userEvent.type(titleInput, 'New Title');

  fireEvent.click(screen.getByRole('button', { name: /save changes/i }));

  await waitFor(() => {
    expect(global.fetch).toHaveBeenCalledWith(
      'http://localhost:8000/jobs/job-42',
      expect.objectContaining({ method: 'PUT' })
    );
  });

  const body = JSON.parse(global.fetch.mock.calls[0][1].body);
  expect(body.title).toBe('New Title');

  await waitFor(() => {
    expect(baseProps.onSaved).toHaveBeenCalledTimes(1);
    expect(baseProps.onClose).toHaveBeenCalledTimes(1);
  });
});

// --- API error ---

test('shows API error message when request fails', async () => {
  global.fetch = jest.fn(() =>
    Promise.resolve({
      ok: false,
      status: 500,
      text: () => Promise.resolve('Internal Server Error'),
    })
  );

  render(<JobForm {...baseProps} />);

  await userEvent.type(screen.getByLabelText(/job title/i), 'Engineer');
  await userEvent.type(screen.getByLabelText(/company/i), 'Acme');

  fireEvent.click(screen.getByRole('button', { name: /add job/i }));

  await waitFor(() => {
    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveTextContent('Internal Server Error');
  });

  expect(baseProps.onClose).not.toHaveBeenCalled();
});

// --- Close behavior ---

test('calls onClose when cancel button clicked', () => {
  render(<JobForm {...baseProps} />);
  fireEvent.click(screen.getByRole('button', { name: /cancel/i }));
  expect(baseProps.onClose).toHaveBeenCalledTimes(1);
});

test('calls onClose when X button clicked', () => {
  render(<JobForm {...baseProps} />);
  fireEvent.click(screen.getByRole('button', { name: /close form/i }));
  expect(baseProps.onClose).toHaveBeenCalledTimes(1);
});

test('calls onClose when Escape key pressed', () => {
  render(<JobForm {...baseProps} />);
  fireEvent.keyDown(document, { key: 'Escape' });
  expect(baseProps.onClose).toHaveBeenCalledTimes(1);
});

test('calls onClose when clicking outside the modal', () => {
  render(<JobForm {...baseProps} />);
  fireEvent.click(screen.getByRole('dialog'));
  expect(baseProps.onClose).toHaveBeenCalledTimes(1);
});
