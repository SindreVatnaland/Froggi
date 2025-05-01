import os from 'os';
import AmdOverlay from 'electron-overlay-amd';
import IntelOverlay from 'electron-overlay-intel';

const isIntelCpu = (cpuModel: string) => {

    return cpuModel.includes('intel');
}

const isAmdCpu = (cpuModel: string) => {
    return cpuModel.includes('amd');
}

export const getInjector = () => {
    const cpuModel = os.cpus()[0].model.toLowerCase();
    const isAmd = isAmdCpu(cpuModel);
    const isIntel = isIntelCpu(cpuModel);

    if (isAmd) {
        return AmdOverlay;
    } else if (isIntel) {
        return IntelOverlay;
    }

    return null;

};
