import { Block } from '../interface/block';
import { ProgressManager } from '../util/ProgressManager';
import { getBlockObjectStore } from '../util/IndexDBUtil'
import { Aborter } from '../util/Aborter'
import { ResolvePlugin } from 'webpack';
class SyncBlockHeaderTask {
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

    /**
     * 当前下载高度
     */
    curSyncHeight: number = 1;
    
    /**
     * 最大区块高度
     */
    blockMaxHeight: number = 0;

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
     * 区块下载
     * @param start 开始区块高度
     * @param end 结束区块高度
     */
    async *sync(){
        // 设置下载的总进度
        do {
            // 重新获取最大区块高度
            this.blockMaxHeight = await this.getBlockMaxHeight();
            // 保存总进度
            this.progress.total = this.blockMaxHeight;
            // 如果当前区块高度小于最大区块高度，则继续下载
            if (this.curSyncHeight <= this.blockMaxHeight) {
                this.curPromise = this.aborter.wrapAsync(this.findBlockByHeight(this.curSyncHeight))
                this.curSyncHeight ++;
                this.progress.buffer = this.curSyncHeight;
                yield this.curPromise;
            }
        } while (true)
    }

    /**
     * 获取最大区块高度
     */
    async getBlockMaxHeight() : Promise<number>{
        this.blockObjectStore = await getBlockObjectStore('MiniBlockChain01');
        return new Promise((resolve) => {
            let request = this.blockObjectStore.getAllKeys();
            request.onsuccess = () => {
                resolve(request.result.length);
            }
        })
    }

    /**
     * 根据高度查找区块
     * @param height 区块高度
     */
    async findBlockByHeight(height: number){
        this.blockObjectStore = await getBlockObjectStore('MiniBlockChain01');
        return new Promise((resolve) => {
            let request= this.blockObjectStore.get(height)
            request.onsuccess = (event) => {
                this.blockCache.push(request.result);
                resolve(request.result)
            }
        })
    }

    /**中断任务 */
    abort(reason: string) {
        this.aborter.abort(this.curPromise, reason);
    }
}

export {SyncBlockHeaderTask}



