
export const newId = () => `e${Math.random().toString(36).slice(-8)}`;

export const dateTimeNow = (): Date => {
    const utcSeconds = Date.now() / 1000;
    const d = new Date(0);
    d.setUTCSeconds(utcSeconds);
    return d;
}

export const getHoursDifference = (date1: Date, date2: Date): number => {
    const timeDifference = date1.getTime() - date2.getTime();
    const hoursDifference = timeDifference / (1000 * 60 * 60);

    return Math.abs(hoursDifference);
}


