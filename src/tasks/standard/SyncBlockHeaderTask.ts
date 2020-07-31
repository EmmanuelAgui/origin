import { getMaxCacheBlock, getMaxBlockLocal, getBlockMaxHeight, findBlockByHeight} from '../../util/IndexDBUtil'
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
            this.blockMaxHeight = await getBlockMaxHeight();

            if (!this.inited) {
                // 获取本地已同步最大的区块
                let maxblockLocal = await getMaxBlockLocal();
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
                this.curPromise = this.aborter.wrapAsync(findBlockByHeight(this.curSyncHeight))
                this.curSyncHeight ++;
                yield this.curPromise;
            }
        } while (true)
    }


    /**中断任务 */
    abort(reason: string) {
        this.aborter.abort(this.curPromise, reason);
    }
}

export {SyncBlockHeaderTask}



