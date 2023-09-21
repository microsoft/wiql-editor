/** Need to implement b/c ie doesn't support */
var IterableIterator = /** @class */ (function () {
    function IterableIterator(hasNext, next) {
        this.hasNext = hasNext;
        this.next = next;
    }
    return IterableIterator;
}());
function batchGenerator(promiseGenerator, batchsize) {
    return new IterableIterator(function () { return promiseGenerator.hasNext(); }, function () {
        var arr = [];
        while (promiseGenerator.hasNext()) {
            arr.push(promiseGenerator.next());
            if (arr.length >= batchsize) {
                return arr;
            }
        }
        return arr;
    });
}
/** It is important to only create the promises as needed by the generator or they will all run at once */
export function throttlePromises(arr, convert, batchsize) {
    var promiseGenerator = createPromiseGenerator(arr, convert);
    var batcher = batchGenerator(promiseGenerator, batchsize);
    var results = [];
    return new Promise(function (resolve, reject) {
        function queueNext() {
            if (batcher.hasNext()) {
                Promise.all(batcher.next()).then(function (vals) {
                    results.push.apply(results, vals);
                    queueNext();
                }, function (error) { reject(error); });
            }
            else {
                resolve(results);
            }
        }
        queueNext();
    });
}
function createPromiseGenerator(arr, convert) {
    var idx = 0;
    var a = new IterableIterator(function () { return idx < arr.length; }, function () { return convert(arr[idx++]); });
    return a;
}
//# sourceMappingURL=throttlePromises.js.map