import express, { Request, Response } from 'express';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import { WebSocketServer, WebSocket } from 'ws';
import ssh2 from 'ssh2';
import fs from 'fs';

const { Client } = ssh2;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '15mb' }));

// Helper to sanitize error messages for security
function sanitizeErrorMessage(err: any): string {
  if (!err) return 'Unknown error occurred';
  const msg = err.message || String(err);
  if (msg.includes('All configured authentication methods failed')) {
    return 'Authentication failed: Invalid username, password, or private key passphrase.';
  }
  if (msg.includes('ETIMEDOUT') || msg.includes('timed out')) {
    return 'Connection timed out: Server did not respond. Check host address and port 22 firewall.';
  }
  if (msg.includes('ECONNREFUSED')) {
    return 'Connection refused: No SSH service listening on the specified port.';
  }
  if (msg.includes('ENOTFOUND')) {
    return 'Host not found: Domain or IP could not be resolved.';
  }
  return msg;
}

// Built-in Demo Shell Sandbox for instant interactive testing without external VPS
class DemoShell {
  private ws: WebSocket;
  private currentDir: string = '/root';
  private commandHistory: string[] = [];
  private inputBuffer: string = '';
  private isClosed: boolean = false;
  private promptStr: string = '\x1b[1;32mroot@ubuntu-srv\x1b[0m:\x1b[1;34m~\x1b[0m# ';

  constructor(ws: WebSocket) {
    this.ws = ws;
    this.init();
  }

  private send(data: string) {
    if (this.isClosed || this.ws.readyState !== WebSocket.OPEN) return;
    this.ws.send(JSON.stringify({ type: 'data', data }));
  }

  private init() {
    this.send('\r\n\x1b[1;36m  ___ _                 _              ___ ___ _  _ \x1b[0m\r\n');
    this.send('\x1b[1;36m |_ _| |_ ___ _ _ _ __ | |_  _ _ ___  / __/ __| || |\x1b[0m\r\n');
    this.send('\x1b[1;36m  | ||  _/ -_) \'_| \'  \\| | || (_-<_-<  \\__ \\__ \\ __ |\x1b[0m\r\n');
    this.send('\x1b[1;36m |___|\\__\\___|_| |_|_|_|_|\\_,_/__/__/  |___/___/_||_|\x1b[0m\r\n');
    this.send('\r\n\x1b[90mWelcome to Ubuntu 24.04.1 LTS (GNU/Linux 6.8.0-45-generic x86_64)\x1b[0m\r\n');
    this.send('\x1b[90m * Documentation:  https://help.ubuntu.com\x1b[0m\r\n');
    this.send('\x1b[90m * Management:     https://landscape.canonical.com\x1b[0m\r\n');
    this.send('\x1b[90m * Support:        https://ubuntu.com/pro\x1b[0m\r\n\r\n');
    this.send('System information as of ' + new Date().toUTCString() + '\r\n');
    this.send('  System load:  0.14, 0.08, 0.03        Memory usage: 28% of 16GB\r\n');
    this.send('  Processes:    118                     IPv4 address: 198.51.100.24\r\n\r\n');
    this.send('Last login: ' + new Date(Date.now() - 3600000).toUTCString() + ' from 192.0.2.1 via TermPulse Android\r\n\r\n');
    this.send(this.promptStr);
  }

