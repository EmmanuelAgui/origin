
/**
 * 基础版任务调度器
 * 思路：由于多个任务之间是有依赖关系的，但同时又需要并行执行，当一个任务没有数据处理的时候，则需要暂时移除执行队列，
 * 等待有数据可以处理的时候，再加入到执行队列。
 */

export class TaskManagerBasic {
  /**
   * 迭代器列表
   */
  agList: AsyncGenerator[] = [];
  /**
   * 迭代器与其所属实例的映射
   */
  agTaskInstanceMap: WeakMap<AsyncGenerator, unknown> = new WeakMap();

  /**
   * 迭代器中的待执行的异步任务(promise)列表
   */
  taskListMap: WeakMap<AsyncGenerator, Promise<any>> = new WeakMap();
  // constructor(taskInstance) {
  //   this.agList = agList;
  // }

  pushTask(taskInstance: unknown, ag: AsyncGenerator) {
    this.agTaskInstanceMap.set(ag, taskInstance);
    this.agList.push(ag)
  }

  async *run() {
    do {
      // 轮询迭代器
      if (this.agList.length === 0) return;

      // 遍历轮询迭代器
      for (let i = 0; i < this.agList.length; i++) {
        let ag = this.agList[i];
        if (this.taskListMap.has(ag)) {
          continue;
        }
        let promise = ag.next();
        this.taskListMap.set(ag, promise);
        if (promise instanceof Promise) {
          promise.then(({value, done}) => {
            console.log('value',value,'done', done)
            if (done) {
              this.agList.splice(i, 1);
            }
            this.taskListMap.delete(ag);
          })
        } else {
          console.log('promise', promise)
          this.taskListMap.set(ag, ag.next());
        }
      }
      yield new Promise((resolve, reject) => {
        setTimeout(() => {
          resolve();
        }, 1);
      })
    } while (this.agList)
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
  yield sleep(10000, "A:1");
  yield sleep(100, "A:2");
  yield sleep(1000, "A:3");
}

async function* B() {
  yield sleep(10000, "B:1");
  yield sleep(100, "B:2");
}

async function* C() {
  yield sleep(100, "C:1");
  yield sleep(100, "C:2");
}

var s = new TaskManagerBasic();
s.pushTask(null, A())
s.pushTask(null, B())
s.pushTask(null, C())
async function taskRun() {
  for await (let i of s.run()) {
    // console.info(i);
  }
}

taskRun();
