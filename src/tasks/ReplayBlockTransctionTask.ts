import { Block } from '../interface/block';
import { ProgressManager } from '../util/ProgressManager';
import { getTransactionObjectStore } from '../util/IndexDBUtil'
import { Aborter } from '../util/Aborter'
import { TransctionsInBlock } from '../interface/transcation_in_block';
import { transactionVerify } from '../util/Verify'
export class ReplayBlockTransactionTask {
    /**
     * 区块存储空间操作对象
     */
    blockObjectStore:IDBObjectStore;
    /**
     * 区块缓存池
     */
    blockCache: Block[] = [];
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

    constructor(){
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
     * 区块交易验证（粗暴，md5方式）
     * @param transactions 区块内所有交易
     * @param block 区块头
     */
    verify(transactions: TransctionsInBlock[], block: Block){
        return transactionVerify(transactions, block);
    }

    /**
     * 重放事件
     */
    async replay(transactions: TransctionsInBlock[], block: Block) {
        let transObjectStore = await getTransactionObjectStore('MiniBlockChain02');
        const verifyStatus = this.verify(transactions, block);
        if (verifyStatus) {
            transactions.forEach(item => {
                transObjectStore.add(item)
            })
            return true
        }
        return false
    }


    /**中断任务 */
    abort(reason: string) {
        this.aborter.abort(this.curPromise, reason);
    }
}



