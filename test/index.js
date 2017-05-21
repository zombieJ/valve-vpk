import { assert, deepEqual } from 'chai';
import VPK from '../js/index';

describe('VPK Test', () => {
	it('read file',() => {
		const path = 'D:/softwares/Steam/steamapps/common/dota 2 beta/game/dota/pak01_dir.vpk';
		const vpk = new VPK(path);

		return vpk.load().then(() => {
			const resPath = 'resource/flash3/images/spellicons';

			assert.isTrue(vpk.fileList.length > 100);
			const imageList = vpk.fileList.filter(path => path.startsWith(resPath));
			const buffer = vpk.readFile(imageList[0]);
			assert.isTrue(buffer.length > 100);
		}).then(() => {
			vpk.destroy();
		});
	});
});
