# Testing Documentation

## Overview

This project uses **Vitest** and **React Testing Library** for comprehensive unit and integration testing, following industry best practices.

## Testing Stack

- **Vitest**: Fast, modern testing framework built for Vite
- **React Testing Library**: Testing utilities for React components
- **@testing-library/jest-dom**: Custom matchers for better assertions
- **@testing-library/user-event**: User interaction simulation
- **jsdom**: Browser environment simulation

## Running Tests

### Basic Commands

```bash
# Run tests in watch mode (development)
npm test

# Run tests once (CI/CD)
npm run test:run

# Run tests with UI
npm run test:ui

# Generate coverage report
npm run test:coverage
```

### Test Coverage

Coverage reports are generated in the `coverage/` directory:
- **HTML Report**: `coverage/index.html` (open in browser)
- **LCOV Report**: `coverage/lcov.info` (for CI/CD tools)
- **JSON Report**: `coverage/coverage-final.json`

## Test Structure

### Directory Layout

Tests are organized in a separate `tests/` directory that mirrors the source code structure:

```
tests/                                # All test files
├── components/
│   ├── UI/
│   │   ├── Button.test.tsx          # Button component tests
│   │   └── Input.test.tsx           # Input component tests
│   └── Widgets/
│       └── (future widget tests)
├── utils/
│   ├── coordinateUtils.test.ts      # Coordinate utility tests
│   ├── shapeUtils.test.ts           # Shape utility tests
│   └── parseUtils.test.ts           # Parse utility tests
├── hooks/
│   └── (future hook tests)
└── setup/
    ├── setup.ts                      # Global test configuration
    └── test-utils.tsx                # Custom render helpers

src/                                  # Source code (no test files)
├── components/
│   ├── UI/
│   │   ├── Button.tsx
│   │   └── Input.tsx
│   └── Widgets/
├── utils/
│   ├── coordinateUtils.ts
│   ├── shapeUtils.ts
│   └── parseUtils.ts
└── hooks/
```

## Writing Tests

### Component Testing

```typescript
import { describe, it, expect, vi } from 'vitest';
import { renderWithProviders, screen, userEvent } from '../setup/test-utils';
import { Button } from '../../src/components/UI/Button';

describe('Button Component', () => {
  it('should render button with text', () => {
    renderWithProviders(<Button>Click me</Button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  it('should handle click events', async () => {
    const handleClick = vi.fn();
    const user = userEvent.setup();
    
    renderWithProviders(<Button onClick={handleClick}>Click</Button>);
    await user.click(screen.getByRole('button'));
    
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
```

### Utility Function Testing

```typescript
import { describe, it, expect } from 'vitest';
import { normalizeCoordinates } from '../../src/utils/coordinateUtils';

describe('normalizeCoordinates', () => {
  it('should normalize coordinates to 0-1 range', () => {
    const points = [{ x: 400, y: 300 }];
    const imageInfo = { width: 800, height: 600 };
    
    const normalized = normalizeCoordinates(points, imageInfo);
    
    expect(normalized[0]).toEqual({ x: 0.5, y: 0.5 });
  });
});
```

### Custom Hooks Testing

```typescript
import { renderHook, act } from '@testing-library/react';
import { useCanvas } from '../../src/hooks/useCanvas';

describe('useCanvas', () => {
  it('should update canvas state', () => {
    const { result } = renderHook(() => useCanvas());
    
    act(() => {
      result.current.setScale(2);
    });
    
    expect(result.current.canvasState.scale).toBe(2);
  });
});
```

## Testing Best Practices

### 1. Test Organization

- **Arrange-Act-Assert (AAA)**: Structure tests clearly
  ```typescript
  it('should update state', () => {
    // Arrange
    const initialValue = 0;
    
    // Act
    const result = increment(initialValue);
    
    // Assert
    expect(result).toBe(1);
  });
  ```

### 2. Use Semantic Queries

Prefer queries in this order:
1. `getByRole` - Best for accessibility
2. `getByLabelText` - Forms and inputs
3. `getByText` - Non-interactive elements
4. `getByTestId` - Last resort

