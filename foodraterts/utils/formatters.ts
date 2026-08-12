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

export const formatTimestamp = (timestamp: number | undefined) => {
    if (!timestamp) return '';

    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString();
};