export interface CommandSuggestion {
  text: string;
  display?: string;
  description: string;
  category: 'system' | 'docker' | 'git' | 'pm2' | 'network' | 'files' | 'service' | 'package' | 'database' | 'history' | 'snippet';
  syntax?: string;
}

export const COMMON_SUGGESTIONS: CommandSuggestion[] = [
  // 1. System Monitoring & Info
  { text: 'htop', description: 'Interactive process viewer and system resource monitor', category: 'system' },
  { text: 'neofetch', description: 'Display beautiful OS logo and hardware/kernel details', category: 'system' },
  { text: 'top', description: 'Real-time list of running processes and CPU/memory usage', category: 'system' },
  { text: 'uptime', description: 'Show how long the system has been running and load averages', category: 'system' },
  { text: 'free -h', description: 'Display amount of free and used memory in human-readable units', category: 'system' },
  { text: 'df -h', description: 'Show disk space usage for all mounted filesystems', category: 'system' },
  { text: 'uname -a', description: 'Print all system architecture, kernel, and OS info', category: 'system' },
  { text: 'whoami', description: 'Print effective current user name', category: 'system' },
  { text: 'id', description: 'Print user and group IDs', category: 'system' },
  { text: 'lscpu', description: 'Display detailed CPU architecture and core details', category: 'system' },
  { text: 'lsblk', description: 'List all block storage devices and partitions', category: 'system' },
  { text: 'hostnamectl', description: 'Query and change system hostname and related settings', category: 'system' },

  // 2. Docker & Containers
  { text: 'docker ps', description: 'List all running Docker containers with status and ports', category: 'docker' },
  { text: 'docker ps -a', description: 'List all Docker containers (running and stopped)', category: 'docker' },
  { text: 'docker compose up -d', description: 'Build, create, and start containers in the background', category: 'docker' },
  { text: 'docker compose down', description: 'Stop and remove containers, networks, and images', category: 'docker' },
  { text: 'docker compose logs -f', description: 'Follow live real-time logs of all compose services', category: 'docker' },
  { text: 'docker compose ps', description: 'List status of compose project containers', category: 'docker' },
  { text: 'docker compose restart', description: 'Restart all services defined in compose file', category: 'docker' },
  { text: 'docker logs -f --tail 100 ', description: 'Follow last 100 log lines of a specific container', category: 'docker', syntax: 'docker logs -f --tail 100 <container>' },
  { text: 'docker exec -it ', description: 'Open interactive bash/sh shell inside a running container', category: 'docker', syntax: 'docker exec -it <container> /bin/bash' },
  { text: 'docker images', description: 'List all locally stored Docker images and sizes', category: 'docker' },
  { text: 'docker system prune -af', description: 'Remove all unused containers, networks, and images', category: 'docker' },
  { text: 'docker stats', description: 'Display a live streaming usage of container resources', category: 'docker' },

  // 3. PM2 & Node.js
  { text: 'pm2 status', description: 'View table of all managed Node.js processes, memory, and status', category: 'pm2' },
  { text: 'pm2 list', description: 'List all active PM2 applications and worker instances', category: 'pm2' },
  { text: 'pm2 logs', description: 'Stream combined stdout and stderr logs for all PM2 apps', category: 'pm2' },
  { text: 'pm2 logs --lines 100', description: 'Show the last 100 log lines across PM2 applications', category: 'pm2' },
  { text: 'pm2 monit', description: 'Launch terminal dashboard monitoring CPU, memory, and events', category: 'pm2' },
  { text: 'pm2 restart all', description: 'Perform zero-downtime reload/restart of all applications', category: 'pm2' },
  { text: 'pm2 stop all', description: 'Stop all running PM2 applications without deleting configs', category: 'pm2' },
  { text: 'pm2 save', description: 'Save current process list to automatically restore on system boot', category: 'pm2' },
  { text: 'pm2 startup', description: 'Generate active startup script to launch PM2 on reboot', category: 'pm2' },
  { text: 'node -v && npm -v', description: 'Check installed Node.js and NPM package manager versions', category: 'pm2' },

  // 4. Systemd & Services
  { text: 'systemctl status ', description: 'Show runtime status, PID, and recent logs for a service', category: 'service', syntax: 'systemctl status <service>' },
  { text: 'systemctl restart ', description: 'Restart specified systemd daemon service', category: 'service', syntax: 'systemctl restart <service>' },
  { text: 'systemctl start ', description: 'Start specified systemd daemon service', category: 'service', syntax: 'systemctl start <service>' },
  { text: 'systemctl stop ', description: 'Stop specified systemd daemon service', category: 'service', syntax: 'systemctl stop <service>' },
  { text: 'systemctl reload ', description: 'Reload service configuration without dropping connections', category: 'service', syntax: 'systemctl reload <service>' },
  { text: 'systemctl enable --now ', description: 'Enable service to start on boot and immediately start it', category: 'service', syntax: 'systemctl enable --now <service>' },
  { text: 'journalctl -xeu ', description: 'Inspect systemd log messages with full error explanations', category: 'service', syntax: 'journalctl -xeu <service>' },
  { text: 'journalctl -f -u ', description: 'Follow live system log stream for specific service', category: 'service', syntax: 'journalctl -f -u <service>' },
  { text: 'journalctl --vacuum-time=3d', description: 'Clean systemd journal logs older than 3 days', category: 'service' },

  // 5. Git & Version Control
  { text: 'git status', description: 'Show working tree status, modified and untracked files', category: 'git' },
  { text: 'git log --oneline -n 10', description: 'Display compact commit history for the last 10 commits', category: 'git' },
  { text: 'git pull origin ', description: 'Fetch and integrate remote changes into current branch', category: 'git', syntax: 'git pull origin main' },
  { text: 'git push origin ', description: 'Update remote refs along with associated objects', category: 'git', syntax: 'git push origin main' },
  { text: 'git branch -a', description: 'List both local and remote tracking branches', category: 'git' },
  { text: 'git checkout ', description: 'Switch branches or restore working tree files', category: 'git', syntax: 'git checkout <branch>' },
  { text: 'git diff', description: 'Show changes between commits, commit and working tree', category: 'git' },
  { text: 'git stash', description: 'Stash the changes in a dirty working directory away', category: 'git' },
  { text: 'git stash pop', description: 'Apply and remove single stashed state from stash list', category: 'git' },

  // 6. Network & Ports
  { text: 'ss -tulpn', description: 'Display all listening TCP/UDP sockets with process names and PIDs', category: 'network' },
  { text: 'netstat -tulpn', description: 'List listening ports and active socket connections', category: 'network' },
  { text: 'ufw status verbose', description: 'Check Uncomplicated Firewall rules, status, and ports', category: 'network' },
  { text: 'ufw allow ', description: 'Allow incoming traffic on specified port or protocol', category: 'network', syntax: 'ufw allow 80/tcp' },
  { text: 'curl -I ', description: 'Fetch and display only HTTP response headers from URL', category: 'network', syntax: 'curl -I https://example.com' },
  { text: 'ping -c 4 ', description: 'Send 4 ICMP ECHO_REQUEST packets to network host', category: 'network', syntax: 'ping -c 4 8.8.8.8' },
  { text: 'ip addr show', description: 'Show all IP addresses assigned to all network interfaces', category: 'network' },
  { text: 'traceroute ', description: 'Print the route packets trace to network host', category: 'network', syntax: 'traceroute 1.1.1.1' },
  { text: 'lsof -i :', description: 'Find process currently using a specific network port', category: 'network', syntax: 'lsof -i :8080' },

  // 7. Files & Directory Operations
  { text: 'ls -lah', description: 'List all files with permissions, hidden files, sizes in human units', category: 'files' },
  { text: 'cd ..', description: 'Navigate up to parent directory', category: 'files' },
  { text: 'cd ~', description: 'Navigate to user home directory', category: 'files' },
  { text: 'pwd', description: 'Print current full working directory path', category: 'files' },
  { text: 'tail -f ', description: 'Output appended data as the file grows in real time', category: 'files', syntax: 'tail -f /var/log/syslog' },
  { text: 'tail -n 100 ', description: 'Output the last 100 lines of specified file', category: 'files', syntax: 'tail -n 100 <file>' },
  { text: 'grep -rn "" .', description: 'Recursively search for string across all files in current directory', category: 'files', syntax: 'grep -rn "API_KEY" .' },
  { text: 'find . -name ""', description: 'Search for files by name matching pattern in directory tree', category: 'files', syntax: 'find . -name "*.log"' },
  { text: 'chmod +x ', description: 'Add executable permission to specified script or binary', category: 'files', syntax: 'chmod +x deploy.sh' },
  { text: 'chown -R ', description: 'Recursively change file owner and group', category: 'files', syntax: 'chown -R www-data:www-data /var/www' },
  { text: 'tar -czvf archive.tar.gz ', description: 'Compress directory into a tar.gz archive', category: 'files', syntax: 'tar -czvf backup.tar.gz ./folder' },
  { text: 'tar -xzvf ', description: 'Extract contents of compressed tar.gz archive', category: 'files', syntax: 'tar -xzvf archive.tar.gz' },
  { text: 'du -sh *', description: 'Display disk usage size for each item in current directory', category: 'files' },

  // 8. Package Management & Security
  { text: 'apt update && apt upgrade -y', description: 'Update package lists and upgrade all system packages', category: 'package' },
  { text: 'apt install -y ', description: 'Install one or more packages without interactive prompts', category: 'package', syntax: 'apt install -y <package>' },
  { text: 'apt autoremove -y', description: 'Remove unused dependency packages automatically', category: 'package' },
  { text: 'nginx -t', description: 'Test Nginx web server configuration syntax without restarting', category: 'service' },
  { text: 'systemctl reload nginx', description: 'Gracefully reload Nginx configuration without dropping connections', category: 'service' },
  { text: 'certbot --nginx', description: 'Automatically obtain and install Let\'s Encrypt SSL certificates', category: 'network' },
  { text: 'fail2ban-client status', description: 'Check status of Fail2ban intrusion protection jails', category: 'system' },

  // 9. Database & Cache
  { text: 'psql -U postgres -d ', description: 'Open interactive PostgreSQL command line terminal', category: 'database', syntax: 'psql -U postgres -d mydb' },
  { text: 'redis-cli ping', description: 'Test connectivity to Redis in-memory cache daemon', category: 'database' },
  { text: 'redis-cli monitor', description: 'Listen for all requests received by Redis server in real time', category: 'database' },
  { text: 'mysqldump -u root -p ', description: 'Dump MySQL database schema and data to backup file', category: 'database', syntax: 'mysqldump -u root -p db > backup.sql' },
];