  public handleInput(data: string) {
    for (let i = 0; i < data.length; i++) {
      const char = data[i];
      const code = char.charCodeAt(0);

      // Backspace
      if (code === 127 || code === 8) {
        if (this.inputBuffer.length > 0) {
          this.inputBuffer = this.inputBuffer.slice(0, -1);
          this.send('\b \b');
        }
        continue;
      }

      // Enter / Return
      if (char === '\r' || char === '\n') {
        this.send('\r\n');
        this.executeCommand(this.inputBuffer.trim());
        this.inputBuffer = '';
        continue;
      }

      // Ctrl + C
      if (code === 3) {
        this.send('^C\r\n' + this.promptStr);
        this.inputBuffer = '';
        continue;
      }

      // Ctrl + L (Clear)
      if (code === 12) {
        this.send('\x1b[2J\x1b[H' + this.promptStr + this.inputBuffer);
        continue;
      }

      // Tab completion simulation
      if (code === 9) {
        const available = ['ls', 'cd', 'cat', 'pwd', 'whoami', 'uname', 'docker', 'pm2', 'htop', 'neofetch', 'systemctl', 'git', 'clear', 'help'];
        const matches = available.filter(cmd => cmd.startsWith(this.inputBuffer));
        if (matches.length === 1) {
          const rest = matches[0].slice(this.inputBuffer.length) + ' ';
          this.inputBuffer = matches[0] + ' ';
          this.send(rest);
        } else if (matches.length > 1) {
          this.send('\r\n' + matches.join('   ') + '\r\n' + this.promptStr + this.inputBuffer);
        }
        continue;
      }

      // Printable chars
      if (code >= 32 && code <= 126) {
        this.inputBuffer += char;
        this.send(char);
      }
    }
  }

