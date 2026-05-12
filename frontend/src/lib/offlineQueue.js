const QUEUE_KEY = 'zentask_offline_queue';

export const getOfflineQueue = () => {
  const data = localStorage.getItem(QUEUE_KEY);
  return data ? JSON.parse(data) : [];
};

export const saveOfflineQueue = (queue) => {
  localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
};

export const addToQueue = (method, url, data) => {
  const queue = getOfflineQueue();
  queue.push({
    id: Date.now().toString() + Math.random().toString(36).substring(2),
    method,
    url,
    data,
    ts: Date.now()
  });
  saveOfflineQueue(queue);
  window.dispatchEvent(new CustomEvent('offline_queue_updated', { detail: queue.length }));
};

export const clearQueue = () => {
  localStorage.removeItem(QUEUE_KEY);
  window.dispatchEvent(new CustomEvent('offline_queue_updated', { detail: 0 }));
};

export const removeFromQueue = (id) => {
  const queue = getOfflineQueue().filter(item => item.id !== id);
  saveOfflineQueue(queue);
  window.dispatchEvent(new CustomEvent('offline_queue_updated', { detail: queue.length }));
};
