
export const retryFunctionAsync = async <T>(maxRetries: number, func: () => Promise<T>): Promise<T | null> => {
    let count = 0;
    let result = null;
    while (count < maxRetries) {
        try {
            result = await func();
            break;
        } catch (e) {
            count++;
            if (count < maxRetries) await new Promise((resolve) => setTimeout(resolve, 10 * count));
        }
    }
    return result;
}

export const retryFunction = <T>(maxRetries: number, func: () => T): T | null => {
    let count = 0;
    let result = null;
    while (count < maxRetries) {
        try {
            result = func();
            break;
        } catch (e) {
            count++;
            setTimeout(() => {}, 10 * count);
        }
    }
    return result;
}