  private executeCommand(cmd: string) {
    if (!cmd) {
      this.send(this.promptStr);
      return;
    }

    const parts = cmd.split(' ').filter(Boolean);
    const main = parts[0].toLowerCase();
    const args = parts.slice(1);

    switch (main) {
      case 'clear':
        this.send('\x1b[2J\x1b[H');
        break;

      case 'help':
        this.send('\x1b[1mTermPulse Sandbox Available Commands:\x1b[0m\r\n');
        this.send('  ls, cd, pwd, whoami, uname, date, uptime, free, df\r\n');
        this.send('  cat, echo, pm2, docker, neofetch, htop, systemctl, ps\r\n');
        this.send('  clear, exit, help\r\n\r\n');
        this.send('\x1b[33mNote:\x1b[0m You can also connect to any real SSH server (VPS/Cloud) using the Add Server modal!\r\n');
        break;

      case 'pwd':
        this.send(this.currentDir + '\r\n');
        break;

      case 'whoami':
        this.send('root\r\n');
        break;

      case 'uname':
        if (args.includes('-a')) {
          this.send('Linux ubuntu-srv 6.8.0-45-generic #45-Ubuntu SMP PREEMPT_DYNAMIC x86_64 GNU/Linux\r\n');
        } else {
          this.send('Linux\r\n');
        }
        break;

      case 'date':
        this.send(new Date().toUTCString() + '\r\n');
        break;

      case 'uptime':
        this.send(' 14:52:10 up 42 days, 16:30,  1 user,  load average: 0.12, 0.08, 0.04\r\n');
        break;

      case 'ls':
        this.send('\x1b[1;34mbin\x1b[0m   \x1b[1;34metc\x1b[0m   \x1b[1;34mvar\x1b[0m   \x1b[1;34mopt\x1b[0m   \x1b[1;32mserver.js\x1b[0m   \x1b[0mdocker-compose.yml\x1b[0m   \x1b[1;34mprojects\x1b[0m\r\n');
        break;

      case 'cd':
        if (!args[0] || args[0] === '~') {
          this.currentDir = '/root';
          this.promptStr = '\x1b[1;32mroot@ubuntu-srv\x1b[0m:\x1b[1;34m~\x1b[0m# ';
        } else {
          this.currentDir = args[0].startsWith('/') ? args[0] : `${this.currentDir}/${args[0]}`;
          this.promptStr = `\x1b[1;32mroot@ubuntu-srv\x1b[0m:\x1b[1;34m${this.currentDir}\x1b[0m# `;
        }
        break;

      case 'cat':
        if (args[0]?.includes('docker')) {
          this.send('services:\r\n  api:\r\n    image: node:22-alpine\r\n    ports:\r\n      - "8080:8080"\r\n    restart: always\r\n');
        } else if (args[0]?.includes('server')) {
          this.send('import http from "http";\r\nconst s = http.createServer((q, r) => r.end("OK"));\r\ns.listen(8080);\r\n');
        } else {
          this.send('# Configuration file\r\nPORT=8080\r\nNODE_ENV=production\r\nSECRET=super-secure-key\r\n');
        }
        break;

      case 'pm2':
        if (args[0] === 'logs' || args[0] === 'log') {
          this.send('\x1b[90m[TAILING] Tailing last 15 lines for [all] processes (press Ctrl+C to exit)\x1b[0m\r\n');
          this.send('\x1b[36m0|quantura-bot\x1b[0m | (+0.1x ATR above EMA20). Avoid buying the top.)\r\n');
          this.send('\x1b[36m0|quantura-bot\x1b[0m | \x1b[33m[ENTRY BLOCKED]\x1b[0m \x1b[1mXRPUSDT\x1b[0m Strategy Institutional SMC proposed LONG, but Entry Confirmation Engine issued WAIT (Anti-Chase Triggered: Price is overextended (+0.1x ATR above EMA20). Avoid buying the top.)\r\n');
          this.send('\x1b[36m0|quantura-bot\x1b[0m | \x1b[33m[ENTRY BLOCKED]\x1b[0m \x1b[1mINJUSDT\x1b[0m Strategy Institutional SMC proposed LONG, but Entry Confirmation Engine issued WAIT (Indecisive quantitative score: insufficient directional consensus)\r\n');
          this.send('\x1b[36m0|quantura-bot\x1b[0m | [HEARTBEAT] WebSocket connection healthy · latency: 14ms · Binance Futures stream active\r\n');
        } else if (args[0] === 'status' || args[0] === 'list' || !args[0]) {
          this.send('┌─────┬────────────────┬─────────────┬─────────┬───────────┬────────┬──────────┐\r\n');
          this.send('│ id  │ name           │ namespace   │ version │ mode      │ pid    │ status   │\r\n');
          this.send('├─────┼────────────────┼─────────────┼─────────┼───────────┼────────┼──────────┤\r\n');
          this.send('│ 0   │ quantura-bot   │ default     │ 2.4.0   │ cluster   │ 14209  │ \x1b[32monline\x1b[0m   │\r\n');
          this.send('│ 1   │ api-gateway    │ default     │ 1.1.2   │ fork      │ 14210  │ \x1b[32monline\x1b[0m   │\r\n');
          this.send('│ 2   │ redis-syncer   │ default     │ 0.9.4   │ fork      │ 14212  │ \x1b[32monline\x1b[0m   │\r\n');
          this.send('└─────┴────────────────┴─────────────┴─────────┴───────────┴────────┴──────────┘\r\n');
        } else {
          this.send(`[PM2] Executing action: ${args.join(' ')}\r\n[PM2] Done.\r\n`);
        }
        break;

      case 'docker':
        if (args[0] === 'ps') {
          this.send('CONTAINER ID   IMAGE                 COMMAND                  CREATED        STATUS        PORTS                    NAMES\r\n');
          this.send('8a12f94b8e21   nginx:alpine          "/docker-entrypoint.…"   3 days ago     Up 3 days     0.0.0.0:80->80/tcp       reverse-proxy\r\n');
          this.send('c302d9178bb4   postgres:16-alpine    "docker-entrypoint.s…"   2 weeks ago    Up 2 weeks    0.0.0.0:5432->5432/tcp   postgres-db\r\n');
          this.send('07b941ec5e92   redis:7-alpine        "docker-entrypoint.s…"   2 weeks ago    Up 2 weeks    0.0.0.0:6379->6379/tcp   cache-store\r\n');
        } else {
          this.send(`Docker version 27.3.1, build ce12230\r\n`);
        }
        break;

      case 'neofetch':
        this.send('\x1b[1;31m            .-/+oossssoo+/-.               \x1b[1;37mroot@ubuntu-srv\x1b[0m\r\n');
        this.send('\x1b[1;31m        `:+ssssssssssssssssss+:`           \x1b[0m----------------\r\n');
        this.send('\x1b[1;31m      -+ssssssssssssssssssyyssss+-         \x1b[1mOS\x1b[0m: Ubuntu 24.04.1 LTS x86_64\r\n');
        this.send('\x1b[1;31m    .ossssssssssssssssssdMMMNysssso.       \x1b[1mHost\x1b[0m: KVM / Cloud VPS\r\n');
        this.send('\x1b[1;31m   /ssssssssssshdmmNNmmyNMMMMhssssss/      \x1b[1mKernel\x1b[0m: 6.8.0-45-generic\r\n');
        this.send('\x1b[1;31m  +ssssssssshmydMMMMMMMNddddyssssssss+     \x1b[1mUptime\x1b[0m: 42 days, 16 hours\r\n');
        this.send('\x1b[1;31m /sssssssshNMMMyhhyyyyhmNMMMNhssssssss/    \x1b[1mPackages\x1b[0m: 892 (dpkg)\r\n');
        this.send('\x1b[1;31m.ssssssssdMMMNhsssssssssshNMMMdssssssss.   \x1b[1mShell\x1b[0m: bash 5.2.21\r\n');
        this.send('\x1b[1;31m+ssssssshNMMNyssssssssssssyNMMMysssssss+   \x1b[1mCPU\x1b[0m: AMD EPYC 9654 4-Core (4) @ 2.400GHz\r\n');
        this.send('\x1b[1;31m+ssssssshNMMNyssssssssssssyNMMMysssssss+   \x1b[1mMemory\x1b[0m: 4381MiB / 16000MiB\r\n');
        this.send('\x1b[1;31m.ssssssssdMMMNhsssssssssshNMMMdssssssss.   \x1b[1mDisk (/)\x1b[0m: 32G / 120G (27%)\r\n');
        this.send('\x1b[1;31m /sssssssshNMMMyhhyyyyhdNMMMNhssssssss/    \r\n');
        this.send('\x1b[1;31m  +ssssssssshmydMMMMMMMNddddyssssssss+     \r\n');
        this.send('\x1b[1;31m   /ssssssssssshdmNNNNmyNMMMMhssssss/      \r\n');
        this.send('\x1b[1;31m    .ossssssssssssssssssdMMMNysssso.       \r\n');
        this.send('\x1b[1;31m      -+ssssssssssssssssssyyssss+-         \r\n');
        this.send('\x1b[1;31m        `:+ssssssssssssssssss+:`           \r\n');
        this.send('\x1b[1;31m            .-/+oossssoo+/-.               \r\n');
        break;

      case 'htop':
        this.send('\x1b[1;37;44m CPU[||||||||||||                    28.4%]   Tasks: 42, 118 thr; 1 running \x1b[0m\r\n');
        this.send('\x1b[1;37;44m Mem[||||||||||||||||||||||    4.38G/16.0G]   Load average: 0.14 0.08 0.03  \x1b[0m\r\n');
        this.send('\x1b[1;37;44m Swp[                               0K/4.0G]   Uptime: 42 days, 16:30:14     \x1b[0m\r\n\r\n');
        this.send('  PID USER      PRI  NI  VIRT   RES   SHR S CPU% MEM%   TIME+  Command\r\n');
        this.send(' 14209 root       20   0 1024M  180M 32400 S  4.2  1.1  2:14.20 node /root/api\r\n');
        this.send(' 14210 root       20   0  512M   95M 28100 S  2.1  0.6  1:05.12 node /root/worker\r\n');
        this.send('  1205 systemd    20   0  160M   18M 11200 S  0.1  0.1  0:12.80 /lib/systemd/systemd\r\n');
        this.send('  3412 postgres   20   0  820M  240M 84000 S  1.5  1.5  5:40.18 postgres: checkpointer\r\n');
        this.send('  9821 redis      20   0   84M   32M 16000 S  0.5  0.2  0:45.30 redis-server *:6379\r\n');
        break;

      case 'systemctl':
        this.send('● docker.service - Docker Application Container Engine\r\n   Loaded: loaded (/lib/systemd/system/docker.service; enabled)\r\n   Active: \x1b[32mactive (running)\x1b[0m since Tue 2026-08-12 04:12:00 UTC; 42 days ago\r\n');
        break;

      case 'ps':
        this.send('  PID TTY          TIME CMD\r\n 9421 pts/0    00:00:00 bash\r\n 9480 pts/0    00:00:00 ps\r\n');
        break;

      case 'exit':
        this.send('\r\nConnection to ubuntu-srv closed.\r\n');
        this.ws.close();
        return;

      default:
        this.send(`bash: ${main}: command not found\r\n`);
    }

    this.send(this.promptStr);
  }

