export async function streamText(res, text, delay = 30) {
    const words = text.split(" ");
    for (const word of words) {
        res.write(word + " ");
        await new Promise((r) => setTimeout(r, delay));
    }
    res.end();
}
