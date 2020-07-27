
/**
 * 基础版任务调度器
 * 思路：由于多个任务之间是有依赖关系的，但同时又需要并行执行，当一个任务没有数据处理的时候，则需要暂时移除执行队列，
 * 等待有数据可以处理的时候，再加入到执行队列。
 */

import { EventEmitter } from '../util/EventEmitter';

export class TaskManagerBasic {
  /**
   * 迭代器列表
   */
  agList: AsyncGenerator[];
  /**
   * 正在执行的迭代器列表
   */
  runningAgList: AsyncGenerator[];
  /**
   * 迭代器中的待执行的异步任务(promise)列表
   */
  taskList: (Promise<any> | null)[] = [];
  constructor(agList: AsyncGenerator[]) {
    this.agList = agList;
  }
  async *run() {
    do {
      // 轮询迭代器
      if (this.agList.length === 0) return;
      for (let i = 0; i < this.agList.length; i++) {
        let ag = this.agList[i];
        if (this.taskList[i]) {
          if (this.taskList[i] instanceof Promise) {
            (this.taskList[i] as Promise<any>).then(({value, done}) => {
              console.log('value',value,'done', done)
              console.log('agLenght',this.agList.length)
              console.log('taskLength',this.taskList.length)
              if (done) {
                this.agList.splice(i, 1);
                this.taskList.splice(i, 1);
              } else {
                this.taskList[i] = ag.next();
              }
            })
          } else {
            this.taskList[i] = ag.next();
          }
          // (p as Promise<any>).then(res => {
            // console.log('res', res);
            // console.log('value', value);
            // console.log('done', done);
            // if (done) {
            //   p = null;
            // } else {
            //   console.log('value', value);
            //   p = ag.next();
            // }
          // }, error => console.log('error', error))
        } else {
          this.taskList[i] = ag.next();
        }
      }
      yield new Promise((resolve, reject) => {
        setTimeout(() => {
          resolve();
        }, 1000);
      })
    } while (true)
  }
}

function sleep(timeout: number, data: string) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      resolve(data);
    }, timeout);
  });
}

async function* A() {
  yield sleep(2000, "A:1");
  yield sleep(1000, "A:2");
  yield sleep(2000, "A:3");
}

async function* B() {
  yield sleep(100, "B:1");
  yield sleep(100, "B:2");
  yield sleep(100, "B:3");
  yield sleep(100, "B:4");
}

async function* C() {
  yield sleep(100, "C:1");
  yield sleep(100, "C:2");
}

var s = new TaskManagerBasic([A(), B(), C()]);
(async function(){
  for await (let i of s.run()) {
    console.info(i);
  }
})()