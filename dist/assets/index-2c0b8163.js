(function(){const e=document.createElement("link").relList;if(e&&e.supports&&e.supports("modulepreload"))return;for(const s of document.querySelectorAll('link[rel="modulepreload"]'))i(s);new MutationObserver(s=>{for(const n of s)if(n.type==="childList")for(const o of n.addedNodes)o.tagName==="LINK"&&o.rel==="modulepreload"&&i(o)}).observe(document,{childList:!0,subtree:!0});function t(s){const n={};return s.integrity&&(n.integrity=s.integrity),s.referrerPolicy&&(n.referrerPolicy=s.referrerPolicy),s.crossOrigin==="use-credentials"?n.credentials="include":s.crossOrigin==="anonymous"?n.credentials="omit":n.credentials="same-origin",n}function i(s){if(s.ep)return;s.ep=!0;const n=t(s);fetch(s.href,n)}})();class v{constructor(e){this.container=document.querySelector(e),this.svg=null,this.simulation=null,this.nodes=[],this.links=[],this.layout="force",this.nodeSize=10,this.linkStrength=1,this.width=0,this.height=0,this.profSmootId=null}init(){if(console.log("NetworkVisualizer init() called"),!this.container){console.error("Container not found for NetworkVisualizer");return}if(typeof d3>"u"){console.error("D3.js is not loaded!");return}console.log("Container found:",this.container),this.container.innerHTML="";const e=this.container.getBoundingClientRect();this.width=e.width||800,this.height=e.height||400,(this.width===0||this.height===0)&&(this.width=800,this.height=400,console.log("Container has zero dimensions, using default size:",this.width,"x",this.height)),console.log("Container dimensions:",this.width,"x",this.height),this.createTopologyControls(),this.svg=d3.select(this.container).append("svg").attr("width","100%").attr("height","100%").attr("viewBox",`0 0 ${this.width} ${this.height}`),this.svg.append("rect").attr("width","100%").attr("height","100%").attr("fill","rgba(0,0,0,0.2)"),this.svg.append("g").attr("class","links"),this.svg.append("g").attr("class","nodes"),this.initSimulation(),this.generateSampleData(),this.render(),console.log("✅ NetworkVisualizer initialized successfully with",this.nodes.length,"nodes and",this.links.length,"links")}createTopologyControls(){const e=document.createElement("div");e.className="topology-controls",e.style.cssText="margin-bottom: 10px; display: flex; align-items: center; gap: 10px;";const t=document.createElement("select");t.id="saved-topologies-dropdown",t.innerHTML='<option value="">Select a saved topology</option>',t.style.cssText="padding: 5px; border-radius: 4px; border: 1px solid #ccc;";const i=document.createElement("button");i.textContent="Refresh List",i.className="btn",i.style.cssText="padding: 5px 10px; border-radius: 4px;";const s=document.createElement("button");s.textContent="Live Network View",s.className="btn",s.style.cssText="padding: 5px 10px; border-radius: 4px; margin-left: 10px;",i.addEventListener("click",()=>{this.updateSavedTopologiesDropdown()}),s.addEventListener("click",()=>{this.refreshLiveView()}),e.appendChild(t),e.appendChild(i),e.appendChild(s),this.container.parentNode.insertBefore(e,this.container),t.addEventListener("change",n=>{const o=n.target.value;o&&this.savedTopologies?this.displaySavedTopology(o):o===""&&this.refreshLiveView()}),this.topologyDropdown=t}updateSavedTopologiesDropdown(){if(!(!this.topologyDropdown||!this.savedTopologies)){for(;this.topologyDropdown.children.length>1;)this.topologyDropdown.removeChild(this.topologyDropdown.lastChild);this.savedTopologies.forEach((e,t)=>{const i=document.createElement("option");i.value=t,i.textContent=`Task ${t.substring(0,8)}... (${new Date(e.timestamp).toLocaleTimeString()})`,this.topologyDropdown.appendChild(i)})}}initSimulation(){this.simulation=d3.forceSimulation().force("link",d3.forceLink().id(e=>e.id).strength(this.linkStrength)).force("charge",d3.forceManyBody().strength(-300)).force("center",d3.forceCenter(this.width/2,this.height/2)).force("collision",d3.forceCollide().radius(this.nodeSize+5)),this.simulation.on("tick",()=>{this.tick()})}tick(){this.svg&&(this.svg.selectAll(".link").attr("x1",e=>e.source.x||0).attr("y1",e=>e.source.y||0).attr("x2",e=>e.target.x||0).attr("y2",e=>e.target.y||0),this.svg.selectAll(".node").attr("transform",e=>`translate(${e.x||0},${e.y||0})`))}generateSampleData(){this.nodes=[{id:"agent1",name:"Agent-1",type:"analysis",status:"online",x:this.width*.3,y:this.height*.3},{id:"agent2",name:"Agent-2",type:"processing",status:"busy",x:this.width*.7,y:this.height*.3},{id:"agent3",name:"Agent-3",type:"reasoning",status:"online",x:this.width*.5,y:this.height*.7},{id:"agent4",name:"Agent-4",type:"coordination",status:"offline",x:this.width*.2,y:this.height*.6},{id:"agent5",name:"Agent-5",type:"visualization",status:"online",x:this.width*.8,y:this.height*.6}],this.links=[{source:"agent1",target:"agent2",strength:.8,type:"collaboration"},{source:"agent2",target:"agent3",strength:.6,type:"data_flow"},{source:"agent1",target:"agent3",strength:.4,type:"coordination"},{source:"agent3",target:"agent5",strength:.7,type:"collaboration"},{source:"agent4",target:"agent1",strength:.3,type:"coordination"}],this.convertLinkReferences()}convertLinkReferences(){!this.nodes||!this.links||(this.links=this.links.map(e=>{let t=e.source,i=e.target;return typeof e.source=="string"&&(t=this.nodes.find(s=>s.id===e.source)),typeof e.target=="string"&&(i=this.nodes.find(s=>s.id===e.target)),t&&i?{...e,source:t,target:i}:(console.warn("Could not find source or target node for link:",e),null)}).filter(e=>e!==null))}setLayout(e){this.layout=e,this.updateLayout()}setNodeSize(e){this.nodeSize=parseInt(e),this.updateNodeSize()}setLinkStrength(e){this.linkStrength=parseFloat(e),this.simulation&&(this.simulation.force("link").strength(this.linkStrength),this.simulation.alpha(.3).restart())}updateLayout(){switch(this.layout){case"force":this.applyForceLayout();break;case"circular":this.applyCircularLayout();break;case"hierarchical":this.applyHierarchicalLayout();break}}applyForceLayout(){this.simulation&&this.simulation.force("center",d3.forceCenter(this.width/2,this.height/2)).force("charge",d3.forceManyBody().strength(-300)).alpha(.5).restart()}applyCircularLayout(){const e=this.width/2,t=this.height/2,i=Math.min(this.width,this.height)*.3;this.nodes.forEach((s,n)=>{const o=n/this.nodes.length*2*Math.PI;s.fx=e+i*Math.cos(o),s.fy=t+i*Math.sin(o)}),this.simulation&&this.simulation.alpha(.3).restart()}applyHierarchicalLayout(){const t=Math.ceil(this.nodes.length/3);this.nodes.forEach((i,s)=>{const n=Math.floor(s/t),o=s%t,a=this.width*.8,r=this.height/(3+1);i.fx=(this.width-a)/2+a/(t+1)*(o+1),i.fy=r*(n+1)}),this.simulation&&this.simulation.alpha(.3).restart()}updateNodeSize(){this.svg.selectAll(".node circle").attr("r",this.nodeSize),this.simulation&&(this.simulation.force("collision").radius(this.nodeSize+5),this.simulation.alpha(.1).restart())}render(){!this.nodes||!this.links||(this.renderLinks(),this.renderNodes(),this.simulation&&this.nodes.length>0&&this.links.length>0&&(this.convertLinkReferences(),this.simulation.nodes(this.nodes),this.simulation.force("link").links(this.links),this.hasSavedTopologyDisplayed()||this.simulation.alpha(.3).restart()))}renderNodes(){const e=this.svg.select(".nodes").selectAll(".node").data(this.nodes,s=>s.id);e.exit().remove();const t=e.enter().append("g").attr("class","node").call(this.drag(this.simulation));t.append("circle").attr("r",this.nodeSize).attr("fill",s=>this.getNodeColor(s)).attr("stroke",s=>this.getNodeStroke(s)).attr("stroke-width",s=>s.isProfSmoot?3:1.5).attr("class",s=>s.isProfSmoot?"prof-smoot-node":""),t.append("text").attr("x",0).attr("y",s=>this.nodeSize+15).attr("text-anchor","middle").attr("class","node-label").text(s=>this.getNodeLabel(s)),t.filter(s=>s.isProfSmoot).append("text").attr("x",0).attr("y",5).attr("text-anchor","middle").attr("class","node-icon").text("🌌");const i=t.merge(e);i.select("circle").attr("fill",s=>this.getNodeColor(s)).attr("stroke",s=>this.getNodeStroke(s)).attr("stroke-width",s=>s.isProfSmoot?3:1.5),i.select(".node-label").text(s=>this.getNodeLabel(s))}renderLinks(){const e=this.svg.select(".links").selectAll(".link").data(this.links,s=>`${s.source.id||s.source}-${s.target.id||s.target}`);e.exit().remove(),e.enter().append("line").attr("class","link").attr("stroke",s=>this.getLinkColor(s)).attr("stroke-width",s=>this.getLinkWidth(s)).attr("stroke-opacity",.6).merge(e).attr("stroke",s=>this.getLinkColor(s)).attr("stroke-width",s=>this.getLinkWidth(s))}getNodeColor(e){return e.isProfSmoot?"#9333ea":e.group==="agent"?{analyzer:"#3b82f6",reasoner:"#10b981",synthesizer:"#f59e0b",validator:"#ef4444",innovator:"#8b5cf6",cosmic_structure_expert:"#9333ea"}[e.type]||"#60a5fa":"#94a3b8"}getNodeStroke(e){return e.isProfSmoot?"#ffffff":e.status==="completed"?"#10b981":e.status==="busy"?"#f59e0b":e.status==="offline"?"#ef4444":"#ffffff"}getNodeLabel(e){return e.name?e.name.length>12?e.name.substring(0,12)+"...":e.name:e.id.substring(0,8)}getLinkColor(e){return{execution:"#60a5fa",sequence:"#10b981",collaboration:"#8b5cf6",data_flow:"#f59e0b"}[e.type]||"#94a3b8"}getLinkWidth(e){return e.type==="sequence"?2:e.type==="execution"?3:1.5}drag(e){function t(n,o){n.active||e.alphaTarget(.3).restart(),o.fx=o.x,o.fy=o.y}function i(n,o){o.fx=n.x,o.fy=n.y}function s(n,o){n.active||e.alphaTarget(0),o.fx=null,o.fy=null}return d3.drag().on("start",t).on("drag",i).on("end",s)}updateNodesFromAgents(e){this.nodes=Array.from(e.values()).map(t=>({id:t.id,name:t.name||t.id,type:t.type||"unknown",status:t.status||"online",x:t.position?t.position.x*this.width:Math.random()*this.width,y:t.position?t.position.y*this.height:Math.random()*this.height})),console.log("Updated nodes:",this.nodes.length)}updateLinksFromTopology(e){e.connections&&(this.links=e.connections.map(t=>({source:t.source,target:t.target,strength:t.strength||.5,type:t.type||"collaboration"})),console.log("Updated links:",this.links.length))}update(e){if(console.log("NetworkVisualizer update called with:",e),this.hasSavedTopologyDisplayed()){console.log("Skipping update - saved topology is displayed");return}if(!this.svg){console.log("SVG not initialized, calling init()..."),this.init();return}e&&e.agents&&e.agents.size>0?(console.log("Updating nodes from agents:",e.agents.size),this.updateNodesFromAgents(e.agents)):console.log("No agents in system state, using sample data"),e&&e.topology&&e.topology.connections?(console.log("Updating links from topology:",e.topology.connections.length),this.updateLinksFromTopology(e.topology)):console.log("No topology data, using sample connections"),this.convertLinkReferences(),this.simulation&&(this.simulation.nodes(this.nodes),this.simulation.force("link").links(this.links),this.simulation.alpha(.3).restart()),this.render()}updateWithTaskChain(e){if(console.log("Updating network visualization with task chain:",e),!e||!e.executionPath){console.warn("No task chain data or execution path provided");return}this.convertTaskChainToNetwork(e.executionPath),this.render(),this.savedTopologies||(this.savedTopologies=new Map),this.savedTopologies.set(e.id,{nodes:[...this.nodes],links:[...this.links],timestamp:Date.now(),taskInfo:{id:e.id,metrics:e.metrics||{}}}),this.updateSavedTopologiesDropdown()}convertTaskChainToNetwork(e){const t=new Map,i=new Map;e.forEach((s,n)=>{if(!t.has(s.agentId)){const a=s.agentDetails&&s.agentDetails.length>0?s.agentDetails.find(r=>r.id===s.agentId):null;t.set(s.agentId,{id:s.agentId,name:a?a.name:`Agent-${s.agentId.substring(0,8)}`,type:a?a.type:"agent",status:"completed",x:Math.random()*this.width,y:Math.random()*this.height,group:"agent",isProfSmoot:a?a.name==="Prof. Smoot":!1})}const o=s.taskId||`task_${n}`;i.has(o)||i.set(o,{id:o,name:s.taskName||`Task-${o.substring(0,8)}`,type:"task",status:"completed",x:Math.random()*this.width,y:Math.random()*this.height,group:"task"})}),this.nodes=[...t.values(),...i.values()],this.links=e.map(s=>{const n=s.taskId||`task_${e.indexOf(s)}`;return{source:s.agentId,target:n,type:"execution",timestamp:s.timestamp,heatLevel:s.heatLevel||.5}});for(let s=0;s<e.length-1;s++){const n=e[s].taskId||`task_${s}`,o=e[s+1].taskId||`task_${s+1}`;this.links.push({source:n,target:o,type:"sequence",timestamp:e[s].timestamp})}this.convertLinkReferences(),console.log("Converted task chain to network:",{nodes:this.nodes.length,links:this.links.length})}displaySavedTopology(e){if(!this.savedTopologies)return console.warn("No saved topologies available"),!1;const t=this.savedTopologies.get(e);return t?(this.nodes=t.nodes.map(i=>({...i})),this.links=t.links.map(i=>({...i})),this.convertLinkReferences(),this.render(),this.topologyDropdown&&(this.topologyDropdown.value=e),console.log("Displayed saved topology for task chain:",e),!0):(console.warn("Saved topology not found for task chain:",e),!1)}getSavedTopologies(){return this.savedTopologies?Array.from(this.savedTopologies.entries()).map(([e,t])=>({id:e,timestamp:t.timestamp,taskInfo:t.taskInfo})):[]}clearSavedTopologies(){this.savedTopologies&&this.savedTopologies.clear(),this.updateSavedTopologiesDropdown()}hasSavedTopologyDisplayed(){if(!this.savedTopologies||this.savedTopologies.size===0)return!1;if(this.topologyDropdown&&this.topologyDropdown.value)return this.savedTopologies.has(this.topologyDropdown.value);if(this.nodes&&this.nodes.length>0){const e=this.nodes.some(i=>i.group==="task"),t=this.nodes.some(i=>i.group==="agent");return e&&t}return!1}clearCurrentVisualization(){this.topologyDropdown&&(this.topologyDropdown.value=""),this.simulation&&this.simulation.stop(),this.svg&&this.svg.selectAll("*").remove(),this.generateSampleData(),this.render(),this.simulation&&this.simulation.alpha(.3).restart()}refreshLiveView(){this.clearCurrentVisualization(),window.cosmicApp&&window.cosmicApp.fetchRealAIAgents()}updateNodesFromAgents(e){this.nodes=Array.from(e.values()).map(t=>{var s,n;const i=t.name&&t.name.includes("Prof. Smoot");return i&&(this.profSmootId=t.id),{id:t.id,name:t.name||`Agent-${t.id.slice(0,8)}`,type:t.type||"general",status:t.status||"online",isProfSmoot:i,x:(s=t.position)!=null&&s.x?t.position.x*this.width:Math.random()*this.width,y:(n=t.position)!=null&&n.y?t.position.y*this.height:Math.random()*this.height}})}updateLinksFromTopology(e){e.connections&&(this.links=e.connections.map(t=>({source:t.source,target:t.target,strength:t.strength||.5,type:t.type||"collaboration"})),console.log("Updated links:",this.links.length))}updateTopology(e){e.nodes&&this.updateNodesFromAgents(new Map(e.nodes.map(t=>[t.id,t]))),e.edges&&(this.links=e.edges.map(t=>({source:t.source,target:t.target,strength:t.weight||.5,type:t.type||"collaboration"}))),this.convertLinkReferences(),this.render()}highlightExecutionStep(e){this.svg&&(this.svg.selectAll(".node").filter(t=>t.id===e.agentId).select("circle").attr("stroke","#ffeb3b").attr("stroke-width",4),this.svg.selectAll(".node").filter(t=>t.id===e.taskId).select("circle").attr("stroke","#ffeb3b").attr("stroke-width",4),this.svg.selectAll(".link").filter(t=>t.source.id===e.agentId&&t.target.id===e.taskId).attr("stroke","#ffeb3b").attr("stroke-width",3))}}class w{constructor(e){this.container=document.querySelector(e),this.canvas=null,this.ctx=null,this.width=0,this.height=0,this.fieldData=null,this.agents=[],this.forceVectors=[],this.cooperationWaves=[],this.resonanceZones=[],this.animationId=null,this.time=0,this.scale=1,this.offsetX=0,this.offsetY=0}init(){if(!this.container)return;this.container.innerHTML="";const e=this.container.getBoundingClientRect();this.width=e.width,this.height=e.height,this.canvas=document.createElement("canvas"),this.canvas.width=this.width,this.canvas.height=this.height,this.canvas.style.width="100%",this.canvas.style.height="100%",this.container.appendChild(this.canvas),this.ctx=this.canvas.getContext("2d"),this.generateSampleData(),this.startAnimation()}generateSampleData(){this.agents=[{id:"agent1",position:{x:this.width*.3,y:this.height*.3},energy:80,radius:15,color:"#64b5f6"},{id:"agent2",position:{x:this.width*.7,y:this.height*.3},energy:90,radius:18,color:"#4fc3f7"},{id:"agent3",position:{x:this.width*.5,y:this.height*.7},energy:70,radius:12,color:"#4dd0e1"}],this.forceVectors=[{agentId:"agent1",vector:{x:20,y:10},magnitude:.8},{agentId:"agent2",vector:{x:-15,y:25},magnitude:.6},{agentId:"agent3",vector:{x:5,y:-20},magnitude:.7}],this.cooperationWaves=[{center:{x:this.width*.5,y:this.height*.5},radius:50,maxRadius:100,amplitude:.8,frequency:2,startTime:Date.now()}],this.resonanceZones=[{center:{x:this.width*.4,y:this.height*.4},radius:60,strength:.9,agents:["agent1","agent2"]}]}startAnimation(){const e=()=>{this.time+=.016,this.render(),this.animationId=requestAnimationFrame(e)};e()}stopAnimation(){this.animationId&&(cancelAnimationFrame(this.animationId),this.animationId=null)}render(){this.ctx.clearRect(0,0,this.width,this.height),this.ctx.fillStyle="rgba(0, 0, 0, 0.1)",this.ctx.fillRect(0,0,this.width,this.height),this.renderFieldGrid(),this.renderResonanceZones(),this.renderCooperationWaves(),this.renderAgents(),this.renderForceVectors(),this.renderInfoOverlay()}renderFieldGrid(){const t=Math.ceil(this.height/20),i=Math.ceil(this.width/20);this.ctx.strokeStyle="rgba(100, 181, 246, 0.1)",this.ctx.lineWidth=.5,this.ctx.beginPath();for(let s=0;s<=i;s++){const n=s*20;this.ctx.moveTo(n,0),this.ctx.lineTo(n,this.height)}for(let s=0;s<=t;s++){const n=s*20;this.ctx.moveTo(0,n),this.ctx.lineTo(this.width,n)}this.ctx.stroke();for(let s=0;s<i;s+=2)for(let n=0;n<t;n+=2){const o=s*20,a=n*20,r=this.calculateFieldStrengthAt(o,a);r>.1&&(this.ctx.fillStyle=`rgba(100, 181, 246, ${Math.min(r,.8)})`,this.ctx.beginPath(),this.ctx.arc(o,a,2,0,Math.PI*2),this.ctx.fill())}}calculateFieldStrengthAt(e,t){let i=0;for(const s of this.agents){const n=e-s.position.x,o=t-s.position.y,a=Math.sqrt(n*n+o*o);if(a>0){const r=s.energy/100/(1+a*.01);i+=r}}return Math.min(i,1)}renderResonanceZones(){for(const e of this.resonanceZones){const t=.1*Math.sin(this.time*3),i=e.radius*(1+t),s=this.ctx.createRadialGradient(e.center.x,e.center.y,0,e.center.x,e.center.y,i);s.addColorStop(0,`rgba(76, 175, 80, ${e.strength*.3})`),s.addColorStop(1,"rgba(76, 175, 80, 0)"),this.ctx.fillStyle=s,this.ctx.beginPath(),this.ctx.arc(e.center.x,e.center.y,i,0,Math.PI*2),this.ctx.fill(),this.ctx.strokeStyle=`rgba(76, 175, 80, ${e.strength*.6})`,this.ctx.lineWidth=2,this.ctx.setLineDash([5,5]),this.ctx.beginPath(),this.ctx.arc(e.center.x,e.center.y,i,0,Math.PI*2),this.ctx.stroke(),this.ctx.setLineDash([])}}renderCooperationWaves(){const e=Date.now();for(const t of this.cooperationWaves){const s=(e-t.startTime)/1e3*t.frequency;if(s>0&&s<5){const n=t.radius+s*20,o=Math.max(0,t.amplitude*(1-s/5));this.ctx.strokeStyle=`rgba(255, 193, 7, ${o})`,this.ctx.lineWidth=3,this.ctx.beginPath(),this.ctx.arc(t.center.x,t.center.y,n,0,Math.PI*2),this.ctx.stroke(),n>20&&(this.ctx.strokeStyle=`rgba(255, 193, 7, ${o*.5})`,this.ctx.lineWidth=1,this.ctx.beginPath(),this.ctx.arc(t.center.x,t.center.y,n-20,0,Math.PI*2),this.ctx.stroke())}}}renderAgents(){for(const e of this.agents){const t=.1*Math.sin(this.time*2+e.position.x*.01),i=e.radius*(1+t),s=this.ctx.createRadialGradient(e.position.x,e.position.y,0,e.position.x,e.position.y,i*2);s.addColorStop(0,e.color+"40"),s.addColorStop(1,e.color+"00"),this.ctx.fillStyle=s,this.ctx.beginPath(),this.ctx.arc(e.position.x,e.position.y,i*2,0,Math.PI*2),this.ctx.fill(),this.ctx.fillStyle=e.color,this.ctx.beginPath(),this.ctx.arc(e.position.x,e.position.y,i,0,Math.PI*2),this.ctx.fill(),this.ctx.strokeStyle="#ffffff",this.ctx.lineWidth=2,this.ctx.beginPath(),this.ctx.arc(e.position.x,e.position.y,i,0,Math.PI*2),this.ctx.stroke();const n=e.energy/100*Math.PI*2;this.ctx.strokeStyle="#4caf50",this.ctx.lineWidth=3,this.ctx.beginPath(),this.ctx.arc(e.position.x,e.position.y,i+5,-Math.PI/2,-Math.PI/2+n),this.ctx.stroke()}}renderForceVectors(){for(const e of this.forceVectors){const t=this.agents.find(l=>l.id===e.agentId);if(!t)continue;const i=t.position.x,s=t.position.y,n=i+e.vector.x*e.magnitude*2,o=s+e.vector.y*e.magnitude*2;this.ctx.strokeStyle=`rgba(255, 87, 34, ${e.magnitude})`,this.ctx.lineWidth=3,this.ctx.beginPath(),this.ctx.moveTo(i,s),this.ctx.lineTo(n,o),this.ctx.stroke();const a=Math.atan2(o-s,n-i),r=10;this.ctx.beginPath(),this.ctx.moveTo(n,o),this.ctx.lineTo(n-r*Math.cos(a-Math.PI/6),o-r*Math.sin(a-Math.PI/6)),this.ctx.moveTo(n,o),this.ctx.lineTo(n-r*Math.cos(a+Math.PI/6),o-r*Math.sin(a+Math.PI/6)),this.ctx.stroke()}}renderInfoOverlay(){this.ctx.fillStyle="rgba(0, 0, 0, 0.7)",this.ctx.fillRect(10,10,200,120),this.ctx.fillStyle="#ffffff",this.ctx.font="12px Arial",this.ctx.fillText("张量协作力场",20,30),[{color:"#64b5f6",text:"Agent节点"},{color:"#4caf50",text:"共振区域"},{color:"#ffc107",text:"协作波动"},{color:"#ff5722",text:"力向量"}].forEach((t,i)=>{const s=50+i*20;this.ctx.fillStyle=t.color,this.ctx.fillRect(20,s-8,12,12),this.ctx.fillStyle="#ffffff",this.ctx.fillText(t.text,40,s)})}update(e){e.agents&&this.updateAgentsFromSystem(e.agents),e.tcf&&this.updateTCFFromSystem(e.tcf)}updateAgentsFromSystem(e){this.agents=Array.from(e.values()).map(t=>{var i,s;return{id:t.id,position:{x:(((i=t.position)==null?void 0:i.x)||0)*.1+this.width*.5,y:(((s=t.position)==null?void 0:s.y)||0)*.1+this.height*.5},energy:t.energy||50,radius:Math.max(10,(t.energy||50)*.2),color:this.getAgentColor(t.type)}})}updateTCFFromSystem(e){e.forceVectors&&(this.forceVectors=e.forceVectors),e.cooperationWaves&&(this.cooperationWaves=e.cooperationWaves),e.resonanceZones&&(this.resonanceZones=e.resonanceZones)}updateField(e){this.fieldData=e,e.agents&&this.updateAgentsFromSystem(new Map(e.agents.map(t=>[t.id,t]))),e.tcf&&this.updateTCFFromSystem(e.tcf)}getAgentColor(e){return{analysis:"#64b5f6",processing:"#4fc3f7",reasoning:"#4dd0e1",coordination:"#4db6ac",visualization:"#81c784"}[e]||"#90a4ae"}destroy(){this.stopAnimation(),this.container&&(this.container.innerHTML="")}}class x{constructor(e){this.container=document.querySelector(e),this.svg=null,this.simulation=null,this.nodes=[],this.links=[],this.taskChainData=null,this.width=0,this.height=0}init(){if(console.log("TaskChainVisualizer init() called"),!this.container){console.error("Container not found for TaskChainVisualizer");return}if(typeof d3>"u"){console.error("D3.js is not loaded!");return}console.log("Container found:",this.container),this.container.innerHTML="";const e=this.container.getBoundingClientRect();this.width=e.width||800,this.height=e.height||400,(this.width===0||this.height===0)&&(this.width=800,this.height=400,console.log("Container has zero dimensions, using default size:",this.width,"x",this.height)),console.log("Container dimensions:",this.width,"x",this.height),this.svg=d3.select(this.container).append("svg").attr("width","100%").attr("height","100%").attr("viewBox",`0 0 ${this.width} ${this.height}`),this.svg.append("rect").attr("width","100%").attr("height","100%").attr("fill","rgba(0,0,0,0.2)"),this.svg.append("g").attr("class","links"),this.svg.append("g").attr("class","nodes"),this.initSimulation(),console.log("✅ TaskChainVisualizer initialized successfully")}initSimulation(){this.simulation=d3.forceSimulation().force("link",d3.forceLink().id(e=>e.id).strength(1)).force("charge",d3.forceManyBody().strength(-300)).force("center",d3.forceCenter(this.width/2,this.height/2)).force("collision",d3.forceCollide().radius(20)),this.simulation.on("tick",()=>{this.tick()})}tick(){this.svg.selectAll(".link").attr("x1",e=>e.source.x).attr("y1",e=>e.source.y).attr("x2",e=>e.target.x).attr("y2",e=>e.target.y),this.svg.selectAll(".node").attr("transform",e=>`translate(${e.x},${e.y})`)}updateTaskChain(e){if(console.log("Updating task chain visualization:",e),!e||!e.executionPath){console.warn("No task chain data or execution path provided");return}this.taskChainData=e,this.convertExecutionPathToGraph(e.executionPath),this.render()}convertExecutionPathToGraph(e){const t=new Map,i=new Map;e.forEach((s,n)=>{t.has(s.agentId)||t.set(s.agentId,{id:s.agentId,name:`Agent-${s.agentId.substring(0,8)}`,type:"agent",status:"completed",x:Math.random()*this.width,y:Math.random()*this.height,group:"agent"});const o=s.taskId;i.has(o)||i.set(o,{id:o,name:`Task-${o.substring(0,8)}`,type:"task",status:"completed",x:Math.random()*this.width,y:Math.random()*this.height,group:"task"})}),this.nodes=[...t.values(),...i.values()],this.links=e.map(s=>({source:s.agentId,target:s.taskId,type:"execution",timestamp:s.timestamp,heatLevel:s.heatLevel||.5}));for(let s=0;s<e.length-1;s++)this.links.push({source:e[s].taskId,target:e[s+1].taskId,type:"sequence",timestamp:e[s].timestamp});console.log("Converted execution path to graph:",{nodes:this.nodes.length,links:this.links.length})}render(){if(!this.svg){console.error("SVG not initialized");return}this.renderLinks(),this.renderNodes(),this.simulation&&(this.simulation.nodes(this.nodes),this.simulation.force("link").links(this.links),this.simulation.alpha(.3).restart())}renderNodes(){const e=this.svg.select(".nodes").selectAll(".node").data(this.nodes,s=>s.id);e.exit().remove();const t=e.enter().append("g").attr("class","node").call(this.drag(this.simulation));t.append("circle").attr("r",s=>this.getNodeSize(s)).attr("fill",s=>this.getNodeColor(s)).attr("stroke",s=>this.getNodeStroke(s)).attr("stroke-width",2),t.append("text").attr("x",0).attr("y",5).attr("text-anchor","middle").attr("class","node-icon").text(s=>this.getNodeIcon(s)),t.append("text").attr("x",0).attr("y",s=>this.getNodeSize(s)+15).attr("text-anchor","middle").attr("class","node-label").text(s=>this.getNodeLabel(s));const i=t.merge(e);i.select("circle").attr("fill",s=>this.getNodeColor(s)).attr("stroke",s=>this.getNodeStroke(s)),i.select(".node-icon").text(s=>this.getNodeIcon(s)),i.select(".node-label").text(s=>this.getNodeLabel(s))}renderLinks(){const e=this.svg.select(".links").selectAll(".link").data(this.links,s=>`${s.source.id||s.source}-${s.target.id||s.target}`);e.exit().remove(),e.enter().append("line").attr("class","link").attr("stroke",s=>this.getLinkColor(s)).attr("stroke-width",s=>this.getLinkWidth(s)).attr("stroke-opacity",.7).merge(e).attr("stroke",s=>this.getLinkColor(s)).attr("stroke-width",s=>this.getLinkWidth(s))}getNodeIcon(e){return e.type==="agent"?e.isProfSmoot?"🌌":"🤖":e.type==="task"?"📋":"●"}getNodeSize(e){return e.type==="agent"?20:e.type==="task"?15:10}getNodeColor(e){return e.isProfSmoot?"#9333ea":e.type==="agent"?{analyzer:"#3b82f6",reasoner:"#10b981",synthesizer:"#f59e0b",validator:"#ef4444",innovator:"#8b5cf6",cosmic_structure_expert:"#9333ea"}[e.type]||"#60a5fa":e.type==="task"?"#94a3b8":"#60a5fa"}getNodeStroke(e){return e.status==="completed"?"#10b981":e.status==="busy"?"#f59e0b":e.status==="offline"?"#ef4444":"#ffffff"}getNodeLabel(e){return e.name?e.name.length>15?e.name.substring(0,15)+"...":e.name:e.id.substring(0,8)}getLinkColor(e){return{execution:"#60a5fa",sequence:"#10b981"}[e.type]||"#94a3b8"}getLinkWidth(e){return e.type==="sequence"?3:e.type==="execution"?2:1.5}drag(e){function t(n,o){n.active||e.alphaTarget(.3).restart(),o.fx=o.x,o.fy=o.y}function i(n,o){o.fx=n.x,o.fy=n.y}function s(n,o){n.active||e.alphaTarget(0),o.fx=null,o.fy=null}return d3.drag().on("start",t).on("drag",i).on("end",s)}convertExecutionPathToGraph(e){const t=new Map,i=new Map;e.forEach((s,n)=>{t.has(s.agentId)||t.set(s.agentId,{id:s.agentId,name:`Agent-${s.agentId.substring(0,8)}`,type:"agent",status:"completed",x:Math.random()*this.width,y:Math.random()*this.height,group:"agent"});const o=s.taskId;i.has(o)||i.set(o,{id:o,name:s.taskName||`Task-${o.substring(0,8)}`,type:"task",status:"completed",x:Math.random()*this.width,y:Math.random()*this.height,group:"task"})}),this.nodes=[...t.values(),...i.values()],this.links=e.map(s=>({source:s.agentId,target:s.taskId,type:"execution",timestamp:s.timestamp,heatLevel:s.heatLevel||.5}));for(let s=0;s<e.length-1;s++)this.links.push({source:e[s].taskId,target:e[s+1].taskId,type:"sequence",timestamp:e[s].timestamp});console.log("Converted execution path to graph:",{nodes:this.nodes.length,links:this.links.length})}clear(){console.log("Clearing task chain visualization"),this.nodes=[],this.links=[],this.taskChainData=null,this.svg&&(this.svg.select(".nodes").selectAll("*").remove(),this.svg.select(".links").selectAll("*").remove()),this.simulation&&this.simulation.stop()}refresh(){this.taskChainData&&this.updateTaskChain(this.taskChainData)}}class C{constructor(){this.container=null}init(){console.log("协作监控组件已初始化")}update(e){var t;this.updateCollaborationSessions(e.collaborationSessions),this.updateConvergenceChart(e.convergenceState),this.updateAgentPerformance(e.agents),this.updateResonanceZones((t=e.tcf)==null?void 0:t.resonanceZones)}updateCollaborationSessions(e){const t=document.getElementById("collaboration-sessions");if(!t||!e)return;t.innerHTML="";const i=Array.from(e.values()).filter(s=>s.status==="active");if(i.length===0){t.innerHTML='<p class="text-muted">暂无活跃协作会话</p>';return}i.forEach(s=>{var o;const n=document.createElement("div");n.className="session-item",n.innerHTML=`
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
            `,t.appendChild(n)})}updateConvergenceChart(e){const t=document.getElementById("convergence-chart");if(t){if(!e){t.innerHTML='<p class="text-muted">暂无收敛数据</p>';return}t.innerHTML=`
            <div class="convergence-metrics">
                <div class="metric-item">
                    <span class="metric-label">全局共识度</span>
                    <span class="metric-value">${(e.globalConsensus*100).toFixed(1)}%</span>
                </div>
                <div class="metric-item">
                    <span class="metric-label">任务完成率</span>
                    <span class="metric-value">${(e.taskCompletionRate*100).toFixed(1)}%</span>
                </div>
                <div class="metric-item">
                    <span class="metric-label">协作效率</span>
                    <span class="metric-value">${(e.collaborationEfficiency*100).toFixed(1)}%</span>
                </div>
                <div class="metric-item">
                    <span class="metric-label">网络稳定性</span>
                    <span class="metric-value">${(e.networkStability*100).toFixed(1)}%</span>
                </div>
            </div>
        `}}updateAgentPerformance(e){const t=document.getElementById("agent-performance");if(!t||!e)return;t.innerHTML="";const i=Array.from(e.values()).sort((s,n)=>(n.performanceScore||0)-(s.performanceScore||0)).slice(0,5);if(i.length===0){t.innerHTML='<p class="text-muted">暂无Agent数据</p>';return}i.forEach(s=>{const n=document.createElement("div");n.className="agent-performance-item",n.innerHTML=`
                <div class="agent-name">${s.name||s.id.slice(0,8)}</div>
                <div class="agent-score">
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${(s.performanceScore||0)*100}%"></div>
                    </div>
                    <span class="score-text">${((s.performanceScore||0)*100).toFixed(1)}%</span>
                </div>
            `,t.appendChild(n)})}updateResonanceZones(e){const t=document.getElementById("resonance-zones");if(t){if(!e||e.length===0){t.innerHTML='<p class="text-muted">暂无共振区域</p>';return}t.innerHTML="",e.forEach((i,s)=>{var o;const n=document.createElement("div");n.className="resonance-zone-item",n.innerHTML=`
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
            `,t.appendChild(n)})}}}class S{constructor(){this.container=null}init(){console.log("任务管理组件已初始化")}update(e){this.updateTaskQueue(e.tasks),this.updateExecutingTasks(e.tasks),this.updateCompletedTasks(e.tasks),this.updateTaskChains(e.taskChains)}updateTaskQueue(e){const t=document.getElementById("task-queue");if(!t||!e)return;const i=Array.from(e.values()).filter(s=>s.status==="pending").sort((s,n)=>(n.priority||0)-(s.priority||0));this.renderTaskList(t,i,"暂无等待任务")}updateExecutingTasks(e){const t=document.getElementById("executing-tasks");if(!t||!e)return;const i=Array.from(e.values()).filter(s=>s.status==="executing");this.renderTaskList(t,i,"暂无执行中任务")}updateCompletedTasks(e){const t=document.getElementById("completed-tasks");if(!t||!e)return;const i=Array.from(e.values()).filter(s=>s.status==="completed").slice(0,10);if(t.innerHTML="",i.length===0){t.innerHTML='<p class="text-muted">暂无已完成任务</p>';return}i.forEach(s=>{var o;const n=document.createElement("div");n.className="task-item",n.innerHTML=`
                <div class="task-header">
                    <span class="task-name">${s.name||((o=s.id)==null?void 0:o.slice(0,8))}</span>
                    <span class="task-priority">优先级: ${s.priority||0}</span>
                </div>
                <div class="task-type">${this.getTaskTypeText(s.type)}</div>
                <div class="task-collaboration">${this.getCollaborationTypeText(s.collaborationType)}</div>
                ${s.assignedAgents?`<div class="task-agents">分配Agent: ${s.assignedAgents.size}</div>`:""}
                <button class="btn btn-small view-topology-btn" data-task-id="${s.id}" style="margin-top: 8px;">View Topology</button>
            `,t.appendChild(n)}),t.querySelectorAll(".view-topology-btn").forEach(s=>{s.addEventListener("click",n=>{const o=n.target.getAttribute("data-task-id"),a=window.cosmicApp;if(a&&a.systemState&&a.systemState.taskChains){let r=null;for(const[l,d]of a.systemState.taskChains.entries())if(d.taskId===o){r=l;break}r&&a.networkViz&&(a.switchView("network"),setTimeout(()=>{a.networkViz.displaySavedTopology(r)},100))}})})}updateTaskChains(e){const t=document.getElementById("task-chains");if(!t||!e)return;t.innerHTML="";const i=Array.from(e.values());if(i.length===0){t.innerHTML='<p class="text-muted">暂无任务链</p>';return}i.forEach(s=>{var o,a;const n=document.createElement("div");n.className="task-chain-item",n.innerHTML=`
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
            `,t.appendChild(n)})}renderTaskList(e,t,i){if(e.innerHTML="",t.length===0){e.innerHTML=`<p class="text-muted">${i}</p>`;return}t.forEach(s=>{var o;const n=document.createElement("div");n.className="task-item",n.innerHTML=`
                <div class="task-header">
                    <span class="task-name">${s.name||((o=s.id)==null?void 0:o.slice(0,8))}</span>
                    <span class="task-priority">优先级: ${s.priority||0}</span>
                </div>
                <div class="task-type">${this.getTaskTypeText(s.type)}</div>
                <div class="task-collaboration">${this.getCollaborationTypeText(s.collaborationType)}</div>
                ${s.assignedAgents?`<div class="task-agents">分配Agent: ${s.assignedAgents.size}</div>`:""}
            `,e.appendChild(n)})}getTaskTypeText(e){return{analysis:"数据分析",processing:"数据处理",reasoning:"推理任务",collaboration:"协作任务"}[e]||e}getCollaborationTypeText(e){return{sequential:"顺序协作",parallel:"并行协作",hierarchical:"分层协作"}[e]||e}getChainStatusText(e){return{pending:"等待中",running:"运行中",completed:"已完成",failed:"失败"}[e]||e}}class T{constructor(){this.container=null,this.charts=new Map}init(){console.log("系统监控组件已初始化")}update(e){var t,i;this.updatePerformanceCharts(e.metrics),this.updateResourceUsage(e.agents),this.updateCooperationWaves((t=e.tcf)==null?void 0:t.cooperationWaves),this.updateSingularityDetection((i=e.tcf)==null?void 0:i.singularityPoints)}updatePerformanceCharts(e){const t=document.getElementById("performance-charts");if(t){if(!e){t.innerHTML='<p class="text-muted">暂无性能数据</p>';return}t.innerHTML=`
            <div class="performance-metrics">
                <div class="metric-card">
                    <div class="metric-title">处理任务总数</div>
                    <div class="metric-number">${e.totalTasksProcessed||0}</div>
                </div>
                <div class="metric-card">
                    <div class="metric-title">成功协作数</div>
                    <div class="metric-number">${e.successfulCollaborations||0}</div>
                </div>
                <div class="metric-card">
                    <div class="metric-title">平均响应时间</div>
                    <div class="metric-number">${(e.averageResponseTime||0).toFixed(2)}ms</div>
                </div>
                <div class="metric-card">
                    <div class="metric-title">质量分数</div>
                    <div class="metric-number">${((e.qualityScore||0)*100).toFixed(1)}%</div>
                </div>
            </div>
        `}}updateResourceUsage(e){const t=document.getElementById("resource-usage");if(!t||!e)return;const i=Array.from(e.values()),s=i.length,n=i.filter(a=>{var r;return((r=a.currentTasks)==null?void 0:r.size)>0}).length,o=s>0?n/s:0;t.innerHTML=`
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
        `}updateCooperationWaves(e){const t=document.getElementById("cooperation-waves");if(t){if(!e||e.length===0){t.innerHTML='<p class="text-muted">暂无协作波动</p>';return}t.innerHTML="",e.slice(0,5).forEach((i,s)=>{var o,a;const n=document.createElement("div");n.className="wave-item",n.innerHTML=`
                <div class="wave-header">
                    <span class="wave-id">波动 ${s+1}</span>
                    <span class="wave-amplitude">${(i.amplitude*100).toFixed(0)}%</span>
                </div>
                <div class="wave-source">源Agent: ${(o=i.sourceAgentId)==null?void 0:o.slice(0,8)}</div>
                <div class="wave-frequency">频率: ${(a=i.frequency)==null?void 0:a.toFixed(2)}Hz</div>
            `,t.appendChild(n)})}}updateSingularityDetection(e){const t=document.getElementById("singularity-detection");if(t){if(!e||e.length===0){t.innerHTML='<p class="text-muted">未检测到奇点</p>';return}t.innerHTML="",e.forEach((i,s)=>{var o;const n=document.createElement("div");n.className=`singularity-item ${this.getSingularityClass(i.type)}`,n.innerHTML=`
                <div class="singularity-header">
                    <span class="singularity-id">奇点 ${s+1}</span>
                    <span class="singularity-type">${this.getSingularityTypeText(i.type)}</span>
                </div>
                <div class="singularity-intensity">强度: ${(i.forceIntensity*100).toFixed(0)}%</div>
                <div class="singularity-risk">风险等级: ${this.getRiskLevelText(i.riskLevel)}</div>
                <div class="singularity-agents">涉及Agent: ${((o=i.convergedAgents)==null?void 0:o.length)||0}个</div>
            `,t.appendChild(n)})}}getSingularityClass(e){return{collaboration_hub:"positive",resource_drain:"warning",conflict_zone:"danger",overload_point:"danger",anomaly:"warning"}[e]||"neutral"}getSingularityTypeText(e){return{collaboration_hub:"协作中心",resource_drain:"资源消耗",conflict_zone:"冲突区域",overload_point:"过载点",anomaly:"异常"}[e]||e}getRiskLevelText(e){return e<.3?"低":e<.7?"中":"高"}}class h{static isVercelDeployment(){return window.location.hostname.includes("vercel.app")}static isLocalhost(){return window.location.hostname==="localhost"||window.location.hostname==="127.0.0.1"}static getBackendUrl(){return this.isVercelDeployment()?(console.warn("Vercel deployment detected. WebSocket connections may not work without a separate backend."),window.location.origin):this.isLocalhost()?"http://localhost:8080":window.location.origin}static getWebSocketUrl(){const e=this.getBackendUrl();return e.startsWith("https://")?e.replace("https://","wss://"):e.replace("http://","ws://")}static shouldUseDemoMode(){return this.isVercelDeployment()}}let k=class{constructor(){this.socket=null,this.eventHandlers=new Map,this.reconnectInterval=3e3,this.maxReconnectAttempts=10,this.reconnectAttempts=0,this.connectionId=Math.random().toString(36).substring(2,9),this.connectionTimeout=15e3,this.isConnected=!1,this.isConnecting=!1,this.manualDisconnect=!1,this.heartbeatInterval=null,this.demoMode=!1}async connect(e=h.getBackendUrl()){if(h.shouldUseDemoMode())return console.log(`[WebSocketClient-${this.connectionId}] Vercel deployment detected, using demo mode`),this.demoMode=!0,this.isConnected=!1,this.emit("disconnected","demo-mode"),Promise.resolve();if(this.isConnected&&this.socket&&this.socket.connected)return console.log(`[WebSocketClient-${this.connectionId}] Already connected`),Promise.resolve();if(this.isConnecting)return console.log(`[WebSocketClient-${this.connectionId}] Already connecting`),Promise.resolve();this.isConnecting=!0,this.manualDisconnect=!1,this.demoMode=!1;try{if(console.log(`[WebSocketClient-${this.connectionId}] Attempting to connect to ${e}`),typeof io>"u")throw console.error("❌ Socket.IO client not loaded! Make sure socket.io.js is included."),this.isConnecting=!1,new Error("Socket.IO client not loaded");return this.socket&&(this.socket.disconnect(),this.socket=null),this.socket=io(e,{transports:["websocket","polling"],timeout:this.connectionTimeout,reconnection:!0,reconnectionAttempts:this.maxReconnectAttempts,reconnectionDelay:this.reconnectInterval,reconnectionDelayMax:5e3,randomizationFactor:.5,autoConnect:!1,upgrade:!0,rememberUpgrade:!1,pingInterval:25e3,pingTimeout:6e4,rejectUnauthorized:!1,withCredentials:!1,forceNew:!0,transports:["websocket","polling"],upgrade:!0,multiplex:!1,upgradeTimeout:3e4,polling:{upgrade:!0},websocket:{upgrade:!0}}),this.setupHeartbeat(),this.socket.connect(),new Promise((t,i)=>{const s=setTimeout(()=>{this.isConnecting=!1,i(new Error("Connection timeout"))},this.connectionTimeout);this.socket.on("connect",()=>{clearTimeout(s),console.log(`✅ [WebSocketClient-${this.connectionId}] Socket.IO连接已建立, socket ID: ${this.socket.id}`),this.isConnected=!0,this.isConnecting=!1,this.reconnectAttempts=0,this.emit("connected"),t()}),this.socket.on("disconnect",n=>{if(clearTimeout(s),console.log(`❌ [WebSocketClient-${this.connectionId}] Socket.IO连接已断开: ${n}`),this.isConnected=!1,this.isConnecting=!1,this.clearHeartbeat(),console.log(`[WebSocketClient-${this.connectionId}] Disconnection reason: ${n}`),n==="transport error"||n==="transport close"){console.log(`[WebSocketClient-${this.connectionId}] Transport issue detected, will attempt immediate reconnect`),setTimeout(()=>{this.connect()},1e3);return}this.manualDisconnect?console.log(`[WebSocketClient-${this.connectionId}] Manual disconnect, not reconnecting`):(this.emit("disconnected",n),this.attemptReconnect())}),this.socket.on("connect_error",n=>{clearTimeout(s),console.error(`[WebSocketClient-${this.connectionId}] Socket.IO连接错误:`,n),this.isConnected=!1,this.isConnecting=!1,this.emit("error",n),this.attemptReconnect()}),this.socket.onAny((n,...o)=>{console.log(`📨 [WebSocketClient-${this.connectionId}] Received event: ${n}`,o),this.emit(n,o[0])}),this.socket.on("pong",()=>{console.log(`🏓 [WebSocketClient-${this.connectionId}] Received pong from server`)})})}catch(t){throw console.error(`[WebSocketClient-${this.connectionId}] Socket.IO连接失败:`,t),this.isConnecting=!1,this.attemptReconnect(),t}}setupHeartbeat(){this.clearHeartbeat(),this.heartbeatInterval=setInterval(()=>{this.socket&&this.socket.connected&&this.socket.emit("ping")},2e4)}clearHeartbeat(){this.heartbeatInterval&&(clearInterval(this.heartbeatInterval),this.heartbeatInterval=null)}attemptReconnect(){if(!this.demoMode)if(this.reconnectAttempts<this.maxReconnectAttempts){this.reconnectAttempts++,console.log(`🔄 [WebSocketClient-${this.connectionId}] 尝试重连 (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);const e=Math.min(this.reconnectInterval*Math.pow(1.5,this.reconnectAttempts),3e4);setTimeout(()=>{this.connect()},e)}else console.error(`❌ [WebSocketClient-${this.connectionId}] Socket.IO重连失败，达到最大重试次数`),this.emit("reconnect-failed")}send(e,t={}){return this.demoMode?(console.log(`[WebSocketClient-${this.connectionId}] Demo mode: Not sending message ${e}`),!1):this.socket&&this.socket.connected?(this.socket.emit(e,t),console.log(`📤 [WebSocketClient-${this.connectionId}] Sent event: ${e}`,t),!0):(console.warn(`[WebSocketClient-${this.connectionId}] Socket.IO未连接，无法发送消息: ${e}`),this.isConnecting||this.connect(),!1)}on(e,t){this.eventHandlers.has(e)||this.eventHandlers.set(e,[]),this.eventHandlers.get(e).push(t),console.log(`[WebSocketClient-${this.connectionId}] Added handler for event: ${e}`)}off(e,t){const i=this.eventHandlers.get(e);if(i){const s=i.indexOf(t);s>-1&&(i.splice(s,1),console.log(`[WebSocketClient-${this.connectionId}] Removed handler for event: ${e}`))}}emit(e,t){const i=this.eventHandlers.get(e);i&&(console.log(`[WebSocketClient-${this.connectionId}] Emitting event: ${e} to ${i.length} handlers`),i.forEach(s=>{try{s(t)}catch(n){console.error(`[WebSocketClient-${this.connectionId}] 事件处理器错误 (${e}):`,n)}}))}disconnect(){if(this.demoMode){this.isConnected=!1,this.isConnecting=!1;return}this.manualDisconnect=!0,this.clearHeartbeat(),this.socket&&(console.log(`[WebSocketClient-${this.connectionId}] Disconnecting socket`),this.socket.disconnect(),this.socket=null,this.isConnected=!1,this.isConnecting=!1)}get connected(){return this.demoMode?!1:this.socket&&this.socket.connected}get isDemoMode(){return this.demoMode}};class I{constructor(){this.ws=new k,this.currentView="ai-overview",this.isConnected=!1,this.reconnectAttempts=0,this.maxReconnectAttempts=5,this.connectionRetryCount=0,this.maxConnectionRetries=3,this.networkViz=new v("#network-graph"),this.tcfViz=new w("#tcf-visualization"),this.taskChainViz=new x("#task-chain-graph"),this.collaborationMonitor=new C,this.taskManager=new S,this.systemMonitor=new T,this.systemState={agents:new Map,tasks:new Map,taskChains:new Map,collaborationSessions:new Map,metrics:{}},this.init()}async init(){window.cosmicApp=this,this.setupEventListeners(),this.setupWebSocketHandlers(),this.initializeComponents(),await this.connectToServer(),this.startDataPolling(),this.generateSampleSystemState(),console.log("🌌 Cosmic Agent Network initialized and connected to Real AI backend")}async connectToServer(){try{console.log("🔄 Attempting to connect to Real AI Server..."),await this.ws.connect(h.getBackendUrl()),this.ws.on("disconnected",e=>{if(this.isConnected=!1,console.log("❌ Disconnected from server:",e),e==="demo-mode"){console.log("📱 Vercel deployment detected, switching to demo mode"),this.setupDemoMode();return}e!=="io client disconnect"&&this.attemptReconnect()}),this.ws.on("error",e=>{console.error("❌ WebSocket error:",e),this.attemptReconnect()})}catch(e){console.error("❌ Failed to connect to server:",e),this.attemptReconnect()}}setupDemoMode(){console.log("📱 Setting up demo mode for Vercel deployment"),this.isConnected=!1,this.isDemoMode=!0,this.showDemoModeNotification(),this.demoInterval&&clearInterval(this.demoInterval),this.demoInterval=setInterval(()=>{this.updateWithDemoData()},1e4),setTimeout(()=>{this.updateWithDemoData()},1e3)}showDemoModeNotification(){document.querySelectorAll(".demo-mode-notification").forEach(i=>i.remove());const t=document.createElement("div");t.className="demo-mode-notification",t.innerHTML=`
            <div style="position: fixed; top: 20px; right: 20px; background: #3b82f6; color: white; padding: 15px; border-radius: 8px; z-index: 10000; box-shadow: 0 4px 6px rgba(0,0,0,0.1); max-width: 300px;">
                <strong>📱 Demo Mode</strong>
                <p>This deployment is running in demo mode. Real AI agents and WebSocket connections are not available.</p>
                <button onclick="this.parentElement.remove()" style="background: white; color: #3b82f6; border: none; padding: 5px 10px; border-radius: 4px; cursor: pointer; margin-top: 5px;">Dismiss</button>
            </div>
        `,document.body.appendChild(t)}updateWithDemoData(){console.log("📱 Updating with demo data");const e=[{id:"demo-1",name:"Prof. Smoot (Demo)",type:"cosmic_structure_expert",status:"active",energy:95,maxEnergy:100,position:{x:0,y:0,z:0},connections:["demo-2","demo-3"],ai:{focusLevel:.9,memoryLoad:{shortTerm:5,longTerm:42},currentThought:"Analyzing cosmic structure patterns..."},capabilities:["cosmic_structure_analysis","gravitational_field_modeling"],personality:{traits:["analytical","methodical","precise"]}},{id:"demo-2",name:"Dr. Analyzer (Demo)",type:"analyzer",status:"processing",energy:87,maxEnergy:100,position:{x:100,y:50,z:20},connections:["demo-1","demo-4"],ai:{focusLevel:.7,memoryLoad:{shortTerm:8,longTerm:36},currentThought:"Processing data patterns..."},capabilities:["deep_analysis","pattern_recognition"],personality:{traits:["analytical","detail-oriented","systematic"]}},{id:"demo-3",name:"Ms. Synthesizer (Demo)",type:"synthesizer",status:"active",energy:92,maxEnergy:100,position:{x:-100,y:75,z:-30},connections:["demo-1","demo-5"],ai:{focusLevel:.8,memoryLoad:{shortTerm:3,longTerm:28},currentThought:"Synthesizing knowledge domains..."},capabilities:["information_synthesis","knowledge_integration"],personality:{traits:["creative","integrative","holistic"]}},{id:"demo-4",name:"Prof. Reasoner (Demo)",type:"reasoner",status:"idle",energy:78,maxEnergy:100,position:{x:200,y:-50,z:40},connections:["demo-2"],ai:{focusLevel:.6,memoryLoad:{shortTerm:6,longTerm:31},currentThought:"Awaiting new reasoning tasks..."},capabilities:["logical_reasoning","inference"],personality:{traits:["logical","methodical","rational"]}},{id:"demo-5",name:"Dr. Validator (Demo)",type:"validator",status:"active",energy:89,maxEnergy:100,position:{x:-200,y:-25,z:-60},connections:["demo-3"],ai:{focusLevel:.85,memoryLoad:{shortTerm:4,longTerm:39},currentThought:"Validating analysis results..."},capabilities:["result_validation","quality_assessment"],personality:{traits:["critical","thorough","careful"]}}];this.systemState.agents=e,this.systemState.collaborations=Math.floor(Math.random()*3),this.systemState.totalTasks=12+Math.floor(Math.random()*5),this.updateAgentList(),this.updateSystemMetrics(),this.simulateTaskChainUpdates()}simulateTaskChainUpdates(){if(Math.random()>.7){const e=`demo-chain-${Math.floor(Math.random()*1e3)}`,t=this.systemState.agents.map(n=>n.id),i=t[Math.floor(Math.random()*t.length)],s={taskChainId:e,taskId:`task-${Math.floor(Math.random()*1e4)}`,agentId:i,taskName:`Demo Task ${Math.floor(Math.random()*100)}`,status:"completed",result:"Demo task completed successfully with synthesized insights.",timestamp:Date.now()};this.handleTaskChainExecutionStep(s)}}attemptReconnect(){this.reconnectAttempts<this.maxReconnectAttempts?(this.reconnectAttempts++,console.log(`🔄 Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`),setTimeout(()=>{this.connectToServer()},3e3*this.reconnectAttempts)):(console.error("❌ Maximum reconnection attempts reached"),this.showConnectionError())}showConnectionError(){const e=document.createElement("div");e.className="connection-error",e.innerHTML=`
            <div style="position: fixed; top: 20px; right: 20px; background: #ef4444; color: white; padding: 15px; border-radius: 8px; z-index: 10000; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                <strong>❌ Connection Error</strong>
                <p>Could not connect to the AI server. Please make sure the server is running.</p>
                <button onclick="this.parentElement.remove()" style="background: white; color: #ef4444; border: none; padding: 5px 10px; border-radius: 4px; cursor: pointer; margin-top: 5px;">Dismiss</button>
            </div>
        `,document.body.appendChild(e)}setupEventListeners(){var i,s,n,o,a,r,l,d,p,u,f,y;document.querySelectorAll(".nav-btn").forEach(m=>{m.addEventListener("click",g=>{const b=g.target.dataset.view;this.switchView(b)})}),(i=document.getElementById("layout-force"))==null||i.addEventListener("click",()=>{this.networkViz&&this.networkViz.svg&&this.networkViz.setLayout("force")}),(s=document.getElementById("layout-circular"))==null||s.addEventListener("click",()=>{this.networkViz&&this.networkViz.svg&&this.networkViz.setLayout("circular")}),(n=document.getElementById("layout-hierarchical"))==null||n.addEventListener("click",()=>{this.networkViz&&this.networkViz.svg&&this.networkViz.setLayout("hierarchical")});const e=document.createElement("button");e.textContent="Refresh Topology",e.className="btn",e.style.marginLeft="20px",e.addEventListener("click",()=>{console.log("🔄 Manual topology refresh triggered"),this.fetchRealAIAgents(),this.updateCurrentView()});const t=document.querySelector("#network .controls");t&&t.appendChild(e),(o=document.getElementById("node-size"))==null||o.addEventListener("input",m=>{this.networkViz&&this.networkViz.svg&&this.networkViz.setNodeSize(m.target.value)}),(a=document.getElementById("link-strength"))==null||a.addEventListener("input",m=>{this.networkViz&&this.networkViz.svg&&this.networkViz.setLinkStrength(m.target.value)}),(r=document.getElementById("refresh-task-chain"))==null||r.addEventListener("click",()=>{this.refreshTaskChainVisualization()}),(l=document.getElementById("clear-task-chain"))==null||l.addEventListener("click",()=>{this.clearTaskChainVisualization()}),(d=document.getElementById("create-task"))==null||d.addEventListener("click",()=>{this.showTaskModal()}),(p=document.getElementById("cancel-task"))==null||p.addEventListener("click",()=>{this.hideTaskModal()}),(u=document.querySelector(".modal-close"))==null||u.addEventListener("click",()=>{this.hideTaskModal()}),(f=document.getElementById("task-form"))==null||f.addEventListener("submit",m=>{m.preventDefault(),this.createTask()}),(y=document.getElementById("task-priority"))==null||y.addEventListener("input",m=>{const g=document.getElementById("priority-value");g&&(g.textContent=m.target.value)})}setupWebSocketHandlers(){this.ws.on("connected",()=>{console.log("✅ WebSocket connected to server"),this.isConnected=!0,this.reconnectAttempts=0,this.ws.send("get-ai-status")}),this.ws.on("ai-system-status",e=>{console.log("Received AI system status:",e),this.updateSystemStatus(e)}),this.ws.on("agent-update",e=>{this.updateAgent(e)}),this.ws.on("task-update",e=>{this.updateTask(e)}),this.ws.on("collaboration-update",e=>{this.updateCollaboration(e)}),this.ws.on("topology-update",e=>{this.updateTopology(e)}),this.ws.on("tcf-update",e=>{this.updateTCF(e)}),this.ws.on("task-chain-execution-step",e=>{this.handleTaskChainExecutionStep(e)}),this.ws.on("task-chain-completed",e=>{this.handleTaskChainCompleted(e)})}handleTaskChainExecutionStep(e){console.log("Task chain execution step:",e),this.systemState.taskChainSteps||(this.systemState.taskChainSteps=new Map),this.systemState.taskChainSteps.has(e.taskChainId)||this.systemState.taskChainSteps.set(e.taskChainId,[]),this.systemState.taskChainSteps.get(e.taskChainId).push(e),this.currentView==="tasks"&&this.updateTaskChainVisualization(e.taskChainId),this.currentView==="network"&&this.networkViz&&this.networkViz.highlightExecutionStep(e)}handleTaskChainCompleted(e){var t;if(console.log("Task chain completed:",e),this.systemState.taskChains.set(e.chainId,e),e.executionSteps&&!this.systemState.taskChainSteps&&(this.systemState.taskChainSteps=new Map),e.executionSteps&&this.systemState.taskChainSteps.set(e.chainId,e.executionSteps),this.currentView==="tasks"&&this.updateTaskChainVisualization(e.chainId),this.networkViz){const i=e.executionSteps||((t=this.systemState.taskChainSteps)==null?void 0:t.get(e.chainId))||[];this.networkViz.updateWithTaskChain({id:e.chainId,executionPath:i,metrics:e.metrics||{}})}}updateTaskChainVisualization(e){var n;console.log("Updating task chain visualization for:",e);const t=document.getElementById("task-chain-visualization-section");t&&(t.style.display="block");const i=this.systemState.taskChains.get(e),s=((n=this.systemState.taskChainSteps)==null?void 0:n.get(e))||[];if(i||s.length>0){const o={id:e,executionPath:s,tasks:(i==null?void 0:i.results)||[],metrics:(i==null?void 0:i.metrics)||{}};this.taskChainViz&&this.taskChainViz.updateTaskChain(o),this.updateTaskChainDetails(o),this.currentView==="network"&&this.networkViz&&this.networkViz.updateWithTaskChain(o)}}updateTaskChainDetails(e){const t=document.getElementById("task-chain-info");if(!t)return;const i=e.executionPath.length,s=new Set(e.executionPath.map(a=>a.agentId)).size,n=new Map;e.executionPath.forEach(a=>{n.has(a.agentId)||n.set(a.agentId,[]),n.get(a.agentId).push(a)}),t.innerHTML=`
            <div class="task-chain-summary">
                <p><strong>Task Chain ID:</strong> ${e.id.substring(0,8)}...</p>
                <p><strong>Total Steps:</strong> ${i}</p>
                <p><strong>Unique Agents:</strong> ${s}</p>
                ${e.metrics&&Object.keys(e.metrics).length>0?`
                <p><strong>Success Rate:</strong> ${(e.metrics.successRate*100).toFixed(1)}%</p>
                <p><strong>Execution Time:</strong> ${e.metrics.executionTime}ms</p>
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
        `;const o=document.getElementById("view-topology-btn");o&&o.addEventListener("click",()=>{this.switchView("network"),setTimeout(()=>{this.networkViz&&this.networkViz.displaySavedTopology(e.id)},100)})}refreshTaskChainVisualization(){console.log("Refreshing task chain visualization"),this.taskChainViz&&this.taskChainViz.init();const e=Array.from(this.systemState.taskChains.keys());if(e.length>0){const t=e[e.length-1];this.updateTaskChainVisualization(t)}}clearTaskChainVisualization(){console.log("Clearing task chain visualization");const e=document.getElementById("task-chain-visualization-section");e&&(e.style.display="none"),this.taskChainViz&&this.taskChainViz.clear();const t=document.getElementById("task-chain-info");t&&(t.innerHTML="")}initializeComponents(){console.log("Initializing components..."),console.log("Initializing NetworkVisualizer..."),this.networkViz.init(),console.log("Initializing TCFVisualizer..."),this.tcfViz.init(),console.log("Initializing MonitoringComponents..."),this.collaborationMonitor.init(),this.taskManager.init(),this.systemMonitor.init(),this.initTopologyVisualization(),console.log("All components initialized")}initTopologyVisualization(){const e=document.getElementById("topology-visualization");if(!e)return;const t=d3.select(e).append("svg").attr("width","100%").attr("height","100%");t.append("rect").attr("width","100%").attr("height","100%").attr("fill","rgba(0,0,0,0.2)"),t.append("text").attr("x","50%").attr("y","50%").attr("text-anchor","middle").attr("fill","rgba(255,255,255,0.5)").text("拓扑结构视图")}switchView(e){console.log("Switching to view:",e),document.querySelectorAll(".view").forEach(s=>{s.classList.remove("active")}),document.querySelectorAll(".nav-btn").forEach(s=>{s.classList.remove("active")});const t=document.getElementById(e);t?(t.classList.add("active"),console.log("View activated:",e)):console.error("Target view not found:",e);const i=document.querySelector(`[data-view="${e}"]`);i?(i.classList.add("active"),console.log("Button activated:",e)):console.error("Target button not found:",e),this.currentView=e,setTimeout(()=>{this.updateCurrentView()},100)}updateCurrentView(){switch(console.log("Updating current view:",this.currentView),this.currentView){case"ai-overview":case"overview":this.updateOverview();break;case"network":console.log("Updating network view..."),this.networkViz&&this.networkViz.container?(console.log("Network container found, updating..."),this.networkViz.hasSavedTopologyDisplayed()?console.log("Skipping network update - saved topology is displayed"):this.networkViz.update(this.systemState)):(console.log("Re-initializing NetworkVisualizer..."),this.networkViz=new v("#network-graph"),this.networkViz.init());break;case"collaboration":this.collaborationMonitor.update(this.systemState);break;case"tasks":this.taskManager.update(this.systemState);const e=Array.from(this.systemState.taskChains.keys());if(e.length>0){const t=e[e.length-1];this.updateTaskChainVisualization(t)}break;case"monitoring":this.systemMonitor.update(this.systemState);break}}updateOverview(){const e=this.systemState.agents.size,t=Array.from(this.systemState.tasks.values()).filter(l=>l.status==="executing").length,i=document.getElementById("agent-count");i&&(i.textContent=e);const s=document.getElementById("active-tasks");s&&(s.textContent=t);const n=(this.systemState.metrics.networkStability||0)*100,o=(this.systemState.metrics.collaborationEfficiency||0)*100,a=document.getElementById("network-stability");a&&(a.textContent=`${n.toFixed(1)}%`);const r=document.getElementById("collaboration-efficiency");r&&(r.textContent=`${o.toFixed(1)}%`),this.tcfViz.update(this.systemState),this.addLog("info",`系统状态更新: ${e}个Agent在线, ${t}个活跃任务`)}showTaskModal(){const e=document.getElementById("task-modal");e&&e.classList.add("show")}hideTaskModal(){const e=document.getElementById("task-modal");e&&e.classList.remove("show");const t=document.getElementById("task-form");t&&t.reset();const i=document.getElementById("priority-value");i&&(i.textContent="5")}createTask(){var s,n,o,a,r;if(!document.getElementById("task-form"))return;const t=Array.from(document.querySelectorAll(".capabilities input:checked")).map(l=>l.value),i={name:((s=document.getElementById("task-name"))==null?void 0:s.value)||"",type:((n=document.getElementById("task-type"))==null?void 0:n.value)||"analysis",collaborationType:((o=document.getElementById("collaboration-type"))==null?void 0:o.value)||"sequential",priority:parseInt(((a=document.getElementById("task-priority"))==null?void 0:a.value)||"5"),description:((r=document.getElementById("task-description"))==null?void 0:r.value)||"",requiredCapabilities:t};this.ws.send("create-task",i),this.addLog("info",`创建新任务: ${i.name}`),this.hideTaskModal()}addLog(e,t){const i=document.getElementById("system-logs");if(!i)return;const s=new Date().toLocaleTimeString(),n=document.createElement("div");for(n.className=`log-entry ${e}`,n.textContent=`[${s}] ${t}`,i.appendChild(n),i.scrollTop=i.scrollHeight;i.children.length>100;)i.removeChild(i.firstChild)}startDataPolling(){setInterval(()=>{this.ws.connected&&this.ws.send("get-system-status")},1e4),setInterval(()=>{this.currentView==="network"?this.networkViz&&!this.networkViz.hasSavedTopologyDisplayed()&&this.updateCurrentView():this.currentView!=="network"&&this.updateCurrentView()},5e3)}updateSystemStatus(e){this.systemState.metrics=e.metrics||{},(this.currentView==="ai-overview"||this.currentView==="overview")&&this.updateOverview()}updateAgent(e){this.systemState.agents.set(e.agentId,e)}updateTask(e){this.systemState.tasks.set(e.taskId,e)}updateCollaboration(e){this.systemState.collaborationSessions.set(e.sessionId,e)}updateTopology(e){this.currentView==="network"&&this.networkViz.updateTopology(e)}updateTCF(e){this.tcfViz.updateField(e)}generateSampleSystemState(){const e=new Map([["agent1",{id:"agent1",name:"Dr. Analyzer",type:"analyzer",status:"online",position:{x:.3,y:.3},capabilities:["deep_analysis","pattern_recognition"]}],["agent2",{id:"agent2",name:"Prof. Reasoner",type:"reasoner",status:"busy",position:{x:.7,y:.3},capabilities:["logical_reasoning","inference"]}],["agent3",{id:"agent3",name:"Ms. Synthesizer",type:"synthesizer",status:"online",position:{x:.5,y:.7},capabilities:["information_synthesis","knowledge_integration"]}],["agent4",{id:"agent4",name:"Dr. Validator",type:"validator",status:"offline",position:{x:.2,y:.6},capabilities:["result_validation","quality_assessment"]}],["agent5",{id:"agent5",name:"Mx. Innovator",type:"innovator",status:"online",position:{x:.8,y:.6},capabilities:["creative_thinking","solution_generation"]}]]);this.systemState.agents=e,this.systemState.topology={connections:[{source:"agent1",target:"agent2",strength:.8,type:"collaboration"},{source:"agent2",target:"agent3",strength:.6,type:"data_flow"},{source:"agent1",target:"agent3",strength:.4,type:"coordination"},{source:"agent3",target:"agent5",strength:.7,type:"collaboration"},{source:"agent4",target:"agent1",strength:.3,type:"coordination"}]},console.log("📊 Generated sample system state with",e.size,"agents"),this.updateCurrentView()}async fetchRealAIAgents(){try{const e=h.getBackendUrl(),t=await fetch(`${e}/api/ai-status`);if(!t.ok)throw new Error(`HTTP error! status: ${t.status}`);const i=await t.json();return console.log("📊 Fetched Real AI agent data:",i),this.systemState.agents=i.aiAgents||[],this.systemState.collaborations=i.activeCollaborations||0,this.systemState.totalTasks=i.totalCollaborations||0,this.updateAgentList(),this.updateSystemMetrics(),i}catch(e){return console.error("❌ Failed to fetch Real AI agents:",e),(!this.ws||!this.ws.connected)&&this.connectToServer(),this.getDemoData()}}generateRealTopologyConnections(e){const t=Array.from(e.values()),i=[];for(let s=0;s<t.length;s++)for(let n=s+1;n<t.length;n++){const o=t[s],a=t[n];let r=.3,l="coordination";o.type==="analyzer"&&a.type==="synthesizer"?(r=.8,l="collaboration"):o.type==="reasoner"&&a.type==="validator"?(r=.7,l="data_flow"):o.type==="innovator"&&(r=.6,l="collaboration"),i.push({source:o.id,target:a.id,strength:r,type:l})}this.systemState.topology={connections:i},console.log("🔗 Generated",i.length,"real topology connections")}}document.addEventListener("DOMContentLoaded",()=>{window.app=new I});class A{constructor(){this.websocket=null,this.aiAgents=new Map,this.activeCollaborations=new Map,this.taskHistory=[],this.initializeInterface(),this.connectWebSocket()}initializeInterface(){console.log("🚀 Initializing Real AI Interface..."),this.createAIControlPanel(),console.log("✅ AI Control Panel created"),this.createCollaborationInterface(),console.log("✅ Collaboration interface created"),this.createTaskInterface(),console.log("✅ Task interface created"),this.setupEventListeners(),console.log("✅ Event listeners setup"),setTimeout(()=>{const e=document.getElementById("ai-task-description"),t=document.getElementById("ai-task-form");console.log("Form verification:",{taskDescription:!!e,aiTaskForm:!!t,descriptionValue:e?e.value:"N/A",descriptionPlaceholder:e?e.placeholder:"N/A"}),e||console.error("❌ Task description element not found after initialization!"),t||console.error("❌ AI task form not found after initialization!")},100),console.log("✅ Real AI Interface initialization complete")}createAIControlPanel(){const e=document.createElement("div");e.className="ai-control-panel",e.innerHTML=`
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
        `,document.body.appendChild(e),this.setupAIControlPanelToggle()}createCollaborationInterface(){const e=document.createElement("div");e.className="collaboration-panel",e.innerHTML=`
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
        `,document.body.appendChild(e),this.setupCollaborationPanelToggle()}createTaskInterface(){const e=document.createElement("div");e.className="task-panel",e.innerHTML=`
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
        `,document.body.appendChild(e)}setupEventListeners(){console.log("Setting up event listeners...");const e=()=>{const t=document.getElementById("task-complexity"),i=document.getElementById("complexity-value");t&&i?(this.complexitySliderListener&&t.removeEventListener("input",this.complexitySliderListener),this.complexitySliderListener=a=>{i.textContent=a.target.value},t.addEventListener("input",this.complexitySliderListener),console.log("✅ Complexity slider listener added")):console.warn("⚠️ Complexity slider elements not found");const s=document.getElementById("ai-task-form");if(s){if(s.hasAttribute("data-listener-attached")){console.log("⚠️ Task form listener already attached, skipping");return}s.setAttribute("data-listener-attached","true"),this.taskFormSubmitListener=a=>{a.preventDefault(),console.log("Form submit event triggered"),this.submitAITask()},s.addEventListener("submit",this.taskFormSubmitListener),console.log("✅ Task form listener added")}else console.warn("⚠️ AI task form not found");const n=document.getElementById("create-ai-agent-btn");if(n){if(n.hasAttribute("data-listener-attached")){console.log("⚠️ Create agent button listener already attached, skipping");return}n.setAttribute("data-listener-attached","true"),this.createAgentBtnListener=()=>{this.showCreateAgentDialog()},n.addEventListener("click",this.createAgentBtnListener),console.log("✅ Create agent button listener added")}else console.warn("⚠️ Create agent button not found");const o=document.getElementById("debug-form-btn");if(o){if(o.hasAttribute("data-listener-attached")){console.log("⚠️ Debug button listener already attached, skipping");return}o.setAttribute("data-listener-attached","true"),this.debugBtnListener=()=>{this.debugFormState()},o.addEventListener("click",this.debugBtnListener),console.log("✅ Debug button listener added")}};e(),setTimeout(e,50),setTimeout(e,200)}connectWebSocket(){console.log("🔄 Connecting to Real AI Server..."),window.app&&window.app.ws&&window.app.ws.socket?(console.log("🔗 Reusing main app WebSocket connection"),this.websocket=window.app.ws,this.setupWebSocketHandlers(),setTimeout(()=>{this.requestAIStatus()},1e3)):(console.log("🔗 Creating new WebSocket connection"),this.websocket=new k,this.websocket.connect(h.getBackendUrl()).catch(e=>{console.error("❌ Failed to connect to WebSocket:",e),h.shouldUseDemoMode()?(console.log("📱 Vercel deployment detected, using demo mode"),this.setupDemoMode()):this.updateAIStatus("offline","Connection Failed")}),this.setupWebSocketHandlers()),setInterval(()=>{if(this.websocket){const e=this.websocket.socket&&this.websocket.socket.connected||this.websocket.connected||!1;console.log(`[RealAIInterface] Connection status check: ${e}`),this.websocket.isDemoMode&&this.updateAIStatus("demo","Demo Mode Active")}},5e3)}setupWebSocketHandlers(){var t;this.websocket===((t=window.app)==null?void 0:t.ws)?this.websocket.socket&&this.websocket.socket.connected?(console.log("✅ Already connected to Real AI Server via main app"),this.updateAIStatus("online","Connected to Real AI Server")):this.websocket.isDemoMode&&(console.log("📱 Demo mode active via main app"),this.setupDemoMode()):(this.websocket.on("connect",()=>{console.log("✅ Connected to Real AI Server"),this.updateAIStatus("online","Connected to Real AI Server")}),this.websocket.on("disconnected",i=>{console.log("❌ Disconnected from Real AI Server:",i),i==="demo-mode"?this.setupDemoMode():this.updateAIStatus("offline","Disconnected from Server")}),this.websocket.on("error",i=>{console.error("❌ WebSocket error:",i),h.shouldUseDemoMode()?this.setupDemoMode():this.updateAIStatus("offline","Connection Error")})),this.websocket.on("ai-system-status",i=>{console.log("📊 AI System Status Update:",i),this.updateSystemStatus(i)}),this.websocket.on("ai-agent-created",i=>{console.log("🤖 New AI Agent Created:",i),i.success&&i.agent&&this.showNotification(`🎉 New AI Agent Created: ${i.agent.name}`,"success")}),this.websocket.on("ai-task-completed",i=>{console.log("🏆 AI Task Completed:",i),this.handleTaskCompleted(i)}),this.websocket.on("prof-smoot-allocation",i=>{console.log("🎯 Prof. Smoot Allocation Decision:",i),this.showNotification(`🌌 Prof. Smoot allocated ${i.allocatedAgents.length} agents for task ${i.taskId.substring(0,8)}...`,"info"),this.addLog("info",`Prof. Smoot allocated agents: ${i.allocatedAgents.length} agents selected with confidence ${i.confidence}`)}),this.websocket.on("fallback-allocation",i=>{console.log("🔄 Fallback Allocation Used:",i),this.showNotification(`🔄 Fallback allocation used for task ${i.taskId.substring(0,8)}...`,"warning"),this.addLog("warning",`Fallback allocation used: ${i.allocatedAgents.length} agents selected using ${i.method}`)}),this.websocket.on("task-chain-execution-step",i=>{console.log("🔗 Task Chain Execution Step:",i),this.handleTaskChainExecutionStep(i)}),this.websocket.on("task-chain-completed",i=>{console.log("✅ Task Chain Completed:",i)}),this.websocket.on("collaboration-completed",i=>{console.log("🎉 Collaboration Completed:",i)}),setTimeout(()=>{this.requestAIStatus()},1e3)}setupDemoMode(){console.log("📱 Setting up demo mode for Real AI Interface"),this.updateAIStatus("demo","Demo Mode Active"),this.showNotification("📱 Demo Mode Active - Real AI agents not available in this deployment","info"),this.demoInterval&&clearInterval(this.demoInterval),this.demoInterval=setInterval(()=>{this.updateWithDemoData()},15e3),setTimeout(()=>{this.updateWithDemoData()},1e3)}updateWithDemoData(){console.log("📱 Updating Real AI Interface with demo data");const e={timestamp:Date.now(),openaiApiKey:!1,totalAIAgents:5,activeCollaborations:Math.floor(Math.random()*3),totalCollaborations:12+Math.floor(Math.random()*5),connectedClients:1,aiAgents:[{id:"demo-1",name:"Prof. Smoot (Demo)",type:"cosmic_structure_expert",status:"active",energy:95,maxEnergy:100,ai:{focusLevel:.9,memoryLoad:{shortTerm:5,longTerm:42},currentThought:"Analyzing cosmic structure patterns..."}},{id:"demo-2",name:"Dr. Analyzer (Demo)",type:"analyzer",status:"processing",energy:87,maxEnergy:100,ai:{focusLevel:.7,memoryLoad:{shortTerm:8,longTerm:36},currentThought:"Processing data patterns..."}},{id:"demo-3",name:"Ms. Synthesizer (Demo)",type:"synthesizer",status:"active",energy:92,maxEnergy:100,ai:{focusLevel:.8,memoryLoad:{shortTerm:3,longTerm:28},currentThought:"Synthesizing knowledge domains..."}}],recentTasks:[],system:{memory:{heapUsed:Math.random()*50*1024*1024},uptime:Math.floor(Math.random()*3600)}};this.updateSystemStatus(e)}requestAIStatus(){if(this.websocket&&this.websocket.isDemoMode){console.log("📱 Demo mode: Skipping AI status request");return}if(this.websocket&&this.websocket.socket&&this.websocket.socket.connected)this.websocket.send("get-ai-status");else if(this.websocket&&!this.websocket.socket)try{this.websocket.send("get-ai-status")}catch(e){console.warn("Could not request AI status:",e)}else console.warn("WebSocket not connected, cannot request AI status")}updateAIStatus(e,t){const i=document.getElementById("ai-status-indicator"),s=document.getElementById("ai-status-text");i&&(e==="demo"?i.className="status-dot demo":i.className=`status-dot ${e}`),s&&(s.textContent=t)}updateSystemStatus(e){this.updateAIAgentsList(e.aiAgents||[]),e.openaiApiKey?this.updateAIStatus("online",`${e.totalAIAgents} AI Agents Active`):this.updateAIStatus("warning","No OpenAI API Key - Limited Features")}updateAIAgentsList(e){const t=document.getElementById("ai-agents-list");t.innerHTML=e.map(i=>{var s,n,o,a,r;return`
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
        `}).join("")}submitAITask(){if(this.isSubmitting){console.log("⚠️ Task submission already in progress, ignoring duplicate request");return}console.log("Submitting AI task..."),this.isSubmitting=!0;const e=document.getElementById("ai-task-description"),t=document.getElementById("task-type"),i=document.getElementById("task-priority"),s=document.getElementById("task-complexity");if(console.log("Form elements found:",{description:!!e,type:!!t,priority:!!i,complexity:!!s}),!e){console.error("Task description element not found!"),alert("Form not properly initialized. Please refresh the page."),this.isSubmitting=!1;return}const n=e.value,o=t?t.value:"strategic_analysis",a=i?parseInt(i.value):3,r=s?parseInt(s.value):50;console.log("Form values:",{description:n,type:o,priority:a,complexity:r});const l=Array.from(document.querySelectorAll(".capabilities-checkboxes input:checked")).map(u=>u.value);console.log("Selected capabilities:",l);const d={type:o,description:n.trim(),priority:a,complexity:r,requiredCapabilities:l};if(console.log("Submitting task data:",d),this.showTaskProgress(),this.websocket&&(this.websocket.socket&&this.websocket.socket.connected||this.websocket.connected))try{this.websocket.send("submit-ai-task",d),e.value="",document.querySelectorAll(".capabilities-checkboxes input:checked").forEach(u=>u.checked=!1),console.log("Task submitted successfully to AI backend"),setTimeout(()=>{this.isSubmitting=!1},2e3)}catch(u){console.error("Error submitting task:",u),this.showError("Failed to submit task: "+u.message),this.isSubmitting=!1;return}else console.warn("WebSocket not connected, using demo mode"),this.runDemoCollaboration(d),setTimeout(()=>{this.isSubmitting=!1},1e3)}showTaskProgress(){const e=document.getElementById("active-task-display");e.style.display="block",this.updateProgressPhase("Initializing AI collaboration...",10),setTimeout(()=>this.updateProgressPhase("Selecting optimal AI agents...",25),1e3),setTimeout(()=>this.updateProgressPhase("Individual analysis phase...",40),3e3),setTimeout(()=>this.updateProgressPhase("Collaborative discussion...",65),8e3),setTimeout(()=>this.updateProgressPhase("Convergence and synthesis...",85),15e3)}updateProgressPhase(e,t){document.getElementById("progress-text").textContent=e,document.getElementById("progress-fill").style.width=`${t}%`}hideTaskProgress(){document.getElementById("active-task-display").style.display="none"}handleTaskCompleted(e){console.log("🏆 Handling task completion:",e),this.hideTaskProgress(),this.isSubmitting=!1,e.success&&e.result?(console.log("✅ Displaying successful task result"),this.displayTaskResult(e.result),this.addToTaskHistory(e.result),this.showNotification("🎉 Task completed successfully!","success")):(console.log("❌ Task failed:",e.error||"Unknown error"),this.showError("Task failed: "+(e.error||"Unknown error")))}displayTaskResult(e){console.log("📊 Displaying task result:",e);const t=document.getElementById("task-results");if(!t){console.error("❌ Task results container not found!");return}const i={task:e.task||{description:"Unknown task",type:"unknown"},finalResult:e.finalResult||e.content||"No result available",synthesizedBy:e.synthesizedBy||"AI Collaboration System",timestamp:e.timestamp||Date.now(),metadata:e.metadata||{totalAgents:1,tokensUsed:0,collaborationType:"standard"},convergenceMetrics:e.convergenceMetrics||{convergenceAchieved:!0,finalConsensus:.8,collaborationEfficiency:.7},insights:e.insights||[]},s=document.createElement("div");s.className="task-result",s.innerHTML=`
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
        `,t.innerHTML="",t.appendChild(s),console.log("✅ Task result displayed successfully")}addToTaskHistory(e){console.log("📜 Adding to task history:",e);const t={task:e.task||{description:"Unknown task",type:"unknown"},finalResult:e.finalResult||e.content||"No result available",timestamp:e.timestamp||Date.now(),synthesizedBy:e.synthesizedBy||"AI System"};this.taskHistory.unshift(t),this.taskHistory.length>20&&(this.taskHistory=this.taskHistory.slice(0,20)),this.updateHistoryDisplay(),console.log("✅ Task added to history. Total items:",this.taskHistory.length)}updateHistoryDisplay(){const e=document.getElementById("history-list");if(!e){console.error("❌ History list container not found!");return}if(console.log("🔄 Updating history display with",this.taskHistory.length,"items"),this.taskHistory.length===0){e.innerHTML='<div class="no-history">No collaboration history yet. Submit a task to get started!</div>';return}e.innerHTML=this.taskHistory.slice(0,5).map(t=>{const i=t.task||{},s=i.description||"Unknown task",n=t.finalResult||"No result available",o=t.timestamp||Date.now();return`
                <div class="history-item">
                    <div class="history-header">
                        <span class="task-type">${i.type||"unknown"}</span>
                        <span class="timestamp">${new Date(o).toLocaleString()}</span>
                    </div>
                    <div class="task-description">${s.substring(0,100)}${s.length>100?"...":""}</div>
                    <div class="result-preview">${n.substring(0,150)}${n.length>150?"...":""}</div>
                </div>
            `}).join(""),console.log("✅ History display updated successfully")}displayDemoResult(e){this.displayTaskResult(e),this.addToTaskHistory(e),this.showNotification("🎭 Demo collaboration completed!","success")}showNotification(e,t="info"){const i=document.createElement("div");i.className=`notification ${t}`,i.textContent=e,document.body.appendChild(i),setTimeout(()=>{i.remove()},5e3)}showError(e){this.showNotification("❌ "+e,"error")}showCreateAgentDialog(){const e=document.createElement("div");e.className="agent-creation-modal",e.style.cssText=`
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
        `,e.innerHTML=`
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
        `,document.body.appendChild(e);const t=e.querySelector(".close-btn"),i=e.querySelector(".cancel-btn"),s=e.querySelector(".debug-agent-btn"),n=e.querySelector("#agent-creation-form"),o=()=>{document.body.removeChild(e)};t.addEventListener("click",o),i.addEventListener("click",o),e.addEventListener("click",a=>{a.target===e&&o()}),s.addEventListener("click",()=>{this.debugAgentForm(e)}),n.addEventListener("submit",a=>{a.preventDefault(),this.createCustomAgent(e)})}debugAgentForm(e){console.log("🔍 Debugging agent creation form...");const t=e.querySelector("#agent-name"),i=e.querySelector("#agent-type"),s=e.querySelector("#agent-expertise"),n=e.querySelectorAll(".personality-checkboxes input"),o={nameInput:{exists:!!t,value:t?t.value:"N/A",length:t?t.value.length:0,trimmed:t?t.value.trim():"N/A",trimmedLength:t?t.value.trim().length:0},typeSelect:{exists:!!i,value:i?i.value:"N/A"},expertiseTextarea:{exists:!!s,value:s?s.value:"N/A",length:s?s.value.length:0},personalityCheckboxes:{total:n.length,checked:Array.from(n).filter(a=>a.checked).length,values:Array.from(n).filter(a=>a.checked).map(a=>a.value)}};console.log("Agent form debug data:",o),t&&(t.value="Test Debug Agent",console.log("📝 Set test name value")),alert(`Form Debug Info:

Name Field: ${o.nameInput.exists?"Found":"Missing"}
Name Value: "${o.nameInput.value}"
Name Length: ${o.nameInput.length}
Type Field: ${o.typeSelect.exists?"Found":"Missing"}
Personality Options: ${o.personalityCheckboxes.total} total, ${o.personalityCheckboxes.checked} selected`)}debugFormState(){var t,i,s,n,o;console.log("🔍 Debugging form state...");const e={taskDescription:document.getElementById("ai-task-description"),taskType:document.getElementById("task-type"),taskPriority:document.getElementById("task-priority"),taskComplexity:document.getElementById("task-complexity"),aiTaskForm:document.getElementById("ai-task-form"),capabilityCheckboxes:document.querySelectorAll(".capabilities-checkboxes input")};console.log("Form elements debug:",{taskDescription:{exists:!!e.taskDescription,value:((t=e.taskDescription)==null?void 0:t.value)||"N/A",placeholder:((i=e.taskDescription)==null?void 0:i.placeholder)||"N/A"},taskType:{exists:!!e.taskType,value:((s=e.taskType)==null?void 0:s.value)||"N/A"},taskPriority:{exists:!!e.taskPriority,value:((n=e.taskPriority)==null?void 0:n.value)||"N/A"},taskComplexity:{exists:!!e.taskComplexity,value:((o=e.taskComplexity)==null?void 0:o.value)||"N/A"},aiTaskForm:{exists:!!e.aiTaskForm},capabilityCheckboxes:{count:e.capabilityCheckboxes.length,checked:Array.from(e.capabilityCheckboxes).filter(a=>a.checked).length}}),e.taskDescription?(e.taskDescription.value="Test task description for debugging",console.log("📝 Set test description"),this.submitAITask()):(console.error("❌ Cannot debug: task description element not found"),alert("Form elements not found! Please check if the interface is properly loaded."))}createCustomAgent(e){console.log("🔍 Debugging custom agent creation...");const t=e.querySelector("#agent-name"),i=e.querySelector("#agent-type"),s=e.querySelector("#agent-expertise");if(console.log("Form elements found in modal:",{nameInput:!!t,typeSelect:!!i,expertiseTextarea:!!s,nameValue:t?t.value:"N/A",nameLength:t?t.value.length:0}),!t){console.error("❌ Agent name input not found in modal!"),alert("Form elements not found! Please try again.");return}const n=t.value,o=i?i.value:"analyst",a=s?s.value:"",r=Array.from(e.querySelectorAll(".personality-checkboxes input:checked")).map(d=>d.value);if(console.log("Extracted values:",{name:n,type:o,expertise:a,personality:r}),!n||!n.trim()){console.log("❌ Empty name detected:",{name:n,trimmed:n?n.trim():"null",length:n?n.length:0}),alert("Please provide an agent name"),t.focus();return}const l={name:n.trim(),type:o,expertise:a.trim(),personality:r,id:`custom_${Date.now()}_${Math.random().toString(36).substr(2,9)}`,createdAt:Date.now(),status:"active"};console.log("🤖 Creating custom agent:",l),this.addCustomAgent(l),document.body.removeChild(e),this.showNotification(`🎉 Custom agent "${n}" created successfully!`,"success"),this.websocket&&this.websocket.connected&&this.websocket.emit("create-ai-agent",l)}addCustomAgent(e){this.customAgents=this.customAgents||new Map,this.customAgents.set(e.id,e),this.updateCustomAgentsDisplay()}updateCustomAgentsDisplay(){const e=document.getElementById("ai-agents-list");if(!e)return;const t=this.customAgents||new Map,i=Array.from(t.values()).map(s=>`
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
        `).join("");if(t.size>0){const s=e.innerHTML;e.innerHTML=i+s}}enableDemoMode(){console.log("🎭 Enabling demo mode..."),this.demoMode=!0,this.createDemoAgents()}createDemoAgents(){const e=[{id:"demo_analyst",name:"Demo Data Analyst",type:"analyst",status:"active",expertise:"Statistical analysis and data interpretation",personality:["analytical","detail_oriented"],createdAt:Date.now()-864e5},{id:"demo_creative",name:"Demo Creative Thinker",type:"creative",status:"active",expertise:"Innovative solutions and creative problem-solving",personality:["creative","innovative"],createdAt:Date.now()-1728e5}];this.customAgents=this.customAgents||new Map,e.forEach(t=>{this.customAgents.set(t.id,t)}),this.updateCustomAgentsDisplay()}runDemoCollaboration(e){if(this.isRunningDemo){console.log("⚠️ Demo collaboration already in progress, ignoring duplicate request");return}console.log("🎭 Running demo collaboration for:",e.description),this.isRunningDemo=!0;const t=document.getElementById("ai-task-description");t&&(t.value=""),document.querySelectorAll(".capabilities-checkboxes input:checked").forEach(i=>i.checked=!1),setTimeout(()=>this.updateProgressPhase("Demo: Analyzing task requirements...",20),500),setTimeout(()=>this.updateProgressPhase("Demo: Custom agents collaborating...",45),2e3),setTimeout(()=>this.updateProgressPhase("Demo: Synthesizing insights...",70),4e3),setTimeout(()=>this.updateProgressPhase("Demo: Generating final analysis...",90),6e3),setTimeout(()=>{const i=this.generateDemoResult(e);this.hideTaskProgress(),this.displayTaskResult(i),this.addToTaskHistory(i),this.isRunningDemo=!1},8e3)}generateDemoResult(e){var i;console.log("🎭 Generating demo result for task:",e.description);const t=this.generateTaskSpecificAnalysis(e.description);return{task:e,finalResult:t,synthesizedBy:"AI协作分析引擎",timestamp:Date.now(),metadata:{totalAgents:(((i=this.customAgents)==null?void 0:i.size)||0)+4,tokensUsed:Math.floor(Math.random()*200)+345,collaborationType:"deep_collaborative_analysis"},convergenceMetrics:{convergenceAchieved:!0,finalConsensus:.88+Math.random()*.1,collaborationEfficiency:.82+Math.random()*.15},insights:["运用多智能体协作框架进行综合分析","整合宏观经济模型和微观数据指标","考虑政策影响和国际环境变化因素","结合历史趋势和未来发展预期","应用先进的计量经济学方法进行预测"]}}generateTaskSpecificAnalysis(e){console.log("📊 Generating task-specific analysis for:",e);const t=e.toLowerCase();return t.includes("gdp")||t.includes("经济")||t.includes("增长")?`基于中国未来10年GDP深度分析，我们的AI协作团队提供以下综合评估：

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
中国未来10年GDP将保持中高速稳健增长，总体呈现"前高后稳"的发展轨迹。经济增长模式将从规模扩张转向质量提升，科技创新和绿色发展成为关键动力。预计到2035年，中国将基本实现社会主义现代化，经济总量和人均收入水平显著提升。`:t.includes("ai")||t.includes("人工智能")||t.includes("技术")?`AI技术对未来社会影响的综合分析：

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
- 人工智能治理框架`:t.includes("市场")||t.includes("market")||t.includes("行业")?`市场分析报告：

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
- 持续创新和研发投入`:`针对您的问题“${e}”的深度分析：

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
综合各方面分析，我们建议采取综合性方案，统筹考虑各种因素和影响，并根据实际情况进行调整和优化。`}setupAIControlPanelToggle(){const e=document.getElementById("ai-control-toggle"),t=document.querySelector(".ai-control-panel");if(!e||!t){console.warn("⚠️ Toggle button or AI control panel not found");return}let i=!1;e.addEventListener("click",()=>{i=!i,i?(t.classList.add("collapsed"),e.innerHTML="<span>◀</span>",console.log("🔄 AI Control panel collapsed")):(t.classList.remove("collapsed"),e.innerHTML="<span>▶</span>",console.log("🔄 AI Control panel expanded"))}),e.addEventListener("mouseenter",()=>{i?e.style.transform="scale(1.1) rotate(180deg)":e.style.transform="scale(1.1)"}),e.addEventListener("mouseleave",()=>{i?e.style.transform="rotate(180deg)":e.style.transform=""}),console.log("✅ AI Control panel toggle setup complete")}setupCollaborationPanelToggle(){const e=document.getElementById("collaboration-toggle"),t=document.querySelector(".collaboration-panel");if(!e||!t){console.warn("⚠️ Toggle button or collaboration panel not found");return}let i=!1;e.addEventListener("click",()=>{i=!i,i?(t.classList.add("collapsed"),e.innerHTML="<span>▶</span>",console.log("🔄 Collaboration panel collapsed")):(t.classList.remove("collapsed"),e.innerHTML="<span>◀</span>",console.log("🔄 Collaboration panel expanded"))}),e.addEventListener("mouseenter",()=>{i?e.style.transform="scale(1.1) rotate(180deg)":e.style.transform="scale(1.1)"}),e.addEventListener("mouseleave",()=>{i?e.style.transform="rotate(180deg)":e.style.transform=""}),console.log("✅ Collaboration panel toggle setup complete")}}document.addEventListener("DOMContentLoaded",()=>{window.realAIInterface=new A});class M{constructor(){this.websocket=null,this.metrics={agents:[],collaborations:0,tasks:0,performance:{convergenceRate:0,avgResponseTime:0,tokenUsage:0,successRate:100},system:{memory:0,connections:0,uptime:0}},this.charts=new Map,this.activityLog=[],this.initializeDashboard(),this.connectWebSocket(),this.startMetricsUpdate(),this.simulateRealtimeUpdates()}initializeDashboard(){this.setupEventListeners(),this.initializeCharts(),setTimeout(()=>{const e=document.querySelector('.nav-btn[data-view="ai-overview"]');e&&!e.classList.contains("active")&&e.classList.add("active");const t=document.getElementById("ai-overview");t&&!t.classList.contains("active")&&t.classList.add("active")},100),this.updateDisplay()}setupEventListeners(){document.querySelectorAll(".nav-btn").forEach(e=>{e.addEventListener("click",t=>{t.preventDefault(),t.stopPropagation();const i=t.target.dataset.view;i&&this.switchView(i)})})}switchView(e){console.log(`Switching to view: ${e}`),document.querySelectorAll(".view").forEach(s=>{s.classList.remove("active")});const t=document.getElementById(e);t?(t.classList.add("active"),console.log(`Activated view: ${e}`)):console.warn(`View not found: ${e}`),document.querySelectorAll(".nav-btn").forEach(s=>{s.classList.remove("active")});const i=document.querySelector(`[data-view="${e}"]`);i?(i.classList.add("active"),console.log(`Activated nav button for: ${e}`)):console.warn(`Nav button not found for: ${e}`),t&&(t.style.animation="fadeIn 0.3s ease")}connectWebSocket(){console.log("🔄 Connecting to Real AI Server..."),window.app&&window.app.ws&&window.app.ws.socket?(console.log("🔗 Reusing main app WebSocket connection in metrics dashboard"),this.websocket=window.app.ws,this.setupWebSocketHandlers()):(console.log("🔗 Creating new WebSocket connection for metrics dashboard"),this.websocket=new WebSocketClient,this.websocket.connect(h.getBackendUrl()).catch(e=>{console.error("❌ Failed to connect to WebSocket:",e),h.shouldUseDemoMode()?(console.log("📱 Vercel deployment detected, using demo mode in metrics dashboard"),this.setupDemoMode()):this.addActivity("Connection Failed","error")}),this.setupWebSocketHandlers())}setupWebSocketHandlers(){var t;const e=this.websocket===((t=window.app)==null?void 0:t.ws);e?this.websocket.socket&&this.websocket.socket.connected?(console.log("✅ Already connected to Real AI Server via main app"),this.addActivity("Connected to AI system","success"),this.websocket.send("get-ai-status")):this.websocket.isDemoMode&&(console.log("📱 Demo mode active via main app in metrics dashboard"),this.setupDemoMode()):(this.websocket.on("connect",()=>{console.log("📡 Connected to Real AI WebSocket"),this.addActivity("Connected to AI system","success"),this.requestSystemStatus()}),this.websocket.on("disconnected",i=>{console.log("❌ Disconnected from AI WebSocket:",i),i==="demo-mode"?this.setupDemoMode():this.addActivity("Disconnected from AI system","error")}),this.websocket.on("error",i=>{console.error("WebSocket connection error:",i),h.shouldUseDemoMode()?this.setupDemoMode():this.addActivity("WebSocket connection error","error")})),this.websocket.on("ai-system-status",i=>{this.updateSystemMetrics(i)}),this.websocket.on("ai-collaboration-update",i=>{this.updateCollaborationMetrics(i)}),this.websocket.on("ai-agent-update",i=>{this.updateAgentMetrics(i)}),this.websocket.on("demo-collaboration-completed",i=>{this.handleCollaborationComplete(i)}),this.websocket.on("network-topology-update",i=>{this.updateNetworkTopology(i)}),this.websocket.on("performance-metrics",i=>{this.updatePerformanceMetrics(i)}),this.websocket.on("collaboration-view-update",i=>{this.updateCollaborationViewMetrics(i)}),e||setTimeout(()=>{this.requestSystemStatus()},1e3)}setupDemoMode(){console.log("📱 Setting up demo mode for Metrics Dashboard"),this.addActivity("Demo Mode Active - Real AI agents not available","info"),this.demoInterval&&clearInterval(this.demoInterval),this.demoInterval=setInterval(()=>{this.updateWithDemoData()},15e3),setTimeout(()=>{this.updateWithDemoData()},1e3)}updateWithDemoData(){console.log("📱 Updating Metrics Dashboard with demo data");const e={timestamp:Date.now(),openaiApiKey:!1,totalAIAgents:5,activeCollaborations:Math.floor(Math.random()*3),totalCollaborations:12+Math.floor(Math.random()*5),connectedClients:1,aiAgents:[{id:"demo-1",name:"Prof. Smoot (Demo)",type:"cosmic_structure_expert",status:"active",energy:95,maxEnergy:100,ai:{focusLevel:.9,memoryLoad:{shortTerm:5,longTerm:42},currentThought:"Analyzing cosmic structure patterns..."}},{id:"demo-2",name:"Dr. Analyzer (Demo)",type:"analyzer",status:"processing",energy:87,maxEnergy:100,ai:{focusLevel:.7,memoryLoad:{shortTerm:8,longTerm:36},currentThought:"Processing data patterns..."}},{id:"demo-3",name:"Ms. Synthesizer (Demo)",type:"synthesizer",status:"active",energy:92,maxEnergy:100,ai:{focusLevel:.8,memoryLoad:{shortTerm:3,longTerm:28},currentThought:"Synthesizing knowledge domains..."}}],system:{memory:{heapUsed:Math.random()*50*1024*1024},uptime:Math.floor(Math.random()*3600)}};this.updateSystemMetrics(e)}requestSystemStatus(){this.websocket&&this.websocket.connected&&this.websocket.emit("get-ai-status")}updateSystemMetrics(e){var t;this.metrics.agents=e.aiAgents||[],this.metrics.collaborations=e.activeCollaborations||0,this.metrics.tasks=e.totalCollaborations||0,e.system&&(this.metrics.system.memory=((t=e.system.memory)==null?void 0:t.heapUsed)||0,this.metrics.system.uptime=e.system.uptime||0),this.metrics.system.connections=e.connectedClients||0,this.updateAPIStatus(e.openaiApiKey),this.updateStatusCards(),this.updateAgentMetricsDisplay(),this.updateResourceMeters(),this.addActivity(`System status updated: ${this.metrics.agents.length} agents active`,"info")}updateStatusCards(){const e=document.getElementById("total-agents"),t=document.getElementById("active-collaborations"),i=document.getElementById("total-tasks");e&&(e.textContent=this.metrics.agents.length),t&&(t.textContent=this.metrics.collaborations),i&&(i.textContent=this.metrics.tasks);const s=document.getElementById("agents-status"),n=document.getElementById("collab-status");s&&(s.className=`status-indicator ${this.metrics.agents.length>0?"online":"offline"}`),n&&(n.className=`status-indicator ${this.metrics.collaborations>0?"online":"offline"}`)}updateAPIStatus(e){const t=document.getElementById("api-status"),i=document.getElementById("api-indicator");t&&i&&(e?(t.textContent="Active",i.className="status-indicator success"):(t.textContent="No Key",i.className="status-indicator warning"))}updateAgentMetricsDisplay(){const e=document.getElementById("agent-metrics-container");e&&(e.innerHTML=this.metrics.agents.map(t=>{var i,s,n,o,a,r;return`
            <div class="agent-metric-card">
                <div class="agent-header">
                    <div class="agent-name">${t.name}</div>
                    <div class="agent-type">${t.type}</div>
                </div>
                
                <div class="agent-metrics">
                    <div class="metric-item">
                        <div class="label">Energy</div>
                        <div class="value">${t.energy}/${t.maxEnergy}</div>
                    </div>
                    
                    <div class="metric-item">
                        <div class="label">Focus</div>
                        <div class="value">${(((i=t.ai)==null?void 0:i.focusLevel)*100||0).toFixed(0)}%</div>
                    </div>
                    
                    <div class="metric-item">
                        <div class="label">Memory</div>
                        <div class="value">${((n=(s=t.ai)==null?void 0:s.memoryLoad)==null?void 0:n.shortTerm)||0}/${((a=(o=t.ai)==null?void 0:o.memoryLoad)==null?void 0:a.longTerm)||0}</div>
                    </div>
                    
                    <div class="metric-item">
                        <div class="label">Status</div>
                        <div class="value ${t.status}">${t.status}</div>
                    </div>
                </div>
                
                ${(r=t.ai)!=null&&r.currentThought?`
                    <div class="agent-thinking">
                        "${t.ai.currentThought}"
                    </div>
                `:""}
            </div>
        `}).join(""))}updateResourceMeters(){const e=Math.round(this.metrics.system.memory/1024/1024),t=Math.min(e/100*100,100),i=document.getElementById("memory-bar"),s=document.getElementById("memory-value");i&&(i.style.width=`${t}%`),s&&(s.textContent=`${e} MB`);const n=Math.min(this.metrics.system.connections/10*100,100),o=document.getElementById("connections-bar"),a=document.getElementById("connections-value");o&&(o.style.width=`${n}%`),a&&(a.textContent=this.metrics.system.connections);const r=this.formatUptime(this.metrics.system.uptime),l=document.getElementById("uptime-value");l&&(l.textContent=r)}updateCollaborationMetrics(e){if(this.addActivity(`Collaboration session: ${e.sessionId}`,"info"),e.convergenceMetrics){this.metrics.performance.convergenceRate=e.convergenceMetrics.finalConsensus*100||0;const t=document.getElementById("convergence-rate");t&&(t.textContent=`${this.metrics.performance.convergenceRate.toFixed(0)}%`)}if(e.metadata){this.metrics.performance.tokenUsage+=e.metadata.tokensUsed||0;const t=document.getElementById("token-usage");t&&(t.textContent=this.metrics.performance.tokenUsage)}}handleCollaborationComplete(e){var i,s,n;this.addActivity(`Collaboration completed: ${e.task.type}`,"success"),this.metrics.tasks++;const t=document.getElementById("total-tasks");if(t&&(t.textContent=this.metrics.tasks),(i=e.convergenceMetrics)!=null&&i.finalConsensus){this.metrics.performance.convergenceRate=e.convergenceMetrics.finalConsensus*100;const o=document.getElementById("convergence-rate");o&&(o.textContent=`${this.metrics.performance.convergenceRate.toFixed(0)}%`)}if((s=e.metadata)!=null&&s.tokensUsed){this.metrics.performance.tokenUsage+=e.metadata.tokensUsed;const o=document.getElementById("token-usage");o&&(o.textContent=this.metrics.performance.tokenUsage)}if((n=e.metadata)!=null&&n.totalAgents&&e.sessionId){const o=Date.now()-parseInt(e.sessionId.split("_")[0]);this.metrics.performance.avgResponseTime=o;const a=document.getElementById("avg-response-time");a&&(a.textContent=`${o}ms`)}}updateNetworkTopology(e){if(e.connections){const t=document.getElementById("network-connections");t&&(t.textContent=e.connections)}if(e.stability){const t=document.getElementById("network-stability");t&&(t.textContent=`${(e.stability*100).toFixed(0)}%`)}if(e.throughput){const t=document.getElementById("throughput");t&&(t.textContent=`${e.throughput} req/s`)}if(e.clusteringCoefficient){const t=document.getElementById("clustering-coefficient");t&&(t.textContent=e.clusteringCoefficient.toFixed(2))}e.agents&&this.updateAgentPositions(e.agents),this.addActivity("Network topology updated","info")}updatePerformanceMetrics(e){if(e.cpuUsage){const t=document.getElementById("cpu-usage");t&&(t.textContent=`${e.cpuUsage.toFixed(0)}%`)}if(e.memoryUsagePercent){const t=document.getElementById("memory-usage-percent");t&&(t.textContent=`${e.memoryUsagePercent.toFixed(0)}%`)}if(e.networkLatency){const t=document.getElementById("network-latency");t&&(t.textContent=`${e.networkLatency}ms`)}if(e.processingSpeed){const t=document.getElementById("processing-speed");t&&(t.textContent=`${e.processingSpeed} ops/s`)}if(e.liveResponseTime){const t=document.getElementById("live-response-time");t&&(t.textContent=`${e.liveResponseTime}ms`)}if(e.liveTokenRate){const t=document.getElementById("live-token-rate");t&&(t.textContent=`${e.liveTokenRate}/min`)}if(e.collabEvents){const t=document.getElementById("collab-events");t&&(t.textContent=e.collabEvents)}if(e.agentActivity){const t=document.getElementById("agent-activity");t&&(t.textContent=`${(e.agentActivity*100).toFixed(0)}%`)}this.addActivity("Performance metrics updated","info")}updateCollaborationViewMetrics(e){if(e.discussionRounds){const t=document.getElementById("discussion-rounds");t&&(t.textContent=e.discussionRounds)}if(e.consensusLevel){const t=document.getElementById("consensus-level");t&&(t.textContent=`${(e.consensusLevel*100).toFixed(0)}%`)}if(e.synthesisSpeed){const t=document.getElementById("synthesis-speed");t&&(t.textContent=`${e.synthesisSpeed}ms`)}if(e.collaborationStrength){const t=document.getElementById("collaboration-strength");t&&(t.textContent=e.collaborationStrength.toFixed(1))}if(e.iterationCount){const t=document.getElementById("iteration-count");t&&(t.textContent=`${e.iterationCount}/5`)}if(e.confidenceAlignment){const t=document.getElementById("confidence-alignment");t&&(t.textContent=`${(e.confidenceAlignment*100).toFixed(0)}%`)}if(e.ideaDiversity){const t=document.getElementById("idea-diversity");t&&(t.textContent=e.ideaDiversity.toFixed(1))}if(e.synthesisQuality){const t=document.getElementById("synthesis-quality");t&&(t.textContent=`${(e.synthesisQuality*100).toFixed(0)}%`)}e.liveSessions&&this.updateLiveCollaborationSessions(e.liveSessions),e.collaborationFlow&&this.updateCollaborationFlow(e.collaborationFlow)}updateLiveCollaborationSessions(e){const t=document.getElementById("live-collaboration-sessions");t&&(t.innerHTML=e.map(i=>`
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
        `).join(""))}updateCollaborationFlow(e){const t=document.getElementById("collaboration-flow");t&&(t.innerHTML=e.slice(0,20).map(i=>`
            <div class="activity-item slide-in">
                <div class="activity-icon ${i.type}"></div>
                <div class="activity-content">
                    <div class="activity-message">${i.message}</div>
                    <div class="activity-time">${this.formatTime(new Date(i.timestamp))}</div>
                </div>
            </div>
        `).join(""))}updateAgentPositions(e){const t=document.getElementById("agent-positions-list");t&&(t.innerHTML=e.map(i=>`
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
        `).join(""))}addActivity(e,t="info"){const i={message:e,type:t,timestamp:new Date};this.activityLog.unshift(i),this.activityLog.length>50&&this.activityLog.pop(),this.updateActivityFeed()}updateActivityFeed(){const e=document.getElementById("activity-feed");e&&(e.innerHTML=this.activityLog.slice(0,20).map(t=>`
            <div class="activity-item slide-in">
                <div class="activity-icon ${t.type}"></div>
                <div class="activity-content">
                    <div class="activity-message">${t.message}</div>
                    <div class="activity-time">${this.formatTime(t.timestamp)}</div>
                </div>
            </div>
        `).join(""))}initializeCharts(){document.querySelectorAll(".metric-chart").forEach(t=>{t.innerHTML='<div style="width: 100%; height: 100%; background: linear-gradient(90deg, transparent 0%, rgba(16, 185, 129, 0.3) 50%, transparent 100%); border-radius: 4px;"></div>'})}startMetricsUpdate(){setInterval(()=>{this.requestSystemStatus()},5e3),setInterval(()=>{this.updateTimeBasedMetrics()},1e3)}updateTimeBasedMetrics(){if(this.metrics.system.uptime>0){this.metrics.system.uptime+=1;const e=this.formatUptime(this.metrics.system.uptime),t=document.getElementById("uptime-value");t&&(t.textContent=e)}}formatUptime(e){const t=Math.floor(e/3600),i=Math.floor(e%3600/60),s=Math.floor(e%60);return t>0?`${t}h ${i}m ${s}s`:i>0?`${i}m ${s}s`:`${s}s`}formatTime(e){return e.toLocaleTimeString()}updateDisplay(){this.updateStatusCards(),this.updateAgentMetricsDisplay(),this.updateResourceMeters(),this.updateActivityFeed()}simulateRealtimeUpdates(){setInterval(()=>{this.updateNetworkTopology({connections:Math.floor(Math.random()*20)+5,stability:.85+Math.random()*.15,throughput:Math.floor(Math.random()*100)+20,clusteringCoefficient:Math.random()*.8+.2,agents:this.generateMockAgentPositions()})},3e3),setInterval(()=>{this.updatePerformanceMetrics({cpuUsage:Math.random()*40+10,memoryUsagePercent:Math.random()*60+20,networkLatency:Math.floor(Math.random()*50)+10,processingSpeed:Math.floor(Math.random()*200)+50,liveResponseTime:Math.floor(Math.random()*1e3)+200,liveTokenRate:Math.floor(Math.random()*50)+10,collabEvents:Math.floor(Math.random()*10),agentActivity:Math.random()*.8+.2})},2e3),setInterval(()=>{this.updateCollaborationViewMetrics({discussionRounds:Math.floor(Math.random()*5)+1,consensusLevel:Math.random()*.8+.2,synthesisSpeed:Math.floor(Math.random()*500)+100,collaborationStrength:Math.random()*4+1,iterationCount:Math.floor(Math.random()*5)+1,confidenceAlignment:Math.random()*.8+.2,ideaDiversity:Math.random()*3+1,synthesisQuality:Math.random()*.8+.2,liveSessions:this.generateMockCollaborationSessions(),collaborationFlow:this.generateMockCollaborationFlow()})},4e3)}generateMockAgentPositions(){const e=["Dr. Analyzer","Prof. Reasoner","Ms. Synthesizer","Dr. Validator","Mx. Innovator"],t=["analyzer","reasoner","synthesizer","validator","innovator"];return e.map((i,s)=>({name:i,type:t[s],position:{x:(Math.random()-.5)*1e3,y:(Math.random()-.5)*1e3,z:(Math.random()-.5)*500},connections:Math.floor(Math.random()*8)+2}))}generateMockCollaborationSessions(){const e=Math.floor(Math.random()*3)+1,t=[];for(let i=0;i<e;i++)t.push({id:`session_${Date.now()}_${i}`,status:["active","converging","synthesizing"][Math.floor(Math.random()*3)],participants:Math.floor(Math.random()*4)+2,progress:Math.floor(Math.random()*80)+20,duration:Math.floor(Math.random()*120)+30,consensus:Math.random()*.6+.4,currentPhase:["Individual Analysis","Discussion Round 2","Synthesis Phase"][Math.floor(Math.random()*3)]});return t}generateMockCollaborationFlow(){const e=["success","info","warning"],t=["Agent collaboration initiated","Consensus level increased to 85%","New insight generated by Synthesizer","Validation phase completed","Discussion round 3 started","Token usage optimized","Network topology updated","Agent energy levels restored"],i=[],s=Math.floor(Math.random()*5)+3;for(let n=0;n<s;n++)i.push({type:e[Math.floor(Math.random()*e.length)],message:t[Math.floor(Math.random()*t.length)],timestamp:Date.now()-Math.random()*3e5});return i.sort((n,o)=>o.timestamp-n.timestamp)}}document.addEventListener("DOMContentLoaded",()=>{window.metricsDashboard=new M});
