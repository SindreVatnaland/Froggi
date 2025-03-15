import { CustomElement } from "$lib/models/constants/customElement";
import { GridContentItem } from "$lib/models/types/overlay";

const disallowedInjectedElements: CustomElement[] = [];

export const isDisallowedInjectedElement = (element: CustomElement | undefined) => {
    if (!element) {
        return true;
    }
    if (element >= 3100 && element <= 3165) {
        return true;
    }
    if (disallowedInjectedElements.includes(element)) {
        return true;
    }
    return false;
};