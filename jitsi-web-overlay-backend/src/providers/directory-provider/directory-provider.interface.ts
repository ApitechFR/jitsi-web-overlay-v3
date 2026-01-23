export interface DirectoryProvider<T = any> {
  getDirectory(): Promise<T>;
}