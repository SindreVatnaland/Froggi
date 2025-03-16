
export const retryFunctionAsync = async <T>(maxRetries: number, func: () => Promise<T>): Promise<T | null> => { 
    let count = 0;
    let result = null;
    while (count < maxRetries) {
        console.log(`Retry count: ${count}`);
        try {
            result = await func();
            break;
        } catch (e) {
            count++;
        }
        await new Promise((resolve) => setTimeout(resolve, 10 * count));
    }
    return result;
}

export const retryFunction = <T>(maxRetries: number, func: () => T): T | null => {
    let count = 0;
    let result = null;
    while (count < maxRetries) {
        console.log(`Retry count: ${count}`);
        try {
            result = func();
            break;
        } catch (e) {
            count++;
        }
        setTimeout(() => {}, 10 * count);
    }
    return result;
}