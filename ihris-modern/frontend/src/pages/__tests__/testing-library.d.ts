declare module "@testing-library/react" {
  export function render(ui: any): any;
  export const screen: any;
  export const fireEvent: any;
}

declare module "@testing-library/jest-dom" {
  export {};
}

declare module "vitest" {
  export function describe(name: string, fn: () => void): void;
  export function it(name: string, fn: () => void | Promise<void>): void;
  export function expect(actual: any): any;
  export const vi: any;
  export function beforeEach(fn: () => void): void;
  export interface Assertion<T> {
    toBeInTheDocument(): void;
    toHaveBeenCalledWith(...args: any[]): void;
    toBeDefined(): void;
  }
}
