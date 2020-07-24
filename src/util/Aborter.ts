/**
 * Aborter 任务中断器
 * 通过对任务（promise）进行封装，使其具有异常情况下的中断功能
 */

import { PromiseOut } from './PromiseOut'

interface TaskWrap<T> {
    task: PromiseOut<T>, 
    promise: Promise<unknown>
}

export class Aborter<T> {
    // waitTasksMap: Map<Symbol, TaskWrap<T>> = new Map();
    waitTaskWeakMap: WeakMap<Promise<unknown>, PromiseOut<T>> = new WeakMap();

    // 为promise封装一层中断器
    wrapAsync(promise: Promise<unknown>) {
        let task = new PromiseOut<T>();
        let wrapedPromise = Promise.race([task.promise, promise])
        // this.waitTasksMap.set(lable, { task: task, promise: wrapedPromise});
        this.waitTaskWeakMap.set(wrapedPromise,task);
        return wrapedPromise
    }

    async *wrapAsyncGenerator(asyncGen: AsyncGenerator){
        do {
            const item:any = await this.wrapAsync(asyncGen.next())
            if (item.done) {
                break;
            }
            yield item.value;
        } while(true)
    }


    // 根据lable中断promise
    // abort(lable: Symbol, reason?: string) {
    //     // this.waitTasksMap.get(lable)!.task.reject(reason)
    //     this.waitTasksMap.delete(lable)
    // }

    // 中断当前执行的任务
    abort(promise:Promise<T>, reason: string){
        this.waitTaskWeakMap.get(promise)!.reject(reason)
        // this.waitTaskWeakMap.delete(promise);
    }

}