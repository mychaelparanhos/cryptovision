"use client";

import { useEffect, useState, useCallback } from "react";

interface ApiKeyData {
  id: string;
  key_prefix: string;
  name: string | null;
  usage_today: number;
  last_used: string | null;
  revoked_at: string | null;
  created_at: string;
}

export default function ApiKeysPage() {
  const [keys, setKeys] = useState<ApiKeyData[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newKeyName, setNewKeyName] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [newlyCreatedKey, setNewlyCreatedKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const fetchKeys = useCallback(async () => {
    try {
      const res = await fetch("/api/v1/auth/api-keys");
      const data = await res.json();
      setKeys(data.keys || []);
    } catch (err) {
      console.error("Failed to fetch keys:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchKeys();
  }, [fetchKeys]);

  async function handleCreate() {
    setCreating(true);
    try {
      const res = await fetch("/api/v1/auth/api-keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newKeyName || undefined }),
      });
      const data = await res.json();
      if (data.key) {
        setNewlyCreatedKey(data.key);
        setNewKeyName("");
        await fetchKeys();
      }
    } catch (err) {
      console.error("Failed to create key:", err);
    } finally {
      setCreating(false);
    }
  }

  async function handleRevoke(id: string) {
    if (!confirm("Are you sure you want to revoke this API key? This cannot be undone.")) {
      return;
    }
    try {
      await fetch(`/api/v1/auth/api-keys/${id}`, { method: "DELETE" });
      await fetchKeys();
    } catch (err) {
      console.error("Failed to revoke key:", err);
    }
  }

  function handleCopy() {
    if (newlyCreatedKey) {
      navigator.clipboard.writeText(newlyCreatedKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  const activeKeys = keys.filter((k) => !k.revoked_at);
  const revokedKeys = keys.filter((k) => k.revoked_at);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#FAFAFA]">API Keys</h1>
          <p className="mt-1 text-sm text-[#71717A]">
            Manage your API keys for programmatic access to CryptoVision data.
          </p>
        </div>
        <button
          onClick={() => {
            setShowModal(true);
            setNewlyCreatedKey(null);
          }}
          className="rounded-lg bg-[#F59E0B] px-4 py-2 text-sm font-semibold text-[#09090B] transition-colors hover:bg-[#D97706]"
        >
          Create Key
        </button>
      </div>

      {/* Active Keys */}
      <div className="rounded-xl border border-[#27272A] bg-[#18181B] p-6">
        <h2 className="mb-4 text-lg font-semibold text-[#FAFAFA]">Active Keys</h2>
        {loading ? (
          <div className="py-8 text-center text-[#71717A]">Loading...</div>
        ) : activeKeys.length === 0 ? (
          <div className="py-8 text-center text-[#71717A]">
            No active API keys. Create one to get started.
          </div>
        ) : (
          <div className="space-y-3">
            {activeKeys.map((key) => (
              <div
                key={key.id}
                className="flex items-center justify-between rounded-lg border border-[#27272A] bg-[#09090B] p-4"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <code className="text-sm font-mono text-[#F59E0B]">
                      {key.key_prefix}...
                    </code>
                    {key.name && (
                      <span className="text-sm text-[#A1A1AA]">{key.name}</span>
                    )}
                  </div>
                  <div className="mt-1 flex items-center gap-4 text-xs text-[#71717A]">
                    <span>
                      Created {new Date(key.created_at).toLocaleDateString()}
                    </span>
                    <span>
                      Usage today: {key.usage_today || 0}
                    </span>
                    {key.last_used && (
                      <span>
                        Last used: {new Date(key.last_used).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => handleRevoke(key.id)}
                  className="ml-4 rounded-md border border-red-500/30 px-3 py-1.5 text-xs font-medium text-red-400 transition-colors hover:bg-red-500/10"
                >
                  Revoke
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Revoked Keys */}
      {revokedKeys.length > 0 && (
        <div className="rounded-xl border border-[#27272A] bg-[#18181B] p-6">
          <h2 className="mb-4 text-lg font-semibold text-[#71717A]">Revoked Keys</h2>
          <div className="space-y-3">
            {revokedKeys.map((key) => (
              <div
                key={key.id}
                className="flex items-center justify-between rounded-lg border border-[#27272A] bg-[#09090B] p-4 opacity-50"
              >
                <div>
                  <div className="flex items-center gap-3">
                    <code className="text-sm font-mono text-[#71717A] line-through">
                      {key.key_prefix}...
                    </code>
                    {key.name && (
                      <span className="text-sm text-[#52525B]">{key.name}</span>
                    )}
                  </div>
                  <div className="mt-1 text-xs text-[#52525B]">
                    Revoked {key.revoked_at ? new Date(key.revoked_at).toLocaleDateString() : ""}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Usage Info */}
      <div className="rounded-xl border border-[#27272A] bg-[#18181B] p-6">
        <h2 className="mb-3 text-lg font-semibold text-[#FAFAFA]">Usage</h2>
        <p className="text-sm text-[#A1A1AA]">
          Include your API key in the <code className="text-[#F59E0B]">Authorization</code> header:
        </p>
        <div className="mt-3 rounded-lg bg-[#09090B] p-4">
          <code className="text-sm text-[#A1A1AA]">
            Authorization: Bearer cv_your_api_key_here
          </code>
        </div>
        <p className="mt-3 text-xs text-[#71717A]">
          Rate limits are based on your plan. Check the pricing page for details.
        </p>
      </div>

      {/* Create Modal */}
      {showModal && (
        <>
          <div
            className="fixed inset-0 z-50 bg-black/60"
            onClick={() => {
              if (!newlyCreatedKey) setShowModal(false);
            }}
          />
          <div className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-xl border border-[#27272A] bg-[#18181B] p-6 shadow-xl">
            {newlyCreatedKey ? (
              <>
                <h3 className="text-lg font-semibold text-[#FAFAFA]">
                  API Key Created
                </h3>
                <p className="mt-2 text-sm text-[#F59E0B]">
                  Copy this key now. It will not be shown again.
                </p>
                <div className="mt-4 flex items-center gap-2 rounded-lg bg-[#09090B] p-4">
                  <code className="flex-1 break-all text-sm text-[#FAFAFA]">
                    {newlyCreatedKey}
                  </code>
                  <button
                    onClick={handleCopy}
                    className="flex-shrink-0 rounded-md bg-[#27272A] px-3 py-1.5 text-xs text-[#FAFAFA] transition-colors hover:bg-[#3F3F46]"
                  >
                    {copied ? "Copied!" : "Copy"}
                  </button>
                </div>
                <button
                  onClick={() => {
                    setShowModal(false);
                    setNewlyCreatedKey(null);
                  }}
                  className="mt-4 w-full rounded-lg bg-[#27272A] py-2 text-sm font-medium text-[#FAFAFA] transition-colors hover:bg-[#3F3F46]"
                >
                  Done
                </button>
              </>
            ) : (
              <>
                <h3 className="text-lg font-semibold text-[#FAFAFA]">
                  Create API Key
                </h3>
                <p className="mt-1 text-sm text-[#71717A]">
                  Give your key a name to help you identify it later.
                </p>
                <input
                  type="text"
                  value={newKeyName}
                  onChange={(e) => setNewKeyName(e.target.value)}
                  placeholder="e.g. Trading Bot, Dashboard, etc."
                  className="mt-4 w-full rounded-lg border border-[#27272A] bg-[#09090B] px-4 py-2.5 text-sm text-[#FAFAFA] placeholder-[#52525B] focus:border-[#F59E0B] focus:outline-none focus:ring-1 focus:ring-[#F59E0B]"
                />
                <div className="mt-4 flex gap-3">
                  <button
                    onClick={() => setShowModal(false)}
                    className="flex-1 rounded-lg border border-[#27272A] py-2 text-sm font-medium text-[#A1A1AA] transition-colors hover:bg-[#27272A]"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreate}
                    disabled={creating}
                    className="flex-1 rounded-lg bg-[#F59E0B] py-2 text-sm font-semibold text-[#09090B] transition-colors hover:bg-[#D97706] disabled:opacity-50"
                  >
                    {creating ? "Creating..." : "Create"}
                  </button>
                </div>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}