  public destroy() {
    this.isClosed = true;
  }
}

// 1. SSH Connection Test endpoint
app.post('/api/ssh/test', (req: Request, res: Response): void => {
  const { host, port = 22, username, password, privateKey, passphrase } = req.body;

  if (!host || !username) {
    res.status(400).json({ success: false, error: 'Host and Username are required' });
    return;
  }

  // Demo Server handling
  if (host === 'demo.termpulse.internal' || host === 'demo' || host.includes('termpulse.internal')) {
    setTimeout(() => {
      res.json({
        success: true,
        latencyMs: Math.floor(Math.random() * 25) + 12,
        serverBanner: 'SSH-2.0-OpenSSH_9.6p1 Ubuntu-3ubuntu13',
        os: 'Ubuntu 24.04.1 LTS',
      });
    }, 450);
    return;
  }

  const startTime = Date.now();
  const conn = new Client();
  let finished = false;

  const timer = setTimeout(() => {
    if (!finished) {
      finished = true;
      try { conn.end(); } catch {}
      res.status(504).json({ success: false, error: 'Connection timed out after 10 seconds' });
    }
  }, 10000);

  conn.on('ready', () => {
    if (finished) return;
    finished = true;
    clearTimeout(timer);
    const latencyMs = Date.now() - startTime;
    conn.end();
    res.json({
      success: true,
      latencyMs,
      serverBanner: 'Connected successfully',
      os: 'Remote Linux Server',
    });
  });

  conn.on('error', (err: any) => {
    if (finished) return;
    finished = true;
    clearTimeout(timer);
    res.status(500).json({ success: false, error: sanitizeErrorMessage(err) });
  });

  try {
    const config: ssh2.ConnectConfig = {
      host,
      port: Number(port) || 22,
      username,
      readyTimeout: 9000,
    };

    if (privateKey) {
      config.privateKey = privateKey;
      if (passphrase) config.passphrase = passphrase;
    } else if (password) {
      config.password = password;
    }

    conn.connect(config);
  } catch (err: any) {
    if (finished) return;
    finished = true;
    clearTimeout(timer);
    res.status(500).json({ success: false, error: sanitizeErrorMessage(err) });
  }
});

