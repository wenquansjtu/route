// 测试脚本用于验证任务完成功能修复
const { EventSource } = require('eventsource');

// 连接到本地服务器的SSE端点
const eventSource = new EventSource('http://localhost:8081/sse');

console.log('Connecting to server...');

eventSource.onopen = function() {
  console.log('Connected to server');
  
  // 通过HTTP POST发送任务提交消息
  fetch('http://localhost:8081/api/message', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      type: 'submit-ai-task',
      payload: {
        id: 'test-task-' + Date.now(),
        description: 'Test task to verify fix for task completion issue',
        priority: 3,
        complexity: 50
      }
    })
  })
  .then(response => {
    if (response.ok) {
      console.log('Task submitted successfully');
    } else {
      console.error('Failed to submit task:', response.status);
    }
  })
  .catch(error => {
    console.error('Error submitting task:', error);
  });
};

eventSource.onmessage = function(event) {
  console.log('Received message:', event.data);
};

eventSource.addEventListener('ai-task-completed', function(event) {
  console.log('✅ Task completion event received - Fix is working!');
  console.log('Event data:', event.data);
  eventSource.close();
  process.exit(0);
});

eventSource.onerror = function(err) {
  console.error('EventSource error:', err);
};

// 设置超时，如果5分钟内没有收到任务完成事件则退出
setTimeout(() => {
  console.log('Timeout: No task completion event received within 5 minutes');
  eventSource.close();
  process.exit(1);
}, 300000);