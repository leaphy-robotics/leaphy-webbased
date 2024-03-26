
export const clearReadBuffer = async (readStream: ReadableStreamDefaultReader<Uint8Array>, timeout: number = 1500) => {
    const timeoutPromise = new Promise((resolve, _) => {
        setTimeout(() => {
            resolve("Timeout");
        }, 100);
    });
    const timeoutPromiseRead = new Promise((resolve, _) => {
        setTimeout(() => {
            resolve("Timeout");
        }, timeout);
    });

    let i = 1;
    while (true) {
        const promise = new Promise(async (resolve, _) => {
            while (true) {
                const result = await Promise.race([readStream.read(), timeoutPromise]);
                if (result === "Timeout")
                    break;
            }
            resolve("K");
        });
        const result = await Promise.race([promise, timeoutPromiseRead]);

        if (result !== "Timeout")
            break;
        if (i > 10)
            throw new Error('Timeout');
        i++;
    }
}

export const delay = (timeOut) => {
  // @ts-ignore
  return new Promise((resolve) => {
    setTimeout(resolve, timeOut)
  })
}
