export type Outputter<T> = {
    output: (data: T) => void;
}
