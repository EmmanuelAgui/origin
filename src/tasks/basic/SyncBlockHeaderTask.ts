import { Block } from '../../interface/block';
import { getBlockObjectStore, getCacheBlockObjectStore, getMaxCacheBlock } from '../../util/IndexDBUtil'
import { Aborter } from '../../util/Aborter'
class SyncBlockHeaderTask {
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

    /**
     * 是否初始化进度
     */
    inited: boolean = false;


    /**
     * 区块下载
     * @param start 开始区块高度
     * @param end 结束区块高度
     */
    async *sync(){
        // 设置下载的总进度
        do {
            // 重新获取链上最大区块高度
            this.blockMaxHeight = await this.getBlockMaxHeight();

            if (!this.inited) {
                // 获取本地已同步最大的区块
                let maxblockLocal = await this.getMaxBlockLocal();
                // 获取缓存的本地区块
                let maxCacheBlock = await getMaxCacheBlock();
                // 如果本地有已同步区块
                if (maxblockLocal) {
                    if (maxCacheBlock) {
                        this.curSyncHeight = maxCacheBlock.height + 1;
                    } else {
                        this.curSyncHeight = maxblockLocal.height + 1;
                    }
                }
                this.inited =  true;
            }
           
            // 如果当前区块高度小于最大区块高度，则继续下载
            if (this.curSyncHeight <= this.blockMaxHeight) {
                console.log(`开始下载区块高度为${this.curSyncHeight}的区块`)
                this.curPromise = this.aborter.wrapAsync(this.findBlockByHeight(this.curSyncHeight))
                this.curSyncHeight ++;
                yield this.curPromise;
            }
        } while (true)
    }

    /**
     * 获取最大区块高度
     */
    async getBlockMaxHeight() : Promise<number>{
        let blockObjectStore = await getBlockObjectStore('MiniBlockChain01');
        return new Promise((resolve) => {
            let request = blockObjectStore.getAllKeys();
            request.onsuccess = () => {
                resolve(request.result.length);
            }
        })
    }

     /**
     * 获取本地已同步最大的区块
     */
    async getMaxBlockLocal() :Promise<Block | undefined>{
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
     * 根据高度查找区块
     * @param height 区块高度
     */
    async findBlockByHeight(height: number){
        let blockObjectStore = await getBlockObjectStore('MiniBlockChain01');
        return new Promise((resolve) => {
            let request= blockObjectStore.get(height)
            request.onsuccess = async () => {
                // this.blockCache.push(request.result);
                let cacheBlockObjectStore = await getCacheBlockObjectStore('MiniBlockChain02');
                cacheBlockObjectStore.add(request.result);
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



