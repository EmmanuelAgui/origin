import { Block } from '../interface/block';
import { ProgressManager } from '../util/ProgressManager';
import { getTransactionObjectStore } from '../util/IndexDBUtil'
import { Aborter } from '../util/Aborter'
export class SyncTransactionTask {
    /**
     * 区块存储空间操作对象
     */
    transactionObjectStore:IDBObjectStore;
    /**
     * 交易缓存池
     */
    transactionCache: Block[] = [];
    /**
     * 进度管理器
     */
    progress: ProgressManager;
    /**
     * 进度标识
     */
    progressSymbol: Symbol = Symbol();
    /**
     * 中断器
     */
    aborter: Aborter<unknown> = new Aborter();
    /**
     * 当前执行的promise
     */
    curPromise: Promise<unknown>;

    constructor() {
        this.progress = new ProgressManager(this.progressSymbol);
    }

    /**
     * 使用Aborter进行封装区块下载
     * @param start 开始区块高度
     * @param end 结束区块高度
     */
    // sync(start: number, end: number) {
    //     return this.aborter.wrapAsyncGenerator(this._sync(start, end));
    // }

    /**
     * 交易下载
     * @param height 对应高度的区块
     * @param numbersOfTransactions 区块交易的数量
     */
    async sync(height: number, numbersOfTransactions: number){
        // 设置下载的总进度
        // this.progress.total = numbersOfTransactions
        // 打开数据库
        // this.curPromise = this.aborter.wrapAsync(this.findTranscByHeight(height))
        // this.progress.buffer += 1 
        // yield this.curPromise;
        const transactions = await this.findTranscByHeight(height);
        return transactions;
    }


    async findTranscByHeight(height: number){
        this.transactionObjectStore = await getTransactionObjectStore('MiniBlockChain01');
        return new Promise((resolve) => {
            let request= this.transactionObjectStore.getAll();
            request.onsuccess = () => {
                let trans = request.result.filter(tran=> {
                    if(tran.height === height) {
                        this.transactionCache.push(tran);
                        this.progress.buffer += 1;
                        return tran;
                    }
                })
                resolve(trans)
            }
        })
    }

    /**中断任务 */
    abort(reason: string) {
        this.aborter.abort(this.curPromise, reason);
    }
}



