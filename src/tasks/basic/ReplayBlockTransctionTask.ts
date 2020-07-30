import { Block } from '../../interface/block';
import { ProgressManager } from '../../util/ProgressManager';
import { getTransactionObjectStore, getMaxTransaction, getBlockByHeight, getCacheBlockByHeight, getCacheTransactionsByHeight } from '../../util/IndexDBUtil'
import { Aborter } from '../../util/Aborter'
import { TransctionsInBlock } from '../../interface/transcation_in_block';
import { transactionVerify } from '../../util/Verify'
export class ReplayBlockTransactionTask {

    /**
     * 中断器
     */
    aborter: Aborter<unknown> = new Aborter();
    /**
     * 当前执行的promise
     */
    curPromise: Promise<unknown>;
    /**
     * 当前高度，指代当前验证的交易所在的区块高度
     */
    curHeight: number = 1;

    /**
     * 是否初始化进度
     */
    inited: boolean = false;

    /**
     * 重放事件
     */
    async verify(transactions: TransctionsInBlock[], block: Block) {
        console.log(`开始校验高度为${block.height}的交易`);
        let transObjectStore = await getTransactionObjectStore('MiniBlockChain02');
        const verifyStatus = transactionVerify(transactions, block);
        console.log('verifyStatus', verifyStatus);
        if (verifyStatus) {
            transactions.forEach(item => {
                transObjectStore.add(item)
            })
            // let cacheTransObjectStore = await getCacheTransactionObjectStore('MiniBlockChain02');
            // transactions.forEach(item => {
            //     cacheTransObjectStore.delete(item.height)
            // })
        } else {
            console.log(`高度为${block.height}的交易校验失败`);
            this.abort(`高度为${block.height}的交易校验失败`)
        }
    }

    /**
     * @TODO 1. 当前查找最大高度都是把全部数据加载进来，进行统计，这样是极其浪费内存的。(已解决) 
     * @TODO 2. 即使需要加载缓存的区块和交易，也应该是缓存部分数据，而不是全部加载进内存。(已解决)
     */
    async *replay() {
        do {
            // 当前最新已校验的交易
            let maxTransaction = await getMaxTransaction();
            if (!this.inited) {
                // 计算当前应校验的高度
                if (maxTransaction) {
                    let block = await getBlockByHeight(maxTransaction.height);
                    // 说明最新已校验交易尚未完成同步，等待其完成
                    if (block) {
                        this.curHeight = maxTransaction.height + 1;
                    }
                } else {
                    this.curHeight = 1
                }
                this.inited = true;
            } else {
                // 计算当前应校验的高度
                if (maxTransaction) {
                    let block = await getBlockByHeight(maxTransaction.height);
                    // 说明最新已校验交易尚未完成同步，等待其完成
                    if (!block || (block.numbersOfTransactions-1 !== maxTransaction.index)) {
                        continue;
                    }
                    this.curHeight = maxTransaction.height + 1;
                } else {
                    this.curHeight = 1
                }
            }
            
            // 当前高度对应的区块
            let curBlock = await getCacheBlockByHeight(this.curHeight)
            if (curBlock) {
                // 当前高度的交易
                let curHeightCacheTransactions = await getCacheTransactionsByHeight(this.curHeight);
                if (curHeightCacheTransactions.length === curBlock.numbersOfTransactions) {
                    // 当前高度的交易
                    this.curPromise = this.aborter.wrapAsync(this.verify(curHeightCacheTransactions, curBlock));
                    yield this.curPromise;
                }
            }
        } while(true)
    }

    /**中断任务 */
    abort(reason: string) {
        this.aborter.abort(this.curPromise, reason);
    }
}



