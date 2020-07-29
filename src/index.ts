'use strict'

let hello = 'Hello, mini blockchain';
document.getElementsByClassName('app')[0].innerHTML = hello;

import { MockData } from './mock_data';
import { Aborter } from './util/Aborter';
import { SyncBlockHeaderTask } from './tasks/SyncBlockHeaderTask'
import { SyncTransactionTask } from './tasks/SyncBlockTransactionTask'
// import { TaskManagerSimple } from './task_manager/TaskManagerSimple'
import { ReplayBlockTransactionTask } from './tasks/ReplayBlockTransctionTask';
import { ReplayBlockHeaderTask } from './tasks/ReplayBlockHeaderTask';
import { TaskManagerBasic } from './task_manager/TaskManagerBasic'

// -------------------------生成模拟数据 Start--------------------
// (async function(){
//     let mockData = new MockData();
//     // 初始化数据库
//     await mockData.init('MiniBlockChain01')
//     // 生成区块
//     await mockData.mockBlock();
//     // 生成交易
//     await mockData.mockTransaction(mockData.transactions)

//     let mockData2 = new MockData();
//     await mockData2.init('MiniBlockChain02')
// })()
// -------------------------生成模拟数据 end--------------------

// let syncTransactionTask = new SyncTransactionTask()

// (async function() {
//     let syncBlockHeaderTask = new SyncBlockHeaderTask()
//     let synGen = syncBlockHeaderTask.sync();
   
//     do {
//         let res = await synGen.next();
//         console.log('res in sync block----------------------------------', res.done);
//         if (res.done) {
//             break
//         }
//     } while (true);
//     setTimeout(()=>{
//         let mockData = new MockData();
//         mockData.mockOneBlock()
//     }, 10000)
   
// })()
// // let syncGen = syncBlockHeaderTask.sync(10,20);
// let synTraGen = syncTransactionTask.sync(20,100)
// async function run() {
//     do {
//         let res = await synTraGen.next();
//         console.log('res', res);
//         if (res.done) {
//             break
//         }
//     } while (true);
// }


// run();

// setTimeout(()=>{
//     // syncBlockHeaderTask.abort('终止')
//     console.log(syncTransactionTask.progress.buffer)
// }, 3000)

// let taskManagerSimple = new TaskManagerSimple();

// taskManagerSimple.start();
// let replayBlockTransactionTask = new ReplayBlockTransactionTask();
// replayBlockTransactionTask.replay();

let taskManagerBasic = new TaskManagerBasic();

let syncBlockHeaderTask = new SyncBlockHeaderTask();
let syncTransactionTask = new SyncTransactionTask();
let replayBlockTransactionTask = new ReplayBlockTransactionTask();
let replayBlockHeaderTask = new ReplayBlockHeaderTask();

taskManagerBasic.pushTask(syncBlockHeaderTask, syncBlockHeaderTask.sync());
taskManagerBasic.pushTask(syncTransactionTask, syncTransactionTask.sync());
taskManagerBasic.pushTask(replayBlockTransactionTask, replayBlockTransactionTask.replay());
taskManagerBasic.pushTask(replayBlockHeaderTask, replayBlockHeaderTask.replay());

(async ()=> {
    for await (let s of taskManagerBasic.run()) {

    }
})()


