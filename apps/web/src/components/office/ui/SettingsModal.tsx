"use client"

import { useState, useEffect } from 'react'
import { cn } from "@/lib/utils"
import type { OfficeLayout } from '../types'
import { sendCommand } from '@/lib/connection'
import { useOfficeStore } from '@/store/office-store'
import { APP_VERSION, APP_BUILD_TIME } from '@/lib/appMeta'
import { TERM_THEMES, applyTermTheme } from '@/components/office/ui/termTheme'
import TermModal from './primitives/TermModal'
import TermButton from './primitives/TermButton'
import TermInput from './primitives/TermInput'

interface SettingsModalProps {
  isOpen: boolean
  onClose: () => void
  layout: OfficeLayout
  onImportLayout: (layout: OfficeLayout) => void
  onImportRoomZip?: (layout: OfficeLayout, backgroundImage: HTMLImageElement | null) => void
  soundEnabled: boolean
  onSoundEnabledChange: (enabled: boolean) => void
  consoleCols?: number
  consoleRows?: number
  onConsoleColsChange?: (v: number) => void
  onConsoleRowsChange?: (v: number) => void
}

/** Horizontal form row: label on left, input on right */
function FormRow({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 mb-2">
      <label className="text-term text-muted-foreground shrink-0 w-[100px] text-right">
        {label}
        {hint && <span className="block text-[10px] opacity-50 mt-0.5">{hint}</span>}
      </label>
      <div className="flex-1 min-w-0">{children}</div>
    </div>
  )
}

