import { useCallback, useEffect, useRef, useState } from 'react';
import { firstEnabledModel, isModelId, MODELS, type ModelId } from '../config/models';
import { probeLocalChatGptBridge } from '../services/localBridge';

const STORAGE_KEY = 'gsyen-selected-model';

function readStoredModel(): ModelId | null {
  try {
    const value = localStorage.getItem(STORAGE_KEY);
    if (isModelId(value)) return value;
    if (value) localStorage.removeItem(STORAGE_KEY);
  } catch {}
  return null;
}

function writeStoredModel(model: ModelId) {
  try { localStorage.setItem(STORAGE_KEY, model); } catch {}
}

async function fetchModelHealth(): Promise<Record<string, any> | null> {
  const base = window.location.protocol === 'file:' ? 'https://gsyen.com' : '';
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), 3000);
  try {
    const res = await fetch(`${base}/api/health`, {
      cache: 'no-store',
      signal: controller.signal,
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.models ?? null;
  } catch {
    return null;
  } finally {
    window.clearTimeout(timer);
  }
}

function isRemoteOnline(modelId: string, models: Record<string, any> | null): boolean {
  const status = models?.[modelId];
  if (typeof status === 'boolean') return status;
  return typeof status === 'object' && status?.available === true;
}

async function firstOnlineModel(): Promise<ModelId | null> {
  const [remote, local] = await Promise.all([
    fetchModelHealth(),
    probeLocalChatGptBridge(900, true).catch(() => null),
  ]);

  for (const model of MODELS) {
    if (model.disabled) continue;
    if (model.id === 'chatgpt-pro') {
      if (local?.health.status === 'online') return model.id as ModelId;
    } else if (isRemoteOnline(model.id, remote)) {
      return model.id as ModelId;
    }
  }
  return null;
}

export function usePreferredModel() {
  const storedAtStartRef = useRef<ModelId | null>(null);
  const userSelectedRef = useRef(false);
  const [selectedModel, setSelectedModelState] = useState<ModelId>(() => {
    const stored = readStoredModel();
    storedAtStartRef.current = stored;
    return stored ?? firstEnabledModel();
  });

  const setSelectedModel = useCallback((model: string | null | undefined) => {
    if (!isModelId(model)) return;
    userSelectedRef.current = true;
    writeStoredModel(model);
    setSelectedModelState(model);
  }, []);

  useEffect(() => {
    if (storedAtStartRef.current) return;
    let cancelled = false;
    firstOnlineModel().then(model => {
      if (cancelled || userSelectedRef.current || !model) return;
      writeStoredModel(model);
      setSelectedModelState(model);
    });
    return () => { cancelled = true; };
  }, []);

  return { selectedModel, setSelectedModel };
}
