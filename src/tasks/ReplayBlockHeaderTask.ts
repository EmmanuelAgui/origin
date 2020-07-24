import { Block } from '../interface/block';
import { ProgressManager } from '../util/ProgressManager';
import { getBlockObjectStore } from '../util/IndexDBUtil'
import { Aborter } from '../util/Aborter'
import { TransctionsInBlock } from '../interface/transcation_in_block';
import md5 from 'md5';
export class ReplayBlockHeaderTask {
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
     * 区块验证重放（粗暴，md5方式）
     * @param block 要重放的区块
     */
    async replay(block: Block, preBlock: Block) {
        this.blockObjectStore = await getBlockObjectStore('MiniBlockChain02');
        let { height, nonce, previousBlockSignature } = block; 
        
        let signature = '';
        if (block.height === 1) {
            // 如果此区块为创始块
            // @TODO 做创世块检查
            signature = md5(`${height}${nonce}${previousBlockSignature}`);
        } else {
            // 当前区块中的previousBlockSignature签名与上一个区块签名对比
            console.log('preBlock', preBlock)
            if ((preBlock as Block).signature !== previousBlockSignature) {
                return false;
            }
            signature = md5(`${height}${nonce}${previousBlockSignature}`);
        }
        if (signature !== block.signature) {
            return false
        }
        this.blockObjectStore.add(block)
        return true;
    }


    async findBlockByHeight(height: number){
        this.blockObjectStore = await getBlockObjectStore('MiniBlockChain02');
        return new Promise((resolve) => {
            let request= this.blockObjectStore.get(height)
            request.onsuccess = (event) => {
                resolve(request.result)
            }
        })
    }

    /**中断任务 */
    abort(reason: string) {
        this.aborter.abort(this.curPromise, reason);
    }
}



