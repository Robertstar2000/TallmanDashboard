export default class BufferList {
    constructor(buffers = []) {
        this.buffers = buffers;
    }
    add(buffer, front) {
        this.buffers[front ? 'unshift' : 'push'](buffer);
        return this;
    }
    addInt16(val, front) {
        return this.add(Buffer.from([val >>> 8, val >>> 0]), front);
    }
    getByteLength() {
        return this.buffers.reduce(function (previous, current) {
            return previous + current.length;
        }, 0);
    }
    addInt32(val, first) {
        return this.add(Buffer.from([(val >>> 24) & 0xff, (val >>> 16) & 0xff, (val >>> 8) & 0xff, (val >>> 0) & 0xff]), first);
    }
    addCString(val, front) {
        var len = Buffer.byteLength(val);
        var buffer = Buffer.alloc(len + 1);
        buffer.write(val);
        buffer[len] = 0;
        return this.add(buffer, front);
    }
    addString(val, front) {
        var len = Buffer.byteLength(val);
        var buffer = Buffer.alloc(len);
        buffer.write(val);
        return this.add(buffer, front);
    }
    addChar(char, first) {
        return this.add(Buffer.from(char, 'utf8'), first);
    }
    addByte(byte) {
        return this.add(Buffer.from([byte]));
    }
    join(appendLength, char) {
        var length = this.getByteLength();
        if (appendLength) {
            this.addInt32(length + 4, true);
            return this.join(false, char);
        }
        if (char) {
            this.addChar(char, true);
            length++;
        }
        var result = Buffer.alloc(length);
        var index = 0;
        this.buffers.forEach(function (buffer) {
            buffer.copy(result, index, 0);
            index += buffer.length;
        });
        return result;
    }
}
