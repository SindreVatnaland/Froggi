import os from 'os';
import AmdOverlay from 'electron-overlay-amd';
import IntelOverlay from 'electron-overlay-intel';

const isIntelCpu = () => {
    return os.cpus()[0]?.model?.toLowerCase().includes('intel');
}

const isAmdCpu = () => {
    return os.cpus()[0]?.model?.toLowerCase().includes('amd');
}

export const getInjector = async () => {
    const isAmd = isAmdCpu();
    const isIntel = isIntelCpu();

    if (isAmd) {
        return AmdOverlay;
    } else if (isIntel) {
        return IntelOverlay;
    } else {
        return null;
    }

};
