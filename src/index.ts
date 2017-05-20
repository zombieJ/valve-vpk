import FileReader from './FileReader';

const PATH = require('path');
const FS = require('fs');

class VPK {
	path: string;
	fileReader: FileReader;

	constructor(path) {
		this.path = PATH.normalize(path);
		this.fileReader = new FileReader(this.path);
	}

	load() {
		return new Promise((resolve, reject) => {
			// Check file type
			const signature = this.fileReader.readUInt32();
			if (signature !== 0x55aa1234) {
				return reject('Not a VPK file');
			}
			console.log('>>>', signature === 0x55aa1234);
			resolve();
		});
	}
}

export default VPK;
