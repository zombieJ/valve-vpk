import FileReader from './FileReader';

const PATH = require('path');
const FS = require('fs');
const CRC = require('crc');

const HEADER_LENGTH_MAP = {
	1: 12,
	2: 28,
};

export interface FileInfo {
	crc: number,
	preloadBytes: number,
	preloadOffset: number,
	archiveIndex: number,
	entryOffset: number,
	entryLength: number,
	end: boolean,
}

class VPK {
	path: string;
	fileReader: FileReader;

	version: number;
	treeSize: number;
	files: object = {};
	cacheFileList: Array<string>;

	fileDefCache: Object = {};

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

	loadFileInfo(): FileInfo {
		const fileInfo =  {
			crc: this.fileReader.readUInt32(),
			preloadBytes: this.fileReader.readUInt16(),
			archiveIndex: this.fileReader.readUInt16(),
			entryOffset: this.fileReader.readUInt32(),
			entryLength: this.fileReader.readUInt32(),
			end: this.fileReader.readUInt16() === 0xffff,

			preloadOffset: this.fileReader.index,
		};

		this.fileReader.skip(fileInfo.preloadBytes);

		return fileInfo;
	}

	get fileList():Array<string> {
		if (!this.cacheFileList) {
			this.cacheFileList = Object.keys(this.files);
		}
		return this.cacheFileList;
	}

	readFile(filePath) {
		const fileInfo: FileInfo = this.files[filePath];
		if (!fileInfo) return null;

		const buffer: Buffer = new Buffer(fileInfo.preloadBytes || fileInfo.entryLength);

		if (fileInfo.preloadBytes) {
			// Preload data
			FS.readSync(this.fileReader.fileDef, buffer, 0, fileInfo.preloadBytes, fileInfo.entryOffset);
		} else if (fileInfo.entryLength) {
			// Entry data
			if (fileInfo.archiveIndex === 0x7fff) {
				// Inline entity
				const offset = this.treeSize + HEADER_LENGTH_MAP[this.version];
				FS.readSync(this.fileReader.fileDef, buffer, 0, fileInfo.entryLength, offset + fileInfo.entryOffset);
			} else {
				const filePath = this.path.replace('_dir.vpk', `_${String(fileInfo.archiveIndex).padStart(3, '0')}.vpk`);
				let fileDef = this.fileDefCache[filePath];
				if (!fileDef) {
					fileDef = this.fileDefCache[filePath] = FS.openSync(filePath, 'r');
				}
				FS.readSync(fileDef, buffer, fileInfo.preloadBytes, fileInfo.entryLength, fileInfo.entryOffset);
			}
		}

		if (CRC.crc32(buffer) !== fileInfo.crc) {
			throw `CRC not match: ${filePath}`;
		}

		return buffer;
	}

	destroy() {
		Object.values(this.fileDefCache).forEach((fileDef) => {
			FS.closeSync(fileDef);
		});
	}
}

export default VPK;
