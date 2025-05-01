import os from 'os';
import AmdOverlay from 'electron-overlay-amd';
import IntelOverlay from 'electron-overlay-intel';

const isIntelCpu = (cpuModel: string) => {
    return cpuModel.includes('intel');
}

export const getInjector = () => {
    const cpuModel = os.cpus()[0].model.toLowerCase();
    const isIntel = isIntelCpu(cpuModel);

    if (isIntel) {
        return IntelOverlay;
    }

    return AmdOverlay;

};