export interface TermiusSnippet {
  id: string;
  title: string;
  command: string;
  category: string;
  description: string;
  icon: string;
}

export const TERMIUS_DEFAULT_SNIPPETS: TermiusSnippet[] = [
  {
    id: 'snip-health',
    title: 'Server Full Health Check',
    command: 'echo "=== UPTIME & LOAD ===" && uptime && echo "\n=== MEMORY ===" && free -h && echo "\n=== DISK USAGE ===" && df -h / && echo "\n=== TOP PROCESSES ===" && ps aux --sort=-%cpu | head -n 8',
    category: 'System',
    description: 'Comprehensive 1-shot overview of CPU, memory, disk, and load',
    icon: 'Activity',
  },
  {
    id: 'snip-docker-stats',
    title: 'Docker Container Overview',
    command: 'docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}\t{{.Image}}"',
    category: 'Docker',
    description: 'Clean formatted table of all active container status and ports',
    icon: 'Container',
  },
  {
    id: 'snip-pm2-reload',
    title: 'PM2 Graceful Reload & Logs',
    command: 'pm2 reload all && pm2 status',
    category: 'Node.js',
    description: 'Zero-downtime cluster reload with updated status view',
    icon: 'RefreshCw',
  },
  {
    id: 'snip-open-ports',
    title: 'Inspect Open Listening Ports',
    command: 'ss -tulpn | grep -E "LISTEN|State"',
    category: 'Network',
    description: 'List all open ports and associated server application processes',
    icon: 'Network',
  },
  {
    id: 'snip-nginx-reload',
    title: 'Test Nginx & Graceful Reload',
    command: 'nginx -t && systemctl reload nginx && systemctl status nginx --no-pager -n 5',
    category: 'Web',
    description: 'Verify Nginx syntax before applying live config changes',
    icon: 'Globe',
  },
  {
    id: 'snip-clean-logs',
    title: 'Free Up Disk & Clean Logs',
    command: 'journalctl --vacuum-time=3d && apt-get clean && docker system prune -f 2>/dev/null || true && df -h /',
    category: 'Maintenance',
    description: 'Safely purge old system logs and dangling docker caches',
    icon: 'Trash2',
  },
  {
    id: 'snip-git-deploy',
    title: 'Git Pull & Fresh Install',
    command: 'git status && git pull origin main && npm install --omit=dev && pm2 restart all',
    category: 'Deployment',
    description: 'Pull latest git commit, update dependencies, and restart apps',
    icon: 'GitPullRequest',
  },
  {
    id: 'snip-failed-logins',
    title: 'Inspect Failed SSH Attempts',
    command: 'grep "Failed password" /var/log/auth.log 2>/dev/null | tail -n 15 || journalctl _COMM=sshd | grep "Failed" | tail -n 15',
    category: 'Security',
    description: 'Check security logs for recent unauthorized SSH login attempts',
    icon: 'ShieldAlert',
  },
];

