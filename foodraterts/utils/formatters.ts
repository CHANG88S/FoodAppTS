export const formatCount = (count: number) => {
    if (count === undefined || count === null || count === 0) return "0";
    if (count < 1000) return count.toString();
    if (count < 1000000) {
        const formatted = (count / 1000).toFixed(1);
        return formatted.endsWith('.0') ? `${Math.floor(count / 1000)}k` : `${formatted}k`;
    }
    const formattedMillion = (count / 1000000).toFixed(1);
    return formattedMillion.endsWith('.0') ? `${Math.floor(count / 1000000)}m` : `${formattedMillion}m`;
};