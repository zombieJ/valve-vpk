const FS = require('fs');
const BUFFER_MAX_LEN = 1024;

class FileReader {
	path: string;

	fileDef: number;

	buffer: Buffer;
	bufferLen: number;
	bufferIndex: number;

	constructor(path) {
		this.path = path;
		this.fileDef = FS.openSync(this.path, 'r');
	}

	getBuffer(): Buffer {
		if (!this.buffer) {
			const buffer = new Buffer(BUFFER_MAX_LEN);

			this.bufferLen = FS.readSync(this.fileDef, buffer, 0, BUFFER_MAX_LEN, null);
			this.buffer = buffer;
			this.bufferIndex = 0;
		} else if (this.bufferIndex >= this.buffer.length) {
			this.buffer = null;
			return this.getBuffer();
		}
		return this.buffer;
	}

	readUInt32() {
		const int = this.getBuffer().readUInt32LE(this.bufferIndex);
		this.bufferIndex += 4;
		return int;
	}
}

export default FileReader;


/* load() {
 return new Promise((resolve, reject) => {
 FS.open(this.path, 'r', (err, fileDef) => {
 if (err) return reject(err);

 var buffer = new Buffer(100);
 FS.read(fd, buffer, 0, 100, 0, function(err, num) {
 console.log(buffer.toString('utf8', 0, num));
 });

 this.fileDef = fileDef;

 resolve(this);
 });

 });
 }*/


/* const readStream = FS.createReadStream(this.path);

 readStream.on('error', function (error) {
 reject(error);
 });

 let first = true;
 readStream.on('data', function (buffer: Buffer) {
 if (first) {
 first = false;
 // console.log('->', buffer);

 const signature = buffer.readInt32LE(0);
 console.log('>>>', signature === 0x55aa1234);
 }
 });

 readStream.on('end', function () {
 resolve();
 }); */
