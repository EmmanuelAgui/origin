
/**
 * 题目： 1.1 定义任务的规范与实现方式
 * 描述：现有两类任务，一种是预热任务，一种是执行任务。执行任务往往依赖于预热任务。
 * 请定义一种规范，可以让其它开发者基于这种规范编写以上两种任务，最终可以在后续开发的“多任务调度器”中执行。
 * 
 * 需求：1. 任务都有自己的进度
 *      2. 任务可以中途结束执行，也可以中途启动参与执行
 *      3. 任务可以互相唤醒
 */
 
// 需求分析：
// 1. 需要有一个异步迭代器队列
// 2. 需要有一个中断装置
// 3. 如果有任务依赖，将依赖的任务依次放入异步迭代器执行
// 4. 所谓唤醒，可以理解为重新生成一个迭代器

// 每一个任务可以作为一个迭代器，但相互依赖的多个任务可以放进同一个迭代器

import { EventEmitter } from '../util/EventEmitter'
import { SyncBlockHeaderTask } from '../tasks/SyncBlockHeaderTask';
import { SyncTransactionTask } from '../tasks/SyncBlockTransactionTask';
import { ReplayBlockTransactionTask } from '../tasks/ReplayBlockTransctionTask';
import { ReplayBlockHeaderTask } from '../tasks/ReplayBlockHeaderTask';
import { Block } from '../interface/block';
import { TransctionsInBlock } from '../interface/transcation_in_block'

export class TaskManagerSimple <T> extends EventEmitter{
    agList: AsyncGenerator[]; // 异步迭代器任务列表
    runningTaskList: Promise<T>[] = [];
    syncBlockHeaderTask: SyncBlockHeaderTask;
    syncTransactionTask: SyncTransactionTask;
    replayBlockTransactionTask: ReplayBlockTransactionTask;
    replayBlockHeaderTask: ReplayBlockHeaderTask
    // 最高区块高度
    static maxHeight = 616;
    // 当前缓存的区块长度
    curBlockCacheLength: number = 0;

    constructor() {
        super();
        this.syncBlockHeaderTask = new SyncBlockHeaderTask();
        this.syncTransactionTask = new SyncTransactionTask();
        this.replayBlockTransactionTask = new ReplayBlockTransactionTask();
        this.replayBlockHeaderTask = new ReplayBlockHeaderTask();
        this.init()
    }

    init() {
        // 注册启动（重启）下载区块头任务
        this.on('startSyncBlockHeaders', () => {
            this.blockSync()
        })

        // 注册启动下载区块事件
        this.on('startSyncTransactions', async (height: number, numbersOfTransactions: number) => {
            console.log('height', height)
            console.log('numbersOfTransactions', numbersOfTransactions)
            await this.transactionSync(height, numbersOfTransactions);
        })

        // 注册启动重放区块交易事件
        this.on('startReplayTransactions', async (transactions: TransctionsInBlock[], height: number) => {
            let block = await this.syncBlockHeaderTask.findBlockByHeight(height);
            // await this.transactionReplay(transactions, block as Block)
        })

        // 注册启动重放区块头事件
        this.on('startReplayBlockHeaders', async (block: Block, preBlock: Block) => {
            // await this.blockReplay(block, preBlock)
        })
        
        // 中断下载区块头任务
        this.on('abortSyncBlockHeaders', (reason: string) => {
            this.replayBlockHeaderTask.abort(reason)
        })
    }

    /**
     * 启动入口
     */
    async start() {
        this.emit('startSyncBlockHeaders')
    } 

    /**
     * 区块下载
     */
    async blockSync() {
        let synGen = this.syncBlockHeaderTask.sync();
        do {
            let res = await synGen.next();
            console.log('res in sync block', res);
            if (res.done) {
                break
            }
            let {height, numbersOfTransactions} = res.value as Block;
            this.emit('startSyncTransactions',height, numbersOfTransactions)
        } while (true);
    }

    /**
     * 区块交易下载
     * @param height 区块高度
     * @param numbersOfTransactions 当前区块交易数量
     */
    async transactionSync(height: number, numbersOfTransactions: number) {
        // let syTransGen = this.syncTransactionTask.sync(height, numbersOfTransactions);
        // do {
        //     let res = await syTransGen.next();
        //     console.log('res in sync transaction', res);
        //     if (res.done) {
        //         break
        //     }
        //     this.emit('startReplayTransactions', res.value, height)
        // } while (true);
        // let transactions = await this.syncTransactionTask.sync(height, numbersOfTransactions);
        // this.emit('startReplayTransactions', transactions, height)
    }

    /**
     * 交易验证重放
     * @param transatcions 要验证重放的交易
     * @param block 交易所在区块
     */
    // async transactionReplay(transatcions: TransctionsInBlock[], block: Block) {
    //     let replayTransactionRes = await this.replayBlockTransactionTask.replay(transatcions, block);
    //     console.log('replay transactions for block:', block)
    //     const preBlock = this.getBlockFromCacheByHeight(block.height-1)
    //     if (replayTransactionRes) {
    //        this.emit('startReplayBlockHeaders', block, preBlock)
    //     } else {
    //         this.emit('abortSyncBlockHeaders', `高度为${block.height}的区块交易校验失败`);
    //     }
    // }

    /**
     * 区块验证重放
     * @param block 要验证重放的区块
     */
    // async blockReplay(block: Block, preBlock: Block) {

    //     let replayBlockRes = await this.replayBlockHeaderTask.replay(block, preBlock)
    //     console.log('replay block:', block)
    //     if (!replayBlockRes) {
    //         this.emit('abortSyncBlockHeaders', `高度为${block.height}的区块重放失败`);
    //     }
    // }

    // getBlockFromCacheByHeight (height: number) {
    //     let index = this.syncBlockHeaderTask.blockCache.findIndex((item) => item.height === height)
    //     return this.syncBlockHeaderTask.blockCache[index];
    // }
}

