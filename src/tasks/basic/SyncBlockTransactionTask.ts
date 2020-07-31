import { Block } from '../../interface/block';
import { getTransactionObjectStore, getCacheBlockObjectStore, getCacheTransactionObjectStore, getMaxCacheBlock, getMaxCacheTransaction, getMaxBlockLocal } from '../../util/IndexDBUtil'
import { Aborter } from '../../util/Aborter'
export class SyncTransactionTask {

    /**
     * 当前高度，指代当前下载的交易所在的区块高度
     */
    curHeight: number = 1;
    /**
     * 中断器
     */
    aborter: Aborter<unknown> = new Aborter();
    /**
     * 当前执行的promise
     */
    curPromise: Promise<unknown>;
    /**
     * 是否初始化进度
     */
    inited: boolean = false;
    
   

    /**
     * 交易下载
     * @param height 对应高度的区块
     * @param numbersOfTransactions 区块交易的数量
     */
    async *sync() {
        do {
            // 获取本地缓存的区块
            let cacheBlocks = await this.getCacheBlocks();
            // 1. 首先看已同步的区块的高度， 已同步的区块高度以下就不用下载了
            // 2. 看本地已经下载的交易的高度，如果高于已同步的区块高度，再看已经下载的区块的高度，如果小于已经下载的区块的高度，继续下载，如果相等，等待
            // 本地链上最高区块
            let localMaxBlock = await getMaxBlockLocal();
            // 本地缓存最大交易
            let cacheMaxTransaction = await getMaxCacheTransaction();
            // 本地缓存最大区块
            let cacheMaxBlock = await getMaxCacheBlock();
            if (!this.inited) {
                if (localMaxBlock) { // 本地链上存在区块
                    if (cacheMaxTransaction) { // 本地已有缓存交易
                        if (cacheMaxTransaction.height < localMaxBlock.height) {
                            this.curHeight = localMaxBlock.height + 1;
                        } else {
                            if (cacheMaxBlock && cacheMaxTransaction.height <= cacheMaxBlock.height) {
                                this.curHeight = cacheMaxTransaction.height + 1;
                            } 
                        }
                    } else {
                        this.curHeight = localMaxBlock.height;
                    }
                } else { // 本地链上不存在区块
                    if (cacheMaxTransaction) { 
                        if (cacheMaxBlock && cacheMaxTransaction.height < cacheMaxBlock.height) {
                            this.curHeight = cacheMaxTransaction.height + 1;
                        } 
                    } else {
                        this.curHeight = 1;
                    }
                }
                this.inited = true;
            }
            
            // 如果本地缓存的最大区块存在，并且当前交易下载高度小于最大缓存区块的高度
            if (cacheMaxBlock && this.curHeight < cacheMaxBlock.height) {
                // 获取当前高度所对应缓存区块的index
                let curIndex = cacheBlocks.findIndex(block => block.height === this.curHeight)
                // 从当前index开始遍历缓存区块
                for (curIndex; curIndex < cacheBlocks.length; curIndex++) {
                    console.log(`开始下载区块高度为${this.curHeight}的区块交易`)
                    this.curPromise = this.aborter.wrapAsync(this.findTranscByHeight(cacheBlocks[curIndex].height));
                    this.curHeight++;
                    yield this.curPromise;
                }
            }            
        } while(true)
    }
    /**
     * 获取临时缓存的区块
     */
    async getCacheBlocks() :Promise<Block[]>{
        let cacheBlockObjectStore = await getCacheBlockObjectStore('MiniBlockChain02');
        return new Promise((resolve) => {
            let request = cacheBlockObjectStore.getAll();
            request.onsuccess = () => {
                resolve(request.result);
            }
        })
    }    

    // async findTranscByHeightV2(height: number, index: number){
    //     let transactionObjectStore = await getTransactionObjectStore('MiniBlockChain01');
    //     return new Promise((resolve) => {
    //         let request= transactionObjectStore.getAll();
    //         request.onsuccess = () => {
    //             let trans = request.result.filter(tran=> {
    //                 if(tran.height === height && tran.index === index) {
    //                     // this.progress.buffer += 1;
    //                     return tran;
    //                 }
    //             })
    //             resolve(trans)
    //         }
    //     })
    // }

    async findTranscByHeight(height: number){
        let transactionObjectStore = await getTransactionObjectStore('MiniBlockChain01');
        return new Promise((resolve) => {
            let request= transactionObjectStore.getAll();
            request.onsuccess = async () => {
                let cacheTransactionObjectStore = await getCacheTransactionObjectStore('MiniBlockChain02');
                let trans = request.result.filter(tran=> {
                    if(tran.height === height) {
                        // 缓存交易
                        cacheTransactionObjectStore.add(tran);
                        // this.progress.buffer += 1;
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