// 2. SFTP List Directory endpoint
app.post('/api/sftp/list', (req: Request, res: Response): void => {
  const { host, port = 22, username, password, privateKey, passphrase, remotePath = '/' } = req.body;

  // Demo fallback
  if (host === 'demo.termpulse.internal' || host === 'demo' || host?.includes('termpulse.internal')) {
    const p = remotePath === '/' ? '/root' : remotePath;
    const demoFiles = [
      { name: '..', isDirectory: true, isFile: false, size: 4096, modifyTime: Date.now() - 86400000, permissions: 'drwxr-xr-x', owner: 'root' },
      { name: 'projects', isDirectory: true, isFile: false, size: 4096, modifyTime: Date.now() - 3600000, permissions: 'drwxr-xr-x', owner: 'root' },
      { name: 'docker-compose.yml', isDirectory: false, isFile: true, size: 1420, modifyTime: Date.now() - 172800000, permissions: '-rw-r--r--', owner: 'root' },
      { name: 'server.js', isDirectory: false, isFile: true, size: 4210, modifyTime: Date.now() - 7200000, permissions: '-rwxr-xr-x', owner: 'root' },
      { name: 'package.json', isDirectory: false, isFile: true, size: 840, modifyTime: Date.now() - 28800000, permissions: '-rw-r--r--', owner: 'root' },
      { name: '.env.production', isDirectory: false, isFile: true, size: 310, modifyTime: Date.now() - 43200000, permissions: '-rw-------', owner: 'root' },
      { name: 'deploy.sh', isDirectory: false, isFile: true, size: 1250, modifyTime: Date.now() - 86400000, permissions: '-rwxr-xr-x', owner: 'root' },
      { name: 'nginx.conf', isDirectory: false, isFile: true, size: 2180, modifyTime: Date.now() - 259200000, permissions: '-rw-r--r--', owner: 'root' },
      { name: 'ssl', isDirectory: true, isFile: false, size: 4096, modifyTime: Date.now() - 500000000, permissions: 'drwx------', owner: 'root' },
    ];
    res.json({ success: true, currentPath: p, files: demoFiles });
    return;
  }

  const conn = new Client();
  let finished = false;

  const timer = setTimeout(() => {
    if (!finished) {
      finished = true;
      try { conn.end(); } catch {}
      res.status(504).json({ success: false, error: 'SFTP connection timed out' });
    }
  }, 12000);

  conn.on('ready', () => {
    conn.sftp((err, sftp) => {
      if (err) {
        if (finished) return;
        finished = true;
        clearTimeout(timer);
        conn.end();
        res.status(500).json({ success: false, error: sanitizeErrorMessage(err) });
        return;
      }

      sftp.readdir(remotePath, (readErr, list) => {
        if (finished) return;
        finished = true;
        clearTimeout(timer);
        conn.end();

        if (readErr) {
          res.status(500).json({ success: false, error: sanitizeErrorMessage(readErr) });
          return;
        }

        const files = list.map(item => {
          const isDir = (item.attrs.mode & 0o040000) === 0o040000;
          return {
            name: item.filename,
            isDirectory: isDir,
            isFile: !isDir,
            size: item.attrs.size,
            modifyTime: item.attrs.mtime * 1000,
            permissions: item.longname?.split(' ')[0] || (isDir ? 'drwxr-xr-x' : '-rw-r--r--'),
            owner: username,
          };
        });

        res.json({ success: true, currentPath: remotePath, files });
      });
    });
  });

  conn.on('error', (err: any) => {
    if (finished) return;
    finished = true;
    clearTimeout(timer);
    res.status(500).json({ success: false, error: sanitizeErrorMessage(err) });
  });

  try {
    const config: ssh2.ConnectConfig = {
      host,
      port: Number(port) || 22,
      username,
      readyTimeout: 10000,
    };
    if (privateKey) {
      config.privateKey = privateKey;
      if (passphrase) config.passphrase = passphrase;
    } else if (password) {
      config.password = password;
    }
    conn.connect(config);
  } catch (err: any) {
    if (finished) return;
    finished = true;
    clearTimeout(timer);
    res.status(500).json({ success: false, error: sanitizeErrorMessage(err) });
  }
});