export function getSuggestions(
  input: string,
  history: string[] = []
): CommandSuggestion[] {
  const trimmed = input.trimStart();
  if (!trimmed) return [];

  const results: CommandSuggestion[] = [];
  const lowerInput = trimmed.toLowerCase();

  // 1. History matches first
  const historyMatches = history
    .filter(h => h && h.toLowerCase().startsWith(lowerInput) && h.toLowerCase() !== lowerInput)
    .slice(0, 3)
    .map(h => ({
      text: h,
      description: 'From your recent command history',
      category: 'history' as const,
    }));

  results.push(...historyMatches);

  // 2. Subcommand context matching
  // E.g., if input is "docker ", match specific docker subcommands
  const matchedCommon = COMMON_SUGGESTIONS.filter(item => {
    const textLower = item.text.toLowerCase();
    // Prefix match
    if (textLower.startsWith(lowerInput)) return true;
    // Word boundary match
    const words = lowerInput.split(' ');
    if (words.length > 1) {
      return textLower.startsWith(words[0]) && textLower.includes(words[1]);
    }
    return false;
  });

  // Prevent duplicate text
  matchedCommon.forEach(item => {
    if (!results.some(r => r.text === item.text)) {
      results.push(item);
    }
  });

  return results.slice(0, 6);
}
