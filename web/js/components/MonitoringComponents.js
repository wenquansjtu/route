// 协作监控组件
export class CollaborationMonitor {
    constructor() {
        this.container = null;
    }
    
    init() {
        console.log('协作监控组件已初始化');
    }
    
    update(systemState) {
        this.updateCollaborationSessions(systemState.collaborationSessions);
        this.updateConvergenceChart(systemState.convergenceState);
        this.updateAgentPerformance(systemState.agents);
        this.updateResonanceZones(systemState.tcf?.resonanceZones);
    }
    
    updateCollaborationSessions(sessions) {
        const container = document.getElementById('collaboration-sessions');
        if (!container || !sessions) return;
        
        container.innerHTML = '';
        
        const activeSessions = Array.from(sessions.values())
            .filter(session => session.status === 'active');
        
        if (activeSessions.length === 0) {
            container.innerHTML = '<p class=\"text-muted\">暂无活跃协作会话</p>';
            return;
        }
        
        activeSessions.forEach(session => {
            const sessionEl = document.createElement('div');
            sessionEl.className = 'session-item';
            sessionEl.innerHTML = `
                <div class=\"session-header\">
                    <span class=\"session-id\">${session.id.slice(0, 8)}</span>
                    <span class=\"session-status\">${session.strategy}</span>
                </div>
                <div class=\"session-participants\">
                    参与者: ${session.participants.size}个Agent
                </div>
                <div class=\"session-progress\">
                    <div class=\"progress-bar\">
                        <div class=\"progress-fill\" style=\"width: ${(session.convergenceTracker?.consensus || 0) * 100}%\"></div>
                    </div>
                </div>
            `;
            container.appendChild(sessionEl);
        });
    }
    
    updateConvergenceChart(convergenceState) {
        const container = document.getElementById('convergence-chart');
        if (!container) return;
        
        if (!convergenceState) {
            container.innerHTML = '<p class=\"text-muted\">暂无收敛数据</p>';
            return;
        }
        
        container.innerHTML = `
            <div class=\"convergence-metrics\">
                <div class=\"metric-item\">
                    <span class=\"metric-label\">全局共识度</span>
                    <span class=\"metric-value\">${(convergenceState.globalConsensus * 100).toFixed(1)}%</span>
                </div>
                <div class=\"metric-item\">
                    <span class=\"metric-label\">任务完成率</span>
                    <span class=\"metric-value\">${(convergenceState.taskCompletionRate * 100).toFixed(1)}%</span>
                </div>
                <div class=\"metric-item\">
                    <span class=\"metric-label\">协作效率</span>
                    <span class=\"metric-value\">${(convergenceState.collaborationEfficiency * 100).toFixed(1)}%</span>
                </div>
                <div class=\"metric-item\">
                    <span class=\"metric-label\">网络稳定性</span>
                    <span class=\"metric-value\">${(convergenceState.networkStability * 100).toFixed(1)}%</span>
                </div>
            </div>
        `;
    }
    
    updateAgentPerformance(agents) {
        const container = document.getElementById('agent-performance');
        if (!container || !agents) return;
        
        container.innerHTML = '';
        
        const agentArray = Array.from(agents.values())
            .sort((a, b) => (b.performanceScore || 0) - (a.performanceScore || 0))
            .slice(0, 5); // 显示前5个
        
        if (agentArray.length === 0) {
            container.innerHTML = '<p class=\"text-muted\">暂无Agent数据</p>';
            return;
        }
        
        agentArray.forEach(agent => {
            const agentEl = document.createElement('div');
            agentEl.className = 'agent-performance-item';
            agentEl.innerHTML = `
                <div class=\"agent-name\">${agent.name || agent.id.slice(0, 8)}</div>
                <div class=\"agent-score\">
                    <div class=\"progress-bar\">
                        <div class=\"progress-fill\" style=\"width: ${(agent.performanceScore || 0) * 100}%\"></div>
                    </div>
                    <span class=\"score-text\">${((agent.performanceScore || 0) * 100).toFixed(1)}%</span>
                </div>
            `;
            container.appendChild(agentEl);
        });
    }
    
