export class PromiseOut<T> {
    promise: Promise<T>;
    is_resolved = false;
    is_rejected = false;
    is_finished = false;
    value?: T;
    reason?: unknown;
    resolve!: (value?: T) => void;
    reject!: (reason: any) => void;
    constructor() {
        this.promise = new Promise<T>((resolve, reject)=>{
            this.resolve = (value?:T) => {
                this.is_resolved = true;
                this.is_finished = true;
                resolve(value);
            }
            this.reject = (reason: any) => {
                this.is_rejected = true;
                this.is_finished = true;
                reject(reason);
            }
        }).then(
            value=>(this.value = value),
            reason => {
                throw (this.reason = reason)
            }
        )
    }
   
}