// 3. SFTP Read File endpoint
app.post('/api/sftp/read', (req: Request, res: Response): void => {
  const { host, port = 22, username, password, privateKey, passphrase, filePath } = req.body;

  if (!filePath) {
    res.status(400).json({ success: false, error: 'filePath is required' });
    return;
  }

  // Demo fallback
  if (host === 'demo.termpulse.internal' || host === 'demo' || host?.includes('termpulse.internal')) {
    let content = `// Content of ${filePath}\nconsole.log("TermPulse Modern SSH Client");\n`;
    if (filePath.endsWith('.yml')) {
      content = 'services:\n  web:\n    image: node:22-alpine\n    ports:\n      - "3000:3000"\n    restart: unless-stopped\n';
    } else if (filePath.endsWith('package.json')) {
      content = JSON.stringify({ name: 'remote-service', version: '1.0.0', main: 'server.js', dependencies: { express: '^4.21.0' } }, null, 2);
    }
    res.json({ success: true, content });
    return;
  }

  const conn = new Client();
  let finished = false;

  conn.on('ready', () => {
    conn.sftp((err, sftp) => {
      if (err) {
        finished = true;
        conn.end();
        res.status(500).json({ success: false, error: sanitizeErrorMessage(err) });
        return;
      }

      sftp.readFile(filePath, (readErr, buffer) => {
        finished = true;
        conn.end();
        if (readErr) {
          res.status(500).json({ success: false, error: sanitizeErrorMessage(readErr) });
          return;
        }
        res.json({ success: true, content: buffer.toString('utf-8') });
      });
    });
  });

  conn.on('error', (err: any) => {
    if (finished) return;
    finished = true;
    res.status(500).json({ success: false, error: sanitizeErrorMessage(err) });
  });

  try {
    const config: ssh2.ConnectConfig = {
      host,
      port: Number(port) || 22,
      username,
      readyTimeout: 10000,
    };
    if (privateKey) {
      config.privateKey = privateKey;
      if (passphrase) config.passphrase = passphrase;
    } else if (password) {
      config.password = password;
    }
    conn.connect(config);
  } catch (err: any) {
    res.status(500).json({ success: false, error: sanitizeErrorMessage(err) });
  }
});

