'use strict';
const { createLocalTools } = require('./tools/local');
const { createBrowserTools } = require('./tools/browser');
const { createScheduler } = require('./tools/scheduler');
const { createHermesStyleTools } = require('./tools/hermes');

function createAgentTools({ registry, memory, ctx }) {
  const fallback = {
    status:'Read Miss Aria bot status.', listGroups:'List groups controllable by the requester.', groupInfo:'Read information about a group.', groupAdmins:'List group administrators.', lockGroup:'Lock or unlock a group.', antiLink:'Enable or disable anti-link protection.', setAdminRole:'Promote or demote a group member.', updateGroupTitle:'Change a group title.', updateGroupDescription:'Change a group description.', pinMessage:'Pin a message.', unpinMessage:'Unpin a message.', emergencyLockdown:'Lock down controllable groups.', sendMessage:'Send a Telegram message.', moderate:'Moderate a group member.', warn:'Warn a group member.',
    workspaceList:'List files in Aria’s safe workspace.', workspaceRead:'Read a file in Aria’s safe workspace.', workspaceWrite:'Write a file in Aria’s safe workspace.', workspaceDelete:'Delete a file in Aria’s safe workspace.', runCommand:'Run an allow-listed development command in the safe workspace.',
    webSearch:'Search the public web.', webFetch:'Fetch and extract a webpage.', webExtract:'Extract readable webpage content.', browserNavigate:'Navigate/read a webpage through the safe browser adapter.',
    imageGenerate:'Generate an image through the configured image provider.', visionAnalyze:'Analyze an image when a vision provider is configured.', videoAnalyze:'Analyze video when a provider is configured.', videoGenerate:'Generate video when a provider is configured.', textToSpeech:'Generate speech when a TTS provider is configured.',
    createCheckpoint:'Create a project checkpoint before risky file changes.', sessionSearch:'Search this user’s recent agent sessions.', rememberSession:'Store an agent session event.', delegateTask:'Split a complex task into isolated sub-work units.',
    createTodo:'Create or replace an agent todo list.', listTodos:'Read the current agent todo list.', systemInfo:'Inspect safe runtime information.',
    gitStatus:'Inspect Git working-tree status.', gitDiff:'Inspect Git diff statistics.', gitLog:'Inspect recent Git commits.', mcpDiscover:'Inspect MCP integration readiness.',
    scheduleReminder:'Create a persistent Telegram reminder.', listReminders:'List Telegram reminders.', cancelReminder:'Cancel a Telegram reminder.',
    computerUse:'Control a desktop through an explicitly configured computer-use driver.', homeAssistant:'Control Home Assistant when connected.', xSearch:'Search X when an xAI/X provider is configured.'
  };
  const registryList = typeof registry?.list === 'function' ? registry.list() : [];
  const byName = new Map(registryList.map(t => [t.name, t]));
  const local = {...createLocalTools(ctx), ...createBrowserTools(), ...createScheduler(ctx), ...createHermesStyleTools(ctx)};
  const descriptions={...fallback};
  for(const [n,m] of byName) descriptions[n]=m.description||n;
  const risks={workspaceWrite:'MEDIUM',workspaceDelete:'HIGH',runCommand:'HIGH',scheduleReminder:'LOW',cancelReminder:'MEDIUM',webFetch:'LOW',webSearch:'LOW',webExtract:'LOW',browserNavigate:'LOW',sendMessage:'MEDIUM',moderate:'HIGH',setAdminRole:'HIGH',lockGroup:'HIGH',emergencyLockdown:'CRITICAL',createCheckpoint:'MEDIUM',imageGenerate:'LOW',visionAnalyze:'LOW',videoAnalyze:'LOW',videoGenerate:'MEDIUM',textToSpeech:'LOW',delegateTask:'MEDIUM',computerUse:'CRITICAL',homeAssistant:'HIGH',mcpDiscover:'LOW',gitStatus:'LOW',gitDiff:'LOW',gitLog:'LOW',createTodo:'LOW',listTodos:'LOW',systemInfo:'LOW'};
  return {
    list:()=>Object.entries(descriptions).map(([name,description])=>{const meta=byName.get(name)||{};const risk=String(meta.risk||risks[name]||( /delete|ban|demote|promote|lock|restart|leave|revoke|remove|update/i.test(name)?'HIGH':'LOW')).toUpperCase();return {name,description,risk,highImpact:['HIGH','CRITICAL'].includes(risk)};}),
    async execute(name,args,userId){
      if(local[name]) {
        if(['workspaceWrite','workspaceDelete','runCommand'].includes(name) && !ctx.agentPolicy?.allowLocalTools) return {success:false,error:{code:'LOCAL_TOOLS_DISABLED',message:'Local agent tools are disabled.'}};
        if(['computerUse','homeAssistant','xSearch','textToSpeech','videoAnalyze','videoGenerate'].includes(name) && !ctx.agentPolicy?.allowAdvancedIntegrations) return {success:false,error:{code:'ADVANCED_INTEGRATION_DISABLED',message:'This integration is disabled until explicitly configured.'}};
        return local[name]({...args,userId});
      }
      if(!registry||typeof registry.execute!=='function') return {success:false,error:{code:'TOOL_REGISTRY_UNAVAILABLE',message:'Tool registry unavailable.'}};
      return registry.execute(name,{...(args||{}),userId:String(userId)});
    }, memory
  };
}
module.exports={createAgentTools};