    updateResonanceZones(zones) {
        const container = document.getElementById('resonance-zones');
        if (!container) return;
        
        if (!zones || zones.length === 0) {
            container.innerHTML = '<p class=\"text-muted\">暂无共振区域</p>';
            return;
        }
        
        container.innerHTML = '';
        
        zones.forEach((zone, index) => {
            const zoneEl = document.createElement('div');
            zoneEl.className = 'resonance-zone-item';
            zoneEl.innerHTML = `
                <div class=\"zone-header\">
                    <span class=\"zone-id\">区域 ${index + 1}</span>
                    <span class=\"zone-strength\">${(zone.strength * 100).toFixed(0)}%</span>
                </div>
                <div class=\"zone-agents\">
                    涉及Agent: ${zone.agents?.length || 0}个
                </div>
                <div class=\"zone-coherence\">
                    相干性: ${(zone.coherence * 100).toFixed(1)}%
                </div>
            `;
            container.appendChild(zoneEl);
        });
    }
}

// 任务管理组件
export class TaskManager {
    constructor() {
        this.container = null;
    }
    
    init() {
        console.log('任务管理组件已初始化');
    }
    
    update(systemState) {
        this.updateTaskQueue(systemState.tasks);
        this.updateExecutingTasks(systemState.tasks);
        this.updateCompletedTasks(systemState.tasks);
        this.updateTaskChains(systemState.taskChains);
    }
    
    updateTaskQueue(tasks) {
        const container = document.getElementById('task-queue');
        if (!container || !tasks) return;
        
        const pendingTasks = Array.from(tasks.values())
            .filter(task => task.status === 'pending')
            .sort((a, b) => (b.priority || 0) - (a.priority || 0));
        
        this.renderTaskList(container, pendingTasks, '暂无等待任务');
    }
    
    updateExecutingTasks(tasks) {
        const container = document.getElementById('executing-tasks');
        if (!container || !tasks) return;
        
        const executingTasks = Array.from(tasks.values())
            .filter(task => task.status === 'executing');
        
        this.renderTaskList(container, executingTasks, '暂无执行中任务');
    }
    
