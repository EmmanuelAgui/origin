import { Block } from '../../interface/block';
import { ProgressManager } from '../../util/ProgressManager';
import { getBlockObjectStore, getCacheBlockObjectStore, getTransactionObjectStore, getMaxCacheBlock } from '../../util/IndexDBUtil'
import { Aborter } from '../../util/Aborter'
import { TransctionsInBlock } from '../../interface/transcation_in_block';
import md5 from 'md5';
export class ReplayBlockHeaderTask {
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

    /**
     * 当前同步的区块高度
     */
    curHeight: number;

    constructor(){
        this.progress = new ProgressManager(this.progressSymbol);
    }


    /**
     * 区块验证重放（粗暴，md5方式）
     * @param block 要重放的区块
     */
    async verify(block: Block, preBlock?: Block) {
        console.log(`开始校验高度为${block.height}的区块`)
        let cacheBlockObjectStore = await getCacheBlockObjectStore('MiniBlockChain02');
        let { height, nonce, previousBlockSignature } = block; 
        let signature = '';
        if (block.height === 1) {
            // 如果此区块为创始块
            // @TODO 做创世块检查
            signature = md5(`${height}${nonce}${previousBlockSignature}`);
        } else {
            // 当前区块中的previousBlockSignature签名与上一个区块签名对比
            if ((preBlock as Block).signature !== previousBlockSignature) {
                return false;
            }
            signature = md5(`${height}${nonce}${previousBlockSignature}`);
        }
        if (signature === block.signature) {
            // 删除缓存的区块
            cacheBlockObjectStore.delete(block.height)
            // 插入新区块
            let blockObjectStore = await getBlockObjectStore('MiniBlockChain02');
            blockObjectStore.add(block)
            
        }
    }

    async *replay() {
        do {
            // 获取本地缓存的未同步的最高区块
            let maxCacheBlock = await getMaxCacheBlock();
            if (maxCacheBlock) {
                // 获取本地已同步的最高区块
                let maxBlock = await this.getMaxBlock();
                if (maxBlock) {
                    if (maxBlock.height < maxCacheBlock.height) {
                        // 当前要同步的区块高度
                        this.curHeight = maxBlock.height + 1;
                        // 获取当前高度的缓存区块
                        let cacheBlock = await this.getCacheBlockByHeight(this.curHeight);
                        // 判断当前区块事件是否同步完成
                        let trans = await this.getTransactionsByHeight(this.curHeight);
                        if (trans.length === cacheBlock.numbersOfTransactions) {
                            yield this.verify(cacheBlock, maxBlock);
                        }
                    } 
                } else {
                    // 当前要同步的区块高度
                    this.curHeight = 1;
                    // 获取当前高度的缓存区块
                    let cacheBlock = await this.getCacheBlockByHeight(this.curHeight);
                    // 判断当前区块事件是否同步完成
                    let trans = await this.getTransactionsByHeight(this.curHeight);
                    if (trans.length === cacheBlock.numbersOfTransactions) {
                        yield this.verify(cacheBlock, maxBlock);
                    }
                }          
            }
              
        } while(true)
    }

    /**
     * 获取本地链上最高区块
     */
    async getMaxBlock() :Promise<Block | undefined>{
        let blockObjectStore = await getBlockObjectStore('MiniBlockChain02');
        return new Promise((resolve) => {
            let request = blockObjectStore.openCursor(null, 'prev');
            request.onsuccess = function() {
                let cursor = request.result!;
                if (cursor) {
                    resolve(cursor.value)
                } else {
                    resolve(undefined)
                }
                
            }
        })
    }


    /**
     * 根据高度获取缓存区块
     */
    async getCacheBlockByHeight(height: number) :Promise<Block>{
        let cacheBlockObjectStore = await getCacheBlockObjectStore('MiniBlockChain02');
        return new Promise((resolve) => {
            let request= cacheBlockObjectStore.get(height)
            request.onsuccess = (event) => {
                resolve(request.result)
            }
        })
    }

    /**
     * 获取某个高度已校验的交易
     */
    async getTransactionsByHeight(height: number) :Promise<TransctionsInBlock[]>{
        let transactionObjectStore = await getTransactionObjectStore('MiniBlockChain02');
        return new Promise((resolve) => {
            let request = transactionObjectStore.getAll();
            request.onsuccess = function(){
                let trans = request.result.filter(ele => ele.height === height);
                resolve(trans||[])              
            }
        })
    }

    /**中断任务 */
    abort(reason: string) {
        this.aborter.abort(this.curPromise, reason);
    }
}



