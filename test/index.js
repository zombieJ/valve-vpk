import { assert, deepEqual } from 'chai';
import VPK from '../js/index';

describe('VPK Test', () => {
	it('read file',() => {
		const path = 'D:/softwares/Steam/steamapps/common/dota 2 beta/game/dota/pak01_dir.vpk';
		const vpk = new VPK(path);
		return vpk.load();
	});
});
