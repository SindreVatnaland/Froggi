import DolphinMemory from 'dolphin-memory-reader';
import { ByteSize } from 'dolphin-memory-reader/dist/types/enum';

export const getPause = (memory: DolphinMemory): boolean => {
	const pauseHex = memory.read(0x80479d68, ByteSize.U32);
	return Boolean(pauseHex);
};

export const getMenuState = (memory: DolphinMemory) => {
	const menuId = memory.read(0x804A04F0, ByteSize.U8);
	const menuPrevId = memory.read(0x804A04F1, ByteSize.U8);
	const menuSelection = memory.read(0x804A04F2, ByteSize.U8);
	const menuValue = memory.read(0x804A04F3, ByteSize.U8);
	console.log(menuId, menuPrevId, menuSelection, menuValue);
};