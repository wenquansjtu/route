// 张量协作力场可视化组件
export class TCFVisualizer {
    constructor(containerSelector) {
        this.container = document.querySelector(containerSelector);
        this.canvas = null;
        this.ctx = null;
        this.width = 0;
        this.height = 0;
        
        // 力场数据
        this.fieldData = null;
        this.agents = [];
        this.forceVectors = [];
        this.cooperationWaves = [];
        this.resonanceZones = [];
        
        // 动画参数
        this.animationId = null;
        this.time = 0;
        
        // 渲染参数
        this.scale = 1;
        this.offsetX = 0;
        this.offsetY = 0;
    }
    
    init() {
        if (!this.container) return;
        
        // 清空容器
        this.container.innerHTML = '';
        
        // 获取容器尺寸
        const rect = this.container.getBoundingClientRect();
        this.width = rect.width;
        this.height = rect.height;
        
        // 创建Canvas
        this.canvas = document.createElement('canvas');
        this.canvas.width = this.width;
        this.canvas.height = this.height;
        this.canvas.style.width = '100%';
        this.canvas.style.height = '100%';
        this.container.appendChild(this.canvas);
        
        this.ctx = this.canvas.getContext('2d');
        
        // 生成示例数据
        this.generateSampleData();
        
        // 开始动画循环
        this.startAnimation();
    }
    
    generateSampleData() {
        // 生成示例Agent
        this.agents = [
            {
                id: 'agent1',
                position: { x: this.width * 0.3, y: this.height * 0.3 },
                energy: 80,
                radius: 15,
                color: '#64b5f6'
            },
            {
                id: 'agent2',
                position: { x: this.width * 0.7, y: this.height * 0.3 },
                energy: 90,
                radius: 18,
                color: '#4fc3f7'
            },
            {
                id: 'agent3',
                position: { x: this.width * 0.5, y: this.height * 0.7 },
                energy: 70,
                radius: 12,
                color: '#4dd0e1'
            }
        ];
        
        // 生成示例力向量
        this.forceVectors = [
            {
                agentId: 'agent1',
                vector: { x: 20, y: 10 },
                magnitude: 0.8
            },
            {
                agentId: 'agent2',
                vector: { x: -15, y: 25 },
                magnitude: 0.6
            },
            {
                agentId: 'agent3',
                vector: { x: 5, y: -20 },
                magnitude: 0.7
            }
        ];
        
        // 生成示例协作波动
        this.cooperationWaves = [
            {
                center: { x: this.width * 0.5, y: this.height * 0.5 },
                radius: 50,
                maxRadius: 100,
                amplitude: 0.8,
                frequency: 2,
                startTime: Date.now()
            }
        ];
        
        // 生成示例共振区域
        this.resonanceZones = [
            {
                center: { x: this.width * 0.4, y: this.height * 0.4 },
                radius: 60,
                strength: 0.9,
                agents: ['agent1', 'agent2']
            }
        ];
    }
    
    startAnimation() {
        const animate = () => {
            this.time += 0.016; // ~60fps
            this.render();
            this.animationId = requestAnimationFrame(animate);
        };
        animate();
    }
    
