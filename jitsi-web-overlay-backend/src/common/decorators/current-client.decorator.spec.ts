import { CurrentClient } from './current-client.decorator';

describe('CurrentClient Decorator', () => {
    it('should be importable and is a function', () => {
        expect(CurrentClient).toBeDefined();
        expect(typeof CurrentClient).toBe('function');
    });

    it('should return a decorator function when called', () => {
        const result = CurrentClient();
        expect(result).toBeDefined();
        expect(typeof result).toBe('function');
    });

    /**
     * Note: Full decorator testing is better done in E2E tests
     * with actual HTTP requests and controllers.
     * This decorator is tested via:
     * - ClientController E2E tests
     * - Integration tests with real ExecutionContext
     */
});
