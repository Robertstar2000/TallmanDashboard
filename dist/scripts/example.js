var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import * as fastq from '../';
import { promise as queueAsPromised } from '../';
// Basic example
const queue = fastq(worker, 1);
queue.push('world', (err, result) => {
    if (err)
        throw err;
    console.log('the result is', result);
});
queue.push('push without cb');
queue.concurrency;
queue.drain();
queue.empty = () => undefined;
console.log('the queue tasks are', queue.getQueue());
queue.idle();
queue.kill();
queue.killAndDrain();
queue.length;
queue.pause();
queue.resume();
queue.running();
queue.saturated = () => undefined;
queue.unshift('world', (err, result) => {
    if (err)
        throw err;
    console.log('the result is', result);
});
queue.unshift('unshift without cb');
function worker(task, cb) {
    cb(null, 'hello ' + task);
}
const genericsQueue = fastq({ base: 6 }, genericsWorker, 1);
genericsQueue.push(7, (err, done) => {
    if (err)
        throw err;
    console.log('the result is', done);
});
genericsQueue.unshift(7, (err, done) => {
    if (err)
        throw err;
    console.log('the result is', done);
});
function genericsWorker(task, cb) {
    cb(null, 'the meaning of life is ' + (this.base * task));
}
const queue2 = queueAsPromised(asyncWorker, 1);
function asyncWorker(task) {
    return __awaiter(this, void 0, void 0, function* () {
        return 'hello ' + task;
    });
}
function run() {
    return __awaiter(this, void 0, void 0, function* () {
        yield queue.push(42);
        yield queue.unshift(42);
    });
}
run();
