import { EventEmitter } from './util/EventEmitter';

class TestEventEmitter extends EventEmitter {
    testEmit(param: string) {
        this.emit('Test',param)
    }
    testOn() {
        this.on('Test',(param: string)=>{
            console.log('这是参数', param)
        })
    }

    testEmit2(param: string) {
        this.emit('Test2',param)
    }
    testOn2() {
        this.once('Test2',(param: string)=>{
            console.log('这是参数', param)
        })
    }
}

let testEventEmitter = new TestEventEmitter();
testEventEmitter.testOn();
testEventEmitter.testEmit('王传硕');
testEventEmitter.testEmit('王传硕');
testEventEmitter.testEmit('王传硕');

testEventEmitter.testOn2()
testEventEmitter.testEmit2('王传硕2');
testEventEmitter.testEmit2('王传硕2');
testEventEmitter.testEmit2('王传硕2');