export default function SettingsModal({
  isOpen,
  onClose,
  soundEnabled,
  onSoundEnabledChange,
  consoleCols = 3,
  consoleRows = 1,
  onConsoleColsChange,
  onConsoleRowsChange,
}: SettingsModalProps) {
  const [tgToken, setTgToken] = useState('')
  const [tgUsers, setTgUsers] = useState('')
  const [tgSaving, setTgSaving] = useState(false)
  const [tgMessage, setTgMessage] = useState<string | null>(null)
  const [tgConnected, setTgConnected] = useState(false)
  const [showToken, setShowToken] = useState(false)
  const [worktreeOn, setWorktreeOn] = useState(true)
  const [autoMergeOn, setAutoMergeOn] = useState(true)
  const [tunnelToken, setTunnelToken] = useState('')
  const [tunnelBaseUrl, setTunnelBaseUrl] = useState('')
  const [tunnelRunning, setTunnelRunning] = useState(false)
  const [tunnelSaving, setTunnelSaving] = useState(false)
  const [tunnelMessage, setTunnelMessage] = useState<string | null>(null)
  const [showTunnelToken, setShowTunnelToken] = useState(false)

  // AI Backends state
  const [defaultBackend, setDefaultBackend] = useState('')
  const [defaultModels, setDefaultModels] = useState<Record<string, string>>({})
  const [backendSaving, setBackendSaving] = useState(false)
  const [backendMessage, setBackendMessage] = useState<string | null>(null)

  // Agent Permissions state
  const [sandboxMode, setSandboxMode] = useState<"full" | "safe">("full")

  // Webhooks state
  const [webhookUrl, setWebhookUrl] = useState('')

  // GitHub state
  const [ghToken, setGhToken] = useState('')
  const [ghRemote, setGhRemote] = useState('origin')
  const [showGhToken, setShowGhToken] = useState(false)
  const [ghSaving, setGhSaving] = useState(false)
  const [ghMessage, setGhMessage] = useState<string | null>(null)

  // Theme state
  const [activeTheme, setActiveTheme] = useState(() => {
    if (typeof window === "undefined") return "studio"
    return localStorage.getItem("nvlabs-org-theme") || "studio"
  })

  const configData = useOfficeStore((s) => s.configData)
  const configResult = useOfficeStore((s) => s.configResult)

  useEffect(() => {
    if (isOpen) {
      sendCommand({ type: "GET_CONFIG" })
    }
  }, [isOpen])

  useEffect(() => {
    if (configData) {
      setTgToken(configData.telegramBotToken ?? '')
      setTgUsers(configData.telegramAllowedUsers?.join(', ') ?? '')
      setTgConnected(configData.telegramConnected ?? false)
      setWorktreeOn(configData.worktreeEnabled ?? true)
      setAutoMergeOn(configData.autoMergeEnabled ?? true)
      setTunnelToken(configData.tunnelToken ?? '')
      setTunnelBaseUrl(configData.tunnelBaseUrl ?? '')
      setTunnelRunning(configData.tunnelRunning ?? false)
      setDefaultBackend(configData.defaultBackend ?? '')
      setDefaultModels(configData.defaultModels ?? {})
      setSandboxMode(configData.sandboxMode ?? 'full')
      setGhToken(configData.githubToken ?? '')
      setGhRemote(configData.githubRemote ?? 'origin')
    }
  }, [configData])

  useEffect(() => {
    if (configResult && tgSaving) {
      setTgSaving(false)
      setTgMessage(configResult.message)
      if (configResult.telegramConnected !== undefined) {
        setTgConnected(configResult.telegramConnected)
      }
      const t = setTimeout(() => setTgMessage(null), 5000)
      return () => clearTimeout(t)
    }
    if (configResult && tunnelSaving) {
      setTunnelSaving(false)
      if (configResult.tunnelRunning !== undefined) {
        setTunnelRunning(configResult.tunnelRunning)
      }
      setTunnelMessage(configResult.tunnelRunning ? 'Tunnel started' : 'Tunnel not running')
      const t = setTimeout(() => setTunnelMessage(null), 5000)
      return () => clearTimeout(t)
    }
    if (configResult && backendSaving) {
      setBackendSaving(false)
      setBackendMessage('Saved')
      const t = setTimeout(() => setBackendMessage(null), 3000)
      return () => clearTimeout(t)
    }
    if (configResult && ghSaving) {
      setGhSaving(false)
      setGhMessage('Saved')
      const t = setTimeout(() => setGhMessage(null), 3000)
      return () => clearTimeout(t)
    }
  }, [configResult])

  const toggleSound = () => {
    const next = !soundEnabled
    onSoundEnabledChange(next)
    localStorage.setItem('office-sound-enabled', JSON.stringify(next))
  }

  const toggleWorktree = () => {
    const next = !worktreeOn
    setWorktreeOn(next)
    sendCommand({ type: "SAVE_CONFIG", worktreeEnabled: next })
  }

  const toggleAutoMerge = () => {
    const next = !autoMergeOn
    setAutoMergeOn(next)
    sendCommand({ type: "SAVE_CONFIG", autoMergeEnabled: next })
  }

  const handleSaveTelegram = () => {
    setTgSaving(true)
    setTgMessage(null)
    const allowedUsers = tgUsers
      .split(',')
      .map(s => s.trim())
      .filter(Boolean)
    sendCommand({
      type: "SAVE_CONFIG",
      telegramBotToken: tgToken.includes('...') ? undefined : tgToken,
      telegramAllowedUsers: allowedUsers,
    })
  }

  const handleSaveTunnel = () => {
    setTunnelSaving(true)
    setTunnelMessage(null)
    sendCommand({
      type: "SAVE_CONFIG",
      tunnelToken: tunnelToken.includes('...') ? undefined : tunnelToken,
      tunnelBaseUrl: tunnelBaseUrl,
    })
  }

  const handleSaveBackends = () => {
    setBackendSaving(true)
    setBackendMessage(null)
    sendCommand({
      type: "SAVE_CONFIG",
      defaultBackend,
      defaultModels,
    })
  }

  const toggleSandboxMode = () => {
    const next = sandboxMode === 'full' ? 'safe' : 'full'
    setSandboxMode(next)
    sendCommand({ type: "SAVE_CONFIG", sandboxMode: next })
  }

  const checkboxCls = (checked: boolean) => cn(
    "w-3.5 h-3.5 border-2 border-muted-foreground rounded-sm shrink-0",
    "flex items-center justify-center text-[11px] leading-none",
    checked ? "bg-accent text-background" : "bg-transparent",
  )

  const toggleCls = "flex items-center justify-between w-full px-3 py-2 text-term text-foreground bg-transparent border-none cursor-pointer text-left font-mono transition-colors duration-fast hover:bg-white/5"

  const detectedBackends = configData?.detectedBackends ?? []

  return (
    <TermModal
      open={isOpen}
      onClose={onClose}
      maxWidth={520}
      zIndex={100}
      title="Settings"
    >
      {/* ---- Telegram Section ---- */}
      <div className="border-b border-term-border-dim pb-3 mb-3">
        <div className="flex items-center gap-1.5 mb-3">
          <span className={cn("inline-block w-2 h-2 rounded-full shrink-0", tgConnected ? "bg-sem-green" : "bg-muted-foreground")} />
          <span className="text-[13px] text-foreground font-medium">
            Telegram {tgConnected ? '(connected)' : '(disconnected)'}
          </span>
        </div>
        <FormRow label="Bot Token">
          <div className="flex gap-1">
            <TermInput
              type={showToken ? 'text' : 'password'}
              value={tgToken}
              onChange={e => setTgToken(e.target.value)}
              placeholder="123456:ABC-DEF..."
              className="flex-1"
              onFocus={() => { if (tgToken.includes('...')) setTgToken('') }}
            />
            <TermButton
              variant="dim"
              size="sm"
              onClick={() => setShowToken(!showToken)}
              title={showToken ? 'Hide' : 'Show'}
            >{showToken ? '\u{1F648}' : '\u{1F441}'}</TermButton>
          </div>
        </FormRow>
        <FormRow label="Allowed IDs" hint="comma-sep, empty=all">
          <TermInput
            type="text"
            value={tgUsers}
            onChange={e => setTgUsers(e.target.value)}
            placeholder="123456789, 987654321"
          />
        </FormRow>
        <div className="flex items-center gap-2 pl-[112px]">
          <TermButton variant="primary" onClick={handleSaveTelegram} disabled={tgSaving}>
            {tgSaving ? 'Saving...' : 'Save & Connect'}
          </TermButton>
          {tgMessage && (
            <span className={cn("text-term", tgMessage.includes('Failed') || tgMessage.includes('not') ? "text-sem-red" : "text-sem-green")}>
              {tgMessage}
            </span>
          )}
        </div>
      </div>

      {/* ---- Tunnel Section ---- */}
      <div className="border-b border-term-border-dim pb-3 mb-3">
        <div className="flex items-center gap-1.5 mb-3">
          <span className={cn("inline-block w-2 h-2 rounded-full shrink-0", tunnelRunning ? "bg-sem-green" : "bg-muted-foreground")} />
          <span className="text-[13px] text-foreground font-medium">
            Tunnel {tunnelRunning ? '(running)' : '(stopped)'}
          </span>
        </div>
        <FormRow label="Token">
          <div className="flex gap-1">
            <TermInput
              type={showTunnelToken ? 'text' : 'password'}
              value={tunnelToken}
              onChange={e => setTunnelToken(e.target.value)}
              placeholder="eyJ..."
              className="flex-1"
              onFocus={() => { if (tunnelToken.includes('...')) setTunnelToken('') }}
            />
            <TermButton
              variant="dim"
              size="sm"
              onClick={() => setShowTunnelToken(!showTunnelToken)}
              title={showTunnelToken ? 'Hide' : 'Show'}
            >{showTunnelToken ? '\u{1F648}' : '\u{1F441}'}</TermButton>
          </div>
        </FormRow>
        <FormRow label="Public URL">
          <TermInput
            type="text"
            value={tunnelBaseUrl}
            onChange={e => setTunnelBaseUrl(e.target.value)}
            placeholder="https://office.example.com"
          />
        </FormRow>
        <div className="flex items-center gap-2 pl-[112px]">
          <TermButton variant="primary" onClick={handleSaveTunnel} disabled={tunnelSaving}>
            {tunnelSaving ? 'Saving...' : 'Save & Start'}
          </TermButton>
          {tunnelMessage && (
            <span className={cn("text-term", tunnelMessage.includes('not') || tunnelMessage.includes('Failed') ? "text-sem-red" : "text-sem-green")}>
              {tunnelMessage}
            </span>
          )}
        </div>
      </div>

      {/* ---- Toggles ---- */}
      <div className="border-b border-term-border-dim pb-3 mb-3">
        <button onClick={toggleWorktree} className={toggleCls} title="Each agent works in its own git worktree branch, merged on completion">
          <span>Agent Isolation</span>
          <span className={checkboxCls(worktreeOn)}>{worktreeOn ? '\u2713' : ''}</span>
        </button>
        <button onClick={toggleAutoMerge} className={toggleCls} title="Auto-merge agent changes to main on task completion. Turn off to review before merging.">
          <span>Auto-merge</span>
          <span className={checkboxCls(autoMergeOn)}>{autoMergeOn ? '\u2713' : ''}</span>
        </button>
        <button onClick={toggleSound} className={toggleCls}>
          <span>Sound Notifications</span>
          <span className={checkboxCls(soundEnabled)}>{soundEnabled ? '\u2713' : ''}</span>
        </button>
      </div>

      {/* ---- AI Backends Section ---- */}
      <div className="border-b border-term-border-dim pb-3 mb-3">
        <span className="text-[13px] text-foreground font-medium block mb-2">AI Backends</span>
        {detectedBackends.length > 0 ? (
          <>
            <div className="mb-2 pl-2">
              {detectedBackends.map(backend => (
                <div key={backend} className="flex items-center gap-1.5 text-term text-muted-foreground text-[12px] py-0.5">
                  <span className="inline-block w-2 h-2 rounded-full bg-sem-green shrink-0" />
                  <span>{backend}</span>
                </div>
              ))}
            </div>
            <FormRow label="Default">
              <select
                value={defaultBackend}
                onChange={e => setDefaultBackend(e.target.value)}
                className="w-full bg-transparent border border-term-border-dim rounded px-2 py-1 text-term text-foreground font-mono text-[12px] outline-none focus:border-accent"
              >
                <option value="" className="bg-background">-- select --</option>
                {detectedBackends.map(b => (
                  <option key={b} value={b} className="bg-background">{b}</option>
                ))}
              </select>
            </FormRow>
            {detectedBackends.map(backend => (
              <FormRow key={backend} label={backend} hint="model">
                <TermInput
                  type="text"
                  value={defaultModels[backend] ?? ''}
                  onChange={e => setDefaultModels(prev => ({ ...prev, [backend]: e.target.value }))}
                  placeholder={`model for ${backend}`}
                />
              </FormRow>
            ))}
            <div className="flex items-center gap-2 pl-[112px]">
              <TermButton variant="primary" onClick={handleSaveBackends} disabled={backendSaving}>
                {backendSaving ? 'Saving...' : 'Save'}
              </TermButton>
              {backendMessage && (
                <span className="text-term text-sem-green">{backendMessage}</span>
              )}
            </div>
          </>
        ) : (
          <div className="text-term text-muted-foreground text-[12px] pl-2">No backends detected</div>
        )}
      </div>

      {/* ---- Agent Permissions Section ---- */}
      <div className="border-b border-term-border-dim pb-3 mb-3">
        <span className="text-[13px] text-foreground font-medium block mb-2">Agent Permissions</span>
        <button onClick={toggleSandboxMode} className={toggleCls} title="Toggle between full access and sandboxed execution">
          <span>{sandboxMode === 'full' ? 'Full Access' : 'Sandbox (safe)'}</span>
          <span className={checkboxCls(sandboxMode === 'safe')}>{sandboxMode === 'safe' ? '\u2713' : ''}</span>
        </button>
        <div className="text-[10px] text-muted-foreground pl-3 mt-1 leading-relaxed">
          {sandboxMode === 'full'
            ? 'Agents can execute any command and modify any file in the workspace.'
            : 'Agents run in a restricted sandbox — no destructive commands, no access outside workspace.'}
        </div>
      </div>

      {/* ---- Console Grid ---- */}
      <div className="border-b border-term-border-dim pb-3 mb-3">
        <span className="text-[13px] text-foreground font-medium block mb-2">Console Grid</span>
        <div className="flex items-center gap-4">
          <FormRow label="Columns">
            <div className="flex items-center gap-1.5">
              {[1, 2, 3, 4].map(v => (
                <button
                  key={v}
                  onClick={() => onConsoleColsChange?.(v)}
                  className={cn(
                    "w-8 h-7 text-term font-mono border rounded cursor-pointer transition-colors duration-150",
                    consoleCols === v
                      ? "border-accent bg-accent/20 text-accent"
                      : "border-muted-foreground/30 bg-transparent text-muted-foreground hover:border-muted-foreground"
                  )}
                >{v}</button>
              ))}
            </div>
          </FormRow>
          <FormRow label="Rows">
            <div className="flex items-center gap-1.5">
              {[1, 2, 3].map(v => (
                <button
                  key={v}
                  onClick={() => onConsoleRowsChange?.(v)}
                  className={cn(
                    "w-8 h-7 text-term font-mono border rounded cursor-pointer transition-colors duration-150",
                    consoleRows === v
                      ? "border-accent bg-accent/20 text-accent"
                      : "border-muted-foreground/30 bg-transparent text-muted-foreground hover:border-muted-foreground"
                  )}
                >{v}</button>
              ))}
            </div>
          </FormRow>
        </div>
        <div className="text-[10px] text-muted-foreground mt-1 pl-[112px]">
          {consoleCols} × {consoleRows} = {consoleCols * consoleRows} agents per page
        </div>
      </div>

      {/* ---- Theme Section ---- */}
      <div className="border-b border-term-border-dim pb-3 mb-3">
        <span className="text-[13px] text-foreground font-medium block mb-2">Theme</span>
        <div className="grid grid-cols-4 gap-2 px-2">
          {Object.entries(TERM_THEMES).map(([key, theme]) => (
            <button
              key={key}
              onClick={() => {
                setActiveTheme(key)
                applyTermTheme(key)
                localStorage.setItem("nvlabs-org-theme", key)
                // Notify the page component to re-render with new theme
                window.dispatchEvent(new CustomEvent("theme-changed", { detail: key }))
              }}
              className={cn(
                "flex items-center gap-1.5 px-2 py-1.5 rounded border cursor-pointer transition-all duration-150 text-left",
                activeTheme === key
                  ? "border-accent bg-accent/10"
                  : "border-transparent hover:border-muted-foreground/30 hover:bg-white/[0.03]"
              )}
              title={theme.name}
            >
              <span
                className="w-3 h-3 rounded-full shrink-0"
                style={{
                  backgroundColor: theme.accent,
                  boxShadow: activeTheme === key ? `0 0 6px ${theme.accent}60` : "none",
                }}
              />
              <span className={cn(
                "text-[10px] font-mono truncate",
                activeTheme === key ? "text-foreground" : "text-muted-foreground"
              )}>
                {theme.name}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* ---- Webhooks Section ---- */}
      <div className="border-b border-term-border-dim pb-3 mb-3">
        <span className="text-[13px] text-foreground font-medium block mb-2">Webhooks</span>
        <div className="text-[10px] text-muted-foreground mb-2 pl-2">
          Receive POST notifications on task events. Configure URLs below.
        </div>
        <FormRow label="URL">
          <div className="flex gap-1">
            <TermInput
              type="text"
              value={webhookUrl}
              onChange={e => setWebhookUrl(e.target.value)}
              placeholder="https://example.com/webhook"
              className="flex-1"
            />
            <TermButton
              variant="primary"
              size="sm"
              onClick={() => {
                if (!webhookUrl.trim()) return;
                const hooks = [...(configData?.webhooks ?? []), { url: webhookUrl.trim(), events: ["TASK_DONE", "TASK_FAILED"], enabled: true }];
                sendCommand({ type: "SAVE_CONFIG", webhooks: hooks });
                setWebhookUrl('');
              }}
            >Add</TermButton>
          </div>
        </FormRow>
        {(configData?.webhooks ?? []).length > 0 && (
          <div className="pl-2 mt-1 space-y-1">
            {(configData?.webhooks ?? []).map((h, i) => (
              <div key={i} className="flex items-center gap-2 text-[10px] font-mono text-muted-foreground">
                <span className={cn("w-2 h-2 rounded-full shrink-0", h.enabled ? "bg-sem-green" : "bg-muted-foreground")} />
                <span className="flex-1 truncate">{h.url}</span>
                <span className="opacity-50">{h.events.join(",")}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ---- GitHub Section ---- */}
      <div className="border-b border-term-border-dim pb-3 mb-3">
        <span className="text-[13px] text-foreground font-medium block mb-2">GitHub</span>
        <FormRow label="Token">
          <div className="flex gap-1">
            <TermInput
              type={showGhToken ? 'text' : 'password'}
              value={ghToken}
              onChange={e => setGhToken(e.target.value)}
              placeholder="ghp_..."
              className="flex-1"
              onFocus={() => { if (ghToken.includes('...')) setGhToken('') }}
            />
            <TermButton
              variant="dim"
              size="sm"
              onClick={() => setShowGhToken(!showGhToken)}
              title={showGhToken ? 'Hide' : 'Show'}
            >{showGhToken ? '\u{1F648}' : '\u{1F441}'}</TermButton>
          </div>
        </FormRow>
        <FormRow label="Remote" hint="default: origin">
          <TermInput
            type="text"
            value={ghRemote}
            onChange={e => setGhRemote(e.target.value)}
            placeholder="origin"
          />
        </FormRow>
        <div className="flex items-center gap-2 pl-[112px]">
          <TermButton variant="primary" onClick={() => {
            setGhSaving(true)
            setGhMessage(null)
            sendCommand({
              type: "SAVE_CONFIG",
              githubToken: ghToken.includes('...') ? undefined : ghToken,
              githubRemote: ghRemote || 'origin',
            })
          }} disabled={ghSaving}>
            {ghSaving ? 'Saving...' : 'Save'}
          </TermButton>
          <TermButton variant="dim" onClick={() => {
            sendCommand({ type: "PUSH_BRANCH", remote: ghRemote || 'origin' })
          }}>Push</TermButton>
          <TermButton variant="dim" onClick={() => {
            const title = window.prompt("PR Title:")
            if (!title) return
            const body = window.prompt("PR Description (optional):") ?? ""
            sendCommand({ type: "CREATE_PR", title, body, remote: ghRemote || undefined })
          }}>Create PR</TermButton>
          {ghMessage && (
            <span className="text-term text-sem-green">{ghMessage}</span>
          )}
        </div>
        <div className="text-[10px] text-muted-foreground pl-[112px] mt-1.5">
          Token is used for git push and GitHub API operations.
        </div>
      </div>

      {/* ---- Data & Privacy Section ---- */}
      <div className="border-b border-term-border-dim pb-3 mb-3">
        <span className="text-[13px] text-foreground font-medium block mb-2">Data & Privacy</span>
        <div className="flex flex-wrap items-center gap-2 pl-2">
          <TermButton variant="dim" onClick={() => {
            if (confirm("Clear all agent memory? This removes learned patterns and session history. Cannot be undone.")) {
              sendCommand({ type: "CLEAR_MEMORY" });
            }
          }}>
            Clear Agent Memory
          </TermButton>
          <TermButton
            variant="dim"
            onClick={() => {
              if (configData?.dataDir) {
                alert(`Config is stored at:\n${configData.dataDir}/config.json`)
              }
            }}
            disabled={!configData?.dataDir}
          >
            Export Config
          </TermButton>
          <TermButton variant="dim" onClick={() => {
            if (confirm("Reset ALL settings to defaults? This deletes your config (tokens, backends, webhooks). Cannot be undone.")) {
              sendCommand({ type: "RESET_CONFIG" });
            }
          }}>
            Reset All Settings
          </TermButton>
          <TermButton
            variant="dim"
            onClick={() => {
              onClose();
              window.dispatchEvent(new CustomEvent("open-log-viewer"));
            }}
          >
            View Gateway Logs
          </TermButton>
          <TermButton
            variant="dim"
            onClick={() => {
              onClose();
              window.dispatchEvent(new CustomEvent("open-metrics"));
            }}
          >
            View Metrics
          </TermButton>
        </div>
        {configData?.dataDir && (
          <div className="text-[10px] text-muted-foreground pl-2 mt-1.5">
            Data: {configData.dataDir}
          </div>
        )}
      </div>

      {/* ---- Workspace Section ---- */}
      <div className="border-b border-term-border-dim pb-3 mb-3">
        <span className="text-[13px] text-foreground font-medium block mb-2">Workspace</span>
        <FormRow label="Current">
          <div className="text-[10px] text-foreground font-mono truncate select-text">
            {configData?.workspace ?? '(default)'}
          </div>
        </FormRow>
        <FormRow label="Switch to">
          <div className="flex gap-1">
            <TermInput
              type="text"
              id="workspace-path-input"
              placeholder="/path/to/project"
              className="flex-1"
              defaultValue=""
            />
            <TermButton
              variant="primary"
              size="sm"
              onClick={() => {
                const input = document.getElementById("workspace-path-input") as HTMLInputElement;
                const val = input?.value?.trim();
                if (!val) return;
                sendCommand({ type: "SWITCH_WORKSPACE", path: val });
                input.value = "";
              }}
            >Switch</TermButton>
          </div>
        </FormRow>
        {(configData?.recentWorkspaces ?? []).length > 0 && (
          <div className="pl-[112px] mt-1.5 space-y-0.5">
            <div className="text-[9px] text-muted-foreground opacity-60 mb-1">Recent:</div>
            {(configData?.recentWorkspaces ?? []).slice(0, 5).map((ws, i) => (
              <button
                key={i}
                onClick={() => sendCommand({ type: "SWITCH_WORKSPACE", path: ws })}
                className="block w-full text-left text-[10px] font-mono text-muted-foreground hover:text-foreground truncate py-0.5 px-1 rounded hover:bg-white/[0.04] transition-colors"
                title={ws}
              >
                {ws === configData?.workspace ? '● ' : '  '}{ws}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ---- System Info Section ---- */}
      <div className="border-b border-term-border-dim pb-3 mb-3">
        <span className="text-[13px] text-foreground font-medium block mb-2">System Info</span>
        <div className="text-term text-[12px] text-muted-foreground pl-2 space-y-1 font-mono select-text">
          {configData?.machineId && (
            <div><span className="opacity-60">Machine ID:</span> {configData.machineId}</div>
          )}
          {configData?.workspace && (
            <div><span className="opacity-60">Workspace:</span> {configData.workspace}</div>
          )}
          {configData?.dataDir && (
            <div><span className="opacity-60">Data Dir:</span> {configData.dataDir}</div>
          )}
          {detectedBackends.length > 0 && (
            <div className="pt-1">
              <span className="opacity-60">Backends:</span>
              {detectedBackends.map(b => (
                <span key={b} className="inline-flex items-center gap-1 ml-2">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-sem-green" />
                  {b}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ---- Version ---- */}
      <div className="border-t border-term-border-dim mt-1 pt-2 text-[11px] text-muted-foreground font-mono leading-snug select-text" title="From monorepo root package.json at build time">
        <div>
          <span className="opacity-75">Web UI</span>{' '}
          <span className="text-foreground">v{APP_VERSION}</span>
        </div>
        {APP_BUILD_TIME ? (
          <div className="mt-0.5 text-[10px] opacity-90">
            build {APP_BUILD_TIME.replace('T', ' ').replace(/\.\d{3}Z$/, ' UTC')}
          </div>
        ) : null}
      </div>
    </TermModal>
  )
}
