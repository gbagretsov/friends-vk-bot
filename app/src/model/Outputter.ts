export type Outputter<T> = {
    output: (data: T) => Promise<void>;
}
