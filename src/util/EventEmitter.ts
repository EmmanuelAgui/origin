interface HandlerObject {
    cb: Function,
    once: Boolean
}
export class EventEmitter {
    /**
     * 事件监听注册存储器
     * Map<事件名，回调>
     */
    eventMap: Map<string, HandlerObject[]> = new Map()
    /**
     * 触发事件
     * @param eventName 
     * @param args 
     */
    emit(eventName: string,...args:any) {
        if (this.eventMap.has(eventName)) {
            let handlerObjs = this.eventMap.get(eventName);
            handlerObjs!.forEach(handlerObj=>{
                const {cb, once} = handlerObj;
                if (cb.constructor.name === 'AsyncFunction') {
                    (async function(){
                        await cb(...args)
                    })()
                } else {
                    cb(...args);
                }
                
                if (once) {
                    // 移除事件
                    this.off(eventName, cb)
                }
            })
        }
    }

    /**
     * 注册事件
     * @param eventName 事件名称
     * @param cb 事件回调
     */
    on(eventName: string, cb: Function) {
        let handlerObjs:HandlerObject[] = [];
        // 该事件是否被其他事件注册过
        if (this.eventMap.has(eventName)) {
            handlerObjs = this.eventMap.get(eventName)!;
        }
        handlerObjs.push({
            cb: cb,
            once: false
        })
        this.eventMap.set(eventName, handlerObjs);
    }

    /**
     * 注册一次性事件
     * @param eventName 事件名称
     * @param cb 事件回调
     */
    once(eventName: string, cb: Function) {
        let handlerObjs:HandlerObject[] = [];
        // 该事件是否被其他事件注册过
        if (this.eventMap.has(eventName)) {
            handlerObjs = this.eventMap.get(eventName)!;
        }
        handlerObjs.push({
            cb: cb,
            once: true
        })
        this.eventMap.set(eventName, handlerObjs);
    }

    /**
     * 移除事件监听
     * @param eventName 事件名称
     * @param cb 回调函数
     */
    off(eventName: string, cb: Function) {
        if (this.eventMap.has(eventName)) {
            let handlerObjs:HandlerObject[] = this.eventMap.get(eventName)!;
            handlerObjs = handlerObjs.filter(item => {
                return item.cb !== cb
            })
            if (handlerObjs.length === 0) {
                this.eventMap.delete(eventName)
            } else {
                this.eventMap.set(eventName, handlerObjs)
            }
            
        }
    }
}
