"use strict";var Xs=Object.create;var V=Object.defineProperty;var Bs=Object.getOwnPropertyDescriptor;var js=Object.getOwnPropertyNames;var Ws=Object.getPrototypeOf,Vs=Object.prototype.hasOwnProperty;var qs=(r,e)=>{for(var s in e)V(r,s,{get:e[s],enumerable:!0})},Ne=(r,e,s,t)=>{if(e&&typeof e=="object"||typeof e=="function")for(let n of js(e))!Vs.call(r,n)&&n!==s&&V(r,n,{get:()=>e[n],enumerable:!(t=Bs(e,n))||t.enumerable});return r};var $=(r,e,s)=>(s=r!=null?Xs(Ws(r)):{},Ne(e||!r||!r.__esModule?V(s,"default",{value:r,enumerable:!0}):s,r)),Ks=r=>Ne(V({},"__esModule",{value:!0}),r);var Lt={};qs(Lt,{generateContext:()=>Gs,generateContextWithStats:()=>fe});module.exports=Ks(Lt);var Fs=$(require("path"),1),$s=require("os"),Hs=require("fs");var me=require("bun:sqlite");var f=require("path"),oe=require("os"),k=require("fs"),be=require("url");var T=require("fs"),Re=require("crypto"),v=require("path");var Ys=null;function Js(r){return(Ys??process.stderr.write.bind(process.stderr))(r)}function x(r){Js(r)}var Qs=process.platform==="win32";function zs(r){return r.replace(/^\uFEFF/,"")}function U(r){return JSON.parse(zs(r))}function Zs(r){(0,T.existsSync)(r)||(0,T.mkdirSync)(r,{recursive:!0})}function ne(r,e){let s=r;try{if((0,T.lstatSync)(r).isSymbolicLink())try{s=(0,T.realpathSync)(r)}catch(E){let u=E instanceof Error?E:new Error(String(E));x(`opencode-mem: realpathSync failed for ${r}, resolving symlink manually: ${u.message}
`);let p=(0,T.readlinkSync)(r);s=(0,v.resolve)((0,v.dirname)(r),p)}}catch(E){let u=E.code;if(u!=="ENOENT"&&u!=="ENOTDIR")throw E}Zs((0,v.dirname)(s));let t=(0,v.dirname)(s),n=(0,v.basename)(s),o=(0,v.join)(t,`.${n}.${process.pid}.${(0,Re.randomBytes)(6).toString("hex")}.tmp`),i=Buffer.from(JSON.stringify(e,null,2)+`
`,"utf-8"),a;try{a=(0,T.statSync)(s).mode&511}catch{}let d;try{d=a!==void 0?(0,T.openSync)(o,"w",a):(0,T.openSync)(o,"w");let E=0;for(;E<i.length;){let u=(0,T.writeSync)(d,i,E,i.length-E);if(u===0)throw new Error(`writeSync stalled at ${E}/${i.length} bytes`);E+=u}if((0,T.fsyncSync)(d),(0,T.closeSync)(d),d=void 0,(0,T.renameSync)(o,s),!Qs){let u;try{u=(0,T.openSync)(t,"r"),(0,T.fsyncSync)(u)}catch(p){let c=p instanceof Error?p:new Error(String(p));x(`opencode-mem: directory fsync failed for ${t}: ${c.message}
`)}finally{if(u!==void 0)try{(0,T.closeSync)(u)}catch{}}}}catch(E){if(d!==void 0)try{(0,T.closeSync)(d)}catch{}try{(0,T.unlinkSync)(o)}catch{}throw E}}var ot={};function et(){return typeof __dirname<"u"?__dirname:(0,f.dirname)((0,be.fileURLToPath)(ot.url))}var st=et();function tt(){if(process.env.OPENCODE_MEM_DATA_DIR)return process.env.OPENCODE_MEM_DATA_DIR;let r=(0,f.join)((0,oe.homedir)(),".opencode-mem"),e=(0,f.join)(r,"settings.json");try{if((0,k.existsSync)(e)){let s=U((0,k.readFileSync)(e,"utf-8")),t=s.env??s;if(t.OPENCODE_MEM_DATA_DIR)return t.OPENCODE_MEM_DATA_DIR}}catch{}return r}var C=tt(),ie=process.env.CLAUDE_CONFIG_DIR||(0,f.join)((0,oe.homedir)(),".claude"),wt=(0,f.join)(ie,"plugins","marketplaces","thedotmack"),rt=(0,f.join)(C,"logs"),Ft=(0,f.join)(C,"settings.json"),he=(0,f.join)(C,"opencode-mem.db"),nt=(0,f.join)(C,"observer-sessions"),ae=(0,f.basename)(nt);function Ie(r){(0,k.mkdirSync)(r,{recursive:!0})}function Ce(){return(0,f.join)(st,"..")}var H={dataDir:()=>C,workerPid:()=>(0,f.join)(C,"worker.pid"),serverPid:()=>(0,f.join)(C,".server-beta.pid"),serverPort:()=>(0,f.join)(C,".server-beta.port"),serverRuntime:()=>(0,f.join)(C,".server-beta.runtime.json"),settings:()=>(0,f.join)(C,"settings.json"),database:()=>(0,f.join)(C,"opencode-mem.db"),chroma:()=>(0,f.join)(C,"chroma"),combinedCerts:()=>(0,f.join)(C,"combined_certs.pem"),transcriptsConfig:()=>(0,f.join)(C,"transcript-watch.json"),transcriptsState:()=>(0,f.join)(C,"transcript-watch-state.json"),corpora:()=>(0,f.join)(C,"corpora"),supervisorRegistry:()=>(0,f.join)(C,"supervisor.json"),envFile:()=>(0,f.join)(C,".env"),logsDir:()=>rt};var y=require("fs"),Ae=require("path");var Ee=(o=>(o[o.DEBUG=0]="DEBUG",o[o.INFO=1]="INFO",o[o.WARN=2]="WARN",o[o.ERROR=3]="ERROR",o[o.SILENT=4]="SILENT",o))(Ee||{}),de=null,_e=class{level=null;useColor;logFilePath=null;logFileInitialized=!1;constructor(){this.useColor=process.stdout.isTTY??!1}ensureLogFileInitialized(){if(!this.logFileInitialized){this.logFileInitialized=!0;try{let e=H.logsDir();(0,y.existsSync)(e)||(0,y.mkdirSync)(e,{recursive:!0});let s=new Date().toISOString().split("T")[0];this.logFilePath=(0,Ae.join)(e,`opencode-mem-${s}.log`)}catch(e){console.error("[LOGGER] Failed to initialize log file:",e instanceof Error?e.message:String(e)),this.logFilePath=null}}}getLevel(){if(this.level===null)try{let e=H.settings();if((0,y.existsSync)(e)){let s=(0,y.readFileSync)(e,"utf-8"),n=(U(s).OPENCODE_MEM_LOG_LEVEL||"INFO").toUpperCase();this.level=Ee[n]??1}else this.level=1}catch(e){console.error("[LOGGER] Failed to load log level from settings:",e instanceof Error?e.message:String(e)),this.level=1}return this.level}formatData(e){if(e==null)return"";if(typeof e=="string")return e;if(typeof e=="number"||typeof e=="boolean")return e.toString();if(typeof e=="object"){if(e instanceof Error)return this.getLevel()===0?`${e.message}
${e.stack}`:e.message;if(Array.isArray(e))return`[${e.length} items]`;let s=Object.keys(e);return s.length===0?"{}":s.length<=3?JSON.stringify(e):`{${s.length} keys: ${s.slice(0,3).join(", ")}...}`}return String(e)}formatTool(e,s){if(!s)return e;let t=s;if(typeof s=="string")try{t=JSON.parse(s)}catch{t=s}if(e==="Bash"&&t.command)return`${e}(${t.command})`;if(t.file_path)return`${e}(${t.file_path})`;if(t.notebook_path)return`${e}(${t.notebook_path})`;if(e==="Glob"&&t.pattern)return`${e}(${t.pattern})`;if(e==="Grep"&&t.pattern)return`${e}(${t.pattern})`;if(t.url)return`${e}(${t.url})`;if(t.query)return`${e}(${t.query})`;if(e==="Task"){if(t.subagent_type)return`${e}(${t.subagent_type})`;if(t.description)return`${e}(${t.description})`}return e==="Skill"&&t.skill?`${e}(${t.skill})`:e==="LSP"&&t.operation?`${e}(${t.operation})`:e}formatTimestamp(e){let s=e.getFullYear(),t=String(e.getMonth()+1).padStart(2,"0"),n=String(e.getDate()).padStart(2,"0"),o=String(e.getHours()).padStart(2,"0"),i=String(e.getMinutes()).padStart(2,"0"),a=String(e.getSeconds()).padStart(2,"0"),d=String(e.getMilliseconds()).padStart(3,"0");return`${s}-${t}-${n} ${o}:${i}:${a}.${d}`}log(e,s,t,n,o){if(e<this.getLevel())return;this.ensureLogFileInitialized();let i=this.formatTimestamp(new Date),a=Ee[e].padEnd(5),d=s.padEnd(6),E="";n?.correlationId?E=`[${n.correlationId}] `:n?.sessionId&&(E=`[session-${n.sessionId}] `);let u="";if(o!=null)if(o instanceof Error)u=this.getLevel()===0?`
${o.message}
${o.stack}`:` ${o.message}`;else if(this.getLevel()===0&&typeof o=="object")try{u=`
`+JSON.stringify(o,null,2)}catch{u=" "+this.formatData(o)}else u=" "+this.formatData(o);let p="";if(n){let{sessionId:O,memorySessionId:h,correlationId:b,...g}=n;Object.keys(g).length>0&&(p=` {${Object.entries(g).map(([D,P])=>`${D}=${P}`).join(", ")}}`)}let c=`[${i}] [${a}] [${d}] ${E}${t}${p}${u}`;if(this.logFilePath)try{(0,y.appendFileSync)(this.logFilePath,c+`
`,"utf8")}catch(O){let h=O instanceof Error?O:new Error(String(O));x(`[LOGGER] Failed to write to log file: ${h.message}
${h.stack??""}
`)}else x(c+`
`)}debug(e,s,t,n){this.log(0,e,s,t,n)}info(e,s,t,n){this.log(1,e,s,t,n)}warn(e,s,t,n){this.log(2,e,s,t,n)}setErrorSink(e){de=e}error(e,s,t,n){this.log(3,e,s,t,n),this.routeErrorToSink(s,t,n)}routeErrorToSink(e,s,t){try{if(!de||!(t instanceof Error))return;de(t)}catch{}}dataIn(e,s,t,n){this.info(e,`\u2192 ${s}`,t,n)}dataOut(e,s,t,n){this.info(e,`\u2190 ${s}`,t,n)}success(e,s,t,n){this.info(e,`\u2713 ${s}`,t,n)}failure(e,s,t,n){this.error(e,`\u2717 ${s}`,t,n)}},_=new _e;var De=require("crypto");function Me(r,e,s){return(0,De.createHash)("sha256").update([r||"",e||"",s||""].join("\0")).digest("hex").slice(0,16)}var l="opencode";function it(r){return r.trim().toLowerCase().replace(/\s+/g,"-")}function A(r){if(!r)return l;let e=it(r);return e?e==="transcript"?"codex":e.includes("opencode")?"opencode":e.includes("codex")?"codex":e.includes("cursor")?"cursor":e.includes("claude")?"claude":e:l}function Le(r){let e=["opencode","claude","codex","cursor"];return[...r].sort((s,t)=>{let n=e.indexOf(s),o=e.indexOf(t);return n!==-1||o!==-1?n===-1?1:o===-1?-1:n-o:s.localeCompare(t)})}function ve(r,e,s,t,n){let o=Date.now()-t,i=n!==void 0?"up.session_db_id = ?":"up.content_session_id = ?",a=n??e;return r.prepare(`
    SELECT
      up.*,
      s.memory_session_id,
      s.project,
      COALESCE(s.platform_source, '${l}') as platform_source
    FROM user_prompts up
    JOIN sdk_sessions s ON up.session_db_id = s.id
    WHERE ${i}
      AND up.prompt_text = ?
      AND up.created_at_epoch >= ?
    ORDER BY up.created_at_epoch DESC
    LIMIT 1
  `).get(a,s,o)??void 0}var xe=["private","opencode-mem-context","system_instruction","system-instruction","persisted-output","system-reminder"],ye=new RegExp(`<(${xe.join("|")})\\b[^>]*>[\\s\\S]*?</\\1>`,"g"),Ue=/<system-reminder>[\s\S]*?<\/system-reminder>/g,Pe=100;function at(r){let e=Object.fromEntries(xe.map(n=>[n,0]));ye.lastIndex=0;let s=0,t=r.replace(ye,(n,o)=>(e[o]=(e[o]??0)+1,s+=1,""));return s>Pe&&_.warn("SYSTEM","tag count exceeds limit",void 0,{tagCount:s,maxAllowed:Pe,contentLength:r.length}),{stripped:t.trim(),counts:e}}function ke(r){return at(r).stripped}var dt=["task-notification"],Yt=new RegExp(`^\\s*<(${dt.join("|")})\\b[^>]*>(?:(?!<\\1\\b|</\\1\\b)[\\s\\S])*</\\1>\\s*$`),Jt=256*1024;var ue=4e3;function q(r){let e=r.trim(),t=ke(r).trim()||e;return t.length<=ue?t:(_.debug("DB","Truncated stored prompt text to the configured cap",{originalLength:t.length,storedLength:ue}),`${t.slice(0,ue-1)}\u2026`)}var Et=require("bun:sqlite");var _t=5e3,ut=4194304;function mt(r){return r.prepare(`
    SELECT name
    FROM sqlite_master
    WHERE type = 'table'
      AND name NOT LIKE 'sqlite_%'
    LIMIT 1
  `).get()!=null}function w(r,e,s){try{r.run(e)}catch(t){let n=t instanceof Error?t:new Error(String(t));throw _.warn("DB",`Failed to apply SQLite pragma ${s}`,{sql:e},n),t}}function we(r,e={}){let{enableWal:s=!0,enableIncrementalAutoVacuum:t=!0}=e;w(r,`PRAGMA busy_timeout = ${_t}`,"busy_timeout"),w(r,"PRAGMA foreign_keys = ON","foreign_keys"),w(r,"PRAGMA synchronous = NORMAL","synchronous"),w(r,`PRAGMA journal_size_limit = ${ut}`,"journal_size_limit"),t&&!mt(r)&&w(r,"PRAGMA auto_vacuum = INCREMENTAL","auto_vacuum"),s&&w(r,"PRAGMA journal_mode = WAL","journal_mode")}var K=class{db;constructor(e=he){e instanceof me.Database?this.db=e:(e!==":memory:"&&Ie(C),this.db=new me.Database(e)),we(this.db),this.initializeSchema(),this.ensureWorkerPortColumn(),this.ensurePromptTrackingColumns(),this.removeSessionSummariesUniqueConstraint(),this.addObservationHierarchicalFields(),this.makeObservationsTextNullable(),this.createUserPromptsTable(),this.ensureDiscoveryTokensColumn(),this.createPendingMessagesTable(),this.renameSessionIdColumns(),this.addFailedAtEpochColumn(),this.addOnUpdateCascadeToForeignKeys(),this.addObservationContentHashColumn(),this.addSessionCustomTitleColumn(),this.addSessionPlatformSourceColumn(),this.addObservationModelColumns(),this.ensureMergedIntoProjectColumns(),this.addObservationSubagentColumns(),this.addObservationsUniqueContentHashIndex(),this.addObservationsMetadataColumn(),this.dropDeadPendingMessagesColumns(),this.ensurePendingMessagesToolUseIdColumn(),this.dropWorkerPidColumn(),this.ensureSDKSessionsPlatformContentIdentity(),this.ensureUserPromptsSessionDbId(),this.ensurePendingMessagesSessionToolUniqueIndex()}getIndexColumns(e){return this.db.query(`PRAGMA index_info(${JSON.stringify(e)})`).all().map(s=>s.name)}hasUniqueIndexOnColumns(e,s){return this.db.query(`PRAGMA index_list(${e})`).all().some(n=>{if(n.unique!==1)return!1;let o=this.getIndexColumns(n.name);return o.length===s.length&&o.every((i,a)=>i===s[a])})}resolvePromptSessionDbId(e,s,t){if(s!==void 0)return s;let n=t?A(t):void 0;return n?this.db.prepare(`
        SELECT id
        FROM sdk_sessions
        WHERE COALESCE(NULLIF(platform_source, ''), ?) = ?
          AND content_session_id = ?
        LIMIT 1
      `).get(l,n,e)?.id??null:this.db.prepare(`
      SELECT id
      FROM sdk_sessions
      WHERE content_session_id = ?
      ORDER BY CASE COALESCE(NULLIF(platform_source, ''), '${l}')
        WHEN '${l}' THEN 0
        ELSE 1
      END, id
      LIMIT 1
    `).get(e)?.id??null}dropWorkerPidColumn(){let e=this.db.prepare("SELECT version FROM schema_versions WHERE version = ?").get(32),t=this.db.query("PRAGMA table_info(pending_messages)").all().some(n=>n.name==="worker_pid");if(!(e&&!t)){if(t)try{this.db.run("DROP INDEX IF EXISTS idx_pending_messages_worker_pid"),this.db.run("ALTER TABLE pending_messages DROP COLUMN worker_pid"),_.debug("DB","Dropped worker_pid column and its index from pending_messages")}catch(n){_.warn("DB","Failed to drop worker_pid column from pending_messages",{},n instanceof Error?n:new Error(String(n)));return}e||this.db.prepare("INSERT OR IGNORE INTO schema_versions (version, applied_at) VALUES (?, ?)").run(32,new Date().toISOString())}}ensureSDKSessionsPlatformContentIdentity(){let e=this.db.prepare("SELECT version FROM schema_versions WHERE version = ?").get(33),s=this.hasUniqueIndexOnColumns("sdk_sessions",["content_session_id"]),t=this.hasUniqueIndexOnColumns("sdk_sessions",["platform_source","content_session_id"]),o=this.db.query("PRAGMA table_info(sdk_sessions)").all().some(i=>i.name==="platform_source");if(!(e&&!s&&t&&o)){if(o||this.db.run(`ALTER TABLE sdk_sessions ADD COLUMN platform_source TEXT NOT NULL DEFAULT '${l}'`),this.db.run(`
      UPDATE sdk_sessions
      SET platform_source = '${l}'
      WHERE platform_source IS NULL OR platform_source = ''
    `),s){this.db.run("PRAGMA foreign_keys = OFF"),this.db.run("BEGIN TRANSACTION");try{this.rebuildSdkSessionsWithCompositeIdentity(e),this.db.run("COMMIT")}catch(i){this.db.run("ROLLBACK");let a=i instanceof Error?i:new Error(String(i));throw _.error("DB","Failed to rebuild sdk_sessions with composite identity, rolled back",{},a),i}finally{this.db.run("PRAGMA foreign_keys = ON")}return}this.db.run("CREATE UNIQUE INDEX IF NOT EXISTS ux_sdk_sessions_platform_content ON sdk_sessions(platform_source, content_session_id)"),this.db.run("CREATE INDEX IF NOT EXISTS idx_sdk_sessions_platform_source ON sdk_sessions(platform_source)"),e||this.db.prepare("INSERT OR IGNORE INTO schema_versions (version, applied_at) VALUES (?, ?)").run(33,new Date().toISOString())}}rebuildSdkSessionsWithCompositeIdentity(e){this.db.run("DROP TABLE IF EXISTS sdk_sessions_new"),this.db.run(`
      CREATE TABLE sdk_sessions_new (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        content_session_id TEXT NOT NULL,
        memory_session_id TEXT UNIQUE,
        project TEXT NOT NULL,
        platform_source TEXT NOT NULL DEFAULT '${l}',
        user_prompt TEXT,
        started_at TEXT NOT NULL,
        started_at_epoch INTEGER NOT NULL,
        completed_at TEXT,
        completed_at_epoch INTEGER,
        status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'completed', 'failed')),
        worker_port INTEGER,
        prompt_counter INTEGER DEFAULT 0,
        custom_title TEXT
      )
    `),this.db.run(`
      INSERT INTO sdk_sessions_new (
        id, content_session_id, memory_session_id, project, platform_source,
        user_prompt, started_at, started_at_epoch, completed_at, completed_at_epoch,
        status, worker_port, prompt_counter, custom_title
      )
      SELECT
        id, content_session_id, memory_session_id, project,
        COALESCE(NULLIF(platform_source, ''), '${l}'),
        user_prompt, started_at, started_at_epoch, completed_at, completed_at_epoch,
        status, worker_port, prompt_counter, custom_title
      FROM sdk_sessions
    `),this.db.run("DROP TABLE sdk_sessions"),this.db.run("ALTER TABLE sdk_sessions_new RENAME TO sdk_sessions"),this.db.run("CREATE INDEX IF NOT EXISTS idx_sdk_sessions_claude_id ON sdk_sessions(content_session_id)"),this.db.run("CREATE INDEX IF NOT EXISTS idx_sdk_sessions_sdk_id ON sdk_sessions(memory_session_id)"),this.db.run("CREATE INDEX IF NOT EXISTS idx_sdk_sessions_project ON sdk_sessions(project)"),this.db.run("CREATE INDEX IF NOT EXISTS idx_sdk_sessions_status ON sdk_sessions(status)"),this.db.run("CREATE INDEX IF NOT EXISTS idx_sdk_sessions_started ON sdk_sessions(started_at_epoch DESC)"),this.db.run("CREATE INDEX IF NOT EXISTS idx_sdk_sessions_platform_source ON sdk_sessions(platform_source)"),this.db.run("CREATE UNIQUE INDEX IF NOT EXISTS ux_sdk_sessions_platform_content ON sdk_sessions(platform_source, content_session_id)"),e||this.db.prepare("INSERT OR IGNORE INTO schema_versions (version, applied_at) VALUES (?, ?)").run(33,new Date().toISOString())}ensureUserPromptsSessionDbId(){let e=this.db.prepare("SELECT version FROM schema_versions WHERE version = ?").get(34);if(this.db.query("SELECT name FROM sqlite_master WHERE type='table' AND name='user_prompts'").all().length===0){this.db.prepare("INSERT OR IGNORE INTO schema_versions (version, applied_at) VALUES (?, ?)").run(34,new Date().toISOString());return}let n=this.db.query("PRAGMA table_info(user_prompts)").all().some(E=>E.name==="session_db_id"),i=this.db.query("PRAGMA foreign_key_list(user_prompts)").all().some(E=>E.table==="sdk_sessions"&&E.from==="content_session_id");if(e&&n&&!i)return;let a=this.db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='user_prompts_fts'").all().length>0,d=n?`COALESCE(up.session_db_id, (
          SELECT s.id FROM sdk_sessions s
          WHERE s.content_session_id = up.content_session_id
          ORDER BY CASE COALESCE(NULLIF(s.platform_source, ''), '${l}')
            WHEN '${l}' THEN 0
            ELSE 1
          END, s.id
          LIMIT 1
        ))`:`(
          SELECT s.id FROM sdk_sessions s
          WHERE s.content_session_id = up.content_session_id
          ORDER BY CASE COALESCE(NULLIF(s.platform_source, ''), '${l}')
            WHEN '${l}' THEN 0
            ELSE 1
          END, s.id
          LIMIT 1
        )`;this.db.run("PRAGMA foreign_keys = OFF"),this.db.run("BEGIN TRANSACTION");try{this.rebuildUserPromptsWithSessionDbId(e,d,a),this.db.run("COMMIT")}catch(E){this.db.run("ROLLBACK");let u=E instanceof Error?E:new Error(String(E));throw _.error("DB","Failed to rebuild user_prompts with session_db_id, rolled back",{},u),E}finally{this.db.run("PRAGMA foreign_keys = ON")}}rebuildUserPromptsWithSessionDbId(e,s,t){this.db.run("DROP TRIGGER IF EXISTS user_prompts_ai"),this.db.run("DROP TRIGGER IF EXISTS user_prompts_ad"),this.db.run("DROP TRIGGER IF EXISTS user_prompts_au"),this.db.run("DROP TABLE IF EXISTS user_prompts_new"),this.db.run(`
      CREATE TABLE user_prompts_new (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        session_db_id INTEGER,
        content_session_id TEXT NOT NULL,
        prompt_number INTEGER NOT NULL,
        prompt_text TEXT NOT NULL,
        created_at TEXT NOT NULL,
        created_at_epoch INTEGER NOT NULL,
        FOREIGN KEY(session_db_id) REFERENCES sdk_sessions(id) ON DELETE CASCADE
      )
    `),this.db.run(`
      INSERT INTO user_prompts_new (
        id, session_db_id, content_session_id, prompt_number,
        prompt_text, created_at, created_at_epoch
      )
      SELECT
        up.id,
        ${s},
        up.content_session_id,
        up.prompt_number,
        up.prompt_text,
        up.created_at,
        up.created_at_epoch
      FROM user_prompts up
    `),this.db.run("DROP TABLE user_prompts"),this.db.run("ALTER TABLE user_prompts_new RENAME TO user_prompts"),this.db.run("CREATE INDEX IF NOT EXISTS idx_user_prompts_session ON user_prompts(session_db_id)"),this.db.run("CREATE INDEX IF NOT EXISTS idx_user_prompts_claude_session ON user_prompts(content_session_id)"),this.db.run("CREATE INDEX IF NOT EXISTS idx_user_prompts_created ON user_prompts(created_at_epoch DESC)"),this.db.run("CREATE INDEX IF NOT EXISTS idx_user_prompts_prompt_number ON user_prompts(prompt_number)"),this.db.run("CREATE INDEX IF NOT EXISTS idx_user_prompts_lookup ON user_prompts(session_db_id, prompt_number)"),this.db.run("CREATE INDEX IF NOT EXISTS idx_user_prompts_content_lookup ON user_prompts(content_session_id, prompt_number)"),t&&(this.db.run(`
        CREATE TRIGGER user_prompts_ai AFTER INSERT ON user_prompts BEGIN
          INSERT INTO user_prompts_fts(rowid, prompt_text)
          VALUES (new.id, new.prompt_text);
        END;

        CREATE TRIGGER user_prompts_ad AFTER DELETE ON user_prompts BEGIN
          INSERT INTO user_prompts_fts(user_prompts_fts, rowid, prompt_text)
          VALUES('delete', old.id, old.prompt_text);
        END;

        CREATE TRIGGER user_prompts_au AFTER UPDATE ON user_prompts BEGIN
          INSERT INTO user_prompts_fts(user_prompts_fts, rowid, prompt_text)
          VALUES('delete', old.id, old.prompt_text);
          INSERT INTO user_prompts_fts(rowid, prompt_text)
          VALUES (new.id, new.prompt_text);
        END;
      `),this.db.run("INSERT INTO user_prompts_fts(user_prompts_fts) VALUES('rebuild')")),e||this.db.prepare("INSERT OR IGNORE INTO schema_versions (version, applied_at) VALUES (?, ?)").run(34,new Date().toISOString())}ensurePendingMessagesSessionToolUniqueIndex(){let e=this.db.prepare("SELECT version FROM schema_versions WHERE version = ?").get(35);if(this.db.query("SELECT name FROM sqlite_master WHERE type='table' AND name='pending_messages'").all().length===0){this.db.prepare("INSERT OR IGNORE INTO schema_versions (version, applied_at) VALUES (?, ?)").run(35,new Date().toISOString());return}let t=this.hasUniqueIndexOnColumns("pending_messages",["session_db_id","tool_use_id"]);if(!(e&&t)){this.db.run("BEGIN TRANSACTION");try{this.recreatePendingSessionToolUniqueIndex(e),this.db.run("COMMIT")}catch(n){this.db.run("ROLLBACK");let o=n instanceof Error?n:new Error(String(n));throw _.error("DB","Failed to recreate ux_pending_session_tool index, rolled back",{},o),n}}}recreatePendingSessionToolUniqueIndex(e){this.db.run("DROP INDEX IF EXISTS ux_pending_session_tool"),this.db.run(`
      DELETE FROM pending_messages
       WHERE id IN (
         SELECT id
           FROM (
             SELECT id,
                    ROW_NUMBER() OVER (
                      PARTITION BY session_db_id, tool_use_id
                      ORDER BY CASE status
                        WHEN 'processing' THEN 0
                        WHEN 'pending' THEN 1
                        ELSE 2
                      END, id
                    ) AS duplicate_rank
               FROM pending_messages
              WHERE tool_use_id IS NOT NULL
           )
          WHERE duplicate_rank > 1
         )
    `),this.db.run(`
      CREATE UNIQUE INDEX IF NOT EXISTS ux_pending_session_tool
      ON pending_messages(session_db_id, tool_use_id)
      WHERE tool_use_id IS NOT NULL
    `),e||this.db.prepare("INSERT OR IGNORE INTO schema_versions (version, applied_at) VALUES (?, ?)").run(35,new Date().toISOString())}dropDeadPendingMessagesColumns(){let e=this.db.prepare("SELECT version FROM schema_versions WHERE version = ?").get(31),s=this.db.query("PRAGMA table_info(pending_messages)").all(),t=new Set(s.map(i=>i.name)),o=["retry_count","failed_at_epoch","completed_at_epoch"].filter(i=>t.has(i));if(!(e&&o.length===0)){if(o.length>0){this.db.run("BEGIN TRANSACTION");try{this.db.run("DELETE FROM pending_messages WHERE status NOT IN ('pending', 'processing')");for(let i of o)this.db.run(`ALTER TABLE pending_messages DROP COLUMN ${i}`),_.debug("DB",`Dropped dead column ${i} from pending_messages`);e||this.db.prepare("INSERT OR IGNORE INTO schema_versions (version, applied_at) VALUES (?, ?)").run(31,new Date().toISOString()),this.db.run("COMMIT")}catch(i){this.db.run("ROLLBACK"),_.warn("DB","Failed to drop dead columns from pending_messages",{},i instanceof Error?i:new Error(String(i)));return}return}e||this.db.prepare("INSERT OR IGNORE INTO schema_versions (version, applied_at) VALUES (?, ?)").run(31,new Date().toISOString())}}initializeSchema(){this.db.run(`
      CREATE TABLE IF NOT EXISTS schema_versions (
        id INTEGER PRIMARY KEY,
        version INTEGER UNIQUE NOT NULL,
        applied_at TEXT NOT NULL
      )
    `),this.db.run(`
      CREATE TABLE IF NOT EXISTS sdk_sessions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        content_session_id TEXT NOT NULL,
        memory_session_id TEXT UNIQUE,
        project TEXT NOT NULL,
        platform_source TEXT NOT NULL DEFAULT 'claude',
        user_prompt TEXT,
        started_at TEXT NOT NULL,
        started_at_epoch INTEGER NOT NULL,
        completed_at TEXT,
        completed_at_epoch INTEGER,
        status TEXT CHECK(status IN ('active', 'completed', 'failed')) NOT NULL DEFAULT 'active'
      );

      CREATE INDEX IF NOT EXISTS idx_sdk_sessions_claude_id ON sdk_sessions(content_session_id);
      CREATE INDEX IF NOT EXISTS idx_sdk_sessions_sdk_id ON sdk_sessions(memory_session_id);
      CREATE INDEX IF NOT EXISTS idx_sdk_sessions_project ON sdk_sessions(project);
      CREATE INDEX IF NOT EXISTS idx_sdk_sessions_status ON sdk_sessions(status);
      CREATE INDEX IF NOT EXISTS idx_sdk_sessions_started ON sdk_sessions(started_at_epoch DESC);

      CREATE TABLE IF NOT EXISTS observations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        memory_session_id TEXT NOT NULL,
        project TEXT NOT NULL,
        text TEXT NOT NULL,
        type TEXT NOT NULL,
        created_at TEXT NOT NULL,
        created_at_epoch INTEGER NOT NULL,
        FOREIGN KEY(memory_session_id) REFERENCES sdk_sessions(memory_session_id) ON DELETE CASCADE ON UPDATE CASCADE
      );

      CREATE INDEX IF NOT EXISTS idx_observations_sdk_session ON observations(memory_session_id);
      CREATE INDEX IF NOT EXISTS idx_observations_project ON observations(project);
      CREATE INDEX IF NOT EXISTS idx_observations_type ON observations(type);
      CREATE INDEX IF NOT EXISTS idx_observations_created ON observations(created_at_epoch DESC);

      CREATE TABLE IF NOT EXISTS session_summaries (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        memory_session_id TEXT UNIQUE NOT NULL,
        project TEXT NOT NULL,
        request TEXT,
        investigated TEXT,
        learned TEXT,
        completed TEXT,
        next_steps TEXT,
        files_read TEXT,
        files_edited TEXT,
        notes TEXT,
        created_at TEXT NOT NULL,
        created_at_epoch INTEGER NOT NULL,
        FOREIGN KEY(memory_session_id) REFERENCES sdk_sessions(memory_session_id) ON DELETE CASCADE ON UPDATE CASCADE
      );

      CREATE INDEX IF NOT EXISTS idx_session_summaries_sdk_session ON session_summaries(memory_session_id);
      CREATE INDEX IF NOT EXISTS idx_session_summaries_project ON session_summaries(project);
      CREATE INDEX IF NOT EXISTS idx_session_summaries_created ON session_summaries(created_at_epoch DESC);
    `),this.db.prepare("INSERT OR IGNORE INTO schema_versions (version, applied_at) VALUES (?, ?)").run(4,new Date().toISOString())}ensureWorkerPortColumn(){this.db.query("PRAGMA table_info(sdk_sessions)").all().some(t=>t.name==="worker_port")||(this.db.run("ALTER TABLE sdk_sessions ADD COLUMN worker_port INTEGER"),_.debug("DB","Added worker_port column to sdk_sessions table")),this.db.prepare("INSERT OR IGNORE INTO schema_versions (version, applied_at) VALUES (?, ?)").run(5,new Date().toISOString())}ensurePromptTrackingColumns(){this.db.query("PRAGMA table_info(sdk_sessions)").all().some(a=>a.name==="prompt_counter")||(this.db.run("ALTER TABLE sdk_sessions ADD COLUMN prompt_counter INTEGER DEFAULT 0"),_.debug("DB","Added prompt_counter column to sdk_sessions table")),this.db.query("PRAGMA table_info(observations)").all().some(a=>a.name==="prompt_number")||(this.db.run("ALTER TABLE observations ADD COLUMN prompt_number INTEGER"),_.debug("DB","Added prompt_number column to observations table")),this.db.query("PRAGMA table_info(session_summaries)").all().some(a=>a.name==="prompt_number")||(this.db.run("ALTER TABLE session_summaries ADD COLUMN prompt_number INTEGER"),_.debug("DB","Added prompt_number column to session_summaries table")),this.db.prepare("INSERT OR IGNORE INTO schema_versions (version, applied_at) VALUES (?, ?)").run(6,new Date().toISOString())}removeSessionSummariesUniqueConstraint(){if(!this.db.query("PRAGMA index_list(session_summaries)").all().some(t=>t.unique===1&&t.origin!=="pk")){this.db.prepare("INSERT OR IGNORE INTO schema_versions (version, applied_at) VALUES (?, ?)").run(7,new Date().toISOString());return}_.debug("DB","Removing UNIQUE constraint from session_summaries.memory_session_id"),this.db.run("BEGIN TRANSACTION"),this.db.run("DROP TABLE IF EXISTS session_summaries_new"),this.db.run(`
      CREATE TABLE session_summaries_new (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        memory_session_id TEXT NOT NULL,
        project TEXT NOT NULL,
        request TEXT,
        investigated TEXT,
        learned TEXT,
        completed TEXT,
        next_steps TEXT,
        files_read TEXT,
        files_edited TEXT,
        notes TEXT,
        prompt_number INTEGER,
        created_at TEXT NOT NULL,
        created_at_epoch INTEGER NOT NULL,
        FOREIGN KEY(memory_session_id) REFERENCES sdk_sessions(memory_session_id) ON DELETE CASCADE
      )
    `),this.db.run(`
      INSERT INTO session_summaries_new
      SELECT id, memory_session_id, project, request, investigated, learned,
             completed, next_steps, files_read, files_edited, notes,
             prompt_number, created_at, created_at_epoch
      FROM session_summaries
    `),this.db.run("DROP TABLE session_summaries"),this.db.run("ALTER TABLE session_summaries_new RENAME TO session_summaries"),this.db.run(`
      CREATE INDEX idx_session_summaries_sdk_session ON session_summaries(memory_session_id);
      CREATE INDEX idx_session_summaries_project ON session_summaries(project);
      CREATE INDEX idx_session_summaries_created ON session_summaries(created_at_epoch DESC);
    `),this.db.run("COMMIT"),this.db.prepare("INSERT OR IGNORE INTO schema_versions (version, applied_at) VALUES (?, ?)").run(7,new Date().toISOString()),_.debug("DB","Successfully removed UNIQUE constraint from session_summaries.memory_session_id")}addObservationHierarchicalFields(){if(this.db.prepare("SELECT version FROM schema_versions WHERE version = ?").get(8))return;if(this.db.query("PRAGMA table_info(observations)").all().some(n=>n.name==="title")){this.db.prepare("INSERT OR IGNORE INTO schema_versions (version, applied_at) VALUES (?, ?)").run(8,new Date().toISOString());return}_.debug("DB","Adding hierarchical fields to observations table"),this.db.run(`
      ALTER TABLE observations ADD COLUMN title TEXT;
      ALTER TABLE observations ADD COLUMN subtitle TEXT;
      ALTER TABLE observations ADD COLUMN facts TEXT;
      ALTER TABLE observations ADD COLUMN narrative TEXT;
      ALTER TABLE observations ADD COLUMN concepts TEXT;
      ALTER TABLE observations ADD COLUMN files_read TEXT;
      ALTER TABLE observations ADD COLUMN files_modified TEXT;
    `),this.db.prepare("INSERT OR IGNORE INTO schema_versions (version, applied_at) VALUES (?, ?)").run(8,new Date().toISOString()),_.debug("DB","Successfully added hierarchical fields to observations table")}makeObservationsTextNullable(){if(this.db.prepare("SELECT version FROM schema_versions WHERE version = ?").get(9))return;let t=this.db.query("PRAGMA table_info(observations)").all().find(n=>n.name==="text");if(!t||t.notnull===0){this.db.prepare("INSERT OR IGNORE INTO schema_versions (version, applied_at) VALUES (?, ?)").run(9,new Date().toISOString());return}_.debug("DB","Making observations.text nullable"),this.db.run("BEGIN TRANSACTION"),this.db.run("DROP TABLE IF EXISTS observations_new"),this.db.run(`
      CREATE TABLE observations_new (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        memory_session_id TEXT NOT NULL,
        project TEXT NOT NULL,
        text TEXT,
        type TEXT NOT NULL,
        title TEXT,
        subtitle TEXT,
        facts TEXT,
        narrative TEXT,
        concepts TEXT,
        files_read TEXT,
        files_modified TEXT,
        prompt_number INTEGER,
        created_at TEXT NOT NULL,
        created_at_epoch INTEGER NOT NULL,
        FOREIGN KEY(memory_session_id) REFERENCES sdk_sessions(memory_session_id) ON DELETE CASCADE
      )
    `),this.db.run(`
      INSERT INTO observations_new
      SELECT id, memory_session_id, project, text, type, title, subtitle, facts,
             narrative, concepts, files_read, files_modified, prompt_number,
             created_at, created_at_epoch
      FROM observations
    `),this.db.run("DROP TABLE observations"),this.db.run("ALTER TABLE observations_new RENAME TO observations"),this.db.run(`
      CREATE INDEX idx_observations_sdk_session ON observations(memory_session_id);
      CREATE INDEX idx_observations_project ON observations(project);
      CREATE INDEX idx_observations_type ON observations(type);
      CREATE INDEX idx_observations_created ON observations(created_at_epoch DESC);
    `),this.db.run("COMMIT"),this.db.prepare("INSERT OR IGNORE INTO schema_versions (version, applied_at) VALUES (?, ?)").run(9,new Date().toISOString()),_.debug("DB","Successfully made observations.text nullable")}createUserPromptsTable(){if(this.db.prepare("SELECT version FROM schema_versions WHERE version = ?").get(10))return;if(this.db.query("PRAGMA table_info(user_prompts)").all().length>0){this.db.prepare("INSERT OR IGNORE INTO schema_versions (version, applied_at) VALUES (?, ?)").run(10,new Date().toISOString());return}_.debug("DB","Creating user_prompts table with FTS5 support"),this.db.run("BEGIN TRANSACTION"),this.db.run(`
      CREATE TABLE user_prompts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        session_db_id INTEGER,
        content_session_id TEXT NOT NULL,
        prompt_number INTEGER NOT NULL,
        prompt_text TEXT NOT NULL,
        created_at TEXT NOT NULL,
        created_at_epoch INTEGER NOT NULL,
        FOREIGN KEY(session_db_id) REFERENCES sdk_sessions(id) ON DELETE CASCADE
      );

      CREATE INDEX idx_user_prompts_session ON user_prompts(session_db_id);
      CREATE INDEX idx_user_prompts_claude_session ON user_prompts(content_session_id);
      CREATE INDEX idx_user_prompts_created ON user_prompts(created_at_epoch DESC);
      CREATE INDEX idx_user_prompts_prompt_number ON user_prompts(prompt_number);
      CREATE INDEX idx_user_prompts_lookup ON user_prompts(session_db_id, prompt_number);
      CREATE INDEX idx_user_prompts_content_lookup ON user_prompts(content_session_id, prompt_number);
    `);let t=`
      CREATE VIRTUAL TABLE user_prompts_fts USING fts5(
        prompt_text,
        content='user_prompts',
        content_rowid='id'
      );
    `,n=`
      CREATE TRIGGER user_prompts_ai AFTER INSERT ON user_prompts BEGIN
        INSERT INTO user_prompts_fts(rowid, prompt_text)
        VALUES (new.id, new.prompt_text);
      END;

      CREATE TRIGGER user_prompts_ad AFTER DELETE ON user_prompts BEGIN
        INSERT INTO user_prompts_fts(user_prompts_fts, rowid, prompt_text)
        VALUES('delete', old.id, old.prompt_text);
      END;

      CREATE TRIGGER user_prompts_au AFTER UPDATE ON user_prompts BEGIN
        INSERT INTO user_prompts_fts(user_prompts_fts, rowid, prompt_text)
        VALUES('delete', old.id, old.prompt_text);
        INSERT INTO user_prompts_fts(rowid, prompt_text)
        VALUES (new.id, new.prompt_text);
      END;
    `;try{this.db.run(t),this.db.run(n)}catch(o){o instanceof Error?_.warn("DB","FTS5 not available \u2014 user_prompts_fts skipped (search uses ChromaDB)",{},o):_.warn("DB","FTS5 not available \u2014 user_prompts_fts skipped (search uses ChromaDB)",{},new Error(String(o))),this.db.run("COMMIT"),this.db.prepare("INSERT OR IGNORE INTO schema_versions (version, applied_at) VALUES (?, ?)").run(10,new Date().toISOString()),_.debug("DB","Created user_prompts table (without FTS5)");return}this.db.run("COMMIT"),this.db.prepare("INSERT OR IGNORE INTO schema_versions (version, applied_at) VALUES (?, ?)").run(10,new Date().toISOString()),_.debug("DB","Successfully created user_prompts table")}ensureDiscoveryTokensColumn(){if(this.db.prepare("SELECT version FROM schema_versions WHERE version = ?").get(11))return;this.db.query("PRAGMA table_info(observations)").all().some(i=>i.name==="discovery_tokens")||(this.db.run("ALTER TABLE observations ADD COLUMN discovery_tokens INTEGER DEFAULT 0"),_.debug("DB","Added discovery_tokens column to observations table")),this.db.query("PRAGMA table_info(session_summaries)").all().some(i=>i.name==="discovery_tokens")||(this.db.run("ALTER TABLE session_summaries ADD COLUMN discovery_tokens INTEGER DEFAULT 0"),_.debug("DB","Added discovery_tokens column to session_summaries table")),this.db.prepare("INSERT OR IGNORE INTO schema_versions (version, applied_at) VALUES (?, ?)").run(11,new Date().toISOString())}createPendingMessagesTable(){if(this.db.prepare("SELECT version FROM schema_versions WHERE version = ?").get(16))return;if(this.db.query("SELECT name FROM sqlite_master WHERE type='table' AND name='pending_messages'").all().length>0){this.db.prepare("INSERT OR IGNORE INTO schema_versions (version, applied_at) VALUES (?, ?)").run(16,new Date().toISOString());return}_.debug("DB","Creating pending_messages table"),this.db.run(`
      CREATE TABLE pending_messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        session_db_id INTEGER NOT NULL,
        content_session_id TEXT NOT NULL,
        message_type TEXT NOT NULL CHECK(message_type IN ('observation', 'summarize')),
        tool_name TEXT,
        tool_input TEXT,
        tool_response TEXT,
        cwd TEXT,
        last_user_message TEXT,
        last_assistant_message TEXT,
        prompt_number INTEGER,
        status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'processing')),
        created_at_epoch INTEGER NOT NULL,
        FOREIGN KEY (session_db_id) REFERENCES sdk_sessions(id) ON DELETE CASCADE
      )
    `),this.db.run("CREATE INDEX IF NOT EXISTS idx_pending_messages_session ON pending_messages(session_db_id)"),this.db.run("CREATE INDEX IF NOT EXISTS idx_pending_messages_status ON pending_messages(status)"),this.db.run("CREATE INDEX IF NOT EXISTS idx_pending_messages_claude_session ON pending_messages(content_session_id)"),this.db.prepare("INSERT OR IGNORE INTO schema_versions (version, applied_at) VALUES (?, ?)").run(16,new Date().toISOString()),_.debug("DB","pending_messages table created successfully")}renameSessionIdColumns(){if(this.db.prepare("SELECT version FROM schema_versions WHERE version = ?").get(17))return;_.debug("DB","Checking session ID columns for semantic clarity rename");let s=0,t=(n,o,i)=>{let a=this.db.query(`PRAGMA table_info(${n})`).all(),d=a.some(u=>u.name===o);return a.some(u=>u.name===i)?!1:d?(this.db.run(`ALTER TABLE ${n} RENAME COLUMN ${o} TO ${i}`),_.debug("DB",`Renamed ${n}.${o} to ${i}`),!0):(_.warn("DB",`Column ${o} not found in ${n}, skipping rename`),!1)};t("sdk_sessions","claude_session_id","content_session_id")&&s++,t("sdk_sessions","sdk_session_id","memory_session_id")&&s++,t("pending_messages","claude_session_id","content_session_id")&&s++,t("observations","sdk_session_id","memory_session_id")&&s++,t("session_summaries","sdk_session_id","memory_session_id")&&s++,t("user_prompts","claude_session_id","content_session_id")&&s++,this.db.prepare("INSERT OR IGNORE INTO schema_versions (version, applied_at) VALUES (?, ?)").run(17,new Date().toISOString()),s>0?_.debug("DB",`Successfully renamed ${s} session ID columns`):_.debug("DB","No session ID column renames needed (already up to date)")}addFailedAtEpochColumn(){if(this.db.prepare("SELECT version FROM schema_versions WHERE version = ?").get(20))return;this.db.query("PRAGMA table_info(pending_messages)").all().some(n=>n.name==="failed_at_epoch")||(this.db.run("ALTER TABLE pending_messages ADD COLUMN failed_at_epoch INTEGER"),_.debug("DB","Added failed_at_epoch column to pending_messages table")),this.db.prepare("INSERT OR IGNORE INTO schema_versions (version, applied_at) VALUES (?, ?)").run(20,new Date().toISOString())}addOnUpdateCascadeToForeignKeys(){if(this.db.prepare("SELECT version FROM schema_versions WHERE version = ?").get(21))return;_.debug("DB","Adding ON UPDATE CASCADE to FK constraints on observations and session_summaries"),this.db.run("PRAGMA foreign_keys = OFF"),this.db.run("BEGIN TRANSACTION"),this.db.run("DROP TRIGGER IF EXISTS observations_ai"),this.db.run("DROP TRIGGER IF EXISTS observations_ad"),this.db.run("DROP TRIGGER IF EXISTS observations_au"),this.db.run("DROP TABLE IF EXISTS observations_new");let s=this.db.query("PRAGMA table_info(observations)").all(),t=s.some(S=>S.name==="metadata"),n=s.some(S=>S.name==="content_hash"),o=t?`,
        metadata TEXT`:"",i=t?", metadata":"",a=n?`,
        content_hash TEXT`:"",d=n?", content_hash":"",E=`
      CREATE TABLE observations_new (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        memory_session_id TEXT NOT NULL,
        project TEXT NOT NULL,
        text TEXT,
        type TEXT NOT NULL,
        title TEXT,
        subtitle TEXT,
        facts TEXT,
        narrative TEXT,
        concepts TEXT,
        files_read TEXT,
        files_modified TEXT,
        prompt_number INTEGER,
        discovery_tokens INTEGER DEFAULT 0,
        created_at TEXT NOT NULL,
        created_at_epoch INTEGER NOT NULL${o}${a},
        FOREIGN KEY(memory_session_id) REFERENCES sdk_sessions(memory_session_id) ON DELETE CASCADE ON UPDATE CASCADE
      )
    `,u=`
      INSERT INTO observations_new
      SELECT id, memory_session_id, project, text, type, title, subtitle, facts,
             narrative, concepts, files_read, files_modified, prompt_number,
             discovery_tokens, created_at, created_at_epoch${i}${d}
      FROM observations
    `,p=`
      CREATE INDEX idx_observations_sdk_session ON observations(memory_session_id);
      CREATE INDEX idx_observations_project ON observations(project);
      CREATE INDEX idx_observations_type ON observations(type);
      CREATE INDEX idx_observations_created ON observations(created_at_epoch DESC);
    `,c=`
      CREATE TRIGGER IF NOT EXISTS observations_ai AFTER INSERT ON observations BEGIN
        INSERT INTO observations_fts(rowid, title, subtitle, narrative, text, facts, concepts)
        VALUES (new.id, new.title, new.subtitle, new.narrative, new.text, new.facts, new.concepts);
      END;

      CREATE TRIGGER IF NOT EXISTS observations_ad AFTER DELETE ON observations BEGIN
        INSERT INTO observations_fts(observations_fts, rowid, title, subtitle, narrative, text, facts, concepts)
        VALUES('delete', old.id, old.title, old.subtitle, old.narrative, old.text, old.facts, old.concepts);
      END;

      CREATE TRIGGER IF NOT EXISTS observations_au AFTER UPDATE ON observations BEGIN
        INSERT INTO observations_fts(observations_fts, rowid, title, subtitle, narrative, text, facts, concepts)
        VALUES('delete', old.id, old.title, old.subtitle, old.narrative, old.text, old.facts, old.concepts);
        INSERT INTO observations_fts(rowid, title, subtitle, narrative, text, facts, concepts)
        VALUES (new.id, new.title, new.subtitle, new.narrative, new.text, new.facts, new.concepts);
      END;
    `;this.db.run("DROP TRIGGER IF EXISTS session_summaries_ai"),this.db.run("DROP TRIGGER IF EXISTS session_summaries_ad"),this.db.run("DROP TRIGGER IF EXISTS session_summaries_au"),this.db.run("DROP TABLE IF EXISTS session_summaries_new");let O=`
      CREATE TABLE session_summaries_new (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        memory_session_id TEXT NOT NULL,
        project TEXT NOT NULL,
        request TEXT,
        investigated TEXT,
        learned TEXT,
        completed TEXT,
        next_steps TEXT,
        files_read TEXT,
        files_edited TEXT,
        notes TEXT,
        prompt_number INTEGER,
        discovery_tokens INTEGER DEFAULT 0,
        created_at TEXT NOT NULL,
        created_at_epoch INTEGER NOT NULL,
        FOREIGN KEY(memory_session_id) REFERENCES sdk_sessions(memory_session_id) ON DELETE CASCADE ON UPDATE CASCADE
      )
    `,h=`
      INSERT INTO session_summaries_new
      SELECT id, memory_session_id, project, request, investigated, learned,
             completed, next_steps, files_read, files_edited, notes,
             prompt_number, discovery_tokens, created_at, created_at_epoch
      FROM session_summaries
    `,b=`
      CREATE INDEX idx_session_summaries_sdk_session ON session_summaries(memory_session_id);
      CREATE INDEX idx_session_summaries_project ON session_summaries(project);
      CREATE INDEX idx_session_summaries_created ON session_summaries(created_at_epoch DESC);
    `,g=`
      CREATE TRIGGER IF NOT EXISTS session_summaries_ai AFTER INSERT ON session_summaries BEGIN
        INSERT INTO session_summaries_fts(rowid, request, investigated, learned, completed, next_steps, notes)
        VALUES (new.id, new.request, new.investigated, new.learned, new.completed, new.next_steps, new.notes);
      END;

      CREATE TRIGGER IF NOT EXISTS session_summaries_ad AFTER DELETE ON session_summaries BEGIN
        INSERT INTO session_summaries_fts(session_summaries_fts, rowid, request, investigated, learned, completed, next_steps, notes)
        VALUES('delete', old.id, old.request, old.investigated, old.learned, old.completed, old.next_steps, old.notes);
      END;

      CREATE TRIGGER IF NOT EXISTS session_summaries_au AFTER UPDATE ON session_summaries BEGIN
        INSERT INTO session_summaries_fts(session_summaries_fts, rowid, request, investigated, learned, completed, next_steps, notes)
        VALUES('delete', old.id, old.request, old.investigated, old.learned, old.completed, old.next_steps, old.notes);
        INSERT INTO session_summaries_fts(rowid, request, investigated, learned, completed, next_steps, notes)
        VALUES (new.id, new.request, new.investigated, new.learned, new.completed, new.next_steps, new.notes);
      END;
    `;try{this.recreateObservationsWithCascade(E,u,p,c),this.recreateSessionSummariesWithCascade(O,h,b,g),this.db.prepare("INSERT OR IGNORE INTO schema_versions (version, applied_at) VALUES (?, ?)").run(21,new Date().toISOString()),this.db.run("COMMIT"),this.db.run("PRAGMA foreign_keys = ON"),_.debug("DB","Successfully added ON UPDATE CASCADE to FK constraints")}catch(S){throw this.db.run("ROLLBACK"),this.db.run("PRAGMA foreign_keys = ON"),S instanceof Error?S:new Error(String(S))}}recreateObservationsWithCascade(e,s,t,n){this.db.run(e),this.db.run(s),this.db.run("DROP TABLE observations"),this.db.run("ALTER TABLE observations_new RENAME TO observations"),this.db.run(t),this.db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='observations_fts'").all().length>0&&this.db.run(n)}recreateSessionSummariesWithCascade(e,s,t,n){this.db.run(e),this.db.run(s),this.db.run("DROP TABLE session_summaries"),this.db.run("ALTER TABLE session_summaries_new RENAME TO session_summaries"),this.db.run(t),this.db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='session_summaries_fts'").all().length>0&&this.db.run(n)}addObservationContentHashColumn(){if(this.db.query("PRAGMA table_info(observations)").all().some(t=>t.name==="content_hash")){this.db.prepare("INSERT OR IGNORE INTO schema_versions (version, applied_at) VALUES (?, ?)").run(22,new Date().toISOString());return}this.db.run("ALTER TABLE observations ADD COLUMN content_hash TEXT"),this.db.run("UPDATE observations SET content_hash = substr(hex(randomblob(8)), 1, 16) WHERE content_hash IS NULL"),this.db.run("CREATE INDEX IF NOT EXISTS idx_observations_content_hash ON observations(content_hash, created_at_epoch)"),_.debug("DB","Added content_hash column to observations table with backfill and index"),this.db.prepare("INSERT OR IGNORE INTO schema_versions (version, applied_at) VALUES (?, ?)").run(22,new Date().toISOString())}addSessionCustomTitleColumn(){let e=this.db.prepare("SELECT version FROM schema_versions WHERE version = ?").get(23),t=this.db.query("PRAGMA table_info(sdk_sessions)").all().some(n=>n.name==="custom_title");e&&t||(t||(this.db.run("ALTER TABLE sdk_sessions ADD COLUMN custom_title TEXT"),_.debug("DB","Added custom_title column to sdk_sessions table")),e||this.db.prepare("INSERT OR IGNORE INTO schema_versions (version, applied_at) VALUES (?, ?)").run(23,new Date().toISOString()))}addSessionPlatformSourceColumn(){let s=this.db.query("PRAGMA table_info(sdk_sessions)").all().some(i=>i.name==="platform_source"),n=this.db.query("PRAGMA index_list(sdk_sessions)").all().some(i=>i.name==="idx_sdk_sessions_platform_source");this.db.prepare("SELECT version FROM schema_versions WHERE version = ?").get(24)&&s&&n||(s||(this.db.run(`ALTER TABLE sdk_sessions ADD COLUMN platform_source TEXT NOT NULL DEFAULT '${l}'`),_.debug("DB","Added platform_source column to sdk_sessions table")),this.db.run(`
      UPDATE sdk_sessions
      SET platform_source = '${l}'
      WHERE platform_source IS NULL OR platform_source = ''
    `),n||this.db.run("CREATE INDEX IF NOT EXISTS idx_sdk_sessions_platform_source ON sdk_sessions(platform_source)"),this.db.prepare("INSERT OR IGNORE INTO schema_versions (version, applied_at) VALUES (?, ?)").run(24,new Date().toISOString()))}addObservationModelColumns(){let e=this.db.query("PRAGMA table_info(observations)").all(),s=e.some(n=>n.name==="generated_by_model"),t=e.some(n=>n.name==="relevance_count");s&&t||(s||this.db.run("ALTER TABLE observations ADD COLUMN generated_by_model TEXT"),t||this.db.run("ALTER TABLE observations ADD COLUMN relevance_count INTEGER DEFAULT 0"),this.db.prepare("INSERT OR IGNORE INTO schema_versions (version, applied_at) VALUES (?, ?)").run(26,new Date().toISOString()))}ensureMergedIntoProjectColumns(){this.db.query("PRAGMA table_info(observations)").all().some(t=>t.name==="merged_into_project")||this.db.run("ALTER TABLE observations ADD COLUMN merged_into_project TEXT"),this.db.run("CREATE INDEX IF NOT EXISTS idx_observations_merged_into ON observations(merged_into_project)"),this.db.query("PRAGMA table_info(session_summaries)").all().some(t=>t.name==="merged_into_project")||this.db.run("ALTER TABLE session_summaries ADD COLUMN merged_into_project TEXT"),this.db.run("CREATE INDEX IF NOT EXISTS idx_summaries_merged_into ON session_summaries(merged_into_project)")}addObservationSubagentColumns(){let e=this.db.prepare("SELECT version FROM schema_versions WHERE version = ?").get(27),s=this.db.query("PRAGMA table_info(observations)").all(),t=s.some(i=>i.name==="agent_type"),n=s.some(i=>i.name==="agent_id");t||this.db.run("ALTER TABLE observations ADD COLUMN agent_type TEXT"),n||this.db.run("ALTER TABLE observations ADD COLUMN agent_id TEXT"),this.db.run("CREATE INDEX IF NOT EXISTS idx_observations_agent_type ON observations(agent_type)"),this.db.run("CREATE INDEX IF NOT EXISTS idx_observations_agent_id ON observations(agent_id)");let o=this.db.query("PRAGMA table_info(pending_messages)").all();if(o.length>0){let i=o.some(d=>d.name==="agent_type"),a=o.some(d=>d.name==="agent_id");i||this.db.run("ALTER TABLE pending_messages ADD COLUMN agent_type TEXT"),a||this.db.run("ALTER TABLE pending_messages ADD COLUMN agent_id TEXT")}e||this.db.prepare("INSERT OR IGNORE INTO schema_versions (version, applied_at) VALUES (?, ?)").run(27,new Date().toISOString())}ensurePendingMessagesToolUseIdColumn(){if(this.db.query("SELECT name FROM sqlite_master WHERE type='table' AND name='pending_messages'").all().length===0){this.db.prepare("INSERT OR IGNORE INTO schema_versions (version, applied_at) VALUES (?, ?)").run(28,new Date().toISOString());return}this.db.query("PRAGMA table_info(pending_messages)").all().some(n=>n.name==="tool_use_id")||this.db.run("ALTER TABLE pending_messages ADD COLUMN tool_use_id TEXT"),this.db.run("BEGIN TRANSACTION");try{this.dedupePendingMessagesByToolUseId(),this.db.run("COMMIT")}catch(n){this.db.run("ROLLBACK");let o=n instanceof Error?n:new Error(String(n));throw _.error("DB","Failed to de-dupe pending_messages by tool_use_id, rolled back",{},o),n}}dedupePendingMessagesByToolUseId(){this.db.run(`
      DELETE FROM pending_messages
       WHERE id IN (
         SELECT id
           FROM (
             SELECT id,
                    ROW_NUMBER() OVER (
                      PARTITION BY session_db_id, tool_use_id
                      ORDER BY CASE status
                        WHEN 'processing' THEN 0
                        WHEN 'pending' THEN 1
                        ELSE 2
                      END, id
                    ) AS duplicate_rank
               FROM pending_messages
              WHERE tool_use_id IS NOT NULL
           )
          WHERE duplicate_rank > 1
         )
    `),this.db.run(`
      -- tool_use_id is optional for summaries and legacy rows; enforce de-dupe
      -- only for rows that came from a concrete tool-use event.
      CREATE UNIQUE INDEX IF NOT EXISTS ux_pending_session_tool
      ON pending_messages(session_db_id, tool_use_id)
      WHERE tool_use_id IS NOT NULL
    `),this.db.prepare("INSERT OR IGNORE INTO schema_versions (version, applied_at) VALUES (?, ?)").run(28,new Date().toISOString())}addObservationsUniqueContentHashIndex(){if(this.db.prepare("SELECT version FROM schema_versions WHERE version = ?").get(29))return;let s=this.db.query("PRAGMA table_info(observations)").all(),t=s.some(o=>o.name==="memory_session_id"),n=s.some(o=>o.name==="content_hash");if(!t||!n){this.db.prepare("INSERT OR IGNORE INTO schema_versions (version, applied_at) VALUES (?, ?)").run(29,new Date().toISOString());return}this.db.run("BEGIN TRANSACTION");try{this.dedupeObservationsByContentHash(),this.db.run("COMMIT")}catch(o){this.db.run("ROLLBACK");let i=o instanceof Error?o:new Error(String(o));throw _.error("DB","Failed to de-dupe observations by content_hash, rolled back",{},i),o}}dedupeObservationsByContentHash(){this.db.run(`
      UPDATE observations
         SET content_hash = '__null_migration_' || id || '__'
       WHERE content_hash IS NULL
    `),this.db.run(`
      DELETE FROM observations
       WHERE id IN (
         SELECT id
           FROM (
             SELECT id,
                    ROW_NUMBER() OVER (
                      PARTITION BY memory_session_id, content_hash
                      ORDER BY id
                    ) AS duplicate_rank
               FROM observations
           )
          WHERE duplicate_rank > 1
       )
    `),this.db.run(`
      CREATE UNIQUE INDEX IF NOT EXISTS ux_observations_session_hash
      ON observations(memory_session_id, content_hash)
    `),this.db.prepare("INSERT OR IGNORE INTO schema_versions (version, applied_at) VALUES (?, ?)").run(29,new Date().toISOString())}addObservationsMetadataColumn(){this.db.query("PRAGMA table_info(observations)").all().some(t=>t.name==="metadata")||(this.db.run("ALTER TABLE observations ADD COLUMN metadata TEXT"),_.debug("DB","Added metadata column to observations table (#2116)")),this.db.prepare("INSERT OR IGNORE INTO schema_versions (version, applied_at) VALUES (?, ?)").run(30,new Date().toISOString())}updateMemorySessionId(e,s){this.db.prepare(`
      UPDATE sdk_sessions
      SET memory_session_id = ?
      WHERE id = ?
    `).run(s,e)}markSessionCompleted(e){let s=Date.now(),t=new Date(s).toISOString();this.db.prepare(`
      UPDATE sdk_sessions
      SET status = 'completed', completed_at = ?, completed_at_epoch = ?
      WHERE id = ?
    `).run(t,s,e)}ensureMemorySessionIdRegistered(e,s,t){let n=this.db.prepare(`
      SELECT id, memory_session_id, worker_port FROM sdk_sessions WHERE id = ?
    `).get(e);if(!n)throw new Error(`Session ${e} not found in sdk_sessions`);n.memory_session_id!==s&&(this.db.prepare(`
        UPDATE sdk_sessions SET memory_session_id = ? WHERE id = ?
      `).run(s,e),_.info("DB","Registered memory_session_id before storage (FK fix)",{sessionDbId:e,oldId:n.memory_session_id,newId:s})),typeof t=="number"&&n.worker_port!==t&&this.db.prepare(`
        UPDATE sdk_sessions SET worker_port = ? WHERE id = ?
      `).run(t,e)}getAllProjects(e){let s=e?A(e):void 0,t=`
      SELECT DISTINCT project
      FROM sdk_sessions
      WHERE project IS NOT NULL AND project != ''
        AND project != ?
    `,n=[ae];return s&&(t+=" AND COALESCE(platform_source, ?) = ?",n.push(l,s)),t+=" ORDER BY project ASC",this.db.prepare(t).all(...n).map(i=>i.project)}getProjectCatalog(){let e=this.db.prepare(`
      SELECT
        COALESCE(platform_source, '${l}') as platform_source,
        project,
        MAX(started_at_epoch) as latest_epoch
      FROM sdk_sessions
      WHERE project IS NOT NULL AND project != ''
        AND project != ?
      GROUP BY COALESCE(platform_source, '${l}'), project
      ORDER BY latest_epoch DESC
    `).all(ae),s=[],t=new Set,n={};for(let i of e){let a=A(i.platform_source);n[a]||(n[a]=[]),n[a].includes(i.project)||n[a].push(i.project),t.has(i.project)||(t.add(i.project),s.push(i.project))}let o=Le(Object.keys(n));return{projects:s,sources:o,projectsBySource:Object.fromEntries(o.map(i=>[i,n[i]||[]]))}}getLatestUserPrompt(e,s){let t=this.resolvePromptSessionDbId(e,s),n=t!==null?"up.session_db_id = ?":"up.content_session_id = ?",o=t!==null?t:e;return this.db.prepare(`
      SELECT
        up.*,
        s.memory_session_id,
        s.project,
        COALESCE(s.platform_source, '${l}') as platform_source
      FROM user_prompts up
      JOIN sdk_sessions s ON up.session_db_id = s.id
      WHERE ${n}
      ORDER BY up.created_at_epoch DESC
      LIMIT 1
    `).get(o)}findRecentDuplicateUserPrompt(e,s,t,n){return ve(this.db,e,q(s),t,this.resolvePromptSessionDbId(e,n)??void 0)}getRecentSessionsWithStatus(e,s=3,t){let n=[e],o="";return t&&(o=`AND COALESCE(NULLIF(s.platform_source, ''), '${l}') = ?`,n.push(A(t))),n.push(s),this.db.prepare(`
      SELECT * FROM (
        SELECT
          s.memory_session_id,
          s.status,
          s.started_at,
          s.started_at_epoch,
          s.user_prompt,
          CASE WHEN sum.memory_session_id IS NOT NULL THEN 1 ELSE 0 END as has_summary
        FROM sdk_sessions s
        LEFT JOIN session_summaries sum ON s.memory_session_id = sum.memory_session_id
        WHERE s.project = ? AND s.memory_session_id IS NOT NULL
        ${o}
        GROUP BY s.memory_session_id
        ORDER BY s.started_at_epoch DESC
        LIMIT ?
      )
      ORDER BY started_at_epoch ASC
    `).all(...n)}getObservationsForSession(e,s){let t=[e],n="";return s&&(n=`
        AND EXISTS (
          SELECT 1
          FROM sdk_sessions s
          WHERE s.memory_session_id = observations.memory_session_id
            AND COALESCE(NULLIF(s.platform_source, ''), '${l}') = ?
        )
      `,t.push(A(s))),this.db.prepare(`
      SELECT title, subtitle, type, prompt_number
      FROM observations
      WHERE memory_session_id = ?
      ${n}
      ORDER BY created_at_epoch ASC
    `).all(...t)}getObservationById(e,s){return s?this.db.prepare(`
      SELECT o.*
      FROM observations o
      LEFT JOIN sdk_sessions s ON s.memory_session_id = o.memory_session_id
      WHERE o.id = ?
        AND COALESCE(NULLIF(s.platform_source, ''), '${l}') = ?
    `).get(e,A(s))||null:this.db.prepare(`
        SELECT *
        FROM observations
        WHERE id = ?
      `).get(e)||null}getObservationsByIds(e,s={}){if(e.length===0)return[];let{orderBy:t="date_desc",limit:n,project:o,platformSource:i,type:a,concepts:d,files:E}=s,u=t==="relevance",p=u?"":`ORDER BY o.created_at_epoch ${t==="date_asc"?"ASC":"DESC"}`,c=n&&!u?`LIMIT ${n}`:"",O=e.map(()=>"?").join(","),h=[...e],b=[];if(o&&(b.push("o.project = ?"),h.push(o)),i&&(b.push(`COALESCE(NULLIF(s.platform_source, ''), '${l}') = ?`),h.push(A(i))),a)if(Array.isArray(a)){let I=a.map(()=>"?").join(",");b.push(`o.type IN (${I})`),h.push(...a)}else b.push("o.type = ?"),h.push(a);if(d){let I=Array.isArray(d)?d:[d],R=I.map(()=>"EXISTS (SELECT 1 FROM json_each(o.concepts) WHERE value = ?)");h.push(...I),b.push(`(${R.join(" OR ")})`)}if(E){let I=Array.isArray(E)?E:[E],R=I.map(()=>"(EXISTS (SELECT 1 FROM json_each(o.files_read) WHERE value LIKE ?) OR EXISTS (SELECT 1 FROM json_each(o.files_modified) WHERE value LIKE ?))");I.forEach(M=>{h.push(`%${M}%`,`%${M}%`)}),b.push(`(${R.join(" OR ")})`)}let g=b.length>0?`WHERE o.id IN (${O}) AND ${b.join(" AND ")}`:`WHERE o.id IN (${O})`,D=this.db.prepare(`
      SELECT o.*
      FROM observations o
      LEFT JOIN sdk_sessions s ON s.memory_session_id = o.memory_session_id
      ${g}
      ${p}
      ${c}
    `).all(...h);if(!u)return D;let P=new Map(D.map(I=>[I.id,I])),N=e.map(I=>P.get(I)).filter(I=>!!I);return n?N.slice(0,n):N}getSummaryForSession(e,s){let t=[e],n="";return s&&(n=`
        AND EXISTS (
          SELECT 1
          FROM sdk_sessions sdk
          WHERE sdk.memory_session_id = session_summaries.memory_session_id
            AND COALESCE(NULLIF(sdk.platform_source, ''), '${l}') = ?
        )
      `,t.push(A(s))),this.db.prepare(`
      SELECT
        request, investigated, learned, completed, next_steps,
        files_read, files_edited, notes, prompt_number, created_at,
        created_at_epoch
      FROM session_summaries
      WHERE memory_session_id = ?
      ${n}
      ORDER BY created_at_epoch DESC
      LIMIT 1
    `).get(...t)||null}getSessionById(e){return this.db.prepare(`
      SELECT id, content_session_id, memory_session_id, project,
             COALESCE(platform_source, '${l}') as platform_source,
             user_prompt, custom_title, status
      FROM sdk_sessions
      WHERE id = ?
      LIMIT 1
    `).get(e)||null}getSdkSessionsBySessionIds(e){if(e.length===0)return[];let s=e.map(()=>"?").join(",");return this.db.prepare(`
      SELECT id, content_session_id, memory_session_id, project,
             COALESCE(platform_source, '${l}') as platform_source,
             user_prompt, custom_title,
             started_at, started_at_epoch, completed_at, completed_at_epoch, status
      FROM sdk_sessions
      WHERE memory_session_id IN (${s})
      ORDER BY started_at_epoch DESC
    `).all(...e)}getPromptNumberFromUserPrompts(e,s){let t=this.resolvePromptSessionDbId(e,s);return t!==null?this.db.prepare(`
        SELECT COUNT(*) as count FROM user_prompts WHERE session_db_id = ?
      `).get(t).count:this.db.prepare(`
      SELECT COUNT(*) as count FROM user_prompts WHERE content_session_id = ?
    `).get(e).count}createSDKSession(e,s,t,n,o){let i=new Date,a=i.getTime(),d=o?A(o):l,E=q(t),u=this.db.prepare(`
      SELECT id, platform_source
      FROM sdk_sessions
      WHERE COALESCE(NULLIF(platform_source, ''), ?) = ?
        AND content_session_id = ?
    `).get(l,d,e);if(u)return s&&this.db.prepare(`
          UPDATE sdk_sessions SET project = ?
          WHERE id = ? AND (project IS NULL OR project = '')
        `).run(s,u.id),n&&this.db.prepare(`
          UPDATE sdk_sessions SET custom_title = ?
          WHERE id = ? AND custom_title IS NULL
        `).run(n,u.id),u.id;let p=this.db.prepare(`
      INSERT INTO sdk_sessions
      (content_session_id, memory_session_id, project, platform_source, user_prompt, custom_title, started_at, started_at_epoch, status)
      VALUES (?, NULL, ?, ?, ?, ?, ?, ?, 'active')
    `).run(e,s,d,E,n||null,i.toISOString(),a);return Number(p.lastInsertRowid)}saveUserPrompt(e,s,t,n){let o=new Date,i=o.getTime(),a=q(t),d=this.resolvePromptSessionDbId(e,n);return this.db.prepare(`
      INSERT INTO user_prompts
      (session_db_id, content_session_id, prompt_number, prompt_text, created_at, created_at_epoch)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(d,e,s,a,o.toISOString(),i).lastInsertRowid}getUserPrompt(e,s,t){let n=this.resolvePromptSessionDbId(e,t);return n!==null?this.db.prepare(`
        SELECT prompt_text
        FROM user_prompts
        WHERE session_db_id = ? AND prompt_number = ?
        LIMIT 1
      `).get(n,s)?.prompt_text??null:this.db.prepare(`
      SELECT prompt_text
      FROM user_prompts
      WHERE content_session_id = ? AND prompt_number = ?
      LIMIT 1
    `).get(e,s)?.prompt_text??null}storeObservation(e,s,t,n,o=0,i,a){let d=this.storeObservations(e,s,[t],null,n,o,i,a);return{id:d.observationIds[0],createdAtEpoch:d.createdAtEpoch}}storeSummary(e,s,t,n,o=0,i){let a=i??Date.now(),d=new Date(a).toISOString(),u=this.db.prepare(`
      INSERT INTO session_summaries
      (memory_session_id, project, request, investigated, learned, completed,
       next_steps, notes, prompt_number, discovery_tokens, created_at, created_at_epoch)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(e,s,t.request,t.investigated,t.learned,t.completed,t.next_steps,t.notes,n||null,o,d,a);return{id:Number(u.lastInsertRowid),createdAtEpoch:a}}storeObservations(e,s,t,n,o,i=0,a,d){let E=a??Date.now(),u=new Date(E).toISOString();return this.db.transaction(()=>{let c=[],O=this.db.prepare(`
        INSERT INTO observations
        (memory_session_id, project, type, title, subtitle, facts, narrative, concepts,
         files_read, files_modified, prompt_number, discovery_tokens, agent_type, agent_id, content_hash, created_at, created_at_epoch,
         generated_by_model, metadata)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(memory_session_id, content_hash) DO NOTHING
        RETURNING id
      `),h=this.db.prepare("SELECT id FROM observations WHERE memory_session_id = ? AND content_hash = ?");for(let g of t){let S=Me(e,g.title,g.narrative),D=O.get(e,s,g.type,g.title,g.subtitle,JSON.stringify(g.facts),g.narrative,JSON.stringify(g.concepts),JSON.stringify(g.files_read),JSON.stringify(g.files_modified),o||null,i,g.agent_type??null,g.agent_id??null,S,u,E,d||null,g.metadata??null);if(D){c.push(D.id);continue}let P=h.get(e,S);if(!P)throw new Error(`storeObservations: ON CONFLICT without existing row for content_hash=${S}`);c.push(P.id)}let b=null;if(n){let S=this.db.prepare(`
          INSERT INTO session_summaries
          (memory_session_id, project, request, investigated, learned, completed,
           next_steps, notes, prompt_number, discovery_tokens, created_at, created_at_epoch)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(e,s,n.request,n.investigated,n.learned,n.completed,n.next_steps,n.notes,o||null,i,u,E);b=Number(S.lastInsertRowid)}return{observationIds:c,summaryId:b,createdAtEpoch:E}})()}getSessionSummariesByIds(e,s={}){if(e.length===0)return[];let{orderBy:t="date_desc",limit:n,project:o,platformSource:i}=s,a=t==="relevance",d=a?"":`ORDER BY ss.created_at_epoch ${t==="date_asc"?"ASC":"DESC"}`,E=n&&!a?`LIMIT ${n}`:"",u=e.map(()=>"?").join(","),p=[...e],c=[];o&&(c.push("ss.project = ?"),p.push(o)),i&&(c.push(`COALESCE(NULLIF(s.platform_source, ''), '${l}') = ?`),p.push(A(i)));let O=c.length>0?`AND ${c.join(" AND ")}`:"",b=this.db.prepare(`
      SELECT ss.*
      FROM session_summaries ss
      LEFT JOIN sdk_sessions s ON s.memory_session_id = ss.memory_session_id
      WHERE ss.id IN (${u}) ${O}
      ${d}
      ${E}
    `).all(...p);if(!a)return b;let g=new Map(b.map(D=>[D.id,D])),S=e.map(D=>g.get(D)).filter(D=>!!D);return n?S.slice(0,n):S}getUserPromptsByIds(e,s={}){if(e.length===0)return[];let{orderBy:t="date_desc",limit:n,project:o,platformSource:i}=s,a=t==="relevance",d=a?"":`ORDER BY up.created_at_epoch ${t==="date_asc"?"ASC":"DESC"}`,E=n?`LIMIT ${n}`:"",u=e.map(()=>"?").join(","),p=[...e],c=[];o&&(c.push("s.project = ?"),p.push(o)),i&&(c.push(`COALESCE(NULLIF(s.platform_source, ''), '${l}') = ?`),p.push(A(i)));let O=c.length>0?`AND ${c.join(" AND ")}`:"",b=this.db.prepare(`
      SELECT
        up.*,
        s.project,
        s.memory_session_id,
        COALESCE(NULLIF(s.platform_source, ''), '${l}') as platform_source
      FROM user_prompts up
      JOIN sdk_sessions s ON up.session_db_id = s.id
      WHERE up.id IN (${u}) ${O}
      ${d}
      ${E}
    `).all(...p);if(!a)return b;let g=new Map(b.map(S=>[S.id,S]));return e.map(S=>g.get(S)).filter(S=>!!S)}getTimelineAroundTimestamp(e,s=10,t=10,n,o){return this.getTimelineAroundObservation(null,e,s,t,n,o)}getTimelineAroundObservation(e,s,t=10,n=10,o,i){let a=i?A(i):void 0,d=(N,I)=>{let R=[],M=[];return o&&(R.push(`${N}.project = ?`),M.push(o)),a&&(R.push(`COALESCE(NULLIF(${I}.platform_source, ''), '${l}') = ?`),M.push(a)),{clause:R.length>0?`AND ${R.join(" AND ")}`:"",params:M}},E=d("o","src"),u=d("ss","src"),p=d("s","s"),c,O;if(e!==null){let N=`
        SELECT o.id, o.created_at_epoch
        FROM observations o
        LEFT JOIN sdk_sessions src ON src.memory_session_id = o.memory_session_id
        WHERE o.id <= ? ${E.clause}
        ORDER BY o.id DESC
        LIMIT ?
      `,I=`
        SELECT o.id, o.created_at_epoch
        FROM observations o
        LEFT JOIN sdk_sessions src ON src.memory_session_id = o.memory_session_id
        WHERE o.id >= ? ${E.clause}
        ORDER BY o.id ASC
        LIMIT ?
      `;try{let R=this.db.prepare(N).all(e,...E.params,t+1),M=this.db.prepare(I).all(e,...E.params,n+1);if(R.length===0&&M.length===0)return{observations:[],sessions:[],prompts:[]};c=R.length>0?R[R.length-1].created_at_epoch:s,O=M.length>0?M[M.length-1].created_at_epoch:s}catch(R){return R instanceof Error?_.error("DB","Error getting boundary observations",{project:o},R):_.error("DB","Error getting boundary observations with non-Error",{},new Error(String(R))),{observations:[],sessions:[],prompts:[]}}}else{let N=`
        SELECT o.created_at_epoch
        FROM observations o
        LEFT JOIN sdk_sessions src ON src.memory_session_id = o.memory_session_id
        WHERE o.created_at_epoch <= ? ${E.clause}
        ORDER BY o.created_at_epoch DESC
        LIMIT ?
      `,I=`
        SELECT o.created_at_epoch
        FROM observations o
        LEFT JOIN sdk_sessions src ON src.memory_session_id = o.memory_session_id
        WHERE o.created_at_epoch >= ? ${E.clause}
        ORDER BY o.created_at_epoch ASC
        LIMIT ?
      `;try{let R=this.db.prepare(N).all(s,...E.params,t),M=this.db.prepare(I).all(s,...E.params,n+1);if(R.length===0&&M.length===0)return{observations:[],sessions:[],prompts:[]};c=R.length>0?R[R.length-1].created_at_epoch:s,O=M.length>0?M[M.length-1].created_at_epoch:s}catch(R){return R instanceof Error?_.error("DB","Error getting boundary timestamps",{project:o},R):_.error("DB","Error getting boundary timestamps with non-Error",{},new Error(String(R))),{observations:[],sessions:[],prompts:[]}}}let h=`
      SELECT o.*
      FROM observations o
      LEFT JOIN sdk_sessions src ON src.memory_session_id = o.memory_session_id
      WHERE o.created_at_epoch >= ? AND o.created_at_epoch <= ? ${E.clause}
      ORDER BY o.created_at_epoch ASC
    `,b=`
      SELECT ss.*
      FROM session_summaries ss
      LEFT JOIN sdk_sessions src ON src.memory_session_id = ss.memory_session_id
      WHERE ss.created_at_epoch >= ? AND ss.created_at_epoch <= ? ${u.clause}
      ORDER BY ss.created_at_epoch ASC
    `,g=`
      SELECT up.*, s.project, s.memory_session_id, COALESCE(NULLIF(s.platform_source, ''), '${l}') as platform_source
      FROM user_prompts up
      JOIN sdk_sessions s ON up.session_db_id = s.id
      WHERE up.created_at_epoch >= ? AND up.created_at_epoch <= ? ${p.clause}
      ORDER BY up.created_at_epoch ASC
    `,S=this.db.prepare(h).all(c,O,...E.params),D=this.db.prepare(b).all(c,O,...u.params),P=this.db.prepare(g).all(c,O,...p.params);return{observations:S,sessions:D.map(N=>({id:N.id,memory_session_id:N.memory_session_id,project:N.project,request:N.request,completed:N.completed,next_steps:N.next_steps,created_at:N.created_at,created_at_epoch:N.created_at_epoch})),prompts:P.map(N=>({id:N.id,content_session_id:N.content_session_id,prompt_number:N.prompt_number,prompt_text:N.prompt_text,project:N.project,platform_source:N.platform_source,created_at:N.created_at,created_at_epoch:N.created_at_epoch}))}}getOrCreateManualSession(e){let s=`manual-${e}`,t=`manual-content-${e}`;if(this.db.prepare("SELECT memory_session_id FROM sdk_sessions WHERE memory_session_id = ?").get(s))return s;let o=new Date;return this.db.prepare(`
      INSERT INTO sdk_sessions (memory_session_id, content_session_id, project, platform_source, started_at, started_at_epoch, status)
      VALUES (?, ?, ?, ?, ?, ?, 'active')
    `).run(s,t,e,l,o.toISOString(),o.getTime()),_.info("SESSION","Created manual session",{memorySessionId:s,project:e}),s}close(){this.db.close()}importSdkSession(e){let s=A(e.platform_source),t=this.db.prepare(`SELECT id FROM sdk_sessions
       WHERE platform_source = ? AND content_session_id = ?`).get(s,e.content_session_id);return t?{imported:!1,id:t.id}:{imported:!0,id:this.db.prepare(`
      INSERT INTO sdk_sessions (
        content_session_id, memory_session_id, project, platform_source, user_prompt,
        started_at, started_at_epoch, completed_at, completed_at_epoch, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(e.content_session_id,e.memory_session_id,e.project,s,e.user_prompt,e.started_at,e.started_at_epoch,e.completed_at,e.completed_at_epoch,e.status).lastInsertRowid}}importSessionSummary(e){let s=this.db.prepare("SELECT id FROM session_summaries WHERE memory_session_id = ?").get(e.memory_session_id);return s?{imported:!1,id:s.id}:{imported:!0,id:this.db.prepare(`
      INSERT INTO session_summaries (
        memory_session_id, project, request, investigated, learned,
        completed, next_steps, files_read, files_edited, notes,
        prompt_number, discovery_tokens, created_at, created_at_epoch
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(e.memory_session_id,e.project,e.request,e.investigated,e.learned,e.completed,e.next_steps,e.files_read,e.files_edited,e.notes,e.prompt_number,e.discovery_tokens||0,e.created_at,e.created_at_epoch).lastInsertRowid}}importObservation(e){let s=this.db.prepare(`
      SELECT id FROM observations
      WHERE memory_session_id = ? AND title = ? AND created_at_epoch = ?
    `).get(e.memory_session_id,e.title,e.created_at_epoch);return s?{imported:!1,id:s.id}:{imported:!0,id:this.db.prepare(`
      INSERT INTO observations (
        memory_session_id, project, text, type, title, subtitle,
        facts, narrative, concepts, files_read, files_modified,
        prompt_number, discovery_tokens, agent_type, agent_id,
        created_at, created_at_epoch
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(e.memory_session_id,e.project,e.text,e.type,e.title,e.subtitle,e.facts,e.narrative,e.concepts,e.files_read,e.files_modified,e.prompt_number,e.discovery_tokens||0,e.agent_type??null,e.agent_id??null,e.created_at,e.created_at_epoch).lastInsertRowid}}rebuildObservationsFTSIndex(){this.db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='observations_fts'").all().length>0&&this.db.run("INSERT INTO observations_fts(observations_fts) VALUES('rebuild')")}importUserPrompt(e){let s=null,t=e.platform_source?A(e.platform_source):void 0;if(typeof e.session_db_id=="number"){let a=this.db.prepare(`
        SELECT id, content_session_id, COALESCE(NULLIF(platform_source, ''), '${l}') as platform_source
        FROM sdk_sessions
        WHERE id = ?
        LIMIT 1
      `).get(e.session_db_id);a&&a.content_session_id===e.content_session_id&&(!t||A(a.platform_source)===t)&&(s=a.id)}s===null&&(s=this.resolvePromptSessionDbId(e.content_session_id,void 0,t));let n=this.db.prepare(`
      SELECT id FROM user_prompts
      WHERE ${s!==null?"session_db_id = ?":"content_session_id = ?"} AND prompt_number = ?
    `).get(s??e.content_session_id,e.prompt_number);return n?{imported:!1,id:n.id}:{imported:!0,id:this.db.prepare(`
      INSERT INTO user_prompts (
        session_db_id, content_session_id, prompt_number, prompt_text,
        created_at, created_at_epoch
      ) VALUES (?, ?, ?, ?, ?, ?)
    `).run(s,e.content_session_id,e.prompt_number,e.prompt_text,e.created_at,e.created_at_epoch).lastInsertRowid}}};var $e=require("os"),He=$(require("path"),1),Ge=require("child_process");var Y=require("fs"),F=$(require("path"),1);var G={isWorktree:!1,worktreeName:null,parentRepoPath:null,parentProjectName:null};function Fe(r){let e=F.default.join(r,".git"),s;try{s=(0,Y.statSync)(e)}catch(u){return u instanceof Error&&u.code!=="ENOENT"&&_.warn("GIT","Unexpected error checking .git",{error:u instanceof Error?u.message:String(u)}),G}if(!s.isFile())return G;let t;try{t=(0,Y.readFileSync)(e,"utf-8").trim()}catch(u){return _.warn("GIT","Failed to read .git file",{error:u instanceof Error?u.message:String(u)}),G}let n=t.match(/^gitdir:\s*(.+)$/);if(!n)return G;let i=F.default.resolve(F.default.dirname(e),n[1]).match(/^(.+)[/\\]\.git[/\\]worktrees[/\\]([^/\\]+)$/);if(!i)return G;let a=i[1],d=F.default.basename(r),E=F.default.basename(a);return{isWorktree:!0,worktreeName:d,parentRepoPath:a,parentProjectName:E}}function Xe(r){return r==="~"||r.startsWith("~/")?r.replace(/^~/,(0,$e.homedir)()):r}function pt(r){try{return(0,Ge.execFileSync)("git",["rev-parse","--show-toplevel"],{cwd:r,encoding:"utf-8",stdio:["ignore","pipe","ignore"]}).trim()||null}catch(e){let s=e instanceof Error?e:new Error(String(e));return _.debug("PROJECT_NAME","git rev-parse failed, falling back to basename",{dir:r},s),null}}function ct(r){if(!r||r.trim()==="")return _.warn("PROJECT_NAME","Empty cwd provided, using fallback",{cwd:r}),"unknown-project";let e=Xe(r),t=pt(e)??e,n=He.default.basename(t);if(n===""){if(process.platform==="win32"){let i=r.match(/^([A-Z]):\\/i);if(i){let d=`drive-${i[1].toUpperCase()}`;return _.info("PROJECT_NAME","Drive root detected",{cwd:r,projectName:d}),d}}return _.warn("PROJECT_NAME","Root directory detected, using fallback",{cwd:r}),"unknown-project"}return n}function Be(r){let e=ct(r);if(!r)return{primary:e,parent:null,isWorktree:!1,allProjects:[e]};let s=Xe(r),t=Fe(s);if(t.isWorktree&&t.parentProjectName){let n=`${t.parentProjectName}/${e}`;return{primary:n,parent:t.parentProjectName,isWorktree:!0,allProjects:[t.parentProjectName,n]}}return{primary:e,parent:null,isWorktree:!1,allProjects:[e]}}var Q=require("fs"),ce=require("path"),le=require("os");var pe={HEALTH_CHECK:3e3,API_REQUEST:3e4,HOOK_READINESS_WAIT:1e4,POST_SPAWN_WAIT:15e3,READINESS_WAIT:3e4,PORT_IN_USE_WAIT:3e3,POWERSHELL_COMMAND:1e4,WINDOWS_MULTIPLIER:1.5};function je(r){return process.platform==="win32"?Math.round(r*pe.WINDOWS_MULTIPLIER):r}var J=class{static DEFAULTS={OPENCODE_MEM_MODEL:"claude-haiku-4-5-20251001",OPENCODE_MEM_CONTEXT_OBSERVATIONS:"50",OPENCODE_MEM_WORKER_PORT:String(37700+(process.getuid?.()??77)%100),OPENCODE_MEM_WORKER_HOST:"127.0.0.1",OPENCODE_MEM_API_TIMEOUT_MS:String(je(pe.API_REQUEST)),OPENCODE_MEM_SKIP_TOOLS:"ListMcpResourcesTool,SlashCommand,Skill,TodoWrite,AskUserQuestion",OPENCODE_MEM_PROVIDER:"openrouter",OPENCODE_MEM_CLAUDE_AUTH_METHOD:"subscription",OPENCODE_MEM_GEMINI_API_KEY:"",OPENCODE_MEM_GEMINI_MODEL:"gemini-2.5-flash-lite",OPENCODE_MEM_GEMINI_RATE_LIMITING_ENABLED:"true",OPENCODE_MEM_OPENROUTER_API_KEY:"",OPENCODE_MEM_OPENROUTER_MODEL:"deepseek-v4-flash",OPENCODE_MEM_OPENROUTER_BASE_URL:"https://opencode.ai/zen/go/v1",OPENCODE_MEM_OPENROUTER_SITE_URL:"",OPENCODE_MEM_OPENROUTER_APP_NAME:"opencode-mem",OPENCODE_MEM_DATA_DIR:(0,ce.join)((0,le.homedir)(),".opencode-mem"),OPENCODE_MEM_LOG_LEVEL:"INFO",OPENCODE_MEM_PYTHON_VERSION:"3.13",CLAUDE_CODE_PATH:"",OPENCODE_MEM_MODE:"code",OPENCODE_MEM_CONTEXT_SHOW_READ_TOKENS:"false",OPENCODE_MEM_CONTEXT_SHOW_WORK_TOKENS:"false",OPENCODE_MEM_CONTEXT_SHOW_SAVINGS_AMOUNT:"false",OPENCODE_MEM_CONTEXT_SHOW_SAVINGS_PERCENT:"true",OPENCODE_MEM_CONTEXT_FULL_COUNT:"0",OPENCODE_MEM_CONTEXT_FULL_FIELD:"narrative",OPENCODE_MEM_CONTEXT_SESSION_COUNT:"10",OPENCODE_MEM_CONTEXT_SHOW_LAST_SUMMARY:"true",OPENCODE_MEM_CONTEXT_SHOW_LAST_MESSAGE:"false",OPENCODE_MEM_CONTEXT_SHOW_TERMINAL_OUTPUT:"true",OPENCODE_MEM_WELCOME_HINT_ENABLED:"true",OPENCODE_MEM_FOLDER_CLAUDEMD_ENABLED:"false",OPENCODE_MEM_FOLDER_USE_LOCAL_MD:"false",OPENCODE_MEM_TRANSCRIPTS_ENABLED:"true",OPENCODE_MEM_TRANSCRIPTS_CONFIG_PATH:(0,ce.join)((0,le.homedir)(),".opencode-mem","transcript-watch.json"),OPENCODE_MEM_CODEX_TRANSCRIPT_INGESTION:"false",OPENCODE_MEM_MAX_CONCURRENT_AGENTS:"2",OPENCODE_MEM_HOOK_FAIL_LOUD_THRESHOLD:"3",OPENCODE_MEM_EXCLUDED_PROJECTS:"",OPENCODE_MEM_FOLDER_MD_EXCLUDE:"[]",OPENCODE_MEM_FOLDER_MD_SKELETON_DENYLIST:"[]",OPENCODE_MEM_SEMANTIC_INJECT:"false",OPENCODE_MEM_SEMANTIC_INJECT_LIMIT:"5",OPENCODE_MEM_TIER_ROUTING_ENABLED:"true",OPENCODE_MEM_TIER_SIMPLE_MODEL:"haiku",OPENCODE_MEM_TIER_SUMMARY_MODEL:"",OPENCODE_MEM_TIER_FAST_MODEL:"haiku",OPENCODE_MEM_TIER_SMART_MODEL:"sonnet",OPENCODE_MEM_CHROMA_ENABLED:"true",OPENCODE_MEM_CHROMA_MODE:"local",OPENCODE_MEM_CHROMA_HOST:"127.0.0.1",OPENCODE_MEM_CHROMA_PORT:"8000",OPENCODE_MEM_CHROMA_SSL:"false",OPENCODE_MEM_CHROMA_API_KEY:"",OPENCODE_MEM_CHROMA_TENANT:"default_tenant",OPENCODE_MEM_CHROMA_DATABASE:"default_database",OPENCODE_MEM_CHROMA_PREWARM_TIMEOUT_MS:"120000",OPENCODE_MEM_TELEGRAM_ENABLED:"true",OPENCODE_MEM_TELEGRAM_BOT_TOKEN:"",OPENCODE_MEM_TELEGRAM_CHAT_ID:"",OPENCODE_MEM_TELEGRAM_TRIGGER_TYPES:"security_alert",OPENCODE_MEM_TELEGRAM_TRIGGER_CONCEPTS:"",OPENCODE_MEM_QUEUE_ENGINE:"sqlite",OPENCODE_MEM_REDIS_URL:"",OPENCODE_MEM_REDIS_HOST:"127.0.0.1",OPENCODE_MEM_REDIS_PORT:"6379",OPENCODE_MEM_REDIS_MODE:"external",OPENCODE_MEM_QUEUE_REDIS_PREFIX:`opencode_mem_${process.env.OPENCODE_MEM_WORKER_PORT??String(37700+(process.getuid?.()??77)%100)}`,OPENCODE_MEM_AUTH_MODE:"api-key",OPENCODE_MEM_RUNTIME:"worker",OPENCODE_MEM_SERVER_URL:`http://127.0.0.1:${process.env.OPENCODE_MEM_SERVER_PORT??String(37877+(process.getuid?.()??77)%100)}`,OPENCODE_MEM_SERVER_API_KEY:"",OPENCODE_MEM_SERVER_PROJECT_ID:"",OPENCODE_MEM_SERVER_BETA_URL:`http://127.0.0.1:${process.env.OPENCODE_MEM_SERVER_PORT??String(37877+(process.getuid?.()??77)%100)}`,OPENCODE_MEM_SERVER_BETA_API_KEY:"",OPENCODE_MEM_SERVER_BETA_PROJECT_ID:""};static getAllDefaults(){return{...this.DEFAULTS}}static get(e){return process.env[e]??this.DEFAULTS[e]}static getInt(e){let s=this.get(e);return parseInt(s,10)}static applyEnvOverrides(e){let s={...e};for(let t of Object.keys(this.DEFAULTS))process.env[t]!==void 0&&(s[t]=process.env[t]);return s}static loadFromFile(e,s=!0){try{if(!(0,Q.existsSync)(e)){let a=this.getAllDefaults();try{ne(e,a),console.warn("[SETTINGS] Created settings file with defaults:",e)}catch(d){console.warn("[SETTINGS] Failed to create settings file, using in-memory defaults:",e,d instanceof Error?d.message:String(d))}return s?this.applyEnvOverrides(a):a}let t=(0,Q.readFileSync)(e,"utf-8"),n=U(t),o=n;if(n.env&&typeof n.env=="object"){o=n.env;try{ne(e,o),console.warn("[SETTINGS] Migrated settings file from nested to flat schema:",e)}catch(a){console.warn("[SETTINGS] Failed to auto-migrate settings file:",e,a instanceof Error?a.message:String(a))}}let i={...this.DEFAULTS};for(let a of Object.keys(this.DEFAULTS))o[a]!==void 0&&(i[a]=o[a]);return s?this.applyEnvOverrides(i):i}catch(t){console.warn("[SETTINGS] Failed to load settings, using defaults:",e,t instanceof Error?t.message:String(t));let n=this.getAllDefaults();return s?this.applyEnvOverrides(n):n}}};var X=require("fs"),z=require("path");var L=class r{static instance=null;activeMode=null;modesDir;constructor(){let e=Ce(),s=[...process.env.OPENCODE_MEM_MODES_DIR?[process.env.OPENCODE_MEM_MODES_DIR]:[],(0,z.join)(e,"modes"),(0,z.join)(e,"..","plugin","modes")],t=s.find(n=>(0,X.existsSync)(n));this.modesDir=t||s[0]}static getInstance(){return r.instance||(r.instance=new r),r.instance}parseInheritance(e){let s=e.split("--");if(s.length===1)return{hasParent:!1,parentId:"",overrideId:""};if(s.length>2)throw new Error(`Invalid mode inheritance: ${e}. Only one level of inheritance supported (parent--override)`);return{hasParent:!0,parentId:s[0],overrideId:e}}isPlainObject(e){return e!==null&&typeof e=="object"&&!Array.isArray(e)}deepMerge(e,s){let t={...e};for(let n in s){let o=s[n],i=e[n];this.isPlainObject(o)&&this.isPlainObject(i)?t[n]=this.deepMerge(i,o):t[n]=o}return t}loadModeFile(e){let s=(0,z.join)(this.modesDir,`${e}.json`);if(!(0,X.existsSync)(s))throw new Error(`Mode file not found: ${s}`);let t=(0,X.readFileSync)(s,"utf-8");return JSON.parse(t)}loadMode(e){let s=this.parseInheritance(e);if(!s.hasParent)try{let d=this.loadModeFile(e);return this.activeMode=d,_.debug("SYSTEM",`Loaded mode: ${d.name} (${e})`,void 0,{types:d.observation_types.map(E=>E.id),concepts:d.observation_concepts.map(E=>E.id)}),d}catch(d){if(d instanceof Error?_.warn("WORKER",`Mode file not found: ${e}, falling back to 'code'`,{message:d.message}):_.warn("WORKER",`Mode file not found: ${e}, falling back to 'code'`,{error:String(d)}),e==="code")throw new Error("Critical: code.json mode file missing");return this.loadMode("code")}let{parentId:t,overrideId:n}=s,o;try{o=this.loadMode(t)}catch(d){d instanceof Error?_.warn("WORKER",`Parent mode '${t}' not found for ${e}, falling back to 'code'`,{message:d.message}):_.warn("WORKER",`Parent mode '${t}' not found for ${e}, falling back to 'code'`,{error:String(d)}),o=this.loadMode("code")}let i;try{i=this.loadModeFile(n),_.debug("SYSTEM",`Loaded override file: ${n} for parent ${t}`)}catch(d){return d instanceof Error?_.warn("WORKER",`Override file '${n}' not found, using parent mode '${t}' only`,{message:d.message}):_.warn("WORKER",`Override file '${n}' not found, using parent mode '${t}' only`,{error:String(d)}),this.activeMode=o,o}if(!i)return _.warn("SYSTEM",`Invalid override file: ${n}, using parent mode '${t}' only`),this.activeMode=o,o;let a=this.deepMerge(o,i);return this.activeMode=a,_.debug("SYSTEM",`Loaded mode with inheritance: ${a.name} (${e} = ${t} + ${n})`,void 0,{parent:t,override:n,types:a.observation_types.map(d=>d.id),concepts:a.observation_concepts.map(d=>d.id)}),a}getActiveMode(){if(!this.activeMode)throw new Error("No mode loaded. Call loadMode() first.");return this.activeMode}getObservationTypes(){return this.getActiveMode().observation_types}getTypeIcon(e){return this.getObservationTypes().find(t=>t.id===e)?.emoji||"\u{1F4DD}"}getWorkEmoji(e){return this.getObservationTypes().find(t=>t.id===e)?.work_emoji||"\u{1F4DD}"}};function We(){let r=H.settings(),e=J.loadFromFile(r),s=L.getInstance().getActiveMode(),t=new Set(s.observation_types.map(o=>o.id)),n=new Set(s.observation_concepts.map(o=>o.id));return{totalObservationCount:parseInt(e.OPENCODE_MEM_CONTEXT_OBSERVATIONS,10),fullObservationCount:parseInt(e.OPENCODE_MEM_CONTEXT_FULL_COUNT,10),sessionCount:parseInt(e.OPENCODE_MEM_CONTEXT_SESSION_COUNT,10),showReadTokens:e.OPENCODE_MEM_CONTEXT_SHOW_READ_TOKENS==="true",showWorkTokens:e.OPENCODE_MEM_CONTEXT_SHOW_WORK_TOKENS==="true",showSavingsAmount:e.OPENCODE_MEM_CONTEXT_SHOW_SAVINGS_AMOUNT==="true",showSavingsPercent:e.OPENCODE_MEM_CONTEXT_SHOW_SAVINGS_PERCENT==="true",observationTypes:t,observationConcepts:n,fullObservationField:e.OPENCODE_MEM_CONTEXT_FULL_FIELD,showLastSummary:e.OPENCODE_MEM_CONTEXT_SHOW_LAST_SUMMARY==="true",showLastMessage:e.OPENCODE_MEM_CONTEXT_SHOW_LAST_MESSAGE==="true"}}var m={reset:"\x1B[0m",bright:"\x1B[1m",dim:"\x1B[2m",cyan:"\x1B[36m",green:"\x1B[32m",yellow:"\x1B[33m",blue:"\x1B[34m",magenta:"\x1B[35m",gray:"\x1B[90m",red:"\x1B[31m"},Ve=4,qe=1;function Ke(r){let e=(r.title?.length||0)+(r.subtitle?.length||0)+(r.narrative?.length||0)+JSON.stringify(r.facts||[]).length;return Math.ceil(e/Ve)}function Te(r){let e=r.length,s=r.reduce((i,a)=>i+Ke(a),0),t=r.reduce((i,a)=>i+(a.discovery_tokens||0),0),n=t-s,o=t>0?Math.round(n/t*100):0;return{totalObservations:e,totalReadTokens:s,totalDiscoveryTokens:t,savings:n,savingsPercent:o}}function lt(r){return L.getInstance().getWorkEmoji(r)}function B(r,e){let s=Ke(r),t=r.discovery_tokens||0,n=lt(r.type),o=t>0?`${n} ${t.toLocaleString()}`:"-";return{readTokens:s,discoveryTokens:t,discoveryDisplay:o,workEmoji:n}}function Z(r){return r.showReadTokens||r.showWorkTokens||r.showSavingsAmount||r.showSavingsPercent}var Ye=$(require("path"),1),ee=require("fs");function Je(r,e,s,t){let n=Array.from(s.observationTypes),o=n.map(()=>"?").join(","),i=Array.from(s.observationConcepts),a=i.map(()=>"?").join(","),d=e.map(()=>"?").join(",");return r.db.prepare(`
    SELECT
      o.id,
      o.memory_session_id,
      COALESCE(s.platform_source, 'claude') as platform_source,
      o.type,
      o.title,
      o.subtitle,
      o.narrative,
      o.facts,
      o.concepts,
      o.files_read,
      o.files_modified,
      o.discovery_tokens,
      o.created_at,
      o.created_at_epoch,
      o.project
    FROM observations o
    LEFT JOIN sdk_sessions s ON o.memory_session_id = s.memory_session_id
    WHERE (o.project IN (${d})
           OR o.merged_into_project IN (${d}))
      AND (? IS NULL OR s.platform_source = ?)
      AND type IN (${o})
      AND EXISTS (
        SELECT 1 FROM json_each(o.concepts)
        WHERE value IN (${a})
      )
    ORDER BY o.created_at_epoch DESC
    LIMIT ?
  `).all(...e,...e,t??null,t??null,...n,...i,s.totalObservationCount)}function Qe(r,e,s,t){let n=e.map(()=>"?").join(",");return r.db.prepare(`
    SELECT
      ss.id,
      ss.memory_session_id,
      COALESCE(s.platform_source, 'claude') as platform_source,
      ss.request,
      ss.investigated,
      ss.learned,
      ss.completed,
      ss.next_steps,
      ss.created_at,
      ss.created_at_epoch,
      ss.project
    FROM session_summaries ss
    LEFT JOIN sdk_sessions s ON ss.memory_session_id = s.memory_session_id
    WHERE (ss.project IN (${n})
           OR ss.merged_into_project IN (${n}))
      AND (? IS NULL OR s.platform_source = ?)
    ORDER BY ss.created_at_epoch DESC
    LIMIT ?
  `).all(...e,...e,t??null,t??null,s.sessionCount+qe)}function Tt(r){return r.replace(/[/.]/g,"-")}function Ot(r){if(!r.includes('"type":"assistant"'))return null;let e=JSON.parse(r);if(e.type==="assistant"&&e.message?.content&&Array.isArray(e.message.content)){let s="";for(let t of e.message.content)t.type==="text"&&(s+=t.text);if(s=s.replace(Ue,"").trim(),s)return s}return null}function gt(r){for(let e=r.length-1;e>=0;e--)try{let s=Ot(r[e]);if(s)return s}catch(s){s instanceof Error?_.debug("WORKER","Skipping malformed transcript line",{lineIndex:e},s):_.debug("WORKER","Skipping malformed transcript line",{lineIndex:e,error:String(s)});continue}return""}function St(r){try{if(!(0,ee.existsSync)(r))return{assistantMessage:""};let e=(0,ee.readFileSync)(r,"utf-8").trim();if(!e)return{assistantMessage:""};let s=e.split(`
`).filter(n=>n.trim());return{assistantMessage:gt(s)}}catch(e){return e instanceof Error?_.failure("WORKER","Failed to extract prior messages from transcript",{transcriptPath:r},e):_.warn("WORKER","Failed to extract prior messages from transcript",{transcriptPath:r,error:String(e)}),{assistantMessage:""}}}function ze(r,e,s,t){if(!e.showLastMessage||r.length===0)return{assistantMessage:""};let n=r.find(d=>d.memory_session_id!==s);if(!n)return{assistantMessage:""};let o=n.memory_session_id,i=Tt(t),a=Ye.default.join(ie,"projects",i,`${o}.jsonl`);return St(a)}function Ze(r,e){let s=e[0]?.id;return r.map((t,n)=>{let o=n===0?null:e[n+1];return{...t,displayEpoch:o?o.created_at_epoch:t.created_at_epoch,displayTime:o?o.created_at:t.created_at,shouldShowLink:t.id!==s}})}function es(r,e){let s=[...r.map(t=>({type:"observation",data:t})),...e.map(t=>({type:"summary",data:t}))];return s.sort((t,n)=>{let o=t.type==="observation"?t.data.created_at_epoch:t.data.displayEpoch,i=n.type==="observation"?n.data.created_at_epoch:n.data.displayEpoch;return o-i}),s}function ss(r,e){return new Set(r.slice(0,e).map(s=>s.id))}function ts(){let r=new Date,e=r.toLocaleDateString("en-CA"),s=r.toLocaleTimeString("en-US",{hour:"numeric",minute:"2-digit",hour12:!0}).toLowerCase().replace(" ",""),t=r.toLocaleTimeString("en-US",{timeZoneName:"short"}).split(" ").pop();return`${e} ${s} ${t}`}function rs(r){return[`# [${r}] recent context, ${ts()}`,""]}function ns(){return[`Legend: \u{1F3AF}session ${L.getInstance().getActiveMode().observation_types.map(s=>`${s.emoji}${s.id}`).join(" ")}`,"Format: ID TIME TYPE TITLE","Fetch details: get_observations([IDs]) | Search: mem-search skill",""]}function os(r,e){let s=[],t=[`${r.totalObservations} obs (${r.totalReadTokens.toLocaleString()}t read)`,`${r.totalDiscoveryTokens.toLocaleString()}t work`];return r.totalDiscoveryTokens>0&&(e.showSavingsAmount||e.showSavingsPercent)&&(e.showSavingsPercent?t.push(`${r.savingsPercent}% savings`):e.showSavingsAmount&&t.push(`${r.savings.toLocaleString()}t saved`)),s.push(`Stats: ${t.join(" | ")}`),s.push(""),s}function is(r){return[`### ${r}`]}function as(r){return r.toLowerCase().replace(" am","a").replace(" pm","p")}function ds(r,e,s){let t=r.title||"Untitled",n=L.getInstance().getTypeIcon(r.type),o=e?as(e):'"';return`${r.id} ${o} ${n} ${t}`}function Es(r,e,s,t){let n=[],o=r.title||"Untitled",i=L.getInstance().getTypeIcon(r.type),a=e?as(e):'"',{readTokens:d,discoveryDisplay:E}=B(r,t);n.push(`**${r.id}** ${a} ${i} **${o}**`),s&&n.push(s);let u=[];return t.showReadTokens&&u.push(`~${d}t`),t.showWorkTokens&&u.push(E),u.length>0&&n.push(u.join(" ")),n.push(""),n}function _s(r,e){return[`S${r.id} ${r.request||"Session started"} (${e})`]}function j(r,e){return e?[`**${r}**: ${e}`,""]:[]}function us(r){return r.assistantMessage?["","---","","**Previously**","",`A: ${r.assistantMessage}`,""]:[]}function ms(r,e){return["",`Access ${Math.round(r/1e3)}k tokens of past work via get_observations([IDs]) or mem-search skill.`]}function ps(r){return`# [${r}] recent context, ${ts()}

No previous sessions found.`}function cs(){let r=new Date,e=r.toLocaleDateString("en-CA"),s=r.toLocaleTimeString("en-US",{hour:"numeric",minute:"2-digit",hour12:!0}).toLowerCase().replace(" ",""),t=r.toLocaleTimeString("en-US",{timeZoneName:"short"}).split(" ").pop();return`${e} ${s} ${t}`}function ls(r){return["",`${m.bright}${m.cyan}[${r}] recent context, ${cs()}${m.reset}`,`${m.gray}${"\u2500".repeat(60)}${m.reset}`,""]}function Ts(){let e=L.getInstance().getActiveMode().observation_types.map(s=>`${s.emoji} ${s.id}`).join(" | ");return[`${m.dim}Legend: session-request | ${e}${m.reset}`,""]}function Os(){return[`${m.bright}Column Key${m.reset}`,`${m.dim}  Read: Tokens to read this observation (cost to learn it now)${m.reset}`,`${m.dim}  Work: Tokens spent on work that produced this record ( research, building, deciding)${m.reset}`,""]}function gs(){return[`${m.dim}Context Index: This semantic index (titles, types, files, tokens) is usually sufficient to understand past work.${m.reset}`,"",`${m.dim}When you need implementation details, rationale, or debugging context:${m.reset}`,`${m.dim}  - Fetch by ID: get_observations([IDs]) for observations visible in this index${m.reset}`,`${m.dim}  - Search history: Use the mem-search skill for past decisions, bugs, and deeper research${m.reset}`,`${m.dim}  - Trust this index over re-reading code for past decisions and learnings${m.reset}`,""]}function Ss(r,e){let s=[];if(s.push(`${m.bright}${m.cyan}Context Economics${m.reset}`),s.push(`${m.dim}  Loading: ${r.totalObservations} observations (${r.totalReadTokens.toLocaleString()} tokens to read)${m.reset}`),s.push(`${m.dim}  Work investment: ${r.totalDiscoveryTokens.toLocaleString()} tokens spent on research, building, and decisions${m.reset}`),r.totalDiscoveryTokens>0&&(e.showSavingsAmount||e.showSavingsPercent)){let t="  Your savings: ";e.showSavingsAmount&&e.showSavingsPercent?t+=`${r.savings.toLocaleString()} tokens (${r.savingsPercent}% reduction from reuse)`:e.showSavingsAmount?t+=`${r.savings.toLocaleString()} tokens`:t+=`${r.savingsPercent}% reduction from reuse`,s.push(`${m.green}${t}${m.reset}`)}return s.push(""),s}function fs(r){return[`${m.bright}${m.cyan}${r}${m.reset}`,""]}function Ns(r){return[`${m.dim}${r}${m.reset}`]}function Rs(r,e,s,t){let n=r.title||"Untitled",o=L.getInstance().getTypeIcon(r.type),{readTokens:i,discoveryTokens:a,workEmoji:d}=B(r,t),E=s?`${m.dim}${e}${m.reset}`:" ".repeat(e.length),u=t.showReadTokens&&i>0?`${m.dim}(~${i}t)${m.reset}`:"",p=t.showWorkTokens&&a>0?`${m.dim}(${d} ${a.toLocaleString()}t)${m.reset}`:"";return`  ${m.dim}#${r.id}${m.reset}  ${E}  ${o}  ${n} ${u} ${p}`}function bs(r,e,s,t,n){let o=[],i=r.title||"Untitled",a=L.getInstance().getTypeIcon(r.type),{readTokens:d,discoveryTokens:E,workEmoji:u}=B(r,n),p=s?`${m.dim}${e}${m.reset}`:" ".repeat(e.length),c=n.showReadTokens&&d>0?`${m.dim}(~${d}t)${m.reset}`:"",O=n.showWorkTokens&&E>0?`${m.dim}(${u} ${E.toLocaleString()}t)${m.reset}`:"";return o.push(`  ${m.dim}#${r.id}${m.reset}  ${p}  ${a}  ${m.bright}${i}${m.reset}`),t&&o.push(`    ${m.dim}${t}${m.reset}`),(c||O)&&o.push(`    ${c} ${O}`),o.push(""),o}function hs(r,e){let s=`${r.request||"Session started"} (${e})`;return[`${m.yellow}#S${r.id}${m.reset} ${s}`,""]}function W(r,e,s){return e?[`${s}${r}:${m.reset} ${e}`,""]:[]}function Is(r){return r.assistantMessage?["","---","",`${m.bright}${m.magenta}Previously${m.reset}`,"",`${m.dim}A: ${r.assistantMessage}${m.reset}`,""]:[]}function Cs(r,e){let s=Math.round(r/1e3);return["",`${m.dim}Access ${s}k tokens of past research & decisions for just ${e.toLocaleString()}t. Use the opencode-mem skill to access memories by ID.${m.reset}`]}function As(r){return`
${m.bright}${m.cyan}[${r}] recent context, ${cs()}${m.reset}
${m.gray}${"\u2500".repeat(60)}${m.reset}

${m.dim}No previous sessions found for this project yet.${m.reset}
`}function Ds(r,e,s,t){let n=[];return t?n.push(...ls(r)):n.push(...rs(r)),t?n.push(...Ts()):n.push(...ns()),t&&(n.push(...Os()),n.push(...gs())),Z(s)&&(t?n.push(...Ss(e,s)):n.push(...os(e,s))),n}var Oe=$(require("path"),1);function re(r){if(!r)return[];try{let e=JSON.parse(r);return Array.isArray(e)?e:[]}catch(e){return _.debug("PARSER","Failed to parse JSON array, using empty fallback",{preview:r?.substring(0,50)},e instanceof Error?e:new Error(String(e))),[]}}function ge(r){return new Date(r).toLocaleString("en-US",{month:"short",day:"numeric",hour:"numeric",minute:"2-digit",hour12:!0})}function Se(r){return new Date(r).toLocaleString("en-US",{hour:"numeric",minute:"2-digit",hour12:!0})}function Ls(r){return new Date(r).toLocaleString("en-US",{month:"short",day:"numeric",year:"numeric"})}function Ms(r,e){return Oe.default.isAbsolute(r)?Oe.default.relative(e,r):r}function vs(r,e,s){let t=re(r);if(t.length>0)return Ms(t[0],e);if(s){let n=re(s);if(n.length>0)return Ms(n[0],e)}return"General"}function ft(r){let e=new Map;for(let t of r){let n=t.type==="observation"?t.data.created_at:t.data.displayTime,o=Ls(n);e.has(o)||e.set(o,[]),e.get(o).push(t)}let s=Array.from(e.entries()).sort((t,n)=>{let o=new Date(t[0]).getTime(),i=new Date(n[0]).getTime();return o-i});return new Map(s)}function ys(r,e){return e.fullObservationField==="narrative"?r.narrative:r.facts?re(r.facts).join(`
`):null}function Nt(r,e,s,t){let n=[];n.push(...is(r));let o="";for(let i of e)if(i.type==="summary"){let a=i.data,d=ge(a.displayTime);n.push(..._s(a,d))}else{let a=i.data,d=Se(a.created_at),u=d!==o?d:"";if(o=d,s.has(a.id)){let c=ys(a,t);n.push(...Es(a,u,c,t))}else n.push(ds(a,u,t))}return n}function Rt(r,e,s,t,n){let o=[];o.push(...fs(r));let i=null,a="";for(let d of e)if(d.type==="summary"){i=null,a="";let E=d.data,u=ge(E.displayTime);o.push(...hs(E,u))}else{let E=d.data,u=vs(E.files_modified,n,E.files_read),p=Se(E.created_at),c=p!==a;a=p;let O=s.has(E.id);if(u!==i&&(o.push(...Ns(u)),i=u),O){let h=ys(E,t);o.push(...bs(E,p,c,h,t))}else o.push(Rs(E,p,c,t))}return o.push(""),o}function bt(r,e,s,t,n,o){return o?Rt(r,e,s,t,n):Nt(r,e,s,t)}function Ps(r,e,s,t,n){let o=[],i=ft(r);for(let[a,d]of i)o.push(...bt(a,d,e,s,t,n));return o}function xs(r,e,s){return!(!r.showLastSummary||!e||!!!(e.investigated||e.learned||e.completed||e.next_steps)||s&&e.created_at_epoch<=s.created_at_epoch)}function Us(r,e){let s=[];return e?(s.push(...W("Investigated",r.investigated,m.blue)),s.push(...W("Learned",r.learned,m.yellow)),s.push(...W("Completed",r.completed,m.green)),s.push(...W("Next Steps",r.next_steps,m.magenta))):(s.push(...j("Investigated",r.investigated)),s.push(...j("Learned",r.learned)),s.push(...j("Completed",r.completed)),s.push(...j("Next Steps",r.next_steps))),s}function ks(r,e){return e?Is(r):us(r)}function ws(r,e,s){return!Z(e)||r.totalDiscoveryTokens<=0||r.savings<=0?[]:s?Cs(r.totalDiscoveryTokens,r.totalReadTokens):ms(r.totalDiscoveryTokens,r.totalReadTokens)}var ht=Fs.default.join((0,$s.homedir)(),".claude","plugins","marketplaces","thedotmack","plugin",".install-version");function It(){try{return new K}catch(r){if(r instanceof Error&&r.code==="ERR_DLOPEN_FAILED"){try{(0,Hs.unlinkSync)(ht)}catch(e){e instanceof Error?_.debug("WORKER","Marker file cleanup failed (may not exist)",{},e):_.debug("WORKER","Marker file cleanup failed (may not exist)",{error:String(e)})}return _.error("WORKER","Native module rebuild needed - restart Claude Code to auto-fix"),null}throw r}}function Ct(r,e){return e?As(r):ps(r)}function At(r,e,s,t,n,o,i){let a=[],d=Te(e);a.push(...Ds(r,d,t,i));let E=s.slice(0,t.sessionCount),u=Ze(E,s),p=es(e,u),c=ss(e,t.fullObservationCount);a.push(...Ps(p,c,t,n,i));let O=s[0],h=e[0];xs(t,O,h)&&a.push(...Us(O,i));let b=ze(e,t,o,n);return a.push(...ks(b,i)),a.push(...ws(d,t,i)),a.join(`
`).trimEnd()}var Dt=new Set(["bugfix","discovery","decision","refactor"]);function Mt(r,e,s){let t=Te(r),n={bugfix:0,discovery:0,decision:0,refactor:0,other:0},o=new Set,i=Number.POSITIVE_INFINITY;for(let d of r){let E=Dt.has(d.type)?d.type:"other";n[E]++,d.memory_session_id&&o.add(d.memory_session_id),d.created_at_epoch&&d.created_at_epoch<i&&(i=d.created_at_epoch)}let a=Number.isFinite(i)?Math.max(0,Math.floor((Date.now()-i)/864e5)):0;return{observation_count:r.length,session_count:o.size,timeline_depth_days:a,has_session_summary:e.length>0,obs_type_bugfix:n.bugfix,obs_type_discovery:n.discovery,obs_type_decision:n.decision,obs_type_refactor:n.refactor,obs_type_other:n.other,tokens_injected:t.totalReadTokens,tokens_saved_vs_naive:t.savings,search_strategy:s?"full":"timeline"}}async function fe(r,e=!1){let s=We(),t=r?.cwd??process.cwd(),n=Be(t),o=r?.projects?.length?r.projects:n.allProjects,i=o[o.length-1]??n.primary;r?.full&&(s.totalObservationCount=999999,s.sessionCount=999999);let a=It();if(!a)return{text:"",stats:null};try{let d=r?.platformSource?A(r.platformSource):void 0,E=o.length>1?o:[i],u=Je(a,E,s,d),p=Qe(a,E,s,d);return u.length===0&&p.length===0?{text:Ct(i,e),stats:null}:{text:At(i,u,p,s,t,r?.session_id,e),stats:Mt(u,p,!!r?.full)}}finally{a.close()}}async function Gs(r,e=!1){return(await fe(r,e)).text}0&&(module.exports={generateContext,generateContextWithStats});
