#!/usr/bin/env node
// Repository-local Pulse: append-only receipts, dated GitHub snapshots, static HTML.
import { appendFileSync, existsSync, readFileSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const ledgerPath = join(root, 'pulse.jsonl');
const ticketsPath = join(root, 'pulse-tickets.json');
const boardPath = join(root, 'pulse.html');
const project = 'little-spoon';
const repository = 'pat-dubois/little-spoon';
const allowedHosts = new Set(['github.com', 'little-spoon.patdubois.chatgpt.site']);

function assert(condition, message) {
  if (!condition) throw new Error(message);
}
function object(value, path) {
  assert(value !== null && typeof value === 'object' && !Array.isArray(value), `${path} must be an object.`);
}
function string(value, path) {
  assert(typeof value === 'string' && value.trim().length > 0, `${path} must be a nonempty string.`);
}
function array(value, path, validate) {
  assert(Array.isArray(value), `${path} must be an array.`);
  value.forEach((item, index) => validate(item, `${path}[${index}]`));
}
function timestamp(value, path) {
  string(value, path);
  assert(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/.test(value)
    && Number.isFinite(Date.parse(value))
    && new Date(value).toISOString().slice(0, 19) === value.slice(0, 19), `${path} must be a valid UTC ISO timestamp.`);
}
function safeUrl(value) {
  if (typeof value !== 'string') return null;
  try {
    const url = new URL(value);
    return ['http:', 'https:'].includes(url.protocol) && allowedHosts.has(url.hostname)
      && !url.username && !url.password && !url.port ? url.href : null;
  } catch { return null; }
}
function linkValue(value, path) {
  assert(safeUrl(value), `${path} must link to GitHub or the existing Little Spoon app over HTTP(S).`);
}
function validateReceipt(receipt, path) {
  object(receipt, path);
  assert(receipt.schema_version === 1, `${path}.schema_version must be 1.`);
  assert(receipt.project === project, `${path}.project must be ${project}.`);
  for (const key of ['session_id', 'host', 'branch', 'event']) string(receipt[key], `${path}.${key}`);
  assert(/^[A-Za-z0-9][A-Za-z0-9._-]*$/.test(receipt.session_id), `${path}.session_id must use letters, numbers, dots, underscores or hyphens.`);
  timestamp(receipt.timestamp, `${path}.timestamp`);
  object(receipt.agent, `${path}.agent`);
  for (const key of ['tool', 'runtime', 'model']) string(receipt.agent[key], `${path}.agent.${key}`);
  array(receipt.reported_agents, `${path}.reported_agents`, (agent, itemPath) => {
    object(agent, itemPath);
    string(agent.role, `${itemPath}.role`);
    string(agent.model, `${itemPath}.model`);
  });
  for (const key of ['accomplishments', 'changed_files', 'checks']) array(receipt[key], `${path}.${key}`, string);
  array(receipt.ticket_refs, `${path}.ticket_refs`, linkValue);
  if (receipt.note !== undefined) string(receipt.note, `${path}.note`);
  if (receipt.project_state !== undefined) {
    const state = receipt.project_state;
    object(state, `${path}.project_state`);
    for (const key of ['label', 'summary', 'feedback', 'next_edge']) string(state[key], `${path}.project_state.${key}`);
    linkValue(state.live_url, `${path}.project_state.live_url`);
    for (const key of ['completed', 'follow_ups']) array(state[key], `${path}.project_state.${key}`, string);
    array(state.checks, `${path}.project_state.checks`, (check, itemPath) => {
      object(check, itemPath);
      string(check.label, `${itemPath}.label`);
      string(check.detail, `${itemPath}.detail`);
      if (check.url !== undefined) linkValue(check.url, `${itemPath}.url`);
    });
    array(state.project_map, `${path}.project_state.project_map`, (entry, itemPath) => {
      object(entry, itemPath);
      string(entry.label, `${itemPath}.label`);
      string(entry.description, `${itemPath}.description`);
      linkValue(entry.url, `${itemPath}.url`);
    });
  }
  for (const key of ['deployment', 'git']) {
    if (receipt[key] !== undefined) object(receipt[key], `${path}.${key}`);
  }
  if (receipt.deployment?.url !== undefined) linkValue(receipt.deployment.url, `${path}.deployment.url`);
  if (receipt.git?.merged_pr !== undefined) linkValue(receipt.git.merged_pr, `${path}.git.merged_pr`);
}
function readLedger() {
  const raw = existsSync(ledgerPath) ? readFileSync(ledgerPath, 'utf8') : '';
  const receipts = [];
  const ids = new Set();
  raw.split('\n').forEach((line, index) => {
    if (!line.trim()) return;
    let receipt;
    try { receipt = JSON.parse(line); } catch { throw new Error(`pulse.jsonl line ${index + 1} is invalid JSON.`); }
    validateReceipt(receipt, `pulse.jsonl line ${index + 1}`);
    assert(!ids.has(receipt.session_id), `Duplicate session_id: ${receipt.session_id}.`);
    ids.add(receipt.session_id);
    receipts.push(receipt);
  });
  return { raw, receipts, ids };
}
function validateSnapshot(snapshot) {
  object(snapshot, 'Ticket snapshot');
  assert(snapshot.schema_version === 1 && snapshot.project === project, 'Ticket snapshot has an unsupported schema or project.');
  timestamp(snapshot.generated_at, 'Ticket snapshot.generated_at');
  assert(snapshot.source?.provider === 'github' && snapshot.source?.project_id === repository
    && snapshot.status === 'current', 'Ticket snapshot must be a successfully fetched GitHub snapshot for this repository.');
  const ids = new Set();
  const validateTicket = (ticket, path, isPr) => {
    object(ticket, path);
    assert(Number.isSafeInteger(ticket.number) && ticket.number > 0, `${path}.number must be a positive integer.`);
    assert(!ids.has(ticket.number), `${path} duplicates ticket #${ticket.number}.`);
    ids.add(ticket.number);
    string(ticket.title, `${path}.title`);
    assert((isPr ? ['OPEN', 'CLOSED', 'MERGED'] : ['OPEN', 'CLOSED']).includes(ticket.state), `${path}.state is invalid.`);
    linkValue(ticket.url, `${path}.url`);
    const url = new URL(ticket.url);
    assert(url.hostname === 'github.com' && url.pathname === `/${repository}/${isPr ? 'pull' : 'issues'}/${ticket.number}`,
      `${path}.url must identify this repository's ticket.`);
    if (ticket.closedAt !== null) timestamp(ticket.closedAt, `${path}.closedAt`);
    if (isPr && ticket.mergedAt !== null) timestamp(ticket.mergedAt, `${path}.mergedAt`);
  };
  array(snapshot.tickets, 'Ticket snapshot.tickets', (ticket, path) => validateTicket(ticket, path, false));
  array(snapshot.pull_requests, 'Ticket snapshot.pull_requests', (ticket, path) => validateTicket(ticket, path, true));
}
function readSnapshot() {
  if (!existsSync(ticketsPath)) return null;
  const snapshot = JSON.parse(readFileSync(ticketsPath, 'utf8'));
  validateSnapshot(snapshot);
  return snapshot;
}
function escape(value) {
  return String(value).replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character]));
}
function link(url, label) {
  const destination = safeUrl(url);
  return destination ? `<a href="${escape(destination)}">${escape(label)}</a>` : escape(label);
}
function time(value) {
  return `<time datetime="${escape(value)}">${escape(value.replace('T', ' ').replace(/\.\d{3}Z$/, ' UTC').replace(/Z$/, ' UTC'))}</time>`;
}
// Keep each visible or expanded list to five items without dropping evidence.
function list(items, renderItem = escape) {
  if (!items.length) return '';
  const groups = [];
  for (let index = 0; index < items.length; index += 5) {
    groups.push(`<ul>${items.slice(index, index + 5).map(item => `<li>${renderItem(item)}</li>`).join('')}</ul>`);
  }
  return groups[0] + (groups.length > 1 ? `<details><summary>${items.length - 5} more items</summary>${groups.slice(1).join('')}</details>` : '');
}
function evidenceDetails(label, value) {
  return value ? `<details><summary>${escape(label)}</summary><pre>${escape(JSON.stringify(value, null, 2))}</pre></details>` : '';
}
function renderTicket(ticket) {
  const state = ticket.mergedAt ? 'Merged' : ticket.state === 'OPEN' ? 'Open' : 'Closed';
  const closed = ticket.mergedAt || ticket.closedAt;
  return `${link(ticket.url, `#${ticket.number} ${ticket.title}`)} <span class="ticket-state">${state}</span>${closed ? `<span class="ticket-date">${time(closed)}</span>` : ''}`;
}
function renderReceipt(receipt, index) {
  return `<details class="receipt"${index === 0 ? ' open' : ''}>
    <summary>${escape(receipt.event)}</summary>
    <p class="meta">${time(receipt.timestamp)} · ${escape(receipt.host)} · ${escape(receipt.branch)}<br>${escape(receipt.agent.tool)} / ${escape(receipt.agent.runtime)} · ${escape(receipt.agent.model)}</p>
    ${list(receipt.accomplishments)}
    ${receipt.note ? `<p class="muted">${escape(receipt.note)}</p>` : ''}
    ${receipt.checks.length ? `<h3>Checks recorded</h3>${list(receipt.checks)}` : ''}
    ${receipt.ticket_refs.length ? `<p class="ticket-links">${receipt.ticket_refs.map(url => {
      const parts = new URL(url).pathname.split('/');
      return link(url, `${parts.at(-2) === 'pull' ? 'PR' : 'Issue'} #${parts.at(-1)}`);
    }).join(' ')}</p>` : ''}
    ${receipt.reported_agents.length ? `<details><summary>Reported agents</summary>${list(receipt.reported_agents, agent => `${escape(agent.role)} · ${escape(agent.model)}`)}</details>` : ''}
    ${receipt.changed_files.length ? `<details><summary>Changed files</summary>${list(receipt.changed_files, file => `<code>${escape(file)}</code>`)}</details>` : ''}
    ${evidenceDetails('Deployment evidence', receipt.deployment)}${evidenceDetails('Git evidence', receipt.git)}
    <p class="meta session"><code>Pulse-Session: ${escape(receipt.session_id)}</code></p>
  </details>`;
}
function renderBoard(receipts, snapshot) {
  assert(receipts.length, 'No receipts found. Append a verified receipt before rendering.');
  const stateReceipt = receipts.findLast(receipt => receipt.project_state);
  assert(stateReceipt, 'No receipt contains project_state; the board needs a verified state.');
  const state = stateReceipt.project_state;
  const allTickets = snapshot ? [...snapshot.tickets, ...snapshot.pull_requests] : [];
  const openTickets = allTickets.filter(ticket => ticket.state === 'OPEN');
  const closedTickets = allTickets.filter(ticket => ticket.state !== 'OPEN');
  const ticketSummary = snapshot
    ? `${openTickets.length} open · ${closedTickets.length} closed or merged. Snapshot ${time(snapshot.generated_at)}.`
    : 'No ticket snapshot yet. Ticket status is unknown.';
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="color-scheme" content="dark">
  <title>Little Spoon Pulse</title>
  <style>
    :root{color-scheme:dark;--bg:#0c0f12;--panel:#171c21;--line:#2d3740;--text:#edf3f6;--muted:#9cabb5;--accent:#79d7aa;--blue:#7bbcff}
    *{box-sizing:border-box}body{margin:0;padding:28px 18px 60px;background:var(--bg);color:var(--text);font:15px/1.55 -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}main{max-width:920px;margin:auto}h1{margin:0;font-size:38px;line-height:1.2}h2{font-size:18px;margin:0 0 12px}h3{font-size:15px;margin:18px 0 6px}p{margin:0 0 14px}.sub{color:var(--muted);margin:8px 0 24px}.grid{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:14px}.card{min-width:0;background:var(--panel);border:1px solid var(--line);border-radius:12px;padding:18px;overflow-wrap:anywhere}.wide{grid-column:1/-1}.tag{display:inline-block;margin-bottom:9px;padding:2px 8px;border-radius:999px;background:#193c2c;color:var(--accent);font-size:11px;font-weight:700;text-transform:uppercase}a{color:var(--blue);text-underline-offset:3px}a:hover{text-decoration-thickness:2px}a:focus-visible,summary:focus-visible{outline:3px solid var(--accent);outline-offset:4px;border-radius:2px}code,pre{font-family:"SFMono-Regular",Consolas,monospace}code{color:var(--blue)}pre{margin:4px 0 12px;white-space:pre-wrap;overflow-wrap:anywhere;font-size:12px;color:#cbd5dc}.muted{color:var(--muted)}details{border-top:1px solid var(--line);padding:4px 0}details:first-of-type{border-top:0}summary{cursor:pointer;font-weight:650;min-height:44px;padding:10px 0}.meta{font-size:12px;color:var(--muted);margin:5px 0 10px}.session{margin-top:12px}ul{margin:6px 0 14px;padding-left:20px}li{margin:7px 0}.evidence{padding-left:20px}.evidence strong{color:var(--text)}.ticket-state{display:inline-block;color:var(--accent);font-size:12px;margin-left:6px}.ticket-date{display:block;color:var(--muted);font-size:12px}.ticket-links{display:flex;flex-wrap:wrap;gap:0 18px}.ticket-links a{display:inline-flex;align-items:center;min-height:44px}.map{padding:0;list-style:none}.map li{margin:0;border-top:1px solid var(--line);padding:8px 0}.map li:first-child{border:0}.map a{display:inline-block;min-height:44px;padding:10px 0;font-weight:650}.map p{margin:0 0 8px;color:var(--muted)}footer{margin-top:16px;color:var(--muted);font-size:12px;overflow-wrap:anywhere}.state-link{display:inline-block;min-height:44px;padding:10px 0}.ticket-status{font-size:13px;color:var(--muted);margin-top:16px}
    @media(max-width:700px){.grid{grid-template-columns:minmax(0,1fr)}body{padding:22px 14px 40px}.card{padding:16px}h1{font-size:32px}}
    @media print{:root{color-scheme:light;--bg:#fff;--panel:#fff;--line:#bbb;--text:#111;--muted:#444;--accent:#174a34;--blue:#174d79}body{padding:0}.card{break-inside:avoid}.grid{display:block}.card{margin-bottom:12px}summary{min-height:0}.tag{background:#eee}}
  </style>
</head>
<body><main>
  <header><span class="tag">${escape(state.label)}</span><h1>Little Spoon Pulse</h1>
  <p class="sub">Project map and work log. State recorded ${time(stateReceipt.timestamp)}.</p></header>
  <div class="grid">
    <section class="card" aria-labelledby="state"><h2 id="state">State</h2>
      <p>${escape(state.summary)}</p><p class="muted">${escape(state.feedback)}</p>
      ${link(state.live_url, 'Open Little Spoon').replace('<a ', '<a class="state-link" ')}
      ${list(state.completed)}
      <details><summary>Verification evidence</summary>${list(state.checks, check => `<strong>${check.url ? link(check.url, check.label) : escape(check.label)}</strong> · ${escape(check.detail)}`)}</details>
    </section>
    <section class="card" aria-labelledby="next"><h2 id="next">Next edge</h2>
      <p>${escape(state.next_edge)}</p>${list(state.follow_ups)}
      <p class="ticket-status">${ticketSummary} This is a saved snapshot, not live sync.</p>
      ${openTickets.length ? `<h3>Open on GitHub at snapshot time</h3>${list(openTickets, renderTicket)}` : ''}
      ${closedTickets.length ? `<details><summary>Closed and merged tickets (${closedTickets.length})</summary>${list(closedTickets, renderTicket)}</details>` : ''}
    </section>
    <section class="card wide" aria-labelledby="map"><h2 id="map">Project map</h2>
      ${list(state.project_map, entry => `${link(entry.url, entry.label)}<p>${escape(entry.description)}</p>`).replaceAll('<ul>', '<ul class="map">')}
    </section>
    <section class="card wide" aria-labelledby="log"><h2 id="log">Work log</h2>
      <p class="muted">${receipts.length} recorded session${receipts.length === 1 ? '' : 's'}. Newest appended receipt first.</p>
      ${[...receipts].reverse().map(renderReceipt).join('\n')}
    </section>
  </div>
  <footer>Generated from local <code>pulse.jsonl</code> receipts and <code>pulse-tickets.json</code>. Refresh with this repository's <code>node scripts/pulse.mjs snapshot</code> command. No global <code>pulse save</code> service is installed or implied.</footer>
</main></body>
</html>
`.replace(/[ \t]+$/gm, '');
}
function render() {
  const { receipts } = readLedger();
  writeFileSync(boardPath, renderBoard(receipts, readSnapshot()));
  console.log(`Rendered pulse.html from ${receipts.length} receipt(s).`);
}
function snapshot() {
  const fetch = (kind, fields) => {
    const raw = execFileSync('gh', [kind, 'list', '--repo', repository, '--state', 'all', '--limit', '1000', '--json', fields],
      { encoding: 'utf8', timeout: 60_000, maxBuffer: 20 * 1024 * 1024 });
    const records = JSON.parse(raw);
    assert(Array.isArray(records) && records.length < 1000, 'GitHub result reached the 1,000-item cap; refusing to save a possibly incomplete snapshot.');
    return records;
  };
  const tickets = fetch('issue', 'number,title,state,url,closedAt');
  const pullRequests = fetch('pr', 'number,title,state,url,closedAt,mergedAt');
  const data = { schema_version: 1, project, generated_at: new Date().toISOString(),
    source: { provider: 'github', project_id: repository }, status: 'current', tickets, pull_requests: pullRequests };
  validateSnapshot(data);
  writeFileSync(ticketsPath, `${JSON.stringify(data, null, 2)}\n`);
  console.log(`Saved GitHub snapshot: ${tickets.length} issue(s), ${pullRequests.length} pull request(s).`);
  if (existsSync(ledgerPath)) render();
}
function append(path) {
  assert(path, 'Usage: node scripts/pulse.mjs append /path/to/verified-session.json');
  const receipt = JSON.parse(readFileSync(resolve(path), 'utf8'));
  validateReceipt(receipt, 'New receipt');
  const { raw, receipts, ids } = readLedger();
  assert(!ids.has(receipt.session_id), `Duplicate session_id: ${receipt.session_id}. Nothing appended.`);
  // Validate/render all inputs before the irreversible append. Existing ledger bytes are never rewritten.
  const html = renderBoard([...receipts, receipt], readSnapshot());
  appendFileSync(ledgerPath, `${raw.length && !raw.endsWith('\n') ? '\n' : ''}${JSON.stringify(receipt)}\n`);
  writeFileSync(boardPath, html);
  console.log(`Appended ${receipt.session_id}; rendered pulse.html. Previous receipts were preserved.`);
}

try {
  const [command, argument, ...extra] = process.argv.slice(2);
  assert(!extra.length && (command === 'append' || argument === undefined), 'Unexpected arguments.');
  if (command === 'snapshot') snapshot();
  else if (command === 'render') render();
  else if (command === 'append') append(argument);
  else throw new Error('Usage: node scripts/pulse.mjs snapshot | render | append /path/to/verified-session.json');
} catch (error) {
  console.error(`Pulse: ${error.message}`);
  process.exitCode = 1;
}