    updateCompletedTasks(tasks) {
        const container = document.getElementById('completed-tasks');
        if (!container || !tasks) return;
        
        const completedTasks = Array.from(tasks.values())
            .filter(task => task.status === 'completed')
            .slice(0, 10); // 显示最近10个
        
        container.innerHTML = '';
        
        if (completedTasks.length === 0) {
            container.innerHTML = '<p class="text-muted">暂无已完成任务</p>';
            return;
        }
        
        completedTasks.forEach(task => {
            const taskEl = document.createElement('div');
            taskEl.className = 'task-item';
            taskEl.innerHTML = `
                <div class="task-header">
                    <span class="task-name">${task.name || task.id?.slice(0, 8)}</span>
                    <span class="task-priority">优先级: ${task.priority || 0}</span>
                </div>
                <div class="task-type">${this.getTaskTypeText(task.type)}</div>
                <div class="task-collaboration">${this.getCollaborationTypeText(task.collaborationType)}</div>
                ${task.assignedAgents ? `<div class="task-agents">分配Agent: ${task.assignedAgents.size}</div>` : ''}
                <button class="btn btn-small view-topology-btn" data-task-id="${task.id}" style="margin-top: 8px;">View Topology</button>
            `;
            container.appendChild(taskEl);
        });
        
        // Add event listeners to the view topology buttons
        container.querySelectorAll('.view-topology-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const taskId = e.target.getAttribute('data-task-id');
                // Find the task chain ID associated with this task
                const app = window.cosmicApp; // Assuming the app instance is globally accessible
                if (app && app.systemState && app.systemState.taskChains) {
                    // Find the task chain that contains this task
                    let taskChainId = null;
                    for (const [chainId, chainData] of app.systemState.taskChains.entries()) {
                        if (chainData.taskId === taskId) {
                            taskChainId = chainId;
                            break;
                        }
                    }
                    
                    if (taskChainId && app.networkViz) {
                        app.switchView('network');
                        // Display the saved topology for this task chain
                        setTimeout(() => {
                            app.networkViz.displaySavedTopology(taskChainId);
                        }, 100);
                    }
                }
            });
        });
    }
    
    updateTaskChains(taskChains) {
        const container = document.getElementById('task-chains');
        if (!container || !taskChains) return;
        
        container.innerHTML = '';
        
        const chainArray = Array.from(taskChains.values());
        
        if (chainArray.length === 0) {
            container.innerHTML = '<p class=\"text-muted\">暂无任务链</p>';
            return;
        }
        
        chainArray.forEach(chain => {
            const chainEl = document.createElement('div');
            chainEl.className = 'task-chain-item';
            chainEl.innerHTML = `
                <div class=\"chain-header\">
                    <span class=\"chain-name\">${chain.name}</span>
                    <span class=\"chain-status\">${this.getChainStatusText(chain.status)}</span>
                </div>
                <div class=\"chain-progress\">
                    <div class=\"progress-bar\">
                        <div class=\"progress-fill\" style=\"width: ${(chain.progress || 0) * 100}%\"></div>
                    </div>
                    <span class=\"progress-text\">${((chain.progress || 0) * 100).toFixed(0)}%</span>
                </div>
                <div class=\"chain-tasks\">
                    任务数: ${chain.tasks?.length || 0} | 已完成: ${chain.completedTasks?.size || 0}
                </div>
            `;
            container.appendChild(chainEl);
        });
    }
    
    renderTaskList(container, tasks, emptyMessage) {
        container.innerHTML = '';
        
        if (tasks.length === 0) {
            container.innerHTML = `<p class=\"text-muted\">${emptyMessage}</p>`;
            return;
        }
        
        tasks.forEach(task => {
            const taskEl = document.createElement('div');
            taskEl.className = 'task-item';
            taskEl.innerHTML = `
                <div class=\"task-header\">
                    <span class=\"task-name\">${task.name || task.id?.slice(0, 8)}</span>
                    <span class=\"task-priority\">优先级: ${task.priority || 0}</span>
                </div>
                <div class=\"task-type\">${this.getTaskTypeText(task.type)}</div>
                <div class=\"task-collaboration\">${this.getCollaborationTypeText(task.collaborationType)}</div>
                ${task.assignedAgents ? `<div class=\"task-agents\">分配Agent: ${task.assignedAgents.size}</div>` : ''}
            `;
            container.appendChild(taskEl);
        });
    }
    
    getTaskTypeText(type) {
        const types = {
            analysis: '数据分析',
            processing: '数据处理',
            reasoning: '推理任务',
            collaboration: '协作任务'
        };
        return types[type] || type;
    }
    
    getCollaborationTypeText(type) {
        const types = {
            sequential: '顺序协作',
            parallel: '并行协作',
            hierarchical: '分层协作'
        };
        return types[type] || type;
    }
    
    getChainStatusText(status) {
        const statuses = {
            pending: '等待中',
            running: '运行中',
            completed: '已完成',
            failed: '失败'
        };
        return statuses[status] || status;
    }
}

// 系统监控组件
export class SystemMonitor {
    constructor() {
        this.container = null;
        this.charts = new Map();
    }
    
    init() {
        console.log('系统监控组件已初始化');
    }
    
    update(systemState) {
        this.updatePerformanceCharts(systemState.metrics);
        this.updateResourceUsage(systemState.agents);
        this.updateCooperationWaves(systemState.tcf?.cooperationWaves);
        this.updateSingularityDetection(systemState.tcf?.singularityPoints);
    }
    
    updatePerformanceCharts(metrics) {
        const container = document.getElementById('performance-charts');
        if (!container) return;
        
        if (!metrics) {
            container.innerHTML = '<p class=\"text-muted\">暂无性能数据</p>';
            return;
        }
        
        container.innerHTML = `
            <div class=\"performance-metrics\">
                <div class=\"metric-card\">
                    <div class=\"metric-title\">处理任务总数</div>
                    <div class=\"metric-number\">${metrics.totalTasksProcessed || 0}</div>
                </div>
                <div class=\"metric-card\">
                    <div class=\"metric-title\">成功协作数</div>
                    <div class=\"metric-number\">${metrics.successfulCollaborations || 0}</div>
                </div>
                <div class=\"metric-card\">
                    <div class=\"metric-title\">平均响应时间</div>
                    <div class=\"metric-number\">${(metrics.averageResponseTime || 0).toFixed(2)}ms</div>
                </div>
                <div class=\"metric-card\">
                    <div class=\"metric-title\">质量分数</div>
                    <div class=\"metric-number\">${((metrics.qualityScore || 0) * 100).toFixed(1)}%</div>
                </div>
            </div>
        `;
    }
    
    updateResourceUsage(agents) {
        const container = document.getElementById('resource-usage');
        if (!container || !agents) return;
        
        const agentArray = Array.from(agents.values());
        const totalAgents = agentArray.length;
        const activeAgents = agentArray.filter(a => a.currentTasks?.size > 0).length;
        const avgLoad = totalAgents > 0 ? activeAgents / totalAgents : 0;
        
        container.innerHTML = `
            <div class=\"resource-metrics\">
                <div class=\"resource-item\">
                    <span class=\"resource-label\">总Agent数</span>
                    <span class=\"resource-value\">${totalAgents}</span>
                </div>
                <div class=\"resource-item\">
                    <span class=\"resource-label\">活跃Agent数</span>
                    <span class=\"resource-value\">${activeAgents}</span>
                </div>
                <div class=\"resource-item\">
                    <span class=\"resource-label\">平均负载</span>
                    <div class=\"progress-bar\">
                        <div class=\"progress-fill\" style=\"width: ${avgLoad * 100}%\"></div>
                    </div>
                    <span class=\"resource-value\">${(avgLoad * 100).toFixed(1)}%</span>
                </div>
            </div>
        `;
    }
    
    updateCooperationWaves(waves) {
        const container = document.getElementById('cooperation-waves');
        if (!container) return;
        
        if (!waves || waves.length === 0) {
            container.innerHTML = '<p class=\"text-muted\">暂无协作波动</p>';
            return;
        }
        
        container.innerHTML = '';
        
        waves.slice(0, 5).forEach((wave, index) => {
            const waveEl = document.createElement('div');
            waveEl.className = 'wave-item';
            waveEl.innerHTML = `
                <div class=\"wave-header\">
                    <span class=\"wave-id\">波动 ${index + 1}</span>
                    <span class=\"wave-amplitude\">${(wave.amplitude * 100).toFixed(0)}%</span>
                </div>
                <div class=\"wave-source\">源Agent: ${wave.sourceAgentId?.slice(0, 8)}</div>
                <div class=\"wave-frequency\">频率: ${wave.frequency?.toFixed(2)}Hz</div>
            `;
            container.appendChild(waveEl);
        });
    }
    
    updateSingularityDetection(singularityPoints) {
        const container = document.getElementById('singularity-detection');
        if (!container) return;
        
        if (!singularityPoints || singularityPoints.length === 0) {
            container.innerHTML = '<p class=\"text-muted\">未检测到奇点</p>';
            return;
        }
        
        container.innerHTML = '';
        
        singularityPoints.forEach((point, index) => {
            const pointEl = document.createElement('div');
            pointEl.className = `singularity-item ${this.getSingularityClass(point.type)}`;
            pointEl.innerHTML = `
                <div class=\"singularity-header\">
                    <span class=\"singularity-id\">奇点 ${index + 1}</span>
                    <span class=\"singularity-type\">${this.getSingularityTypeText(point.type)}</span>
                </div>
                <div class=\"singularity-intensity\">强度: ${(point.forceIntensity * 100).toFixed(0)}%</div>
                <div class=\"singularity-risk\">风险等级: ${this.getRiskLevelText(point.riskLevel)}</div>
                <div class=\"singularity-agents\">涉及Agent: ${point.convergedAgents?.length || 0}个</div>
            `;
            container.appendChild(pointEl);
        });
    }
    
    getSingularityClass(type) {
        const classes = {
            collaboration_hub: 'positive',
            resource_drain: 'warning',
            conflict_zone: 'danger',
            overload_point: 'danger',
            anomaly: 'warning'
        };
        return classes[type] || 'neutral';
    }
    
    getSingularityTypeText(type) {
        const types = {
            collaboration_hub: '协作中心',
            resource_drain: '资源消耗',
            conflict_zone: '冲突区域',
            overload_point: '过载点',
            anomaly: '异常'
        };
        return types[type] || type;
    }
    
    getRiskLevelText(level) {
        if (level < 0.3) return '低';
        if (level < 0.7) return '中';
        return '高';
    }
}