// 4. SFTP Write File endpoint
app.post('/api/sftp/write', (req: Request, res: Response): void => {
  const { host, port = 22, username, password, privateKey, passphrase, filePath, content } = req.body;

  if (!filePath || content === undefined) {
    res.status(400).json({ success: false, error: 'filePath and content are required' });
    return;
  }

  if (host === 'demo.termpulse.internal' || host === 'demo' || host?.includes('termpulse.internal')) {
    res.json({ success: true, message: 'File saved successfully in sandbox.' });
    return;
  }

  const conn = new Client();
  conn.on('ready', () => {
    conn.sftp((err, sftp) => {
      if (err) {
        conn.end();
        res.status(500).json({ success: false, error: sanitizeErrorMessage(err) });
        return;
      }
      sftp.writeFile(filePath, Buffer.from(content, 'utf-8'), (writeErr: any) => {
        conn.end();
        if (writeErr) {
          res.status(500).json({ success: false, error: sanitizeErrorMessage(writeErr) });
          return;
        }
        res.json({ success: true, message: 'File saved successfully' });
      });
    });
  });

  conn.on('error', (err: any) => {
    res.status(500).json({ success: false, error: sanitizeErrorMessage(err) });
  });

  try {
    const config: ssh2.ConnectConfig = { host, port: Number(port) || 22, username };
    if (privateKey) {
      config.privateKey = privateKey;
      if (passphrase) config.passphrase = passphrase;
    } else if (password) {
      config.password = password;
    }
    conn.connect(config);
  } catch (err: any) {
    res.status(500).json({ success: false, error: sanitizeErrorMessage(err) });
  }
});

// 5. SFTP Operations: mkdir, delete, rename
app.post('/api/sftp/operation', (req: Request, res: Response): void => {
  const { host, port = 22, username, password, privateKey, passphrase, operation, targetPath, newPath } = req.body;

  if (host === 'demo.termpulse.internal' || host === 'demo' || host?.includes('termpulse.internal')) {
    res.json({ success: true, message: `Operation ${operation} completed successfully.` });
    return;
  }

  const conn = new Client();
  conn.on('ready', () => {
    conn.sftp((err, sftp) => {
      if (err) {
        conn.end();
        res.status(500).json({ success: false, error: sanitizeErrorMessage(err) });
        return;
      }

      const callback = (opErr: any) => {
        conn.end();
        if (opErr) {
          res.status(500).json({ success: false, error: sanitizeErrorMessage(opErr) });
        } else {
          res.json({ success: true, message: `Operation ${operation} successful` });
        }
      };

      if (operation === 'mkdir') {
        sftp.mkdir(targetPath, callback);
      } else if (operation === 'delete') {
        sftp.unlink(targetPath, (unlinkErr) => {
          if (unlinkErr) {
            // Might be a directory
            sftp.rmdir(targetPath, callback);
          } else {
            callback(null);
          }
        });
      } else if (operation === 'rename' && newPath) {
        sftp.rename(targetPath, newPath, callback);
      } else {
        conn.end();
        res.status(400).json({ success: false, error: 'Unsupported operation' });
      }
    });
  });

  conn.on('error', (err: any) => {
    res.status(500).json({ success: false, error: sanitizeErrorMessage(err) });
  });

  try {
    const config: ssh2.ConnectConfig = { host, port: Number(port) || 22, username };
    if (privateKey) {
      config.privateKey = privateKey;
      if (passphrase) config.passphrase = passphrase;
    } else if (password) {
      config.password = password;
    }
    conn.connect(config);
  } catch (err: any) {
    res.status(500).json({ success: false, error: sanitizeErrorMessage(err) });
  }
});

