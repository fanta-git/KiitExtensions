const notices = new Set<Notification>();

async function noticeSend(text: string, options?: NotificationOptions) {
    if (!document.hasFocus()) return false;
    if (Notification.permission === 'default') await Notification.requestPermission();
    if (Notification.permission === 'denied') return false;
    const item = new Notification(text, options);
    notices.add(item);

    return true;
}

function noticeClear() {
    for (const notice of notices) notice.close();
    notices.clear();
}

export default { noticeSend, noticeClear };
