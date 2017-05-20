const PATH = require('path');
const FS = require('fs');

class VPK {
	path: string;

	constructor(path) {
		this.path = PATH.normalize(path);
	}

	load() {
		return new Promise((resolve, reject) => {
			const readStream = FS.createReadStream(this.path);

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
			});
		});
	}
}

export default VPK;