// Setup HTTP & WebSocket server
const server = http.createServer(app);
const wss = new WebSocketServer({ noServer: true });

server.on('upgrade', (request, socket, head) => {
  const pathname = new URL(request.url || '', `http://${request.headers.host}`).pathname;
  if (pathname === '/ws/ssh') {
    wss.handleUpgrade(request, socket, head, (ws) => {
      wss.emit('connection', ws, request);
    });
  }
});

wss.on('connection', (ws: WebSocket) => {
  let sshClient: ssh2.Client | null = null;
  let sshStream: ssh2.ClientChannel | null = null;
  let demoShell: DemoShell | null = null;

  ws.on('message', (message: string) => {
    try {
      const msg = JSON.parse(message.toString());

      if (msg.type === 'connect') {
        const { host, port = 22, username, password, privateKey, passphrase, cols = 80, rows = 24 } = msg;

        // Check if demo server
        if (host === 'demo.termpulse.internal' || host === 'demo' || host?.includes('termpulse.internal')) {
          demoShell = new DemoShell(ws);
          return;
        }

        // Real SSH Connection
        sshClient = new Client();

        sshClient.on('ready', () => {
          ws.send(JSON.stringify({ type: 'status', status: 'connected' }));

          sshClient!.shell({ term: 'xterm-256color', cols: Number(cols) || 80, rows: Number(rows) || 24 }, (err, stream) => {
            if (err) {
              ws.send(JSON.stringify({ type: 'error', error: sanitizeErrorMessage(err) }));
              ws.close();
              return;
            }

            sshStream = stream;

            stream.on('data', (data: Buffer) => {
              if (ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({ type: 'data', data: data.toString('utf-8') }));
              }
            });

            stream.on('close', () => {
              if (ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({ type: 'status', status: 'disconnected', message: 'SSH session closed by remote server' }));
                ws.close();
              }
            });

            stream.stderr.on('data', (data: Buffer) => {
              if (ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({ type: 'data', data: data.toString('utf-8') }));
              }
            });
          });
        });

        sshClient.on('error', (err: any) => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: 'error', error: sanitizeErrorMessage(err) }));
            ws.close();
          }
        });

        sshClient.on('close', () => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: 'status', status: 'disconnected' }));
          }
        });

        const config: ssh2.ConnectConfig = {
          host,
          port: Number(port) || 22,
          username,
          readyTimeout: 10000,
          keepaliveInterval: 15000,
        };

        if (privateKey) {
          config.privateKey = privateKey;
          if (passphrase) config.passphrase = passphrase;
        } else if (password) {
          config.password = password;
        }

        sshClient.connect(config);
      } else if (msg.type === 'data') {
        if (demoShell) {
          demoShell.handleInput(msg.data);
        } else if (sshStream) {
          sshStream.write(msg.data);
        }
      } else if (msg.type === 'resize') {
        if (sshStream) {
          try {
            sshStream.setWindow(Number(msg.rows) || 24, Number(msg.cols) || 80, 0, 0);
          } catch {}
        }
      }
    } catch (err: any) {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'error', error: 'Internal message handler error: ' + sanitizeErrorMessage(err) }));
      }
    }
  });

  ws.on('close', () => {
    if (demoShell) {
      demoShell.destroy();
      demoShell = null;
    }
    if (sshStream) {
      try { sshStream.end(); } catch {}
      sshStream = null;
    }
    if (sshClient) {
      try { sshClient.end(); } catch {}
      sshClient = null;
    }
  });
});

// Configure Vite in development mode or serve static files in production
async function start() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: process.env.DISABLE_HMR !== 'true',
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    if (fs.existsSync(distPath)) {
      app.use(express.static(distPath));
      app.get('*', (_req: Request, res: Response) => {
        res.sendFile(path.resolve(distPath, 'index.html'));
      });
    }
  }

  server.listen(PORT, () => {
    console.log(`TermPulse SSH Server running on port ${PORT}`);
  });
}

start();
