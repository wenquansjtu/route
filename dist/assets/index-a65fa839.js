(function(){const t=document.createElement("link").relList;if(t&&t.supports&&t.supports("modulepreload"))return;for(const s of document.querySelectorAll('link[rel="modulepreload"]'))i(s);new MutationObserver(s=>{for(const n of s)if(n.type==="childList")for(const o of n.addedNodes)o.tagName==="LINK"&&o.rel==="modulepreload"&&i(o)}).observe(document,{childList:!0,subtree:!0});function e(s){const n={};return s.integrity&&(n.integrity=s.integrity),s.referrerPolicy&&(n.referrerPolicy=s.referrerPolicy),s.crossOrigin==="use-credentials"?n.credentials="include":s.crossOrigin==="anonymous"?n.credentials="omit":n.credentials="same-origin",n}function i(s){if(s.ep)return;s.ep=!0;const n=e(s);fetch(s.href,n)}})();class v{constructor(t){this.container=document.querySelector(t),this.svg=null,this.simulation=null,this.nodes=[],this.links=[],this.layout="force",this.nodeSize=10,this.linkStrength=1,this.width=0,this.height=0,this.profSmootId=null}init(){if(console.log("NetworkVisualizer init() called"),!this.container){console.error("Container not found for NetworkVisualizer");return}if(typeof d3>"u"){console.error("D3.js is not loaded!");return}console.log("Container found:",this.container),this.container.innerHTML="";const t=this.container.getBoundingClientRect();this.width=t.width||800,this.height=t.height||400,(this.width===0||this.height===0)&&(this.width=800,this.height=400,console.log("Container has zero dimensions, using default size:",this.width,"x",this.height)),console.log("Container dimensions:",this.width,"x",this.height),this.createTopologyControls(),this.svg=d3.select(this.container).append("svg").attr("width","100%").attr("height","100%").attr("viewBox",`0 0 ${this.width} ${this.height}`),this.svg.append("rect").attr("width","100%").attr("height","100%").attr("fill","rgba(0,0,0,0.2)"),this.svg.append("g").attr("class","links"),this.svg.append("g").attr("class","nodes"),this.initSimulation(),this.generateSampleData(),this.render(),console.log("✅ NetworkVisualizer initialized successfully with",this.nodes.length,"nodes and",this.links.length,"links")}createTopologyControls(){const t=document.createElement("div");t.className="topology-controls",t.style.cssText="margin-bottom: 10px; display: flex; align-items: center; gap: 10px;";const e=document.createElement("select");e.id="saved-topologies-dropdown",e.innerHTML='<option value="">Select a saved topology</option>',e.style.cssText="padding: 5px; border-radius: 4px; border: 1px solid #ccc;";const i=document.createElement("button");i.textContent="Refresh List",i.className="btn",i.style.cssText="padding: 5px 10px; border-radius: 4px;";const s=document.createElement("button");s.textContent="Live Network View",s.className="btn",s.style.cssText="padding: 5px 10px; border-radius: 4px; margin-left: 10px;",i.addEventListener("click",()=>{this.updateSavedTopologiesDropdown()}),s.addEventListener("click",()=>{this.refreshLiveView()}),t.appendChild(e),t.appendChild(i),t.appendChild(s),this.container.parentNode.insertBefore(t,this.container),e.addEventListener("change",n=>{const o=n.target.value;o&&this.savedTopologies?this.displaySavedTopology(o):o===""&&this.refreshLiveView()}),this.topologyDropdown=e}updateSavedTopologiesDropdown(){if(!(!this.topologyDropdown||!this.savedTopologies)){for(;this.topologyDropdown.children.length>1;)this.topologyDropdown.removeChild(this.topologyDropdown.lastChild);this.savedTopologies.forEach((t,e)=>{const i=document.createElement("option");i.value=e,i.textContent=`Task ${e.substring(0,8)}... (${new Date(t.timestamp).toLocaleTimeString()})`,this.topologyDropdown.appendChild(i)})}}initSimulation(){this.simulation=d3.forceSimulation().force("link",d3.forceLink().id(t=>t.id).strength(this.linkStrength)).force("charge",d3.forceManyBody().strength(-300)).force("center",d3.forceCenter(this.width/2,this.height/2)).force("collision",d3.forceCollide().radius(this.nodeSize+5)),this.simulation.on("tick",()=>{this.tick()})}tick(){this.svg&&(this.svg.selectAll(".link").attr("x1",t=>t.source.x||0).attr("y1",t=>t.source.y||0).attr("x2",t=>t.target.x||0).attr("y2",t=>t.target.y||0),this.svg.selectAll(".node").attr("transform",t=>`translate(${t.x||0},${t.y||0})`))}generateSampleData(){this.nodes=[{id:"agent1",name:"Agent-1",type:"analysis",status:"online",x:this.width*.3,y:this.height*.3},{id:"agent2",name:"Agent-2",type:"processing",status:"busy",x:this.width*.7,y:this.height*.3},{id:"agent3",name:"Agent-3",type:"reasoning",status:"online",x:this.width*.5,y:this.height*.7},{id:"agent4",name:"Agent-4",type:"coordination",status:"offline",x:this.width*.2,y:this.height*.6},{id:"agent5",name:"Agent-5",type:"visualization",status:"online",x:this.width*.8,y:this.height*.6}],this.links=[{source:"agent1",target:"agent2",strength:.8,type:"collaboration"},{source:"agent2",target:"agent3",strength:.6,type:"data_flow"},{source:"agent1",target:"agent3",strength:.4,type:"coordination"},{source:"agent3",target:"agent5",strength:.7,type:"collaboration"},{source:"agent4",target:"agent1",strength:.3,type:"coordination"}],this.convertLinkReferences()}convertLinkReferences(){!this.nodes||!this.links||(this.links=this.links.map(t=>{let e=t.source,i=t.target;return typeof t.source=="string"&&(e=this.nodes.find(s=>s.id===t.source)),typeof t.target=="string"&&(i=this.nodes.find(s=>s.id===t.target)),e&&i?{...t,source:e,target:i}:(console.warn("Could not find source or target node for link:",t),null)}).filter(t=>t!==null))}setLayout(t){this.layout=t,this.updateLayout()}setNodeSize(t){this.nodeSize=parseInt(t),this.updateNodeSize()}setLinkStrength(t){this.linkStrength=parseFloat(t),this.simulation&&(this.simulation.force("link").strength(this.linkStrength),this.simulation.alpha(.3).restart())}updateLayout(){switch(this.layout){case"force":this.applyForceLayout();break;case"circular":this.applyCircularLayout();break;case"hierarchical":this.applyHierarchicalLayout();break}}applyForceLayout(){this.simulation&&this.simulation.force("center",d3.forceCenter(this.width/2,this.height/2)).force("charge",d3.forceManyBody().strength(-300)).alpha(.5).restart()}applyCircularLayout(){const t=this.width/2,e=this.height/2,i=Math.min(this.width,this.height)*.3;this.nodes.forEach((s,n)=>{const o=n/this.nodes.length*2*Math.PI;s.fx=t+i*Math.cos(o),s.fy=e+i*Math.sin(o)}),this.simulation&&this.simulation.alpha(.3).restart()}applyHierarchicalLayout(){const e=Math.ceil(this.nodes.length/3);this.nodes.forEach((i,s)=>{const n=Math.floor(s/e),o=s%e,a=this.width*.8,r=this.height/(3+1);i.fx=(this.width-a)/2+a/(e+1)*(o+1),i.fy=r*(n+1)}),this.simulation&&this.simulation.alpha(.3).restart()}updateNodeSize(){this.svg.selectAll(".node circle").attr("r",this.nodeSize),this.simulation&&(this.simulation.force("collision").radius(this.nodeSize+5),this.simulation.alpha(.1).restart())}render(){!this.nodes||!this.links||(this.renderLinks(),this.renderNodes(),this.simulation&&this.nodes.length>0&&this.links.length>0&&(this.convertLinkReferences(),this.simulation.nodes(this.nodes),this.simulation.force("link").links(this.links),this.hasSavedTopologyDisplayed()||this.simulation.alpha(.3).restart()))}renderNodes(){const t=this.svg.select(".nodes").selectAll(".node").data(this.nodes,s=>s.id);t.exit().remove();const e=t.enter().append("g").attr("class","node").call(this.drag(this.simulation));e.append("circle").attr("r",this.nodeSize).attr("fill",s=>this.getNodeColor(s)).attr("stroke",s=>this.getNodeStroke(s)).attr("stroke-width",s=>s.isProfSmoot?3:1.5).attr("class",s=>s.isProfSmoot?"prof-smoot-node":""),e.append("text").attr("x",0).attr("y",s=>this.nodeSize+15).attr("text-anchor","middle").attr("class","node-label").text(s=>this.getNodeLabel(s)),e.filter(s=>s.isProfSmoot).append("text").attr("x",0).attr("y",5).attr("text-anchor","middle").attr("class","node-icon").text("🌌");const i=e.merge(t);i.select("circle").attr("fill",s=>this.getNodeColor(s)).attr("stroke",s=>this.getNodeStroke(s)).attr("stroke-width",s=>s.isProfSmoot?3:1.5),i.select(".node-label").text(s=>this.getNodeLabel(s))}renderLinks(){const t=this.svg.select(".links").selectAll(".link").data(this.links,s=>`${s.source.id||s.source}-${s.target.id||s.target}`);t.exit().remove(),t.enter().append("line").attr("class","link").attr("stroke",s=>this.getLinkColor(s)).attr("stroke-width",s=>this.getLinkWidth(s)).attr("stroke-opacity",.6).merge(t).attr("stroke",s=>this.getLinkColor(s)).attr("stroke-width",s=>this.getLinkWidth(s))}getNodeColor(t){return t.isProfSmoot?"#9333ea":t.group==="agent"?{analyzer:"#3b82f6",reasoner:"#10b981",synthesizer:"#f59e0b",validator:"#ef4444",innovator:"#8b5cf6",cosmic_structure_expert:"#9333ea"}[t.type]||"#60a5fa":"#94a3b8"}getNodeStroke(t){return t.isProfSmoot?"#ffffff":t.status==="completed"?"#10b981":t.status==="busy"?"#f59e0b":t.status==="offline"?"#ef4444":"#ffffff"}getNodeLabel(t){return t.name?t.name.length>12?t.name.substring(0,12)+"...":t.name:t.id.substring(0,8)}getLinkColor(t){return{execution:"#60a5fa",sequence:"#10b981",collaboration:"#8b5cf6",data_flow:"#f59e0b"}[t.type]||"#94a3b8"}getLinkWidth(t){return t.type==="sequence"?2:t.type==="execution"?3:1.5}drag(t){function e(n,o){n.active||t.alphaTarget(.3).restart(),o.fx=o.x,o.fy=o.y}function i(n,o){o.fx=n.x,o.fy=n.y}function s(n,o){n.active||t.alphaTarget(0),o.fx=null,o.fy=null}return d3.drag().on("start",e).on("drag",i).on("end",s)}updateNodesFromAgents(t){this.nodes=Array.from(t.values()).map(e=>({id:e.id,name:e.name||e.id,type:e.type||"unknown",status:e.status||"online",x:e.position?e.position.x*this.width:Math.random()*this.width,y:e.position?e.position.y*this.height:Math.random()*this.height})),console.log("Updated nodes:",this.nodes.length)}updateLinksFromTopology(t){t.connections&&(this.links=t.connections.map(e=>({source:e.source,target:e.target,strength:e.strength||.5,type:e.type||"collaboration"})),console.log("Updated links:",this.links.length))}update(t){if(console.log("NetworkVisualizer update called with:",t),this.hasSavedTopologyDisplayed()){console.log("Skipping update - saved topology is displayed");return}if(!this.svg){console.log("SVG not initialized, calling init()..."),this.init();return}t&&t.agents&&t.agents.size>0?(console.log("Updating nodes from agents:",t.agents.size),this.updateNodesFromAgents(t.agents)):console.log("No agents in system state, using sample data"),t&&t.topology&&t.topology.connections?(console.log("Updating links from topology:",t.topology.connections.length),this.updateLinksFromTopology(t.topology)):console.log("No topology data, using sample connections"),this.convertLinkReferences(),this.simulation&&(this.simulation.nodes(this.nodes),this.simulation.force("link").links(this.links),this.simulation.alpha(.3).restart()),this.render()}updateWithTaskChain(t){if(console.log("Updating network visualization with task chain:",t),!t||!t.executionPath){console.warn("No task chain data or execution path provided");return}this.convertTaskChainToNetwork(t.executionPath),this.render(),this.savedTopologies||(this.savedTopologies=new Map),this.savedTopologies.set(t.id,{nodes:[...this.nodes],links:[...this.links],timestamp:Date.now(),taskInfo:{id:t.id,metrics:t.metrics||{}}}),this.updateSavedTopologiesDropdown()}convertTaskChainToNetwork(t){const e=new Map,i=new Map;t.forEach((s,n)=>{if(!e.has(s.agentId)){const a=s.agentDetails&&s.agentDetails.length>0?s.agentDetails.find(r=>r.id===s.agentId):null;e.set(s.agentId,{id:s.agentId,name:a?a.name:`Agent-${s.agentId.substring(0,8)}`,type:a?a.type:"agent",status:"completed",x:Math.random()*this.width,y:Math.random()*this.height,group:"agent",isProfSmoot:a?a.name==="Prof. Smoot":!1})}const o=s.taskId||`task_${n}`;i.has(o)||i.set(o,{id:o,name:s.taskName||`Task-${o.substring(0,8)}`,type:"task",status:"completed",x:Math.random()*this.width,y:Math.random()*this.height,group:"task"})}),this.nodes=[...e.values(),...i.values()],this.links=t.map(s=>{const n=s.taskId||`task_${t.indexOf(s)}`;return{source:s.agentId,target:n,type:"execution",timestamp:s.timestamp,heatLevel:s.heatLevel||.5}});for(let s=0;s<t.length-1;s++){const n=t[s].taskId||`task_${s}`,o=t[s+1].taskId||`task_${s+1}`;this.links.push({source:n,target:o,type:"sequence",timestamp:t[s].timestamp})}this.convertLinkReferences(),console.log("Converted task chain to network:",{nodes:this.nodes.length,links:this.links.length})}displaySavedTopology(t){if(!this.savedTopologies)return console.warn("No saved topologies available"),!1;const e=this.savedTopologies.get(t);return e?(this.nodes=e.nodes.map(i=>({...i})),this.links=e.links.map(i=>({...i})),this.convertLinkReferences(),this.render(),this.topologyDropdown&&(this.topologyDropdown.value=t),console.log("Displayed saved topology for task chain:",t),!0):(console.warn("Saved topology not found for task chain:",t),!1)}getSavedTopologies(){return this.savedTopologies?Array.from(this.savedTopologies.entries()).map(([t,e])=>({id:t,timestamp:e.timestamp,taskInfo:e.taskInfo})):[]}clearSavedTopologies(){this.savedTopologies&&this.savedTopologies.clear(),this.updateSavedTopologiesDropdown()}hasSavedTopologyDisplayed(){if(!this.savedTopologies||this.savedTopologies.size===0)return!1;if(this.topologyDropdown&&this.topologyDropdown.value)return this.savedTopologies.has(this.topologyDropdown.value);if(this.nodes&&this.nodes.length>0){const t=this.nodes.some(i=>i.group==="task"),e=this.nodes.some(i=>i.group==="agent");return t&&e}return!1}clearCurrentVisualization(){this.topologyDropdown&&(this.topologyDropdown.value=""),this.simulation&&this.simulation.stop(),this.svg&&this.svg.selectAll("*").remove(),this.generateSampleData(),this.render(),this.simulation&&this.simulation.alpha(.3).restart()}refreshLiveView(){this.clearCurrentVisualization(),window.cosmicApp&&window.cosmicApp.fetchRealAIAgents()}updateNodesFromAgents(t){this.nodes=Array.from(t.values()).map(e=>{var s,n;const i=e.name&&e.name.includes("Prof. Smoot");return i&&(this.profSmootId=e.id),{id:e.id,name:e.name||`Agent-${e.id.slice(0,8)}`,type:e.type||"general",status:e.status||"online",isProfSmoot:i,x:(s=e.position)!=null&&s.x?e.position.x*this.width:Math.random()*this.width,y:(n=e.position)!=null&&n.y?e.position.y*this.height:Math.random()*this.height}})}updateLinksFromTopology(t){t.connections&&(this.links=t.connections.map(e=>({source:e.source,target:e.target,strength:e.strength||.5,type:e.type||"collaboration"})),console.log("Updated links:",this.links.length))}updateTopology(t){t.nodes&&this.updateNodesFromAgents(new Map(t.nodes.map(e=>[e.id,e]))),t.edges&&(this.links=t.edges.map(e=>({source:e.source,target:e.target,strength:e.weight||.5,type:e.type||"collaboration"}))),this.convertLinkReferences(),this.render()}highlightExecutionStep(t){this.svg&&(this.svg.selectAll(".node").filter(e=>e.id===t.agentId).select("circle").attr("stroke","#ffeb3b").attr("stroke-width",4),this.svg.selectAll(".node").filter(e=>e.id===t.taskId).select("circle").attr("stroke","#ffeb3b").attr("stroke-width",4),this.svg.selectAll(".link").filter(e=>e.source.id===t.agentId&&e.target.id===t.taskId).attr("stroke","#ffeb3b").attr("stroke-width",3))}}class w{constructor(t){this.container=document.querySelector(t),this.canvas=null,this.ctx=null,this.width=0,this.height=0,this.fieldData=null,this.agents=[],this.forceVectors=[],this.cooperationWaves=[],this.resonanceZones=[],this.animationId=null,this.time=0,this.scale=1,this.offsetX=0,this.offsetY=0}init(){if(!this.container)return;this.container.innerHTML="";const t=this.container.getBoundingClientRect();this.width=t.width,this.height=t.height,this.canvas=document.createElement("canvas"),this.canvas.width=this.width,this.canvas.height=this.height,this.canvas.style.width="100%",this.canvas.style.height="100%",this.container.appendChild(this.canvas),this.ctx=this.canvas.getContext("2d"),this.generateSampleData(),this.startAnimation()}generateSampleData(){this.agents=[{id:"agent1",position:{x:this.width*.3,y:this.height*.3},energy:80,radius:15,color:"#64b5f6"},{id:"agent2",position:{x:this.width*.7,y:this.height*.3},energy:90,radius:18,color:"#4fc3f7"},{id:"agent3",position:{x:this.width*.5,y:this.height*.7},energy:70,radius:12,color:"#4dd0e1"}],this.forceVectors=[{agentId:"agent1",vector:{x:20,y:10},magnitude:.8},{agentId:"agent2",vector:{x:-15,y:25},magnitude:.6},{agentId:"agent3",vector:{x:5,y:-20},magnitude:.7}],this.cooperationWaves=[{center:{x:this.width*.5,y:this.height*.5},radius:50,maxRadius:100,amplitude:.8,frequency:2,startTime:Date.now()}],this.resonanceZones=[{center:{x:this.width*.4,y:this.height*.4},radius:60,strength:.9,agents:["agent1","agent2"]}]}startAnimation(){const t=()=>{this.time+=.016,this.render(),this.animationId=requestAnimationFrame(t)};t()}stopAnimation(){this.animationId&&(cancelAnimationFrame(this.animationId),this.animationId=null)}render(){this.ctx.clearRect(0,0,this.width,this.height),this.ctx.fillStyle="rgba(0, 0, 0, 0.1)",this.ctx.fillRect(0,0,this.width,this.height),this.renderFieldGrid(),this.renderResonanceZones(),this.renderCooperationWaves(),this.renderAgents(),this.renderForceVectors(),this.renderInfoOverlay()}renderFieldGrid(){const e=Math.ceil(this.height/20),i=Math.ceil(this.width/20);this.ctx.strokeStyle="rgba(100, 181, 246, 0.1)",this.ctx.lineWidth=.5,this.ctx.beginPath();for(let s=0;s<=i;s++){const n=s*20;this.ctx.moveTo(n,0),this.ctx.lineTo(n,this.height)}for(let s=0;s<=e;s++){const n=s*20;this.ctx.moveTo(0,n),this.ctx.lineTo(this.width,n)}this.ctx.stroke();for(let s=0;s<i;s+=2)for(let n=0;n<e;n+=2){const o=s*20,a=n*20,r=this.calculateFieldStrengthAt(o,a);r>.1&&(this.ctx.fillStyle=`rgba(100, 181, 246, ${Math.min(r,.8)})`,this.ctx.beginPath(),this.ctx.arc(o,a,2,0,Math.PI*2),this.ctx.fill())}}calculateFieldStrengthAt(t,e){let i=0;for(const s of this.agents){const n=t-s.position.x,o=e-s.position.y,a=Math.sqrt(n*n+o*o);if(a>0){const r=s.energy/100/(1+a*.01);i+=r}}return Math.min(i,1)}renderResonanceZones(){for(const t of this.resonanceZones){const e=.1*Math.sin(this.time*3),i=t.radius*(1+e),s=this.ctx.createRadialGradient(t.center.x,t.center.y,0,t.center.x,t.center.y,i);s.addColorStop(0,`rgba(76, 175, 80, ${t.strength*.3})`),s.addColorStop(1,"rgba(76, 175, 80, 0)"),this.ctx.fillStyle=s,this.ctx.beginPath(),this.ctx.arc(t.center.x,t.center.y,i,0,Math.PI*2),this.ctx.fill(),this.ctx.strokeStyle=`rgba(76, 175, 80, ${t.strength*.6})`,this.ctx.lineWidth=2,this.ctx.setLineDash([5,5]),this.ctx.beginPath(),this.ctx.arc(t.center.x,t.center.y,i,0,Math.PI*2),this.ctx.stroke(),this.ctx.setLineDash([])}}renderCooperationWaves(){const t=Date.now();for(const e of this.cooperationWaves){const s=(t-e.startTime)/1e3*e.frequency;if(s>0&&s<5){const n=e.radius+s*20,o=Math.max(0,e.amplitude*(1-s/5));this.ctx.strokeStyle=`rgba(255, 193, 7, ${o})`,this.ctx.lineWidth=3,this.ctx.beginPath(),this.ctx.arc(e.center.x,e.center.y,n,0,Math.PI*2),this.ctx.stroke(),n>20&&(this.ctx.strokeStyle=`rgba(255, 193, 7, ${o*.5})`,this.ctx.lineWidth=1,this.ctx.beginPath(),this.ctx.arc(e.center.x,e.center.y,n-20,0,Math.PI*2),this.ctx.stroke())}}}renderAgents(){for(const t of this.agents){const e=.1*Math.sin(this.time*2+t.position.x*.01),i=t.radius*(1+e),s=this.ctx.createRadialGradient(t.position.x,t.position.y,0,t.position.x,t.position.y,i*2);s.addColorStop(0,t.color+"40"),s.addColorStop(1,t.color+"00"),this.ctx.fillStyle=s,this.ctx.beginPath(),this.ctx.arc(t.position.x,t.position.y,i*2,0,Math.PI*2),this.ctx.fill(),this.ctx.fillStyle=t.color,this.ctx.beginPath(),this.ctx.arc(t.position.x,t.position.y,i,0,Math.PI*2),this.ctx.fill(),this.ctx.strokeStyle="#ffffff",this.ctx.lineWidth=2,this.ctx.beginPath(),this.ctx.arc(t.position.x,t.position.y,i,0,Math.PI*2),this.ctx.stroke();const n=t.energy/100*Math.PI*2;this.ctx.strokeStyle="#4caf50",this.ctx.lineWidth=3,this.ctx.beginPath(),this.ctx.arc(t.position.x,t.position.y,i+5,-Math.PI/2,-Math.PI/2+n),this.ctx.stroke()}}renderForceVectors(){for(const t of this.forceVectors){const e=this.agents.find(l=>l.id===t.agentId);if(!e)continue;const i=e.position.x,s=e.position.y,n=i+t.vector.x*t.magnitude*2,o=s+t.vector.y*t.magnitude*2;this.ctx.strokeStyle=`rgba(255, 87, 34, ${t.magnitude})`,this.ctx.lineWidth=3,this.ctx.beginPath(),this.ctx.moveTo(i,s),this.ctx.lineTo(n,o),this.ctx.stroke();const a=Math.atan2(o-s,n-i),r=10;this.ctx.beginPath(),this.ctx.moveTo(n,o),this.ctx.lineTo(n-r*Math.cos(a-Math.PI/6),o-r*Math.sin(a-Math.PI/6)),this.ctx.moveTo(n,o),this.ctx.lineTo(n-r*Math.cos(a+Math.PI/6),o-r*Math.sin(a+Math.PI/6)),this.ctx.stroke()}}renderInfoOverlay(){this.ctx.fillStyle="rgba(0, 0, 0, 0.7)",this.ctx.fillRect(10,10,200,120),this.ctx.fillStyle="#ffffff",this.ctx.font="12px Arial",this.ctx.fillText("张量协作力场",20,30),[{color:"#64b5f6",text:"Agent节点"},{color:"#4caf50",text:"共振区域"},{color:"#ffc107",text:"协作波动"},{color:"#ff5722",text:"力向量"}].forEach((e,i)=>{const s=50+i*20;this.ctx.fillStyle=e.color,this.ctx.fillRect(20,s-8,12,12),this.ctx.fillStyle="#ffffff",this.ctx.fillText(e.text,40,s)})}update(t){t.agents&&this.updateAgentsFromSystem(t.agents),t.tcf&&this.updateTCFFromSystem(t.tcf)}updateAgentsFromSystem(t){this.agents=Array.from(t.values()).map(e=>{var i,s;return{id:e.id,position:{x:(((i=e.position)==null?void 0:i.x)||0)*.1+this.width*.5,y:(((s=e.position)==null?void 0:s.y)||0)*.1+this.height*.5},energy:e.energy||50,radius:Math.max(10,(e.energy||50)*.2),color:this.getAgentColor(e.type)}})}updateTCFFromSystem(t){t.forceVectors&&(this.forceVectors=t.forceVectors),t.cooperationWaves&&(this.cooperationWaves=t.cooperationWaves),t.resonanceZones&&(this.resonanceZones=t.resonanceZones)}updateField(t){this.fieldData=t,t.agents&&this.updateAgentsFromSystem(new Map(t.agents.map(e=>[e.id,e]))),t.tcf&&this.updateTCFFromSystem(t.tcf)}getAgentColor(t){return{analysis:"#64b5f6",processing:"#4fc3f7",reasoning:"#4dd0e1",coordination:"#4db6ac",visualization:"#81c784"}[t]||"#90a4ae"}destroy(){this.stopAnimation(),this.container&&(this.container.innerHTML="")}}class x{constructor(t){this.container=document.querySelector(t),this.svg=null,this.simulation=null,this.nodes=[],this.links=[],this.taskChainData=null,this.width=0,this.height=0}init(){if(console.log("TaskChainVisualizer init() called"),!this.container){console.error("Container not found for TaskChainVisualizer");return}if(typeof d3>"u"){console.error("D3.js is not loaded!");return}console.log("Container found:",this.container),this.container.innerHTML="";const t=this.container.getBoundingClientRect();this.width=t.width||800,this.height=t.height||400,(this.width===0||this.height===0)&&(this.width=800,this.height=400,console.log("Container has zero dimensions, using default size:",this.width,"x",this.height)),console.log("Container dimensions:",this.width,"x",this.height),this.svg=d3.select(this.container).append("svg").attr("width","100%").attr("height","100%").attr("viewBox",`0 0 ${this.width} ${this.height}`),this.svg.append("rect").attr("width","100%").attr("height","100%").attr("fill","rgba(0,0,0,0.2)"),this.svg.append("g").attr("class","links"),this.svg.append("g").attr("class","nodes"),this.initSimulation(),console.log("✅ TaskChainVisualizer initialized successfully")}initSimulation(){this.simulation=d3.forceSimulation().force("link",d3.forceLink().id(t=>t.id).strength(1)).force("charge",d3.forceManyBody().strength(-300)).force("center",d3.forceCenter(this.width/2,this.height/2)).force("collision",d3.forceCollide().radius(20)),this.simulation.on("tick",()=>{this.tick()})}tick(){this.svg.selectAll(".link").attr("x1",t=>t.source.x).attr("y1",t=>t.source.y).attr("x2",t=>t.target.x).attr("y2",t=>t.target.y),this.svg.selectAll(".node").attr("transform",t=>`translate(${t.x},${t.y})`)}updateTaskChain(t){if(console.log("Updating task chain visualization:",t),!t||!t.executionPath){console.warn("No task chain data or execution path provided");return}this.taskChainData=t,this.convertExecutionPathToGraph(t.executionPath),this.render()}convertExecutionPathToGraph(t){const e=new Map,i=new Map;t.forEach((s,n)=>{e.has(s.agentId)||e.set(s.agentId,{id:s.agentId,name:`Agent-${s.agentId.substring(0,8)}`,type:"agent",status:"completed",x:Math.random()*this.width,y:Math.random()*this.height,group:"agent"});const o=s.taskId;i.has(o)||i.set(o,{id:o,name:`Task-${o.substring(0,8)}`,type:"task",status:"completed",x:Math.random()*this.width,y:Math.random()*this.height,group:"task"})}),this.nodes=[...e.values(),...i.values()],this.links=t.map(s=>({source:s.agentId,target:s.taskId,type:"execution",timestamp:s.timestamp,heatLevel:s.heatLevel||.5}));for(let s=0;s<t.length-1;s++)this.links.push({source:t[s].taskId,target:t[s+1].taskId,type:"sequence",timestamp:t[s].timestamp});console.log("Converted execution path to graph:",{nodes:this.nodes.length,links:this.links.length})}render(){if(!this.svg){console.error("SVG not initialized");return}this.renderLinks(),this.renderNodes(),this.simulation&&(this.simulation.nodes(this.nodes),this.simulation.force("link").links(this.links),this.simulation.alpha(.3).restart())}renderNodes(){const t=this.svg.select(".nodes").selectAll(".node").data(this.nodes,s=>s.id);t.exit().remove();const e=t.enter().append("g").attr("class","node").call(this.drag(this.simulation));e.append("circle").attr("r",s=>this.getNodeSize(s)).attr("fill",s=>this.getNodeColor(s)).attr("stroke",s=>this.getNodeStroke(s)).attr("stroke-width",2),e.append("text").attr("x",0).attr("y",5).attr("text-anchor","middle").attr("class","node-icon").text(s=>this.getNodeIcon(s)),e.append("text").attr("x",0).attr("y",s=>this.getNodeSize(s)+15).attr("text-anchor","middle").attr("class","node-label").text(s=>this.getNodeLabel(s));const i=e.merge(t);i.select("circle").attr("fill",s=>this.getNodeColor(s)).attr("stroke",s=>this.getNodeStroke(s)),i.select(".node-icon").text(s=>this.getNodeIcon(s)),i.select(".node-label").text(s=>this.getNodeLabel(s))}renderLinks(){const t=this.svg.select(".links").selectAll(".link").data(this.links,s=>`${s.source.id||s.source}-${s.target.id||s.target}`);t.exit().remove(),t.enter().append("line").attr("class","link").attr("stroke",s=>this.getLinkColor(s)).attr("stroke-width",s=>this.getLinkWidth(s)).attr("stroke-opacity",.7).merge(t).attr("stroke",s=>this.getLinkColor(s)).attr("stroke-width",s=>this.getLinkWidth(s))}getNodeIcon(t){return t.type==="agent"?t.isProfSmoot?"🌌":"🤖":t.type==="task"?"📋":"●"}getNodeSize(t){return t.type==="agent"?20:t.type==="task"?15:10}getNodeColor(t){return t.isProfSmoot?"#9333ea":t.type==="agent"?{analyzer:"#3b82f6",reasoner:"#10b981",synthesizer:"#f59e0b",validator:"#ef4444",innovator:"#8b5cf6",cosmic_structure_expert:"#9333ea"}[t.type]||"#60a5fa":t.type==="task"?"#94a3b8":"#60a5fa"}getNodeStroke(t){return t.status==="completed"?"#10b981":t.status==="busy"?"#f59e0b":t.status==="offline"?"#ef4444":"#ffffff"}getNodeLabel(t){return t.name?t.name.length>15?t.name.substring(0,15)+"...":t.name:t.id.substring(0,8)}getLinkColor(t){return{execution:"#60a5fa",sequence:"#10b981"}[t.type]||"#94a3b8"}getLinkWidth(t){return t.type==="sequence"?3:t.type==="execution"?2:1.5}drag(t){function e(n,o){n.active||t.alphaTarget(.3).restart(),o.fx=o.x,o.fy=o.y}function i(n,o){o.fx=n.x,o.fy=n.y}function s(n,o){n.active||t.alphaTarget(0),o.fx=null,o.fy=null}return d3.drag().on("start",e).on("drag",i).on("end",s)}convertExecutionPathToGraph(t){const e=new Map,i=new Map;t.forEach((s,n)=>{e.has(s.agentId)||e.set(s.agentId,{id:s.agentId,name:`Agent-${s.agentId.substring(0,8)}`,type:"agent",status:"completed",x:Math.random()*this.width,y:Math.random()*this.height,group:"agent"});const o=s.taskId;i.has(o)||i.set(o,{id:o,name:s.taskName||`Task-${o.substring(0,8)}`,type:"task",status:"completed",x:Math.random()*this.width,y:Math.random()*this.height,group:"task"})}),this.nodes=[...e.values(),...i.values()],this.links=t.map(s=>({source:s.agentId,target:s.taskId,type:"execution",timestamp:s.timestamp,heatLevel:s.heatLevel||.5}));for(let s=0;s<t.length-1;s++)this.links.push({source:t[s].taskId,target:t[s+1].taskId,type:"sequence",timestamp:t[s].timestamp});console.log("Converted execution path to graph:",{nodes:this.nodes.length,links:this.links.length})}clear(){console.log("Clearing task chain visualization"),this.nodes=[],this.links=[],this.taskChainData=null,this.svg&&(this.svg.select(".nodes").selectAll("*").remove(),this.svg.select(".links").selectAll("*").remove()),this.simulation&&this.simulation.stop()}refresh(){this.taskChainData&&this.updateTaskChain(this.taskChainData)}}class C{constructor(){this.container=null}init(){console.log("协作监控组件已初始化")}update(t){var e;this.updateCollaborationSessions(t.collaborationSessions),this.updateConvergenceChart(t.convergenceState),this.updateAgentPerformance(t.agents),this.updateResonanceZones((e=t.tcf)==null?void 0:e.resonanceZones)}updateCollaborationSessions(t){const e=document.getElementById("collaboration-sessions");if(!e||!t)return;e.innerHTML="";const i=Array.from(t.values()).filter(s=>s.status==="active");if(i.length===0){e.innerHTML='<p class="text-muted">暂无活跃协作会话</p>';return}i.forEach(s=>{var o;const n=document.createElement("div");n.className="session-item",n.innerHTML=`
                <div class="session-header">
                    <span class="session-id">${s.id.slice(0,8)}</span>
                    <span class="session-status">${s.strategy}</span>
                </div>
                <div class="session-participants">
                    参与者: ${s.participants.size}个Agent
                </div>
                <div class="session-progress">
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${(((o=s.convergenceTracker)==null?void 0:o.consensus)||0)*100}%"></div>
                    </div>
                </div>
            `,e.appendChild(n)})}updateConvergenceChart(t){const e=document.getElementById("convergence-chart");if(e){if(!t){e.innerHTML='<p class="text-muted">暂无收敛数据</p>';return}e.innerHTML=`
            <div class="convergence-metrics">
                <div class="metric-item">
                    <span class="metric-label">全局共识度</span>
                    <span class="metric-value">${(t.globalConsensus*100).toFixed(1)}%</span>
                </div>
                <div class="metric-item">
                    <span class="metric-label">任务完成率</span>
                    <span class="metric-value">${(t.taskCompletionRate*100).toFixed(1)}%</span>
                </div>
                <div class="metric-item">
                    <span class="metric-label">协作效率</span>
                    <span class="metric-value">${(t.collaborationEfficiency*100).toFixed(1)}%</span>
                </div>
                <div class="metric-item">
                    <span class="metric-label">网络稳定性</span>
                    <span class="metric-value">${(t.networkStability*100).toFixed(1)}%</span>
                </div>
            </div>
        `}}updateAgentPerformance(t){const e=document.getElementById("agent-performance");if(!e||!t)return;e.innerHTML="";const i=Array.from(t.values()).sort((s,n)=>(n.performanceScore||0)-(s.performanceScore||0)).slice(0,5);if(i.length===0){e.innerHTML='<p class="text-muted">暂无Agent数据</p>';return}i.forEach(s=>{const n=document.createElement("div");n.className="agent-performance-item",n.innerHTML=`
                <div class="agent-name">${s.name||s.id.slice(0,8)}</div>
                <div class="agent-score">
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${(s.performanceScore||0)*100}%"></div>
                    </div>
                    <span class="score-text">${((s.performanceScore||0)*100).toFixed(1)}%</span>
                </div>
            `,e.appendChild(n)})}updateResonanceZones(t){const e=document.getElementById("resonance-zones");if(e){if(!t||t.length===0){e.innerHTML='<p class="text-muted">暂无共振区域</p>';return}e.innerHTML="",t.forEach((i,s)=>{var o;const n=document.createElement("div");n.className="resonance-zone-item",n.innerHTML=`
                <div class="zone-header">
                    <span class="zone-id">区域 ${s+1}</span>
                    <span class="zone-strength">${(i.strength*100).toFixed(0)}%</span>
                </div>
                <div class="zone-agents">
                    涉及Agent: ${((o=i.agents)==null?void 0:o.length)||0}个
                </div>
                <div class="zone-coherence">
                    相干性: ${(i.coherence*100).toFixed(1)}%
                </div>
            `,e.appendChild(n)})}}}class T{constructor(){this.container=null}init(){console.log("任务管理组件已初始化")}update(t){this.updateTaskQueue(t.tasks),this.updateExecutingTasks(t.tasks),this.updateCompletedTasks(t.tasks),this.updateTaskChains(t.taskChains)}updateTaskQueue(t){const e=document.getElementById("task-queue");if(!e||!t)return;const i=Array.from(t.values()).filter(s=>s.status==="pending").sort((s,n)=>(n.priority||0)-(s.priority||0));this.renderTaskList(e,i,"暂无等待任务")}updateExecutingTasks(t){const e=document.getElementById("executing-tasks");if(!e||!t)return;const i=Array.from(t.values()).filter(s=>s.status==="executing");this.renderTaskList(e,i,"暂无执行中任务")}updateCompletedTasks(t){const e=document.getElementById("completed-tasks");if(!e||!t)return;const i=Array.from(t.values()).filter(s=>s.status==="completed").slice(0,10);if(e.innerHTML="",i.length===0){e.innerHTML='<p class="text-muted">暂无已完成任务</p>';return}i.forEach(s=>{var o;const n=document.createElement("div");n.className="task-item",n.innerHTML=`
                <div class="task-header">
                    <span class="task-name">${s.name||((o=s.id)==null?void 0:o.slice(0,8))}</span>
                    <span class="task-priority">优先级: ${s.priority||0}</span>
                </div>
                <div class="task-type">${this.getTaskTypeText(s.type)}</div>
                <div class="task-collaboration">${this.getCollaborationTypeText(s.collaborationType)}</div>
                ${s.assignedAgents?`<div class="task-agents">分配Agent: ${s.assignedAgents.size}</div>`:""}
                <button class="btn btn-small view-topology-btn" data-task-id="${s.id}" style="margin-top: 8px;">View Topology</button>
            `,e.appendChild(n)}),e.querySelectorAll(".view-topology-btn").forEach(s=>{s.addEventListener("click",n=>{const o=n.target.getAttribute("data-task-id"),a=window.cosmicApp;if(a&&a.systemState&&a.systemState.taskChains){let r=null;for(const[l,d]of a.systemState.taskChains.entries())if(d.taskId===o){r=l;break}r&&a.networkViz&&(a.switchView("network"),setTimeout(()=>{a.networkViz.displaySavedTopology(r)},100))}})})}updateTaskChains(t){const e=document.getElementById("task-chains");if(!e||!t)return;e.innerHTML="";const i=Array.from(t.values());if(i.length===0){e.innerHTML='<p class="text-muted">暂无任务链</p>';return}i.forEach(s=>{var o,a;const n=document.createElement("div");n.className="task-chain-item",n.innerHTML=`
                <div class="chain-header">
                    <span class="chain-name">${s.name}</span>
                    <span class="chain-status">${this.getChainStatusText(s.status)}</span>
                </div>
                <div class="chain-progress">
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${(s.progress||0)*100}%"></div>
                    </div>
                    <span class="progress-text">${((s.progress||0)*100).toFixed(0)}%</span>
                </div>
                <div class="chain-tasks">
                    任务数: ${((o=s.tasks)==null?void 0:o.length)||0} | 已完成: ${((a=s.completedTasks)==null?void 0:a.size)||0}
                </div>
            `,e.appendChild(n)})}renderTaskList(t,e,i){if(t.innerHTML="",e.length===0){t.innerHTML=`<p class="text-muted">${i}</p>`;return}e.forEach(s=>{var o;const n=document.createElement("div");n.className="task-item",n.innerHTML=`
                <div class="task-header">
                    <span class="task-name">${s.name||((o=s.id)==null?void 0:o.slice(0,8))}</span>
                    <span class="task-priority">优先级: ${s.priority||0}</span>
                </div>
                <div class="task-type">${this.getTaskTypeText(s.type)}</div>
                <div class="task-collaboration">${this.getCollaborationTypeText(s.collaborationType)}</div>
                ${s.assignedAgents?`<div class="task-agents">分配Agent: ${s.assignedAgents.size}</div>`:""}
            `,t.appendChild(n)})}getTaskTypeText(t){return{analysis:"数据分析",processing:"数据处理",reasoning:"推理任务",collaboration:"协作任务"}[t]||t}getCollaborationTypeText(t){return{sequential:"顺序协作",parallel:"并行协作",hierarchical:"分层协作"}[t]||t}getChainStatusText(t){return{pending:"等待中",running:"运行中",completed:"已完成",failed:"失败"}[t]||t}}class S{constructor(){this.container=null,this.charts=new Map}init(){console.log("系统监控组件已初始化")}update(t){var e,i;this.updatePerformanceCharts(t.metrics),this.updateResourceUsage(t.agents),this.updateCooperationWaves((e=t.tcf)==null?void 0:e.cooperationWaves),this.updateSingularityDetection((i=t.tcf)==null?void 0:i.singularityPoints)}updatePerformanceCharts(t){const e=document.getElementById("performance-charts");if(e){if(!t){e.innerHTML='<p class="text-muted">暂无性能数据</p>';return}e.innerHTML=`
            <div class="performance-metrics">
                <div class="metric-card">
                    <div class="metric-title">处理任务总数</div>
                    <div class="metric-number">${t.totalTasksProcessed||0}</div>
                </div>
                <div class="metric-card">
                    <div class="metric-title">成功协作数</div>
                    <div class="metric-number">${t.successfulCollaborations||0}</div>
                </div>
                <div class="metric-card">
                    <div class="metric-title">平均响应时间</div>
                    <div class="metric-number">${(t.averageResponseTime||0).toFixed(2)}ms</div>
                </div>
                <div class="metric-card">
                    <div class="metric-title">质量分数</div>
                    <div class="metric-number">${((t.qualityScore||0)*100).toFixed(1)}%</div>
                </div>
            </div>
        `}}updateResourceUsage(t){const e=document.getElementById("resource-usage");if(!e||!t)return;const i=Array.from(t.values()),s=i.length,n=i.filter(a=>{var r;return((r=a.currentTasks)==null?void 0:r.size)>0}).length,o=s>0?n/s:0;e.innerHTML=`
            <div class="resource-metrics">
                <div class="resource-item">
                    <span class="resource-label">总Agent数</span>
                    <span class="resource-value">${s}</span>
                </div>
                <div class="resource-item">
                    <span class="resource-label">活跃Agent数</span>
                    <span class="resource-value">${n}</span>
                </div>
                <div class="resource-item">
                    <span class="resource-label">平均负载</span>
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${o*100}%"></div>
                    </div>
                    <span class="resource-value">${(o*100).toFixed(1)}%</span>
                </div>
            </div>
        `}updateCooperationWaves(t){const e=document.getElementById("cooperation-waves");if(e){if(!t||t.length===0){e.innerHTML='<p class="text-muted">暂无协作波动</p>';return}e.innerHTML="",t.slice(0,5).forEach((i,s)=>{var o,a;const n=document.createElement("div");n.className="wave-item",n.innerHTML=`
                <div class="wave-header">
                    <span class="wave-id">波动 ${s+1}</span>
                    <span class="wave-amplitude">${(i.amplitude*100).toFixed(0)}%</span>
                </div>
                <div class="wave-source">源Agent: ${(o=i.sourceAgentId)==null?void 0:o.slice(0,8)}</div>
                <div class="wave-frequency">频率: ${(a=i.frequency)==null?void 0:a.toFixed(2)}Hz</div>
            `,e.appendChild(n)})}}updateSingularityDetection(t){const e=document.getElementById("singularity-detection");if(e){if(!t||t.length===0){e.innerHTML='<p class="text-muted">未检测到奇点</p>';return}e.innerHTML="",t.forEach((i,s)=>{var o;const n=document.createElement("div");n.className=`singularity-item ${this.getSingularityClass(i.type)}`,n.innerHTML=`
                <div class="singularity-header">
                    <span class="singularity-id">奇点 ${s+1}</span>
                    <span class="singularity-type">${this.getSingularityTypeText(i.type)}</span>
                </div>
                <div class="singularity-intensity">强度: ${(i.forceIntensity*100).toFixed(0)}%</div>
                <div class="singularity-risk">风险等级: ${this.getRiskLevelText(i.riskLevel)}</div>
                <div class="singularity-agents">涉及Agent: ${((o=i.convergedAgents)==null?void 0:o.length)||0}个</div>
            `,e.appendChild(n)})}}getSingularityClass(t){return{collaboration_hub:"positive",resource_drain:"warning",conflict_zone:"danger",overload_point:"danger",anomaly:"warning"}[t]||"neutral"}getSingularityTypeText(t){return{collaboration_hub:"协作中心",resource_drain:"资源消耗",conflict_zone:"冲突区域",overload_point:"过载点",anomaly:"异常"}[t]||t}getRiskLevelText(t){return t<.3?"低":t<.7?"中":"高"}}class p{static isVercelDeployment(){return window.location.hostname.includes("vercel.app")}static isLocalhost(){return window.location.hostname==="localhost"||window.location.hostname==="127.0.0.1"}static getBackendUrl(){return this.isVercelDeployment()?(console.warn("Vercel deployment detected. WebSocket connections may not work without a separate backend."),window.location.origin):this.isLocalhost()?"http://localhost:8080":window.location.origin}static getWebSocketUrl(){const t=this.getBackendUrl();return t.startsWith("https://")?t.replace("https://","wss://"):t.replace("http://","ws://")}static shouldUseDemoMode(){return this.isVercelDeployment()}}class k{constructor(){this.socket=null,this.eventHandlers=new Map,this.reconnectInterval=3e3,this.maxReconnectAttempts=10,this.reconnectAttempts=0,this.connectionId=Math.random().toString(36).substring(2,9),this.connectionTimeout=15e3,this.isConnected=!1,this.isConnecting=!1,this.manualDisconnect=!1,this.heartbeatInterval=null,this.demoMode=!1}async connect(t=p.getBackendUrl()){if(p.shouldUseDemoMode())return console.log(`[WebSocketClient-${this.connectionId}] Vercel deployment detected, using demo mode`),this.demoMode=!0,this.isConnected=!1,this.emit("disconnected","demo-mode"),Promise.resolve();if(this.isConnected&&this.socket&&this.socket.connected)return console.log(`[WebSocketClient-${this.connectionId}] Already connected`),Promise.resolve();if(this.isConnecting)return console.log(`[WebSocketClient-${this.connectionId}] Already connecting`),Promise.resolve();this.isConnecting=!0,this.manualDisconnect=!1,this.demoMode=!1;try{if(console.log(`[WebSocketClient-${this.connectionId}] Attempting to connect to ${t}`),typeof io>"u")throw console.error("❌ Socket.IO client not loaded! Make sure socket.io.js is included."),this.isConnecting=!1,new Error("Socket.IO client not loaded");return this.socket&&(this.socket.disconnect(),this.socket=null),this.socket=io(t,{transports:["websocket","polling"],timeout:this.connectionTimeout,reconnection:!0,reconnectionAttempts:this.maxReconnectAttempts,reconnectionDelay:this.reconnectInterval,reconnectionDelayMax:5e3,randomizationFactor:.5,autoConnect:!1,upgrade:!0,rememberUpgrade:!1,pingInterval:25e3,pingTimeout:6e4,rejectUnauthorized:!1,withCredentials:!1,forceNew:!0,transports:["websocket","polling"],upgrade:!0,multiplex:!1,upgradeTimeout:3e4,polling:{upgrade:!0},websocket:{upgrade:!0}}),this.setupHeartbeat(),this.socket.connect(),new Promise((e,i)=>{const s=setTimeout(()=>{this.isConnecting=!1,i(new Error("Connection timeout"))},this.connectionTimeout);this.socket.on("connect",()=>{clearTimeout(s),console.log(`✅ [WebSocketClient-${this.connectionId}] Socket.IO连接已建立, socket ID: ${this.socket.id}`),this.isConnected=!0,this.isConnecting=!1,this.reconnectAttempts=0,this.emit("connected"),e()}),this.socket.on("disconnect",n=>{if(clearTimeout(s),console.log(`❌ [WebSocketClient-${this.connectionId}] Socket.IO连接已断开: ${n}`),this.isConnected=!1,this.isConnecting=!1,this.clearHeartbeat(),console.log(`[WebSocketClient-${this.connectionId}] Disconnection reason: ${n}`),n==="transport error"||n==="transport close"){console.log(`[WebSocketClient-${this.connectionId}] Transport issue detected, will attempt immediate reconnect`),setTimeout(()=>{this.connect()},1e3);return}this.manualDisconnect?console.log(`[WebSocketClient-${this.connectionId}] Manual disconnect, not reconnecting`):(this.emit("disconnected",n),this.attemptReconnect())}),this.socket.on("connect_error",n=>{clearTimeout(s),console.error(`[WebSocketClient-${this.connectionId}] Socket.IO连接错误:`,n),this.isConnected=!1,this.isConnecting=!1,this.emit("error",n),this.attemptReconnect()}),this.socket.onAny((n,...o)=>{console.log(`📨 [WebSocketClient-${this.connectionId}] Received event: ${n}`,o),this.emit(n,o[0])}),this.socket.on("pong",()=>{console.log(`🏓 [WebSocketClient-${this.connectionId}] Received pong from server`)})})}catch(e){throw console.error(`[WebSocketClient-${this.connectionId}] Socket.IO连接失败:`,e),this.isConnecting=!1,this.attemptReconnect(),e}}setupHeartbeat(){this.clearHeartbeat(),this.heartbeatInterval=setInterval(()=>{this.socket&&this.socket.connected&&this.socket.emit("ping")},2e4)}clearHeartbeat(){this.heartbeatInterval&&(clearInterval(this.heartbeatInterval),this.heartbeatInterval=null)}attemptReconnect(){if(!this.demoMode)if(this.reconnectAttempts<this.maxReconnectAttempts){this.reconnectAttempts++,console.log(`🔄 [WebSocketClient-${this.connectionId}] 尝试重连 (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);const t=Math.min(this.reconnectInterval*Math.pow(1.5,this.reconnectAttempts),3e4);setTimeout(()=>{this.connect()},t)}else console.error(`❌ [WebSocketClient-${this.connectionId}] Socket.IO重连失败，达到最大重试次数`),this.emit("reconnect-failed")}send(t,e={}){return this.demoMode?(console.log(`[WebSocketClient-${this.connectionId}] Demo mode: Not sending message ${t}`),!1):this.socket&&this.socket.connected?(this.socket.emit(t,e),console.log(`📤 [WebSocketClient-${this.connectionId}] Sent event: ${t}`,e),!0):(console.warn(`[WebSocketClient-${this.connectionId}] Socket.IO未连接，无法发送消息: ${t}`),this.isConnecting||this.connect(),!1)}on(t,e){this.eventHandlers.has(t)||this.eventHandlers.set(t,[]),this.eventHandlers.get(t).push(e),console.log(`[WebSocketClient-${this.connectionId}] Added handler for event: ${t}`)}off(t,e){const i=this.eventHandlers.get(t);if(i){const s=i.indexOf(e);s>-1&&(i.splice(s,1),console.log(`[WebSocketClient-${this.connectionId}] Removed handler for event: ${t}`))}}emit(t,e){const i=this.eventHandlers.get(t);i&&(console.log(`[WebSocketClient-${this.connectionId}] Emitting event: ${t} to ${i.length} handlers`),i.forEach(s=>{try{s(e)}catch(n){console.error(`[WebSocketClient-${this.connectionId}] 事件处理器错误 (${t}):`,n)}}))}disconnect(){if(this.demoMode){this.isConnected=!1,this.isConnecting=!1;return}this.manualDisconnect=!0,this.clearHeartbeat(),this.socket&&(console.log(`[WebSocketClient-${this.connectionId}] Disconnecting socket`),this.socket.disconnect(),this.socket=null,this.isConnected=!1,this.isConnecting=!1)}get connected(){return this.demoMode?!1:this.socket&&this.socket.connected}get isDemoMode(){return this.demoMode}}class I{constructor(){this.ws=new k,this.currentView="ai-overview",this.isConnected=!1,this.reconnectAttempts=0,this.maxReconnectAttempts=5,this.connectionRetryCount=0,this.maxConnectionRetries=3,this.networkViz=new v("#network-graph"),this.tcfViz=new w("#tcf-visualization"),this.taskChainViz=new x("#task-chain-graph"),this.collaborationMonitor=new C,this.taskManager=new T,this.systemMonitor=new S,this.systemState={agents:new Map,tasks:new Map,taskChains:new Map,collaborationSessions:new Map,metrics:{}},this.init()}async init(){window.cosmicApp=this,this.setupEventListeners(),this.setupWebSocketHandlers(),this.initializeComponents(),await this.connectToServer(),this.startDataPolling(),this.generateSampleSystemState(),console.log("🌌 Cosmic Agent Network initialized and connected to Real AI backend")}async connectToServer(){try{console.log("🔄 Attempting to connect to Real AI Server..."),await this.ws.connect(p.getBackendUrl()),this.ws.on("disconnected",t=>{if(this.isConnected=!1,console.log("❌ Disconnected from server:",t),t==="demo-mode"){console.log("📱 Vercel deployment detected, switching to demo mode"),this.setupDemoMode();return}t!=="io client disconnect"&&this.attemptReconnect()}),this.ws.on("error",t=>{console.error("❌ WebSocket error:",t),this.attemptReconnect()})}catch(t){console.error("❌ Failed to connect to server:",t),this.attemptReconnect()}}setupDemoMode(){console.log("📱 Setting up demo mode for Vercel deployment"),this.isConnected=!1,this.isDemoMode=!0,this.showDemoModeNotification(),this.demoInterval&&clearInterval(this.demoInterval),this.demoInterval=setInterval(()=>{this.updateWithDemoData()},1e4),setTimeout(()=>{this.updateWithDemoData()},1e3)}showDemoModeNotification(){document.querySelectorAll(".demo-mode-notification").forEach(i=>i.remove());const e=document.createElement("div");e.className="demo-mode-notification",e.innerHTML=`
            <div style="position: fixed; top: 20px; right: 20px; background: #3b82f6; color: white; padding: 15px; border-radius: 8px; z-index: 10000; box-shadow: 0 4px 6px rgba(0,0,0,0.1); max-width: 300px;">
                <strong>📱 Demo Mode</strong>
                <p>This deployment is running in demo mode. Real AI agents and WebSocket connections are not available.</p>
                <button onclick="this.parentElement.remove()" style="background: white; color: #3b82f6; border: none; padding: 5px 10px; border-radius: 4px; cursor: pointer; margin-top: 5px;">Dismiss</button>
            </div>
        `,document.body.appendChild(e)}updateWithDemoData(){console.log("📱 Updating with demo data");const t=[{id:"demo-1",name:"Prof. Smoot (Demo)",type:"cosmic_structure_expert",status:"active",energy:95,maxEnergy:100,position:{x:0,y:0,z:0},connections:["demo-2","demo-3"],ai:{focusLevel:.9,memoryLoad:{shortTerm:5,longTerm:42},currentThought:"Analyzing cosmic structure patterns..."},capabilities:["cosmic_structure_analysis","gravitational_field_modeling"],personality:{traits:["analytical","methodical","precise"]}},{id:"demo-2",name:"Dr. Analyzer (Demo)",type:"analyzer",status:"processing",energy:87,maxEnergy:100,position:{x:100,y:50,z:20},connections:["demo-1","demo-4"],ai:{focusLevel:.7,memoryLoad:{shortTerm:8,longTerm:36},currentThought:"Processing data patterns..."},capabilities:["deep_analysis","pattern_recognition"],personality:{traits:["analytical","detail-oriented","systematic"]}},{id:"demo-3",name:"Ms. Synthesizer (Demo)",type:"synthesizer",status:"active",energy:92,maxEnergy:100,position:{x:-100,y:75,z:-30},connections:["demo-1","demo-5"],ai:{focusLevel:.8,memoryLoad:{shortTerm:3,longTerm:28},currentThought:"Synthesizing knowledge domains..."},capabilities:["information_synthesis","knowledge_integration"],personality:{traits:["creative","integrative","holistic"]}},{id:"demo-4",name:"Prof. Reasoner (Demo)",type:"reasoner",status:"idle",energy:78,maxEnergy:100,position:{x:200,y:-50,z:40},connections:["demo-2"],ai:{focusLevel:.6,memoryLoad:{shortTerm:6,longTerm:31},currentThought:"Awaiting new reasoning tasks..."},capabilities:["logical_reasoning","inference"],personality:{traits:["logical","methodical","rational"]}},{id:"demo-5",name:"Dr. Validator (Demo)",type:"validator",status:"active",energy:89,maxEnergy:100,position:{x:-200,y:-25,z:-60},connections:["demo-3"],ai:{focusLevel:.85,memoryLoad:{shortTerm:4,longTerm:39},currentThought:"Validating analysis results..."},capabilities:["result_validation","quality_assessment"],personality:{traits:["critical","thorough","careful"]}}];this.systemState.agents=t,this.systemState.collaborations=Math.floor(Math.random()*3),this.systemState.totalTasks=12+Math.floor(Math.random()*5),this.updateAgentList(),this.updateSystemMetrics(),this.simulateTaskChainUpdates()}simulateTaskChainUpdates(){if(Math.random()>.7){const t=`demo-chain-${Math.floor(Math.random()*1e3)}`,e=this.systemState.agents.map(n=>n.id),i=e[Math.floor(Math.random()*e.length)],s={taskChainId:t,taskId:`task-${Math.floor(Math.random()*1e4)}`,agentId:i,taskName:`Demo Task ${Math.floor(Math.random()*100)}`,status:"completed",result:"Demo task completed successfully with synthesized insights.",timestamp:Date.now()};this.handleTaskChainExecutionStep(s)}}attemptReconnect(){this.reconnectAttempts<this.maxReconnectAttempts?(this.reconnectAttempts++,console.log(`🔄 Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`),setTimeout(()=>{this.connectToServer()},3e3*this.reconnectAttempts)):(console.error("❌ Maximum reconnection attempts reached"),this.showConnectionError())}showConnectionError(){const t=document.createElement("div");t.className="connection-error",t.innerHTML=`
            <div style="position: fixed; top: 20px; right: 20px; background: #ef4444; color: white; padding: 15px; border-radius: 8px; z-index: 10000; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                <strong>❌ Connection Error</strong>
                <p>Could not connect to the AI server. Please make sure the server is running.</p>
                <button onclick="this.parentElement.remove()" style="background: white; color: #ef4444; border: none; padding: 5px 10px; border-radius: 4px; cursor: pointer; margin-top: 5px;">Dismiss</button>
            </div>
        `,document.body.appendChild(t)}setupEventListeners(){var i,s,n,o,a,r,l,d,g,h,f,y;document.querySelectorAll(".nav-btn").forEach(u=>{u.addEventListener("click",m=>{const b=m.target.dataset.view;this.switchView(b)})}),(i=document.getElementById("layout-force"))==null||i.addEventListener("click",()=>{this.networkViz&&this.networkViz.svg&&this.networkViz.setLayout("force")}),(s=document.getElementById("layout-circular"))==null||s.addEventListener("click",()=>{this.networkViz&&this.networkViz.svg&&this.networkViz.setLayout("circular")}),(n=document.getElementById("layout-hierarchical"))==null||n.addEventListener("click",()=>{this.networkViz&&this.networkViz.svg&&this.networkViz.setLayout("hierarchical")});const t=document.createElement("button");t.textContent="Refresh Topology",t.className="btn",t.style.marginLeft="20px",t.addEventListener("click",()=>{console.log("🔄 Manual topology refresh triggered"),this.fetchRealAIAgents(),this.updateCurrentView()});const e=document.querySelector("#network .controls");e&&e.appendChild(t),(o=document.getElementById("node-size"))==null||o.addEventListener("input",u=>{this.networkViz&&this.networkViz.svg&&this.networkViz.setNodeSize(u.target.value)}),(a=document.getElementById("link-strength"))==null||a.addEventListener("input",u=>{this.networkViz&&this.networkViz.svg&&this.networkViz.setLinkStrength(u.target.value)}),(r=document.getElementById("refresh-task-chain"))==null||r.addEventListener("click",()=>{this.refreshTaskChainVisualization()}),(l=document.getElementById("clear-task-chain"))==null||l.addEventListener("click",()=>{this.clearTaskChainVisualization()}),(d=document.getElementById("create-task"))==null||d.addEventListener("click",()=>{this.showTaskModal()}),(g=document.getElementById("cancel-task"))==null||g.addEventListener("click",()=>{this.hideTaskModal()}),(h=document.querySelector(".modal-close"))==null||h.addEventListener("click",()=>{this.hideTaskModal()}),(f=document.getElementById("task-form"))==null||f.addEventListener("submit",u=>{u.preventDefault(),this.createTask()}),(y=document.getElementById("task-priority"))==null||y.addEventListener("input",u=>{const m=document.getElementById("priority-value");m&&(m.textContent=u.target.value)})}setupWebSocketHandlers(){this.ws.on("connected",()=>{console.log("✅ WebSocket connected to server"),this.isConnected=!0,this.reconnectAttempts=0,this.ws.send("get-ai-status")}),this.ws.on("ai-system-status",t=>{console.log("Received AI system status:",t),this.updateSystemStatus(t)}),this.ws.on("agent-update",t=>{this.updateAgent(t)}),this.ws.on("task-update",t=>{this.updateTask(t)}),this.ws.on("collaboration-update",t=>{this.updateCollaboration(t)}),this.ws.on("topology-update",t=>{this.updateTopology(t)}),this.ws.on("tcf-update",t=>{this.updateTCF(t)}),this.ws.on("task-chain-execution-step",t=>{this.handleTaskChainExecutionStep(t)}),this.ws.on("task-chain-completed",t=>{this.handleTaskChainCompleted(t)})}handleTaskChainExecutionStep(t){console.log("Task chain execution step:",t),this.systemState.taskChainSteps||(this.systemState.taskChainSteps=new Map),this.systemState.taskChainSteps.has(t.taskChainId)||this.systemState.taskChainSteps.set(t.taskChainId,[]),this.systemState.taskChainSteps.get(t.taskChainId).push(t),this.currentView==="tasks"&&this.updateTaskChainVisualization(t.taskChainId),this.currentView==="network"&&this.networkViz&&this.networkViz.highlightExecutionStep(t)}handleTaskChainCompleted(t){var e;if(console.log("Task chain completed:",t),this.systemState.taskChains.set(t.chainId,t),t.executionSteps&&!this.systemState.taskChainSteps&&(this.systemState.taskChainSteps=new Map),t.executionSteps&&this.systemState.taskChainSteps.set(t.chainId,t.executionSteps),this.currentView==="tasks"&&this.updateTaskChainVisualization(t.chainId),this.networkViz){const i=t.executionSteps||((e=this.systemState.taskChainSteps)==null?void 0:e.get(t.chainId))||[];this.networkViz.updateWithTaskChain({id:t.chainId,executionPath:i,metrics:t.metrics||{}})}}updateTaskChainVisualization(t){var n;console.log("Updating task chain visualization for:",t);const e=document.getElementById("task-chain-visualization-section");e&&(e.style.display="block");const i=this.systemState.taskChains.get(t),s=((n=this.systemState.taskChainSteps)==null?void 0:n.get(t))||[];if(i||s.length>0){const o={id:t,executionPath:s,tasks:(i==null?void 0:i.results)||[],metrics:(i==null?void 0:i.metrics)||{}};this.taskChainViz&&this.taskChainViz.updateTaskChain(o),this.updateTaskChainDetails(o),this.currentView==="network"&&this.networkViz&&this.networkViz.updateWithTaskChain(o)}}updateTaskChainDetails(t){const e=document.getElementById("task-chain-info");if(!e)return;const i=t.executionPath.length,s=new Set(t.executionPath.map(a=>a.agentId)).size,n=new Map;t.executionPath.forEach(a=>{n.has(a.agentId)||n.set(a.agentId,[]),n.get(a.agentId).push(a)}),e.innerHTML=`
            <div class="task-chain-summary">
                <p><strong>Task Chain ID:</strong> ${t.id.substring(0,8)}...</p>
                <p><strong>Total Steps:</strong> ${i}</p>
                <p><strong>Unique Agents:</strong> ${s}</p>
                ${t.metrics&&Object.keys(t.metrics).length>0?`
                <p><strong>Success Rate:</strong> ${(t.metrics.successRate*100).toFixed(1)}%</p>
                <p><strong>Execution Time:</strong> ${t.metrics.executionTime}ms</p>
                `:""}
                <button id="view-topology-btn" class="btn btn-primary" style="margin-top: 10px;">View Network Topology</button>
            </div>
            <div class="execution-steps">
                <h5>Execution Steps by Agent:</h5>
                ${Array.from(n.entries()).map(([a,r])=>`
                    <div class="agent-step-group">
                        <h6>Agent: ${r[0].agentDetails?r[0].agentDetails[0].name:a.substring(0,8)}...</h6>
                        <ul>
                            ${r.map(l=>`
                                <li>${l.taskName||`Task ${l.taskId.substring(0,8)}...`} at ${new Date(l.timestamp).toLocaleTimeString()}</li>
                            `).join("")}
                        </ul>
                    </div>
                `).join("")}
            </div>
        `;const o=document.getElementById("view-topology-btn");o&&o.addEventListener("click",()=>{this.switchView("network"),setTimeout(()=>{this.networkViz&&this.networkViz.displaySavedTopology(t.id)},100)})}refreshTaskChainVisualization(){console.log("Refreshing task chain visualization"),this.taskChainViz&&this.taskChainViz.init();const t=Array.from(this.systemState.taskChains.keys());if(t.length>0){const e=t[t.length-1];this.updateTaskChainVisualization(e)}}clearTaskChainVisualization(){console.log("Clearing task chain visualization");const t=document.getElementById("task-chain-visualization-section");t&&(t.style.display="none"),this.taskChainViz&&this.taskChainViz.clear();const e=document.getElementById("task-chain-info");e&&(e.innerHTML="")}initializeComponents(){console.log("Initializing components..."),console.log("Initializing NetworkVisualizer..."),this.networkViz.init(),console.log("Initializing TCFVisualizer..."),this.tcfViz.init(),console.log("Initializing MonitoringComponents..."),this.collaborationMonitor.init(),this.taskManager.init(),this.systemMonitor.init(),this.initTopologyVisualization(),console.log("All components initialized")}initTopologyVisualization(){const t=document.getElementById("topology-visualization");if(!t)return;const e=d3.select(t).append("svg").attr("width","100%").attr("height","100%");e.append("rect").attr("width","100%").attr("height","100%").attr("fill","rgba(0,0,0,0.2)"),e.append("text").attr("x","50%").attr("y","50%").attr("text-anchor","middle").attr("fill","rgba(255,255,255,0.5)").text("拓扑结构视图")}switchView(t){console.log("Switching to view:",t),document.querySelectorAll(".view").forEach(s=>{s.classList.remove("active")}),document.querySelectorAll(".nav-btn").forEach(s=>{s.classList.remove("active")});const e=document.getElementById(t);e?(e.classList.add("active"),console.log("View activated:",t)):console.error("Target view not found:",t);const i=document.querySelector(`[data-view="${t}"]`);i?(i.classList.add("active"),console.log("Button activated:",t)):console.error("Target button not found:",t),this.currentView=t,setTimeout(()=>{this.updateCurrentView()},100)}updateCurrentView(){switch(console.log("Updating current view:",this.currentView),this.currentView){case"ai-overview":case"overview":this.updateOverview();break;case"network":console.log("Updating network view..."),this.networkViz&&this.networkViz.container?(console.log("Network container found, updating..."),this.networkViz.hasSavedTopologyDisplayed()?console.log("Skipping network update - saved topology is displayed"):this.networkViz.update(this.systemState)):(console.log("Re-initializing NetworkVisualizer..."),this.networkViz=new v("#network-graph"),this.networkViz.init());break;case"collaboration":this.collaborationMonitor.update(this.systemState);break;case"tasks":this.taskManager.update(this.systemState);const t=Array.from(this.systemState.taskChains.keys());if(t.length>0){const e=t[t.length-1];this.updateTaskChainVisualization(e)}break;case"monitoring":this.systemMonitor.update(this.systemState);break}}updateOverview(){const t=this.systemState.agents.size,e=Array.from(this.systemState.tasks.values()).filter(l=>l.status==="executing").length,i=document.getElementById("agent-count");i&&(i.textContent=t);const s=document.getElementById("active-tasks");s&&(s.textContent=e);const n=(this.systemState.metrics.networkStability||0)*100,o=(this.systemState.metrics.collaborationEfficiency||0)*100,a=document.getElementById("network-stability");a&&(a.textContent=`${n.toFixed(1)}%`);const r=document.getElementById("collaboration-efficiency");r&&(r.textContent=`${o.toFixed(1)}%`),this.tcfViz.update(this.systemState),this.addLog("info",`系统状态更新: ${t}个Agent在线, ${e}个活跃任务`)}showTaskModal(){const t=document.getElementById("task-modal");t&&t.classList.add("show")}hideTaskModal(){const t=document.getElementById("task-modal");t&&t.classList.remove("show");const e=document.getElementById("task-form");e&&e.reset();const i=document.getElementById("priority-value");i&&(i.textContent="5")}createTask(){var s,n,o,a,r;if(!document.getElementById("task-form"))return;const e=Array.from(document.querySelectorAll(".capabilities input:checked")).map(l=>l.value),i={name:((s=document.getElementById("task-name"))==null?void 0:s.value)||"",type:((n=document.getElementById("task-type"))==null?void 0:n.value)||"analysis",collaborationType:((o=document.getElementById("collaboration-type"))==null?void 0:o.value)||"sequential",priority:parseInt(((a=document.getElementById("task-priority"))==null?void 0:a.value)||"5"),description:((r=document.getElementById("task-description"))==null?void 0:r.value)||"",requiredCapabilities:e};this.ws.send("create-task",i),this.addLog("info",`创建新任务: ${i.name}`),this.hideTaskModal()}addLog(t,e){const i=document.getElementById("system-logs");if(!i)return;const s=new Date().toLocaleTimeString(),n=document.createElement("div");for(n.className=`log-entry ${t}`,n.textContent=`[${s}] ${e}`,i.appendChild(n),i.scrollTop=i.scrollHeight;i.children.length>100;)i.removeChild(i.firstChild)}startDataPolling(){setInterval(()=>{this.ws.connected&&this.ws.send("get-system-status")},1e4),setInterval(()=>{this.currentView==="network"?this.networkViz&&!this.networkViz.hasSavedTopologyDisplayed()&&this.updateCurrentView():this.currentView!=="network"&&this.updateCurrentView()},5e3)}updateSystemStatus(t){this.systemState.metrics=t.metrics||{},(this.currentView==="ai-overview"||this.currentView==="overview")&&this.updateOverview()}updateAgent(t){this.systemState.agents.set(t.agentId,t)}updateTask(t){this.systemState.tasks.set(t.taskId,t)}updateCollaboration(t){this.systemState.collaborationSessions.set(t.sessionId,t)}updateTopology(t){this.currentView==="network"&&this.networkViz.updateTopology(t)}updateTCF(t){this.tcfViz.updateField(t)}generateSampleSystemState(){const t=new Map([["agent1",{id:"agent1",name:"Dr. Analyzer",type:"analyzer",status:"online",position:{x:.3,y:.3},capabilities:["deep_analysis","pattern_recognition"]}],["agent2",{id:"agent2",name:"Prof. Reasoner",type:"reasoner",status:"busy",position:{x:.7,y:.3},capabilities:["logical_reasoning","inference"]}],["agent3",{id:"agent3",name:"Ms. Synthesizer",type:"synthesizer",status:"online",position:{x:.5,y:.7},capabilities:["information_synthesis","knowledge_integration"]}],["agent4",{id:"agent4",name:"Dr. Validator",type:"validator",status:"offline",position:{x:.2,y:.6},capabilities:["result_validation","quality_assessment"]}],["agent5",{id:"agent5",name:"Mx. Innovator",type:"innovator",status:"online",position:{x:.8,y:.6},capabilities:["creative_thinking","solution_generation"]}]]);this.systemState.agents=t,this.systemState.topology={connections:[{source:"agent1",target:"agent2",strength:.8,type:"collaboration"},{source:"agent2",target:"agent3",strength:.6,type:"data_flow"},{source:"agent1",target:"agent3",strength:.4,type:"coordination"},{source:"agent3",target:"agent5",strength:.7,type:"collaboration"},{source:"agent4",target:"agent1",strength:.3,type:"coordination"}]},console.log("📊 Generated sample system state with",t.size,"agents"),this.updateCurrentView()}async fetchRealAIAgents(){try{const t=p.getBackendUrl(),e=await fetch(`${t}/api/ai-status`);if(!e.ok)throw new Error(`HTTP error! status: ${e.status}`);const i=await e.json();return console.log("📊 Fetched Real AI agent data:",i),this.systemState.agents=i.aiAgents||[],this.systemState.collaborations=i.activeCollaborations||0,this.systemState.totalTasks=i.totalCollaborations||0,this.updateAgentList(),this.updateSystemMetrics(),i}catch(t){return console.error("❌ Failed to fetch Real AI agents:",t),(!this.ws||!this.ws.connected)&&this.connectToServer(),this.getDemoData()}}generateRealTopologyConnections(t){const e=Array.from(t.values()),i=[];for(let s=0;s<e.length;s++)for(let n=s+1;n<e.length;n++){const o=e[s],a=e[n];let r=.3,l="coordination";o.type==="analyzer"&&a.type==="synthesizer"?(r=.8,l="collaboration"):o.type==="reasoner"&&a.type==="validator"?(r=.7,l="data_flow"):o.type==="innovator"&&(r=.6,l="collaboration"),i.push({source:o.id,target:a.id,strength:r,type:l})}this.systemState.topology={connections:i},console.log("🔗 Generated",i.length,"real topology connections")}}document.addEventListener("DOMContentLoaded",()=>{window.app=new I});class A{constructor(){this.websocket=null,this.aiAgents=new Map,this.activeCollaborations=new Map,this.taskHistory=[],this.initializeInterface(),this.connectWebSocket()}initializeInterface(){console.log("🚀 Initializing Real AI Interface..."),this.createAIControlPanel(),console.log("✅ AI Control Panel created"),this.createCollaborationInterface(),console.log("✅ Collaboration interface created"),this.createTaskInterface(),console.log("✅ Task interface created"),this.setupEventListeners(),console.log("✅ Event listeners setup"),setTimeout(()=>{const t=document.getElementById("ai-task-description"),e=document.getElementById("ai-task-form");console.log("Form verification:",{taskDescription:!!t,aiTaskForm:!!e,descriptionValue:t?t.value:"N/A",descriptionPlaceholder:t?t.placeholder:"N/A"}),t||console.error("❌ Task description element not found after initialization!"),e||console.error("❌ AI task form not found after initialization!")},100),console.log("✅ Real AI Interface initialization complete")}createAIControlPanel(){const t=document.createElement("div");t.className="ai-control-panel",t.innerHTML=`
            <div class="panel-toggle" id="ai-control-toggle">
                <span>▶</span>
            </div>
            <div class="panel-content">
                <div class="panel-header">
                    <h3>🧠 Real AI Agent Control</h3>
                    <div class="ai-status">
                        <span id="ai-status-indicator" class="status-dot offline"></span>
                        <span id="ai-status-text">Connecting...</span>
                    </div>
                </div>
                
                <div class="ai-agents-section">
                    <h4>Active AI Agents</h4>
                    <div id="ai-agents-list" class="agents-list"></div>
                    <button id="create-ai-agent-btn" class="btn btn-primary">Create AI Agent</button>
                </div>
                
                <div class="collaboration-section">
                    <h4>Live Collaborations</h4>
                    <div id="active-collaborations" class="collaborations-list"></div>
                </div>
            </div>
        `,document.body.appendChild(t),this.setupAIControlPanelToggle()}createCollaborationInterface(){const t=document.createElement("div");t.className="collaboration-panel",t.innerHTML=`
            <div class="panel-toggle" id="collaboration-toggle">
                <span>◀</span>
            </div>
            <div class="panel-content">
                <div class="panel-header">
                    <h3>🤝 AI Collaboration Lab</h3>
                </div>
                
                <div class="task-submission">
                    <h4>Submit Task for AI Collaboration</h4>
                    <form id="ai-task-form">
                        <div class="form-group">
                            <label>Task Description:</label>
                            <textarea id="ai-task-description" rows="4" placeholder="Describe the complex problem you want AI agents to collaborate on..."></textarea>
                        </div>
                        
                        <div class="form-row">
                            <div class="form-group">
                                <label>Task Type:</label>
                                <select id="task-type">
                                    <option value="strategic_analysis">Strategic Analysis</option>
                                    <option value="creative_problem_solving">Creative Problem Solving</option>
                                    <option value="technical_evaluation">Technical Evaluation</option>
                                    <option value="ethical_analysis">Ethical Analysis</option>
                                    <option value="research_synthesis">Research Synthesis</option>
                                    <option value="innovation_challenge">Innovation Challenge</option>
                                </select>
                            </div>
                            
                            <div class="form-group">
                                <label>Priority:</label>
                                <select id="task-priority">
                                    <option value="1">Low</option>
                                    <option value="3">Medium</option>
                                    <option value="5">High</option>
                                </select>
                            </div>
                            
                            <div class="form-group">
                                <label>Complexity:</label>
                                <input type="range" id="task-complexity" min="10" max="100" value="50">
                                <span id="complexity-value">50</span>
                            </div>
                        </div>
                        
                        <div class="form-group">
                            <label>Required Capabilities (select multiple):</label>
                            <div class="capabilities-checkboxes">
                                <label><input type="checkbox" value="deep_analysis"> Deep Analysis</label>
                                <label><input type="checkbox" value="logical_reasoning"> Logical Reasoning</label>
                                <label><input type="checkbox" value="creative_thinking"> Creative Thinking</label>
                                <label><input type="checkbox" value="information_synthesis"> Information Synthesis</label>
                                <label><input type="checkbox" value="result_validation"> Result Validation</label>
                                <label><input type="checkbox" value="ethical_reasoning"> Ethical Reasoning</label>
                            </div>
                        </div>
                        
                        <button type="submit" class="btn btn-success">🚀 Start AI Collaboration</button>
                    </form>
                </div>
            </div>
        `,document.body.appendChild(t),this.setupCollaborationPanelToggle()}createTaskInterface(){const t=document.createElement("div");t.className="task-panel",t.innerHTML=`
            <div class="panel-header">
                <h3>📋 Task Results & History</h3>
            </div>
            
            <div id="active-task-display" class="active-task" style="display: none;">
                <h4>🔄 Collaboration in Progress</h4>
                <div class="task-progress">
                    <div class="progress-bar">
                        <div id="progress-fill" class="progress-fill"></div>
                    </div>
                    <div id="progress-text">Initializing...</div>
                </div>
                <div id="collaboration-phases" class="phases-display"></div>
            </div>
            
            <div id="task-results" class="task-results"></div>
            
            <div id="task-history" class="task-history">
                <h4>Previous Collaborations</h4>
                <div id="history-list" class="history-list"></div>
            </div>
        `,document.body.appendChild(t)}setupEventListeners(){console.log("Setting up event listeners...");const t=()=>{const e=document.getElementById("task-complexity"),i=document.getElementById("complexity-value");e&&i?(this.complexitySliderListener&&e.removeEventListener("input",this.complexitySliderListener),this.complexitySliderListener=a=>{i.textContent=a.target.value},e.addEventListener("input",this.complexitySliderListener),console.log("✅ Complexity slider listener added")):console.warn("⚠️ Complexity slider elements not found");const s=document.getElementById("ai-task-form");if(s){if(s.hasAttribute("data-listener-attached")){console.log("⚠️ Task form listener already attached, skipping");return}s.setAttribute("data-listener-attached","true"),this.taskFormSubmitListener=a=>{a.preventDefault(),console.log("Form submit event triggered"),this.submitAITask()},s.addEventListener("submit",this.taskFormSubmitListener),console.log("✅ Task form listener added")}else console.warn("⚠️ AI task form not found");const n=document.getElementById("create-ai-agent-btn");if(n){if(n.hasAttribute("data-listener-attached")){console.log("⚠️ Create agent button listener already attached, skipping");return}n.setAttribute("data-listener-attached","true"),this.createAgentBtnListener=()=>{this.showCreateAgentDialog()},n.addEventListener("click",this.createAgentBtnListener),console.log("✅ Create agent button listener added")}else console.warn("⚠️ Create agent button not found");const o=document.getElementById("debug-form-btn");if(o){if(o.hasAttribute("data-listener-attached")){console.log("⚠️ Debug button listener already attached, skipping");return}o.setAttribute("data-listener-attached","true"),this.debugBtnListener=()=>{this.debugFormState()},o.addEventListener("click",this.debugBtnListener),console.log("✅ Debug button listener added")}};t(),setTimeout(t,50),setTimeout(t,200)}connectWebSocket(){console.log("🔄 Connecting to Real AI Server..."),window.app&&window.app.ws&&window.app.ws.socket?(console.log("🔗 Reusing main app WebSocket connection"),this.websocket=window.app.ws,this.setupWebSocketHandlers(),setTimeout(()=>{this.requestAIStatus()},1e3)):(console.log("🔗 Creating new WebSocket connection"),this.websocket=new k,this.websocket.connect(p.getBackendUrl()).catch(t=>{console.error("❌ Failed to connect to WebSocket:",t),p.shouldUseDemoMode()?(console.log("📱 Vercel deployment detected, using demo mode"),this.setupDemoMode()):this.updateAIStatus("offline","Connection Failed")}),this.setupWebSocketHandlers()),setInterval(()=>{if(this.websocket){const t=this.websocket.socket&&this.websocket.socket.connected||this.websocket.connected||!1;console.log(`[RealAIInterface] Connection status check: ${t}`),this.websocket.isDemoMode&&this.updateAIStatus("demo","Demo Mode Active")}},5e3)}setupWebSocketHandlers(){var e;this.websocket===((e=window.app)==null?void 0:e.ws)?this.websocket.socket&&this.websocket.socket.connected?(console.log("✅ Already connected to Real AI Server via main app"),this.updateAIStatus("online","Connected to Real AI Server")):this.websocket.isDemoMode&&(console.log("📱 Demo mode active via main app"),this.setupDemoMode()):(this.websocket.on("connect",()=>{console.log("✅ Connected to Real AI Server"),this.updateAIStatus("online","Connected to Real AI Server")}),this.websocket.on("disconnected",i=>{console.log("❌ Disconnected from Real AI Server:",i),i==="demo-mode"?this.setupDemoMode():this.updateAIStatus("offline","Disconnected from Server")}),this.websocket.on("error",i=>{console.error("❌ WebSocket error:",i),p.shouldUseDemoMode()?this.setupDemoMode():this.updateAIStatus("offline","Connection Error")})),this.websocket.on("ai-system-status",i=>{console.log("📊 AI System Status Update:",i),this.updateSystemStatus(i)}),this.websocket.on("ai-agent-created",i=>{console.log("🤖 New AI Agent Created:",i),i.success&&i.agent&&this.showNotification(`🎉 New AI Agent Created: ${i.agent.name}`,"success")}),this.websocket.on("ai-task-completed",i=>{console.log("🏆 AI Task Completed:",i),this.handleTaskCompleted(i)}),this.websocket.on("prof-smoot-allocation",i=>{console.log("🎯 Prof. Smoot Allocation Decision:",i),this.showNotification(`🌌 Prof. Smoot allocated ${i.allocatedAgents.length} agents for task ${i.taskId.substring(0,8)}...`,"info"),this.addLog("info",`Prof. Smoot allocated agents: ${i.allocatedAgents.length} agents selected with confidence ${i.confidence}`)}),this.websocket.on("fallback-allocation",i=>{console.log("🔄 Fallback Allocation Used:",i),this.showNotification(`🔄 Fallback allocation used for task ${i.taskId.substring(0,8)}...`,"warning"),this.addLog("warning",`Fallback allocation used: ${i.allocatedAgents.length} agents selected using ${i.method}`)}),this.websocket.on("task-chain-execution-step",i=>{console.log("🔗 Task Chain Execution Step:",i),this.handleTaskChainExecutionStep(i)}),this.websocket.on("task-chain-completed",i=>{console.log("✅ Task Chain Completed:",i)}),this.websocket.on("collaboration-completed",i=>{console.log("🎉 Collaboration Completed:",i)}),setTimeout(()=>{this.requestAIStatus()},1e3)}setupDemoMode(){console.log("📱 Setting up demo mode for Real AI Interface"),this.updateAIStatus("demo","Demo Mode Active"),this.showNotification("📱 Demo Mode Active - Real AI agents not available in this deployment","info"),this.demoInterval&&clearInterval(this.demoInterval),this.demoInterval=setInterval(()=>{this.updateWithDemoData()},15e3),setTimeout(()=>{this.updateWithDemoData()},1e3)}updateWithDemoData(){console.log("📱 Updating Real AI Interface with demo data");const t={timestamp:Date.now(),openaiApiKey:!1,totalAIAgents:5,activeCollaborations:Math.floor(Math.random()*3),totalCollaborations:12+Math.floor(Math.random()*5),connectedClients:1,aiAgents:[{id:"demo-1",name:"Prof. Smoot (Demo)",type:"cosmic_structure_expert",status:"active",energy:95,maxEnergy:100,ai:{focusLevel:.9,memoryLoad:{shortTerm:5,longTerm:42},currentThought:"Analyzing cosmic structure patterns..."}},{id:"demo-2",name:"Dr. Analyzer (Demo)",type:"analyzer",status:"processing",energy:87,maxEnergy:100,ai:{focusLevel:.7,memoryLoad:{shortTerm:8,longTerm:36},currentThought:"Processing data patterns..."}},{id:"demo-3",name:"Ms. Synthesizer (Demo)",type:"synthesizer",status:"active",energy:92,maxEnergy:100,ai:{focusLevel:.8,memoryLoad:{shortTerm:3,longTerm:28},currentThought:"Synthesizing knowledge domains..."}}],recentTasks:[],system:{memory:{heapUsed:Math.random()*50*1024*1024},uptime:Math.floor(Math.random()*3600)}};this.updateSystemStatus(t)}updateAIStatus(t,e){const i=document.getElementById("ai-status-indicator"),s=document.getElementById("ai-status-text");i&&(t==="demo"?i.className="status-dot demo":i.className=`status-dot ${t}`),s&&(s.textContent=e)}updateSystemStatus(t){this.updateAIAgentsList(t.aiAgents||[]),t.openaiApiKey?this.updateAIStatus("online",`${t.totalAIAgents} AI Agents Active`):this.updateAIStatus("warning","No OpenAI API Key - Limited Features")}updateAIAgentsList(t){const e=document.getElementById("ai-agents-list");e.innerHTML=t.map(i=>{var s,n,o,a,r;return`
            <div class="agent-card">
                <div class="agent-header">
                    <h5>${i.name}</h5>
                    <span class="agent-type">${i.type}</span>
                    <span class="agent-status ${i.status}">${i.status}</span>
                </div>
                <div class="agent-details">
                    <div class="agent-stats">
                        <span>Energy: ${i.energy}/${i.maxEnergy}</span>
                        <span>Focus: ${(((s=i.ai)==null?void 0:s.focusLevel)*100||0).toFixed(0)}%</span>
                        <span>Memory: ${((o=(n=i.ai)==null?void 0:n.memoryLoad)==null?void 0:o.shortTerm)||0}</span>
                    </div>
                    <div class="agent-capabilities">
                        ${((a=i.capabilities)==null?void 0:a.map(l=>`<span class="capability-tag">${l}</span>`).join(""))||""}
                    </div>
                    ${(r=i.ai)!=null&&r.currentThought?`<div class="current-thought">"${i.ai.currentThought}"</div>`:""}
                </div>
            </div>
        `}).join("")}submitAITask(){if(this.isSubmitting){console.log("⚠️ Task submission already in progress, ignoring duplicate request");return}console.log("Submitting AI task..."),this.isSubmitting=!0;const t=document.getElementById("ai-task-description"),e=document.getElementById("task-type"),i=document.getElementById("task-priority"),s=document.getElementById("task-complexity");if(console.log("Form elements found:",{description:!!t,type:!!e,priority:!!i,complexity:!!s}),!t){console.error("Task description element not found!"),alert("Form not properly initialized. Please refresh the page."),this.isSubmitting=!1;return}const n=t.value,o=e?e.value:"strategic_analysis",a=i?parseInt(i.value):3,r=s?parseInt(s.value):50;console.log("Form values:",{description:n,type:o,priority:a,complexity:r});const l=Array.from(document.querySelectorAll(".capabilities-checkboxes input:checked")).map(h=>h.value);console.log("Selected capabilities:",l);const d={type:o,description:n.trim(),priority:a,complexity:r,requiredCapabilities:l};if(console.log("Submitting task data:",d),this.showTaskProgress(),this.websocket&&(this.websocket.socket&&this.websocket.socket.connected||this.websocket.connected))try{this.websocket.send("submit-ai-task",d),t.value="",document.querySelectorAll(".capabilities-checkboxes input:checked").forEach(h=>h.checked=!1),console.log("Task submitted successfully to AI backend"),setTimeout(()=>{this.isSubmitting=!1},2e3)}catch(h){console.error("Error submitting task:",h),this.showError("Failed to submit task: "+h.message),this.isSubmitting=!1;return}else console.warn("WebSocket not connected, using demo mode"),this.runDemoCollaboration(d),setTimeout(()=>{this.isSubmitting=!1},1e3)}showTaskProgress(){const t=document.getElementById("active-task-display");t.style.display="block",this.updateProgressPhase("Initializing AI collaboration...",10),setTimeout(()=>this.updateProgressPhase("Selecting optimal AI agents...",25),1e3),setTimeout(()=>this.updateProgressPhase("Individual analysis phase...",40),3e3),setTimeout(()=>this.updateProgressPhase("Collaborative discussion...",65),8e3),setTimeout(()=>this.updateProgressPhase("Convergence and synthesis...",85),15e3)}updateProgressPhase(t,e){document.getElementById("progress-text").textContent=t,document.getElementById("progress-fill").style.width=`${e}%`}hideTaskProgress(){document.getElementById("active-task-display").style.display="none"}handleTaskCompleted(t){console.log("🏆 Handling task completion:",t),this.hideTaskProgress(),this.isSubmitting=!1,t.success&&t.result?(console.log("✅ Displaying successful task result"),this.displayTaskResult(t.result),this.addToTaskHistory(t.result),this.showNotification("🎉 Task completed successfully!","success")):(console.log("❌ Task failed:",t.error||"Unknown error"),this.showError("Task failed: "+(t.error||"Unknown error")))}displayTaskResult(t){console.log("📊 Displaying task result:",t);const e=document.getElementById("task-results");if(!e){console.error("❌ Task results container not found!");return}const i={task:t.task||{description:"Unknown task",type:"unknown"},finalResult:t.finalResult||t.content||"No result available",synthesizedBy:t.synthesizedBy||"AI Collaboration System",timestamp:t.timestamp||Date.now(),metadata:t.metadata||{totalAgents:1,tokensUsed:0,collaborationType:"standard"},convergenceMetrics:t.convergenceMetrics||{convergenceAchieved:!0,finalConsensus:.8,collaborationEfficiency:.7},insights:t.insights||[]},s=document.createElement("div");s.className="task-result",s.innerHTML=`
            <div class="result-header">
                <h4>🎉 Collaboration Completed</h4>
                <span class="timestamp">${new Date(i.timestamp).toLocaleString()}</span>
            </div>
            
            <div class="result-meta">
                <div class="meta-item">
                    <span class="label">Task:</span>
                    <span class="value">${i.task.description}</span>
                </div>
                <div class="meta-item">
                    <span class="label">Synthesized by:</span>
                    <span class="value">${i.synthesizedBy}</span>
                </div>
                <div class="meta-item">
                    <span class="label">Participants:</span>
                    <span class="value">${i.metadata.totalAgents} AI agents</span>
                </div>
                <div class="meta-item">
                    <span class="label">Tokens Used:</span>
                    <span class="value">${i.metadata.tokensUsed}</span>
                </div>
            </div>
            
            <div class="result-content">
                <h5>Final Collaborative Analysis:</h5>
                <div class="analysis-text">${i.finalResult}</div>
            </div>
            
            <div class="result-metrics">
                <h5>Collaboration Metrics:</h5>
                <div class="metrics-grid">
                    ${i.convergenceMetrics.convergenceAchieved?`<div class="metric">
                            <span class="metric-label">Convergence:</span>
                            <span class="metric-value success">✅ Achieved</span>
                        </div>
                        <div class="metric">
                            <span class="metric-label">Consensus:</span>
                            <span class="metric-value">${(i.convergenceMetrics.finalConsensus*100).toFixed(1)}%</span>
                        </div>
                        <div class="metric">
                            <span class="metric-label">Efficiency:</span>
                            <span class="metric-value">${(i.convergenceMetrics.collaborationEfficiency*100).toFixed(1)}%</span>
                        </div>`:'<div class="metric"><span class="metric-value warning">⚠️ Partial Convergence</span></div>'}
                </div>
            </div>
        `,e.innerHTML="",e.appendChild(s),console.log("✅ Task result displayed successfully")}addToTaskHistory(t){console.log("📜 Adding to task history:",t);const e={task:t.task||{description:"Unknown task",type:"unknown"},finalResult:t.finalResult||t.content||"No result available",timestamp:t.timestamp||Date.now(),synthesizedBy:t.synthesizedBy||"AI System"};this.taskHistory.unshift(e),this.taskHistory.length>20&&(this.taskHistory=this.taskHistory.slice(0,20)),this.updateHistoryDisplay(),console.log("✅ Task added to history. Total items:",this.taskHistory.length)}updateHistoryDisplay(){const t=document.getElementById("history-list");if(!t){console.error("❌ History list container not found!");return}if(console.log("🔄 Updating history display with",this.taskHistory.length,"items"),this.taskHistory.length===0){t.innerHTML='<div class="no-history">No collaboration history yet. Submit a task to get started!</div>';return}t.innerHTML=this.taskHistory.slice(0,5).map(e=>{const i=e.task||{},s=i.description||"Unknown task",n=e.finalResult||"No result available",o=e.timestamp||Date.now();return`
                <div class="history-item">
                    <div class="history-header">
                        <span class="task-type">${i.type||"unknown"}</span>
                        <span class="timestamp">${new Date(o).toLocaleString()}</span>
                    </div>
                    <div class="task-description">${s.substring(0,100)}${s.length>100?"...":""}</div>
                    <div class="result-preview">${n.substring(0,150)}${n.length>150?"...":""}</div>
                </div>
            `}).join(""),console.log("✅ History display updated successfully")}displayDemoResult(t){this.displayTaskResult(t),this.addToTaskHistory(t),this.showNotification("🎭 Demo collaboration completed!","success")}showNotification(t,e="info"){const i=document.createElement("div");i.className=`notification ${e}`,i.textContent=t,document.body.appendChild(i),setTimeout(()=>{i.remove()},5e3)}showError(t){this.showNotification("❌ "+t,"error")}showCreateAgentDialog(){const t=document.createElement("div");t.className="agent-creation-modal",t.style.cssText=`
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.8);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 10000;
        `,t.innerHTML=`
            <div class="modal-content" style="
                background: linear-gradient(135deg, #1e293b, #334155);
                border-radius: 12px;
                padding: 30px;
                width: 500px;
                max-width: 90vw;
                border: 1px solid rgba(14, 165, 233, 0.3);
                box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
            ">
                <div class="modal-header" style="margin-bottom: 20px; display: flex; justify-content: space-between; align-items: center;">
                    <h3 style="color: #0ea5e9; margin: 0;">🤖 Create Custom AI Agent</h3>
                    <button class="close-btn" style="
                        background: none;
                        border: none;
                        color: #94a3b8;
                        font-size: 24px;
                        cursor: pointer;
                        padding: 5px;
                    ">×</button>
                </div>
                
                <form id="agent-creation-form">
                    <div class="form-group" style="margin-bottom: 15px;">
                        <label style="display: block; color: #0ea5e9; margin-bottom: 5px; font-weight: 500;">Agent Name:</label>
                        <input type="text" id="agent-name" placeholder="e.g., Data Analyst Agent" style="
                            width: 100%;
                            background: rgba(14, 165, 233, 0.1);
                            border: 1px solid rgba(14, 165, 233, 0.3);
                            border-radius: 6px;
                            padding: 8px 12px;
                            color: #ffffff;
                            font-family: inherit;
                        ">
                    </div>
                    
                    <div class="form-group" style="margin-bottom: 15px;">
                        <label style="display: block; color: #0ea5e9; margin-bottom: 5px; font-weight: 500;">Agent Type:</label>
                        <select id="agent-type" style="
                            width: 100%;
                            background: rgba(14, 165, 233, 0.1);
                            border: 1px solid rgba(14, 165, 233, 0.3);
                            border-radius: 6px;
                            padding: 8px 12px;
                            color: #ffffff;
                            font-family: inherit;
                        ">
                            <option value="analyst">Analyst - Data & Research Expert</option>
                            <option value="creative">Creative - Innovation & Ideas</option>
                            <option value="technical">Technical - Engineering & Development</option>
                            <option value="strategic">Strategic - Planning & Decision Making</option>
                            <option value="ethical">Ethical - Values & Guidelines</option>
                            <option value="synthesizer">Synthesizer - Integration & Summary</option>
                        </select>
                    </div>
                    
                    <div class="form-group" style="margin-bottom: 15px;">
                        <label style="display: block; color: #0ea5e9; margin-bottom: 5px; font-weight: 500;">Personality Traits:</label>
                        <div class="personality-checkboxes" style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-top: 5px;">
                            <label style="display: flex; align-items: center; gap: 6px; margin: 0; font-weight: normal; cursor: pointer; color: #ffffff;">
                                <input type="checkbox" value="analytical" style="width: auto; margin: 0;"> Analytical
                            </label>
                            <label style="display: flex; align-items: center; gap: 6px; margin: 0; font-weight: normal; cursor: pointer; color: #ffffff;">
                                <input type="checkbox" value="creative" style="width: auto; margin: 0;"> Creative
                            </label>
                            <label style="display: flex; align-items: center; gap: 6px; margin: 0; font-weight: normal; cursor: pointer; color: #ffffff;">
                                <input type="checkbox" value="detail_oriented" style="width: auto; margin: 0;"> Detail-Oriented
                            </label>
                            <label style="display: flex; align-items: center; gap: 6px; margin: 0; font-weight: normal; cursor: pointer; color: #ffffff;">
                                <input type="checkbox" value="innovative" style="width: auto; margin: 0;"> Innovative
                            </label>
                            <label style="display: flex; align-items: center; gap: 6px; margin: 0; font-weight: normal; cursor: pointer; color: #ffffff;">
                                <input type="checkbox" value="collaborative" style="width: auto; margin: 0;"> Collaborative
                            </label>
                            <label style="display: flex; align-items: center; gap: 6px; margin: 0; font-weight: normal; cursor: pointer; color: #ffffff;">
                                <input type="checkbox" value="critical_thinking" style="width: auto; margin: 0;"> Critical Thinking
                            </label>
                        </div>
                    </div>
                    
                    <div class="form-group" style="margin-bottom: 20px;">
                        <label style="display: block; color: #0ea5e9; margin-bottom: 5px; font-weight: 500;">Expertise Description:</label>
                        <textarea id="agent-expertise" rows="3" placeholder="Describe this agent's areas of expertise and unique capabilities..." style="
                            width: 100%;
                            background: rgba(14, 165, 233, 0.1);
                            border: 1px solid rgba(14, 165, 233, 0.3);
                            border-radius: 6px;
                            padding: 8px 12px;
                            color: #ffffff;
                            font-family: inherit;
                            resize: vertical;
                        "></textarea>
                    </div>
                    
                    <div class="modal-footer" style="display: flex; justify-content: flex-end; gap: 10px;">
                        <button type="button" class="debug-agent-btn" style="
                            background: #6b7280;
                            color: white;
                            border: none;
                            padding: 10px 20px;
                            border-radius: 6px;
                            cursor: pointer;
                            font-family: inherit;
                            font-weight: 500;
                            margin-right: auto;
                        ">🔍 Debug</button>
                        <button type="button" class="cancel-btn" style="
                            background: #6b7280;
                            color: white;
                            border: none;
                            padding: 10px 20px;
                            border-radius: 6px;
                            cursor: pointer;
                            font-family: inherit;
                            font-weight: 500;
                        ">Cancel</button>
                        <button type="submit" style="
                            background: linear-gradient(135deg, #10b981, #059669);
                            color: white;
                            border: none;
                            padding: 10px 20px;
                            border-radius: 6px;
                            cursor: pointer;
                            font-family: inherit;
                            font-weight: 500;
                        ">🚀 Create Agent</button>
                    </div>
                </form>
            </div>
        `,document.body.appendChild(t);const e=t.querySelector(".close-btn"),i=t.querySelector(".cancel-btn"),s=t.querySelector(".debug-agent-btn"),n=t.querySelector("#agent-creation-form"),o=()=>{document.body.removeChild(t)};e.addEventListener("click",o),i.addEventListener("click",o),t.addEventListener("click",a=>{a.target===t&&o()}),s.addEventListener("click",()=>{this.debugAgentForm(t)}),n.addEventListener("submit",a=>{a.preventDefault(),this.createCustomAgent(t)})}debugAgentForm(t){console.log("🔍 Debugging agent creation form...");const e=t.querySelector("#agent-name"),i=t.querySelector("#agent-type"),s=t.querySelector("#agent-expertise"),n=t.querySelectorAll(".personality-checkboxes input"),o={nameInput:{exists:!!e,value:e?e.value:"N/A",length:e?e.value.length:0,trimmed:e?e.value.trim():"N/A",trimmedLength:e?e.value.trim().length:0},typeSelect:{exists:!!i,value:i?i.value:"N/A"},expertiseTextarea:{exists:!!s,value:s?s.value:"N/A",length:s?s.value.length:0},personalityCheckboxes:{total:n.length,checked:Array.from(n).filter(a=>a.checked).length,values:Array.from(n).filter(a=>a.checked).map(a=>a.value)}};console.log("Agent form debug data:",o),e&&(e.value="Test Debug Agent",console.log("📝 Set test name value")),alert(`Form Debug Info:

Name Field: ${o.nameInput.exists?"Found":"Missing"}
Name Value: "${o.nameInput.value}"
Name Length: ${o.nameInput.length}
Type Field: ${o.typeSelect.exists?"Found":"Missing"}
Personality Options: ${o.personalityCheckboxes.total} total, ${o.personalityCheckboxes.checked} selected`)}debugFormState(){var e,i,s,n,o;console.log("🔍 Debugging form state...");const t={taskDescription:document.getElementById("ai-task-description"),taskType:document.getElementById("task-type"),taskPriority:document.getElementById("task-priority"),taskComplexity:document.getElementById("task-complexity"),aiTaskForm:document.getElementById("ai-task-form"),capabilityCheckboxes:document.querySelectorAll(".capabilities-checkboxes input")};console.log("Form elements debug:",{taskDescription:{exists:!!t.taskDescription,value:((e=t.taskDescription)==null?void 0:e.value)||"N/A",placeholder:((i=t.taskDescription)==null?void 0:i.placeholder)||"N/A"},taskType:{exists:!!t.taskType,value:((s=t.taskType)==null?void 0:s.value)||"N/A"},taskPriority:{exists:!!t.taskPriority,value:((n=t.taskPriority)==null?void 0:n.value)||"N/A"},taskComplexity:{exists:!!t.taskComplexity,value:((o=t.taskComplexity)==null?void 0:o.value)||"N/A"},aiTaskForm:{exists:!!t.aiTaskForm},capabilityCheckboxes:{count:t.capabilityCheckboxes.length,checked:Array.from(t.capabilityCheckboxes).filter(a=>a.checked).length}}),t.taskDescription?(t.taskDescription.value="Test task description for debugging",console.log("📝 Set test description"),this.submitAITask()):(console.error("❌ Cannot debug: task description element not found"),alert("Form elements not found! Please check if the interface is properly loaded."))}createCustomAgent(t){console.log("🔍 Debugging custom agent creation...");const e=t.querySelector("#agent-name"),i=t.querySelector("#agent-type"),s=t.querySelector("#agent-expertise");if(console.log("Form elements found in modal:",{nameInput:!!e,typeSelect:!!i,expertiseTextarea:!!s,nameValue:e?e.value:"N/A",nameLength:e?e.value.length:0}),!e){console.error("❌ Agent name input not found in modal!"),alert("Form elements not found! Please try again.");return}const n=e.value,o=i?i.value:"analyst",a=s?s.value:"",r=Array.from(t.querySelectorAll(".personality-checkboxes input:checked")).map(d=>d.value);if(console.log("Extracted values:",{name:n,type:o,expertise:a,personality:r}),!n||!n.trim()){console.log("❌ Empty name detected:",{name:n,trimmed:n?n.trim():"null",length:n?n.length:0}),alert("Please provide an agent name"),e.focus();return}const l={name:n.trim(),type:o,expertise:a.trim(),personality:r,id:`custom_${Date.now()}_${Math.random().toString(36).substr(2,9)}`,createdAt:Date.now(),status:"active"};console.log("🤖 Creating custom agent:",l),this.addCustomAgent(l),document.body.removeChild(t),this.showNotification(`🎉 Custom agent "${n}" created successfully!`,"success"),this.websocket&&this.websocket.connected&&this.websocket.emit("create-ai-agent",l)}addCustomAgent(t){this.customAgents=this.customAgents||new Map,this.customAgents.set(t.id,t),this.updateCustomAgentsDisplay()}updateCustomAgentsDisplay(){const t=document.getElementById("ai-agents-list");if(!t)return;const e=this.customAgents||new Map,i=Array.from(e.values()).map(s=>`
            <div class="agent-card custom-agent" style="border-left: 3px solid #10b981;">
                <div class="agent-header">
                    <h5>${s.name}</h5>
                    <span class="agent-type custom">${s.type}</span>
                    <span class="agent-status active">${s.status}</span>
                </div>
                <div class="agent-details">
                    <div class="agent-capabilities">
                        <strong>Expertise:</strong> ${s.expertise||"General capabilities"}
                    </div>
                    <div class="agent-capabilities">
                        <strong>Personality:</strong> ${s.personality.join(", ")||"Adaptive"}
                    </div>
                    <div class="agent-metrics">
                        <span>Type: Custom Agent</span>
                        <span>Created: ${new Date(s.createdAt).toLocaleDateString()}</span>
                    </div>
                </div>
            </div>
        `).join("");if(e.size>0){const s=t.innerHTML;t.innerHTML=i+s}}enableDemoMode(){console.log("🎭 Enabling demo mode..."),this.demoMode=!0,this.createDemoAgents()}createDemoAgents(){const t=[{id:"demo_analyst",name:"Demo Data Analyst",type:"analyst",status:"active",expertise:"Statistical analysis and data interpretation",personality:["analytical","detail_oriented"],createdAt:Date.now()-864e5},{id:"demo_creative",name:"Demo Creative Thinker",type:"creative",status:"active",expertise:"Innovative solutions and creative problem-solving",personality:["creative","innovative"],createdAt:Date.now()-1728e5}];this.customAgents=this.customAgents||new Map,t.forEach(e=>{this.customAgents.set(e.id,e)}),this.updateCustomAgentsDisplay()}runDemoCollaboration(t){if(this.isRunningDemo){console.log("⚠️ Demo collaboration already in progress, ignoring duplicate request");return}console.log("🎭 Running demo collaboration for:",t.description),this.isRunningDemo=!0;const e=document.getElementById("ai-task-description");e&&(e.value=""),document.querySelectorAll(".capabilities-checkboxes input:checked").forEach(i=>i.checked=!1),setTimeout(()=>this.updateProgressPhase("Demo: Analyzing task requirements...",20),500),setTimeout(()=>this.updateProgressPhase("Demo: Custom agents collaborating...",45),2e3),setTimeout(()=>this.updateProgressPhase("Demo: Synthesizing insights...",70),4e3),setTimeout(()=>this.updateProgressPhase("Demo: Generating final analysis...",90),6e3),setTimeout(()=>{const i=this.generateDemoResult(t);this.hideTaskProgress(),this.displayTaskResult(i),this.addToTaskHistory(i),this.isRunningDemo=!1},8e3)}generateDemoResult(t){var i;console.log("🎭 Generating demo result for task:",t.description);const e=this.generateTaskSpecificAnalysis(t.description);return{task:t,finalResult:e,synthesizedBy:"AI协作分析引擎",timestamp:Date.now(),metadata:{totalAgents:(((i=this.customAgents)==null?void 0:i.size)||0)+4,tokensUsed:Math.floor(Math.random()*200)+345,collaborationType:"deep_collaborative_analysis"},convergenceMetrics:{convergenceAchieved:!0,finalConsensus:.88+Math.random()*.1,collaborationEfficiency:.82+Math.random()*.15},insights:["运用多智能体协作框架进行综合分析","整合宏观经济模型和微观数据指标","考虑政策影响和国际环境变化因素","结合历史趋势和未来发展预期","应用先进的计量经济学方法进行预测"]}}generateTaskSpecificAnalysis(t){console.log("📊 Generating task-specific analysis for:",t);const e=t.toLowerCase();return e.includes("gdp")||e.includes("经济")||e.includes("增长")?`基于中国未来10年GDP深度分析，我们的AI协作团队提供以下综合评估：

**🔍 经济增长预测 (2025-2035)：**
• 2025-2027年：GDP年均增长率 5.8-6.2%（政策支持期）
• 2028-2030年：增长率稳定在 5.2-5.8%（转型深化期）
• 2031-2035年：增长率调整至 4.5-5.2%（高质量发展期）
• 预计2035年GDP总量达到约200万亿元人民币

**🚀 核心驱动因素：**
1. **科技创新引擎**：人工智能、5G/6G、新能源技术将贡献30-35%增长动能
2. **消费市场升级**：14亿人口的消费潜力和中产阶级扩大
3. **绿色转型投资**：碳中和目标下的清洁能源和环保产业
4. **城镇化进程**：新型城镇化带来的基础设施和服务业需求
5. **"双循环"战略**：内循环为主体、国内国际双循环相互促进

**⚠️ 主要挑战与风险：**
• 人口老龄化：2030年后劳动年龄人口减少，需提高生产率
• 地缘政治：中美贸易关系和全球供应链重构影响
• 环境约束：碳中和承诺与经济增长的平衡挑战
• 结构转型：从投资拉动向消费和创新驱动转变的阵痛

**📊 分阶段发展特征：**
**第一阶段 (2025-2027)**：政策红利释放，新基建投资高峰
**第二阶段 (2028-2030)**：产业升级加速，服务业占比超过60%
**第三阶段 (2031-2035)**：创新驱动成熟，高质量发展模式确立

**🎯 综合结论：**
中国未来10年GDP将保持中高速稳健增长，总体呈现"前高后稳"的发展轨迹。经济增长模式将从规模扩张转向质量提升，科技创新和绿色发展成为关键动力。预计到2035年，中国将基本实现社会主义现代化，经济总量和人均收入水平显著提升。`:e.includes("ai")||e.includes("人工智能")||e.includes("技术")?`AI技术对未来社会影响的综合分析：

**技术发展趋势：**
- 机器学习和深度学习将成为主流
- 自然语言处理和计算机视觉快速发展
- 边缘计算和AIoT应用普及

**经济影响：**
- 生产力显著提升，预计增加20-40%
- 新兴产业和就业机会创造
- 传统行业转型升级加速

**社会变革：**
- 教育和培训模式改变
- 医疗健康服务个性化
- 智慧城市和数字治理

**伦理考量：**
- 数据隐私和安全保护
- 算法公平性和透明度
- 人工智能治理框架`:e.includes("市场")||e.includes("market")||e.includes("行业")?`市场分析报告：

**市场现状：**
- 当前市场规模和竞争格局分析
- 主要参与者和市场份额
- 消费者行为和需求趋势

**机会与挑战：**
- 新兴技术带来的机遇
- 政策法规影响
- 全球化和本土化平衡

**发展建议：**
- 数字化转型策略
- 品牌建设和客户体验优化
- 持续创新和研发投入`:`针对您的问题“${t}”的深度分析：

**问题分解与分析：**
我们的AI协作系统对该问题进行了多维度分析，综合考虑了相关的各种因素和变量。

**核心发现：**
1. 问题的复杂性需要系统性方法解决
2. 多个关键因素相互作用影响结果
3. 需要综合考虑短期和长期影响

**解决方案建议：**
- 采用分阶段实施策略
- 建立监测和评估机制
- 加强利益相关者沟通协调

**结论与建议：**
综合各方面分析，我们建议采取综合性方案，统筹考虑各种因素和影响，并根据实际情况进行调整和优化。`}setupAIControlPanelToggle(){const t=document.getElementById("ai-control-toggle"),e=document.querySelector(".ai-control-panel");if(!t||!e){console.warn("⚠️ Toggle button or AI control panel not found");return}let i=!1;t.addEventListener("click",()=>{i=!i,i?(e.classList.add("collapsed"),t.innerHTML="<span>◀</span>",console.log("🔄 AI Control panel collapsed")):(e.classList.remove("collapsed"),t.innerHTML="<span>▶</span>",console.log("🔄 AI Control panel expanded"))}),t.addEventListener("mouseenter",()=>{i?t.style.transform="scale(1.1) rotate(180deg)":t.style.transform="scale(1.1)"}),t.addEventListener("mouseleave",()=>{i?t.style.transform="rotate(180deg)":t.style.transform=""}),console.log("✅ AI Control panel toggle setup complete")}setupCollaborationPanelToggle(){const t=document.getElementById("collaboration-toggle"),e=document.querySelector(".collaboration-panel");if(!t||!e){console.warn("⚠️ Toggle button or collaboration panel not found");return}let i=!1;t.addEventListener("click",()=>{i=!i,i?(e.classList.add("collapsed"),t.innerHTML="<span>▶</span>",console.log("🔄 Collaboration panel collapsed")):(e.classList.remove("collapsed"),t.innerHTML="<span>◀</span>",console.log("🔄 Collaboration panel expanded"))}),t.addEventListener("mouseenter",()=>{i?t.style.transform="scale(1.1) rotate(180deg)":t.style.transform="scale(1.1)"}),t.addEventListener("mouseleave",()=>{i?t.style.transform="rotate(180deg)":t.style.transform=""}),console.log("✅ Collaboration panel toggle setup complete")}}document.addEventListener("DOMContentLoaded",()=>{window.realAIInterface=new A});class M{constructor(){this.websocket=null,this.metrics={agents:[],collaborations:0,tasks:0,performance:{convergenceRate:0,avgResponseTime:0,tokenUsage:0,successRate:100},system:{memory:0,connections:0,uptime:0}},this.charts=new Map,this.activityLog=[],this.initializeDashboard(),this.connectWebSocket(),this.startMetricsUpdate(),this.simulateRealtimeUpdates()}initializeDashboard(){this.setupEventListeners(),this.initializeCharts(),setTimeout(()=>{const t=document.querySelector('.nav-btn[data-view="ai-overview"]');t&&!t.classList.contains("active")&&t.classList.add("active");const e=document.getElementById("ai-overview");e&&!e.classList.contains("active")&&e.classList.add("active")},100),this.updateDisplay()}setupEventListeners(){document.querySelectorAll(".nav-btn").forEach(t=>{t.addEventListener("click",e=>{e.preventDefault(),e.stopPropagation();const i=e.target.dataset.view;i&&this.switchView(i)})})}switchView(t){console.log(`Switching to view: ${t}`),document.querySelectorAll(".view").forEach(s=>{s.classList.remove("active")});const e=document.getElementById(t);e?(e.classList.add("active"),console.log(`Activated view: ${t}`)):console.warn(`View not found: ${t}`),document.querySelectorAll(".nav-btn").forEach(s=>{s.classList.remove("active")});const i=document.querySelector(`[data-view="${t}"]`);i?(i.classList.add("active"),console.log(`Activated nav button for: ${t}`)):console.warn(`Nav button not found for: ${t}`),e&&(e.style.animation="fadeIn 0.3s ease")}connectWebSocket(){console.log("🔄 Connecting to Real AI Server..."),window.app&&window.app.ws&&window.app.ws.socket?(console.log("🔗 Reusing main app WebSocket connection in metrics dashboard"),this.websocket=window.app.ws,this.setupWebSocketHandlers()):(console.log("🔗 Creating new WebSocket connection for metrics dashboard"),this.websocket=io(p.getBackendUrl()),this.websocket.on("connect",()=>{console.log("📡 Connected to Real AI WebSocket"),this.addActivity("Connected to AI system","success"),this.requestSystemStatus()}),this.websocket.on("ai-system-status",t=>{this.updateSystemMetrics(t)}),this.websocket.on("ai-collaboration-update",t=>{this.updateCollaborationMetrics(t)}),this.websocket.on("ai-agent-update",t=>{this.updateAgentMetrics(t)}),this.websocket.on("demo-collaboration-completed",t=>{this.handleCollaborationComplete(t)}),this.websocket.on("network-topology-update",t=>{this.updateNetworkTopology(t)}),this.websocket.on("performance-metrics",t=>{this.updatePerformanceMetrics(t)}),this.websocket.on("collaboration-view-update",t=>{this.updateCollaborationViewMetrics(t)}),this.websocket.on("disconnect",()=>{console.log("❌ Disconnected from AI WebSocket"),this.addActivity("Disconnected from AI system","error")}),this.websocket.on("connect_error",t=>{console.error("WebSocket connection error:",t),this.addActivity("WebSocket connection error","error")}))}setupWebSocketHandlers(){window.app&&window.app.ws&&(window.app.ws.on("ai-system-status",t=>{this.updateSystemMetrics(t)}),window.app.ws.on("ai-collaboration-update",t=>{this.updateCollaborationMetrics(t)}),window.app.ws.on("ai-agent-update",t=>{this.updateAgentMetrics(t)}),window.app.ws.on("demo-collaboration-completed",t=>{this.handleCollaborationComplete(t)}),window.app.ws.on("network-topology-update",t=>{this.updateNetworkTopology(t)}),window.app.ws.on("performance-metrics",t=>{this.updatePerformanceMetrics(t)}),window.app.ws.on("collaboration-view-update",t=>{this.updateCollaborationViewMetrics(t)}),window.app.ws.send("get-ai-status"))}requestSystemStatus(){this.websocket&&this.websocket.connected&&this.websocket.emit("get-ai-status")}updateSystemMetrics(t){var e;this.metrics.agents=t.aiAgents||[],this.metrics.collaborations=t.activeCollaborations||0,this.metrics.tasks=t.totalCollaborations||0,t.system&&(this.metrics.system.memory=((e=t.system.memory)==null?void 0:e.heapUsed)||0,this.metrics.system.uptime=t.system.uptime||0),this.metrics.system.connections=t.connectedClients||0,this.updateAPIStatus(t.openaiApiKey),this.updateStatusCards(),this.updateAgentMetricsDisplay(),this.updateResourceMeters(),this.addActivity(`System status updated: ${this.metrics.agents.length} agents active`,"info")}updateStatusCards(){const t=document.getElementById("total-agents"),e=document.getElementById("active-collaborations"),i=document.getElementById("total-tasks");t&&(t.textContent=this.metrics.agents.length),e&&(e.textContent=this.metrics.collaborations),i&&(i.textContent=this.metrics.tasks);const s=document.getElementById("agents-status"),n=document.getElementById("collab-status");s&&(s.className=`status-indicator ${this.metrics.agents.length>0?"online":"offline"}`),n&&(n.className=`status-indicator ${this.metrics.collaborations>0?"online":"offline"}`)}updateAPIStatus(t){const e=document.getElementById("api-status"),i=document.getElementById("api-indicator");e&&i&&(t?(e.textContent="Active",i.className="status-indicator success"):(e.textContent="No Key",i.className="status-indicator warning"))}updateAgentMetricsDisplay(){const t=document.getElementById("agent-metrics-container");t&&(t.innerHTML=this.metrics.agents.map(e=>{var i,s,n,o,a,r;return`
            <div class="agent-metric-card">
                <div class="agent-header">
                    <div class="agent-name">${e.name}</div>
                    <div class="agent-type">${e.type}</div>
                </div>
                
                <div class="agent-metrics">
                    <div class="metric-item">
                        <div class="label">Energy</div>
                        <div class="value">${e.energy}/${e.maxEnergy}</div>
                    </div>
                    
                    <div class="metric-item">
                        <div class="label">Focus</div>
                        <div class="value">${(((i=e.ai)==null?void 0:i.focusLevel)*100||0).toFixed(0)}%</div>
                    </div>
                    
                    <div class="metric-item">
                        <div class="label">Memory</div>
                        <div class="value">${((n=(s=e.ai)==null?void 0:s.memoryLoad)==null?void 0:n.shortTerm)||0}/${((a=(o=e.ai)==null?void 0:o.memoryLoad)==null?void 0:a.longTerm)||0}</div>
                    </div>
                    
                    <div class="metric-item">
                        <div class="label">Status</div>
                        <div class="value ${e.status}">${e.status}</div>
                    </div>
                </div>
                
                ${(r=e.ai)!=null&&r.currentThought?`
                    <div class="agent-thinking">
                        "${e.ai.currentThought}"
                    </div>
                `:""}
            </div>
        `}).join(""))}updateResourceMeters(){const t=Math.round(this.metrics.system.memory/1024/1024),e=Math.min(t/100*100,100),i=document.getElementById("memory-bar"),s=document.getElementById("memory-value");i&&(i.style.width=`${e}%`),s&&(s.textContent=`${t} MB`);const n=Math.min(this.metrics.system.connections/10*100,100),o=document.getElementById("connections-bar"),a=document.getElementById("connections-value");o&&(o.style.width=`${n}%`),a&&(a.textContent=this.metrics.system.connections);const r=this.formatUptime(this.metrics.system.uptime),l=document.getElementById("uptime-value");l&&(l.textContent=r)}updateCollaborationMetrics(t){if(this.addActivity(`Collaboration session: ${t.sessionId}`,"info"),t.convergenceMetrics){this.metrics.performance.convergenceRate=t.convergenceMetrics.finalConsensus*100||0;const e=document.getElementById("convergence-rate");e&&(e.textContent=`${this.metrics.performance.convergenceRate.toFixed(0)}%`)}if(t.metadata){this.metrics.performance.tokenUsage+=t.metadata.tokensUsed||0;const e=document.getElementById("token-usage");e&&(e.textContent=this.metrics.performance.tokenUsage)}}handleCollaborationComplete(t){var i,s,n;this.addActivity(`Collaboration completed: ${t.task.type}`,"success"),this.metrics.tasks++;const e=document.getElementById("total-tasks");if(e&&(e.textContent=this.metrics.tasks),(i=t.convergenceMetrics)!=null&&i.finalConsensus){this.metrics.performance.convergenceRate=t.convergenceMetrics.finalConsensus*100;const o=document.getElementById("convergence-rate");o&&(o.textContent=`${this.metrics.performance.convergenceRate.toFixed(0)}%`)}if((s=t.metadata)!=null&&s.tokensUsed){this.metrics.performance.tokenUsage+=t.metadata.tokensUsed;const o=document.getElementById("token-usage");o&&(o.textContent=this.metrics.performance.tokenUsage)}if((n=t.metadata)!=null&&n.totalAgents&&t.sessionId){const o=Date.now()-parseInt(t.sessionId.split("_")[0]);this.metrics.performance.avgResponseTime=o;const a=document.getElementById("avg-response-time");a&&(a.textContent=`${o}ms`)}}updateNetworkTopology(t){if(t.connections){const e=document.getElementById("network-connections");e&&(e.textContent=t.connections)}if(t.stability){const e=document.getElementById("network-stability");e&&(e.textContent=`${(t.stability*100).toFixed(0)}%`)}if(t.throughput){const e=document.getElementById("throughput");e&&(e.textContent=`${t.throughput} req/s`)}if(t.clusteringCoefficient){const e=document.getElementById("clustering-coefficient");e&&(e.textContent=t.clusteringCoefficient.toFixed(2))}t.agents&&this.updateAgentPositions(t.agents),this.addActivity("Network topology updated","info")}updatePerformanceMetrics(t){if(t.cpuUsage){const e=document.getElementById("cpu-usage");e&&(e.textContent=`${t.cpuUsage.toFixed(0)}%`)}if(t.memoryUsagePercent){const e=document.getElementById("memory-usage-percent");e&&(e.textContent=`${t.memoryUsagePercent.toFixed(0)}%`)}if(t.networkLatency){const e=document.getElementById("network-latency");e&&(e.textContent=`${t.networkLatency}ms`)}if(t.processingSpeed){const e=document.getElementById("processing-speed");e&&(e.textContent=`${t.processingSpeed} ops/s`)}if(t.liveResponseTime){const e=document.getElementById("live-response-time");e&&(e.textContent=`${t.liveResponseTime}ms`)}if(t.liveTokenRate){const e=document.getElementById("live-token-rate");e&&(e.textContent=`${t.liveTokenRate}/min`)}if(t.collabEvents){const e=document.getElementById("collab-events");e&&(e.textContent=t.collabEvents)}if(t.agentActivity){const e=document.getElementById("agent-activity");e&&(e.textContent=`${(t.agentActivity*100).toFixed(0)}%`)}this.addActivity("Performance metrics updated","info")}updateCollaborationViewMetrics(t){if(t.discussionRounds){const e=document.getElementById("discussion-rounds");e&&(e.textContent=t.discussionRounds)}if(t.consensusLevel){const e=document.getElementById("consensus-level");e&&(e.textContent=`${(t.consensusLevel*100).toFixed(0)}%`)}if(t.synthesisSpeed){const e=document.getElementById("synthesis-speed");e&&(e.textContent=`${t.synthesisSpeed}ms`)}if(t.collaborationStrength){const e=document.getElementById("collaboration-strength");e&&(e.textContent=t.collaborationStrength.toFixed(1))}if(t.iterationCount){const e=document.getElementById("iteration-count");e&&(e.textContent=`${t.iterationCount}/5`)}if(t.confidenceAlignment){const e=document.getElementById("confidence-alignment");e&&(e.textContent=`${(t.confidenceAlignment*100).toFixed(0)}%`)}if(t.ideaDiversity){const e=document.getElementById("idea-diversity");e&&(e.textContent=t.ideaDiversity.toFixed(1))}if(t.synthesisQuality){const e=document.getElementById("synthesis-quality");e&&(e.textContent=`${(t.synthesisQuality*100).toFixed(0)}%`)}t.liveSessions&&this.updateLiveCollaborationSessions(t.liveSessions),t.collaborationFlow&&this.updateCollaborationFlow(t.collaborationFlow)}updateLiveCollaborationSessions(t){const e=document.getElementById("live-collaboration-sessions");e&&(e.innerHTML=t.map(i=>`
            <div class="agent-metric-card">
                <div class="agent-header">
                    <div class="agent-name">Session ${i.id.substring(0,8)}</div>
                    <div class="agent-type">${i.status}</div>
                </div>
                
                <div class="agent-metrics">
                    <div class="metric-item">
                        <div class="label">Participants</div>
                        <div class="value">${i.participants}</div>
                    </div>
                    
                    <div class="metric-item">
                        <div class="label">Progress</div>
                        <div class="value">${i.progress}%</div>
                    </div>
                    
                    <div class="metric-item">
                        <div class="label">Duration</div>
                        <div class="value">${i.duration}s</div>
                    </div>
                    
                    <div class="metric-item">
                        <div class="label">Consensus</div>
                        <div class="value">${(i.consensus*100).toFixed(0)}%</div>
                    </div>
                </div>
                
                <div class="agent-thinking">
                    ${i.currentPhase}
                </div>
            </div>
        `).join(""))}updateCollaborationFlow(t){const e=document.getElementById("collaboration-flow");e&&(e.innerHTML=t.slice(0,20).map(i=>`
            <div class="activity-item slide-in">
                <div class="activity-icon ${i.type}"></div>
                <div class="activity-content">
                    <div class="activity-message">${i.message}</div>
                    <div class="activity-time">${this.formatTime(new Date(i.timestamp))}</div>
                </div>
            </div>
        `).join(""))}updateAgentPositions(t){const e=document.getElementById("agent-positions-list");e&&(e.innerHTML=t.map(i=>`
            <div class="agent-metric-card">
                <div class="agent-header">
                    <div class="agent-name">${i.name}</div>
                    <div class="agent-type">${i.type}</div>
                </div>
                
                <div class="agent-metrics">
                    <div class="metric-item">
                        <div class="label">X</div>
                        <div class="value">${i.position.x.toFixed(1)}</div>
                    </div>
                    
                    <div class="metric-item">
                        <div class="label">Y</div>
                        <div class="value">${i.position.y.toFixed(1)}</div>
                    </div>
                    
                    <div class="metric-item">
                        <div class="label">Z</div>
                        <div class="value">${i.position.z.toFixed(1)}</div>
                    </div>
                    
                    <div class="metric-item">
                        <div class="label">Connections</div>
                        <div class="value">${i.connections||0}</div>
                    </div>
                </div>
            </div>
        `).join(""))}addActivity(t,e="info"){const i={message:t,type:e,timestamp:new Date};this.activityLog.unshift(i),this.activityLog.length>50&&this.activityLog.pop(),this.updateActivityFeed()}updateActivityFeed(){const t=document.getElementById("activity-feed");t&&(t.innerHTML=this.activityLog.slice(0,20).map(e=>`
            <div class="activity-item slide-in">
                <div class="activity-icon ${e.type}"></div>
                <div class="activity-content">
                    <div class="activity-message">${e.message}</div>
                    <div class="activity-time">${this.formatTime(e.timestamp)}</div>
                </div>
            </div>
        `).join(""))}initializeCharts(){document.querySelectorAll(".metric-chart").forEach(e=>{e.innerHTML='<div style="width: 100%; height: 100%; background: linear-gradient(90deg, transparent 0%, rgba(16, 185, 129, 0.3) 50%, transparent 100%); border-radius: 4px;"></div>'})}startMetricsUpdate(){setInterval(()=>{this.requestSystemStatus()},5e3),setInterval(()=>{this.updateTimeBasedMetrics()},1e3)}updateTimeBasedMetrics(){if(this.metrics.system.uptime>0){this.metrics.system.uptime+=1;const t=this.formatUptime(this.metrics.system.uptime),e=document.getElementById("uptime-value");e&&(e.textContent=t)}}formatUptime(t){const e=Math.floor(t/3600),i=Math.floor(t%3600/60),s=Math.floor(t%60);return e>0?`${e}h ${i}m ${s}s`:i>0?`${i}m ${s}s`:`${s}s`}formatTime(t){return t.toLocaleTimeString()}updateDisplay(){this.updateStatusCards(),this.updateAgentMetricsDisplay(),this.updateResourceMeters(),this.updateActivityFeed()}simulateRealtimeUpdates(){setInterval(()=>{this.updateNetworkTopology({connections:Math.floor(Math.random()*20)+5,stability:.85+Math.random()*.15,throughput:Math.floor(Math.random()*100)+20,clusteringCoefficient:Math.random()*.8+.2,agents:this.generateMockAgentPositions()})},3e3),setInterval(()=>{this.updatePerformanceMetrics({cpuUsage:Math.random()*40+10,memoryUsagePercent:Math.random()*60+20,networkLatency:Math.floor(Math.random()*50)+10,processingSpeed:Math.floor(Math.random()*200)+50,liveResponseTime:Math.floor(Math.random()*1e3)+200,liveTokenRate:Math.floor(Math.random()*50)+10,collabEvents:Math.floor(Math.random()*10),agentActivity:Math.random()*.8+.2})},2e3),setInterval(()=>{this.updateCollaborationViewMetrics({discussionRounds:Math.floor(Math.random()*5)+1,consensusLevel:Math.random()*.8+.2,synthesisSpeed:Math.floor(Math.random()*500)+100,collaborationStrength:Math.random()*4+1,iterationCount:Math.floor(Math.random()*5)+1,confidenceAlignment:Math.random()*.8+.2,ideaDiversity:Math.random()*3+1,synthesisQuality:Math.random()*.8+.2,liveSessions:this.generateMockCollaborationSessions(),collaborationFlow:this.generateMockCollaborationFlow()})},4e3)}generateMockAgentPositions(){const t=["Dr. Analyzer","Prof. Reasoner","Ms. Synthesizer","Dr. Validator","Mx. Innovator"],e=["analyzer","reasoner","synthesizer","validator","innovator"];return t.map((i,s)=>({name:i,type:e[s],position:{x:(Math.random()-.5)*1e3,y:(Math.random()-.5)*1e3,z:(Math.random()-.5)*500},connections:Math.floor(Math.random()*8)+2}))}generateMockCollaborationSessions(){const t=Math.floor(Math.random()*3)+1,e=[];for(let i=0;i<t;i++)e.push({id:`session_${Date.now()}_${i}`,status:["active","converging","synthesizing"][Math.floor(Math.random()*3)],participants:Math.floor(Math.random()*4)+2,progress:Math.floor(Math.random()*80)+20,duration:Math.floor(Math.random()*120)+30,consensus:Math.random()*.6+.4,currentPhase:["Individual Analysis","Discussion Round 2","Synthesis Phase"][Math.floor(Math.random()*3)]});return e}generateMockCollaborationFlow(){const t=["success","info","warning"],e=["Agent collaboration initiated","Consensus level increased to 85%","New insight generated by Synthesizer","Validation phase completed","Discussion round 3 started","Token usage optimized","Network topology updated","Agent energy levels restored"],i=[],s=Math.floor(Math.random()*5)+3;for(let n=0;n<s;n++)i.push({type:t[Math.floor(Math.random()*t.length)],message:e[Math.floor(Math.random()*e.length)],timestamp:Date.now()-Math.random()*3e5});return i.sort((n,o)=>o.timestamp-n.timestamp)}}document.addEventListener("DOMContentLoaded",()=>{window.metricsDashboard=new M});
