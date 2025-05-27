import { useEffect, useCallback } from 'react';
import { useChatContext } from '@/context/chat-ctx';
export const useMarkAsRead = (msgId, peerId, read, dm) => {
    const { messageHistory, setMessageHistory, directMessages, setDirectMessages } = useChatContext();
    const markAsRead = useCallback((messages, msgId) => {
        return messages.map((m) => (m.msgId === msgId ? { ...m, read: true } : m));
    }, []);
    useEffect(() => {
        if (read) {
            return;
        }
        if (dm) {
            const updatedDMs = directMessages[peerId];
            if (updatedDMs.some((m) => m.msgId === msgId && !m.read)) {
                setDirectMessages((prev) => ({
                    ...prev,
                    [peerId]: markAsRead(updatedDMs, msgId),
                }));
            }
        }
        else {
            if (messageHistory.some((m) => m.msgId === msgId && !m.read)) {
                setMessageHistory((prev) => markAsRead(prev, msgId));
            }
        }
    }, [dm, directMessages, messageHistory, msgId, peerId, read, setDirectMessages, setMessageHistory, markAsRead]);
};
//# sourceMappingURL=useMarkAsRead.js.map