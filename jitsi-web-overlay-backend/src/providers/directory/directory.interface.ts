export interface IDirectory<T = any> {
  getDirectoryUsers(): Promise<T>;
}