    stopAnimation() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
    }
    
    render() {
        // 清空画布
        this.ctx.clearRect(0, 0, this.width, this.height);
        
        // 设置背景
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
        this.ctx.fillRect(0, 0, this.width, this.height);
        
        // 渲染力场网格
        this.renderFieldGrid();
        
        // 渲染共振区域
        this.renderResonanceZones();
        
        // 渲染协作波动
        this.renderCooperationWaves();
        
        // 渲染Agent
        this.renderAgents();
        
        // 渲染力向量
        this.renderForceVectors();
        
        // 渲染信息覆盖层
        this.renderInfoOverlay();
    }
    
    renderFieldGrid() {
        const gridSize = 20;
        const rows = Math.ceil(this.height / gridSize);
        const cols = Math.ceil(this.width / gridSize);
        
        this.ctx.strokeStyle = 'rgba(100, 181, 246, 0.1)';
        this.ctx.lineWidth = 0.5;
        
        // 绘制网格线
        this.ctx.beginPath();
        for (let i = 0; i <= cols; i++) {
            const x = i * gridSize;
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, this.height);
        }
        for (let j = 0; j <= rows; j++) {
            const y = j * gridSize;
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(this.width, y);
        }
        this.ctx.stroke();
        
        // 绘制力场强度点
        for (let i = 0; i < cols; i += 2) {
            for (let j = 0; j < rows; j += 2) {
                const x = i * gridSize;
                const y = j * gridSize;
                
                // 计算该点的力场强度
                const fieldStrength = this.calculateFieldStrengthAt(x, y);
                
                if (fieldStrength > 0.1) {
                    this.ctx.fillStyle = `rgba(100, 181, 246, ${Math.min(fieldStrength, 0.8)})`;
                    this.ctx.beginPath();
                    this.ctx.arc(x, y, 2, 0, Math.PI * 2);
                    this.ctx.fill();
                }
            }
        }
    }
    
    calculateFieldStrengthAt(x, y) {
        let totalStrength = 0;
        
        // 计算来自所有Agent的影响
        for (const agent of this.agents) {
            const dx = x - agent.position.x;
            const dy = y - agent.position.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance > 0) {
                const influence = (agent.energy / 100) / (1 + distance * 0.01);
                totalStrength += influence;
            }
        }
        
        return Math.min(totalStrength, 1.0);
    }
    
    renderResonanceZones() {
        for (const zone of this.resonanceZones) {
            const pulseEffect = 0.1 * Math.sin(this.time * 3);
            const currentRadius = zone.radius * (1 + pulseEffect);
            
            // 渐变填充
            const gradient = this.ctx.createRadialGradient(
                zone.center.x, zone.center.y, 0,
                zone.center.x, zone.center.y, currentRadius
            );
            gradient.addColorStop(0, `rgba(76, 175, 80, ${zone.strength * 0.3})`);
            gradient.addColorStop(1, 'rgba(76, 175, 80, 0)');
            
            this.ctx.fillStyle = gradient;
            this.ctx.beginPath();
            this.ctx.arc(zone.center.x, zone.center.y, currentRadius, 0, Math.PI * 2);
            this.ctx.fill();
            
            // 边界
            this.ctx.strokeStyle = `rgba(76, 175, 80, ${zone.strength * 0.6})`;
            this.ctx.lineWidth = 2;
            this.ctx.setLineDash([5, 5]);
            this.ctx.beginPath();
            this.ctx.arc(zone.center.x, zone.center.y, currentRadius, 0, Math.PI * 2);
            this.ctx.stroke();
            this.ctx.setLineDash([]);
        }
    }
    
    renderCooperationWaves() {
        const currentTime = Date.now();
        
        for (const wave of this.cooperationWaves) {
            const elapsed = (currentTime - wave.startTime) / 1000;
            const progress = elapsed * wave.frequency;
            
            if (progress > 0 && progress < 5) { // 波动持续5秒
                const currentRadius = wave.radius + (progress * 20);
                const opacity = Math.max(0, wave.amplitude * (1 - progress / 5));
                
                this.ctx.strokeStyle = `rgba(255, 193, 7, ${opacity})`;
                this.ctx.lineWidth = 3;
                this.ctx.beginPath();
                this.ctx.arc(wave.center.x, wave.center.y, currentRadius, 0, Math.PI * 2);
                this.ctx.stroke();
                
                // 内圈
                if (currentRadius > 20) {
                    this.ctx.strokeStyle = `rgba(255, 193, 7, ${opacity * 0.5})`;
                    this.ctx.lineWidth = 1;
                    this.ctx.beginPath();
                    this.ctx.arc(wave.center.x, wave.center.y, currentRadius - 20, 0, Math.PI * 2);
                    this.ctx.stroke();
                }
            }
        }
    }
    
    renderAgents() {
        for (const agent of this.agents) {
            const pulseEffect = 0.1 * Math.sin(this.time * 2 + agent.position.x * 0.01);
            const currentRadius = agent.radius * (1 + pulseEffect);
            
            // Agent光晕
            const gradient = this.ctx.createRadialGradient(
                agent.position.x, agent.position.y, 0,
                agent.position.x, agent.position.y, currentRadius * 2
            );
            gradient.addColorStop(0, agent.color + '40');
            gradient.addColorStop(1, agent.color + '00');
            
            this.ctx.fillStyle = gradient;
            this.ctx.beginPath();
            this.ctx.arc(agent.position.x, agent.position.y, currentRadius * 2, 0, Math.PI * 2);
            this.ctx.fill();
            
            // Agent核心
            this.ctx.fillStyle = agent.color;
            this.ctx.beginPath();
            this.ctx.arc(agent.position.x, agent.position.y, currentRadius, 0, Math.PI * 2);
            this.ctx.fill();
            
            // Agent边框
            this.ctx.strokeStyle = '#ffffff';
            this.ctx.lineWidth = 2;
            this.ctx.beginPath();
            this.ctx.arc(agent.position.x, agent.position.y, currentRadius, 0, Math.PI * 2);
            this.ctx.stroke();
            
            // 能量指示器
            const energyAngle = (agent.energy / 100) * Math.PI * 2;
            this.ctx.strokeStyle = '#4caf50';
            this.ctx.lineWidth = 3;
            this.ctx.beginPath();
            this.ctx.arc(agent.position.x, agent.position.y, currentRadius + 5, -Math.PI / 2, -Math.PI / 2 + energyAngle);
            this.ctx.stroke();
        }
    }
    
    renderForceVectors() {
        for (const forceVector of this.forceVectors) {
            const agent = this.agents.find(a => a.id === forceVector.agentId);
            if (!agent) continue;
            
            const startX = agent.position.x;
            const startY = agent.position.y;
            const endX = startX + forceVector.vector.x * forceVector.magnitude * 2;
            const endY = startY + forceVector.vector.y * forceVector.magnitude * 2;
            
            // 力向量箭头
            this.ctx.strokeStyle = `rgba(255, 87, 34, ${forceVector.magnitude})`;
            this.ctx.lineWidth = 3;
            this.ctx.beginPath();
            this.ctx.moveTo(startX, startY);
            this.ctx.lineTo(endX, endY);
            this.ctx.stroke();
            
            // 箭头头部
            const angle = Math.atan2(endY - startY, endX - startX);
            const arrowLength = 10;
            
            this.ctx.beginPath();
            this.ctx.moveTo(endX, endY);
            this.ctx.lineTo(
                endX - arrowLength * Math.cos(angle - Math.PI / 6),
                endY - arrowLength * Math.sin(angle - Math.PI / 6)
            );
            this.ctx.moveTo(endX, endY);
            this.ctx.lineTo(
                endX - arrowLength * Math.cos(angle + Math.PI / 6),
                endY - arrowLength * Math.sin(angle + Math.PI / 6)
            );
            this.ctx.stroke();
        }
    }
    
    renderInfoOverlay() {
        // 渲染图例
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.fillRect(10, 10, 200, 120);
        
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = '12px Arial';
        this.ctx.fillText('张量协作力场', 20, 30);
        
        // 图例项
        const legendItems = [
            { color: '#64b5f6', text: 'Agent节点' },
            { color: '#4caf50', text: '共振区域' },
            { color: '#ffc107', text: '协作波动' },
            { color: '#ff5722', text: '力向量' }
        ];
        
        legendItems.forEach((item, index) => {
            const y = 50 + index * 20;
            
            this.ctx.fillStyle = item.color;
            this.ctx.fillRect(20, y - 8, 12, 12);
            
            this.ctx.fillStyle = '#ffffff';
            this.ctx.fillText(item.text, 40, y);
        });
    }
    
    update(systemState) {
        // 更新Agent数据
        if (systemState.agents) {
            this.updateAgentsFromSystem(systemState.agents);
        }
        
        // 更新TCF数据
        if (systemState.tcf) {
            this.updateTCFFromSystem(systemState.tcf);
        }
    }
    
    updateAgentsFromSystem(agents) {
        this.agents = Array.from(agents.values()).map(agent => ({
            id: agent.id,
            position: {
                x: (agent.position?.x || 0) * 0.1 + this.width * 0.5,
                y: (agent.position?.y || 0) * 0.1 + this.height * 0.5
            },
            energy: agent.energy || 50,
            radius: Math.max(10, (agent.energy || 50) * 0.2),
            color: this.getAgentColor(agent.type)
        }));
    }
    
    updateTCFFromSystem(tcfData) {
        if (tcfData.forceVectors) {
            this.forceVectors = tcfData.forceVectors;
        }
        
        if (tcfData.cooperationWaves) {
            this.cooperationWaves = tcfData.cooperationWaves;
        }
        
        if (tcfData.resonanceZones) {
            this.resonanceZones = tcfData.resonanceZones;
        }
    }
    
    updateField(data) {
        this.fieldData = data;
        
        if (data.agents) {
            this.updateAgentsFromSystem(new Map(data.agents.map(agent => [agent.id, agent])));
        }
        
        if (data.tcf) {
            this.updateTCFFromSystem(data.tcf);
        }
    }
    
    getAgentColor(type) {
        const colors = {
            analysis: '#64b5f6',
            processing: '#4fc3f7',
            reasoning: '#4dd0e1',
            coordination: '#4db6ac',
            visualization: '#81c784'
        };
        return colors[type] || '#90a4ae';
    }
    
    destroy() {
        this.stopAnimation();
        if (this.container) {
            this.container.innerHTML = '';
        }
    }
}