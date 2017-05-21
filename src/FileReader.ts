const FS = require('fs');
const BUFFER_MAX_LEN = 2048;

class FileReader {
	path: string;

	fileDef: number;

	index: number = 0;

	buffer: Buffer;
	bufferLen: number;
	bufferIndex: number;

	done: boolean = false;

	constructor(path) {
		this.path = path;
		this.fileDef = FS.openSync(this.path, 'r');
	}

	getBuffer(minLen: number = 1): Buffer {
		if (!this.buffer) {
			const buffer = new Buffer(BUFFER_MAX_LEN);

			this.bufferLen = FS.readSync(this.fileDef, buffer, 0, BUFFER_MAX_LEN, this.index);
			this.index += BUFFER_MAX_LEN;

			if (this.bufferLen !== 0) {
				this.buffer = buffer;
				this.bufferIndex = 0;
			} else {
				this.done = true;
			}
		} else {
			const bufferLen: number = this.buffer.length;

			if (this.bufferIndex + minLen >= bufferLen) {
				this.buffer = null;
				this.index -= (bufferLen - this.bufferIndex);
				return this.getBuffer();
			}
		}

		return this.buffer;
	}

	readUInt8() {
		if (this.done) return null;
		const int = this.getBuffer().readUInt8(this.bufferIndex);
		this.bufferIndex += 1;
		return int;
	}

	readUInt16() {
		if (this.done) return null;
		const int = this.getBuffer(2).readUInt16LE(this.bufferIndex);
		this.bufferIndex += 2;
		return int;
	}

	readUInt32() {
		if (this.done) return null;
		const int = this.getBuffer(4).readUInt32LE(this.bufferIndex);
		this.bufferIndex += 4;
		return int;
	}

	readString() {
		if (this.done) return null;

		let int: number;
		const arrList: Array<number> = [];
		while (true) {
			int = this.readUInt8();
			if (int === 0) break;

			arrList.push(int);
		}
		return String.fromCharCode.apply(null, new Uint8Array(arrList));
	}

	skip(offset: number) {
		this.bufferIndex += offset;
	}
}

export default FileReader;
