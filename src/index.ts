import FileReader from './FileReader';

const PATH = require('path');
const FS = require('fs');

class VPK {
	path: string;
	fileReader: FileReader;

	version: number;
	treeSize: number;
	files: object;

	fileDataSectionSize: number;
	archiveMD5SectionSize: number;
	otherMD5SectionSize: number;
	signatureSectionSize: number;

	constructor(path) {
		this.path = PATH.normalize(path);
		this.fileReader = new FileReader(this.path);
	}

	async load() {
		await this.loadHeader();
		await this.loadTree();
	}

	async loadHeader() {
		// Check file type
		const signature = this.fileReader.readUInt32();
		if (signature !== 0x55aa1234) {
			throw 'Not a VPK file';
		}

		// Check version
		this.version = this.fileReader.readUInt32();
		if (this.version !== 1 && this.version !== 2) {
			throw `VPK Version not support: ${this.version}`;
		}

		// Get tree size
		this.treeSize = this.fileReader.readUInt32();

		// Version 2 check
		if (this.version === 2) {
			this.fileDataSectionSize = this.fileReader.readUInt32();
			this.archiveMD5SectionSize = this.fileReader.readUInt32();
			this.otherMD5SectionSize = this.fileReader.readUInt32();
			this.signatureSectionSize = this.fileReader.readUInt32();
		}
	}

	async loadTree() {
		this.files = {};

		while (true) {
			// Extension
			const extension = this.fileReader.readString();
			if (!extension) break;

			while (true) {
				// Path
				const path = this.fileReader.readString();
				if (!path) break;

				while (true) {
					// File Name
					const fileName = this.fileReader.readString();
					if (!fileName) break;

					const fullName = `${path}/${fileName}.${extension}`;
					this.files[fullName] = this.loadFileInfo();
				}
			}
		}
	}

	loadFileInfo() {
		return {
			CRC: this.fileReader.readUInt32(),
			PreloadBytes: this.fileReader.readUInt16(),
			ArchiveIndex: this.fileReader.readUInt16(),
			EntryOffset: this.fileReader.readUInt32(),
			EntryLength: this.fileReader.readUInt32(),
			End: this.fileReader.readUInt16() === 0xffff,
		};
	}
}

export default VPK;