```typescript
// ✅ Good
screen.getByRole('button', { name: 'Submit' });
screen.getByLabelText('Username');

// ❌ Avoid
screen.getByTestId('submit-button');
```

### 3. User-Centric Testing

Simulate real user interactions:
```typescript
const user = userEvent.setup();

// ✅ Good - simulates real user behavior
await user.type(input, 'hello');
await user.click(button);

// ❌ Avoid - implementation details
fireEvent.change(input, { target: { value: 'hello' } });
```

### 4. Mock External Dependencies

```typescript
import { vi } from 'vitest';

// Mock API calls
vi.mock('./api', () => ({
  fetchData: vi.fn(() => Promise.resolve({ data: [] }))
}));

// Mock DOM APIs
HTMLCanvasElement.prototype.getContext = vi.fn();
```

### 5. Test Isolation

Each test should be independent:
```typescript
beforeEach(() => {
  vi.clearAllMocks();
  cleanup();
});
```

### 6. Async Testing

Handle async operations properly:
```typescript
it('should load data', async () => {
  renderWithProviders(<DataComponent />);
  
  // Wait for element to appear
  const element = await screen.findByText('Data loaded');
  expect(element).toBeInTheDocument();
});
```

## Coverage Goals

- **Statements**: > 80%
- **Branches**: > 75%
- **Functions**: > 80%
- **Lines**: > 80%

### Coverage Exclusions

The following are excluded from coverage:
- `node_modules/`
- Test files (`*.test.ts`, `*.spec.ts`)
- Type definitions (`*.d.ts`)
- Configuration files
- Mock data

## Continuous Integration

Tests run automatically on:
- **Push**: to `main`, `develop`, `refactor` branches
- **Pull Requests**: targeting these branches

### CI Pipeline

1. **Lint Check**: ESLint validation
2. **Unit Tests**: All test suites
3. **Coverage Report**: Generated and uploaded
4. **Build Verification**: Production build

### Matrix Testing

Tests run on multiple Node.js versions:
- Node 18.x
- Node 20.x
- Node 22.x

## Debugging Tests

### Run Specific Test File

```bash
npm test -- Button.test.tsx
```

### Run Tests Matching Pattern

```bash
npm test -- -t "should render"
```

### Debug in VS Code

Add to `.vscode/launch.json`:
```json
{
  "type": "node",
  "request": "launch",
  "name": "Debug Tests",
  "runtimeExecutable": "npm",
  "runtimeArgs": ["test"],
  "console": "integratedTerminal"
}
```

### UI Mode for Debugging

```bash
npm run test:ui
```

Opens interactive UI at `http://localhost:51204/__vitest__/`

## Common Patterns

### Testing Forms

```typescript
it('should handle form submission', async () => {
  const user = userEvent.setup();
  const onSubmit = vi.fn();
  
  renderWithProviders(<Form onSubmit={onSubmit} />);
  
  await user.type(screen.getByLabelText('Email'), 'test@example.com');
  await user.click(screen.getByRole('button', { name: 'Submit' }));
  
  expect(onSubmit).toHaveBeenCalledWith({ email: 'test@example.com' });
});
```

### Testing Error States

```typescript
it('should display error message', async () => {
  const errorMessage = 'Something went wrong';
  
  renderWithProviders(<Component error={errorMessage} />);
  
  expect(screen.getByRole('alert')).toHaveTextContent(errorMessage);
});
```

### Testing Loading States

```typescript
it('should show loading spinner', () => {
  renderWithProviders(<Component isLoading={true} />);
  
  expect(screen.getByRole('status')).toBeInTheDocument();
  expect(screen.getByLabelText('Loading...')).toBeInTheDocument();
});
```

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/react)
- [Testing Library Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)
- [Jest DOM Matchers](https://github.com/testing-library/jest-dom)

## Contributing

When adding new features:
1. Write tests first (TDD approach recommended)
2. Ensure all tests pass: `npm run test:run`
3. Check coverage: `npm run test:coverage`
4. Maintain > 80% coverage
5. Add integration tests for user flows

