process.env.DISABLE_HMR = 'true';
import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';
import webpush from 'web-push';

dotenv.config({ override: true });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
function getPort(): number {
  if (process.env.PORT) {
    const p = parseInt(process.env.PORT, 10);
    if (!isNaN(p)) return p;
  }
  const portIndex = process.argv.indexOf('--port');
  if (portIndex !== -1 && process.argv[portIndex + 1]) {
    const p = parseInt(process.argv[portIndex + 1], 10);
    if (!isNaN(p)) return p;
  }
  return 3000;
}
const PORT = getPort();

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Helper to safely extract JSON even with markdown, preambles, or conversational packaging
function extractJson(text: string): any {
  if (!text || typeof text !== 'string') return null;
  const trimmed = text.trim();

  // Try direct parse first
  try {
    return JSON.parse(trimmed);
  } catch (_) {}

  // Try extracting from markdown code fence
  const fenceRegex = /```(?:json)?\s*([\s\S]*?)\s*```/i;
  const fenceMatch = trimmed.match(fenceRegex);
  if (fenceMatch && fenceMatch[1]) {
    try {
      return JSON.parse(fenceMatch[1].trim());
    } catch (_) {}
  }

  // Look for outermost JSON object { ... }
  const firstBrace = trimmed.indexOf('{');
  const lastBrace = trimmed.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace > firstBrace) {
    try {
      return JSON.parse(trimmed.slice(firstBrace, lastBrace + 1));
    } catch (_) {}
  }

  // Look for outermost JSON array [ ... ]
  const firstBracket = trimmed.indexOf('[');
  const lastBracket = trimmed.lastIndexOf(']');
  if (firstBracket !== -1 && lastBracket > firstBracket) {
    try {
      return JSON.parse(trimmed.slice(firstBracket, lastBracket + 1));
    } catch (_) {}
  }

  return null;
}

const getGeminiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY || '';
  return new GoogleGenAI({ apiKey });
};

// API Endpoint: Proxy Gemini API calls securely server-side with resilient multi-model fallback
app.post('/api/ai/generate', async (req, res) => {
  try {
    const { prompt, model: requestedModel, json = false, inlineData } = req.body;
    const client = getGeminiClient();

    // Model fallback chain:
    // Prefer gemini-3.1-flash-lite as primary high-availability model,
    // and automatically fallback to other valid models if 503 high demand spikes occur
    const preferredModel = requestedModel || 'gemini-3.1-flash-lite';
    const candidateModels = [
      preferredModel,
      'gemini-3.1-flash-lite',
      'gemini-flash-latest',
      'gemini-3.8-flash'
    ].filter((m, idx, arr) => arr.indexOf(m) === idx);

    let lastError: any = null;

    for (const modelToTry of candidateModels) {
      try {
        let contents: any = prompt;
        if (inlineData) {
          contents = [
            {
              role: 'user',
              parts: [
                {
                  inlineData: {
                    data: inlineData.data,
                    mimeType: inlineData.mimeType
                  }
                },
                { text: prompt || '' }
              ]
            }
          ];
        }

        const config: any = {};
        if (json) {
          config.responseMimeType = 'application/json';
        }

        const response = await client.models.generateContent({
          model: modelToTry,
          contents,
          config
        });

        const text = response.text || '';
        if (json) {
          const parsed = extractJson(text);
          return res.json({ success: true, data: parsed, text, modelUsed: modelToTry });
        }

        return res.json({ success: true, text, modelUsed: modelToTry });
      } catch (err: any) {
        console.warn(`[Gemini Proxy] Model '${modelToTry}' attempt failed:`, err?.message || err);
        lastError = err;
        // Continue loop to try next fallback model
      }
    }

    console.error('[Gemini Proxy] All candidate models failed:', lastError);
    return res.status(500).json({ 
      success: false, 
      error: lastError?.message || 'Failed to generate AI response' 
    });
  } catch (error: any) {
    console.error('Gemini proxy error:', error);
    return res.status(500).json({ 
      success: false, 
      error: error?.message || 'Failed to generate AI response' 
    });
  }
});

// Helper to get effective server-configured ElevenLabs API key
function getEffectiveElevenLabsKey(): string {
  // 1. Process environment (e.g. injected by runtime / secrets)
  const envKey = process.env.ELEVENLABS_API_KEY?.trim();
  if (envKey && envKey.length > 5 && envKey !== 'MY_ELEVENLABS_API_KEY') {
    return envKey;
  }
  // 2. Local .env file
  try {
    const envPath = path.resolve(__dirname, '.env');
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, 'utf8');
      const match = content.match(/ELEVENLABS_API_KEY=["']?([^"'\r\n]+)["']?/);
      if (match && match[1] && match[1] !== 'MY_ELEVENLABS_API_KEY') {
        return match[1].trim();
      }
    }
  } catch (_) {}
  // 3. Parent .dev.env.json
  try {
    const devEnvPath = path.resolve(__dirname, '..', '.dev.env.json');
    if (fs.existsSync(devEnvPath)) {
      const data = JSON.parse(fs.readFileSync(devEnvPath, 'utf8'));
      if (data.ELEVENLABS_API_KEY && data.ELEVENLABS_API_KEY !== 'MY_ELEVENLABS_API_KEY') {
        return data.ELEVENLABS_API_KEY.trim();
      }
    }
  } catch (_) {}
  return '';
}

// Helper to get effective voice ID (guarantees valid premade voice IDs)
function getEffectiveElevenLabsVoiceId(requestedVoiceId?: string): string {
  const PREMADE_VALID = [
    'EXAVITQu4vr4xnSDxMaL', // Sarah (premade, widely supported)
    '21m00Tcm4TlvDq8ikWAM', // Rachel
    'AZnzlk1XvdvUeBnXmlld', // Domi
    'ErXwobaYiN019PkySvjV', // Antoni
    'pNInz6obpgDQGcFmaJgB', // Adam
    'TxGEqnHWrfWFTfGW9XjX', // Josh
    'Xb7hH8MSUJpSbSDYk0k2'  // Alice
  ];
  if (requestedVoiceId && PREMADE_VALID.includes(requestedVoiceId)) {
    return requestedVoiceId;
  }
  const envVoice = process.env.ELEVENLABS_VOICE_ID?.trim();
  if (envVoice && PREMADE_VALID.includes(envVoice)) {
    return envVoice;
  }
  return 'EXAVITQu4vr4xnSDxMaL'; // Sarah as reliable default
}

// API Endpoint: ElevenLabs Text-to-Speech Proxy
app.post('/api/elevenlabs/tts', async (req, res) => {
  try {
    const { text, voiceId, modelId = 'eleven_multilingual_v2', stability = 0.5, similarityBoost = 0.75 } = req.body;
    
    if (!text || typeof text !== 'string') {
      return res.status(400).json({ success: false, error: 'Text is required for TTS' });
    }

    const effectiveKey = getEffectiveElevenLabsKey();

    if (!effectiveKey) {
      return res.status(200).json({ 
        success: false, 
        configured: false, 
        fallback: true,
        error: 'ELEVENLABS_API_KEY is not configured on server. Seamlessly utilizing high-clarity Neural Speech.' 
      });
    }

    const targetVoiceId = getEffectiveElevenLabsVoiceId(voiceId);

    const elevenRes = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${targetVoiceId}`, {
      method: 'POST',
      headers: {
        'Accept': 'audio/mpeg',
        'Content-Type': 'application/json',
        'xi-api-key': effectiveKey
      },
      body: JSON.stringify({
        text: text.slice(0, 4500),
        model_id: modelId,
        voice_settings: {
          stability: Number(stability),
          similarity_boost: Number(similarityBoost),
          style: 0.15,
          use_speaker_boost: true
        }
      })
    });

    if (!elevenRes.ok) {
      const errText = await elevenRes.text();
      console.warn('ElevenLabs API response:', elevenRes.status, errText);
      return res.status(200).json({ 
        success: false, 
        fallback: true,
        error: `ElevenLabs API error (${elevenRes.status}): ${errText}` 
      });
    }

    // Stream or convert audio buffer to base64
    const audioArrayBuffer = await elevenRes.arrayBuffer();
    const audioBuffer = Buffer.from(audioArrayBuffer);
    const base64Audio = audioBuffer.toString('base64');
    const dataUri = `data:audio/mpeg;base64,${base64Audio}`;

    return res.json({ 
      success: true, 
      audioUrl: dataUri,
      provider: 'elevenlabs',
      voiceId: targetVoiceId
    });
  } catch (error: any) {
    console.error('ElevenLabs proxy exception:', error);
    return res.status(200).json({ 
      success: false, 
      fallback: true,
      error: error?.message || 'Failed to generate ElevenLabs speech' 
    });
  }
});

// API Endpoint: Validate ElevenLabs API Key on Server
app.post('/api/elevenlabs/validate', async (_req, res) => {
  try {
    const key = getEffectiveElevenLabsKey();

    if (!key) {
      return res.json({ valid: false, error: 'No ElevenLabs API key configured on server.' });
    }

    const testRes = await fetch('https://api.elevenlabs.io/v1/user', {
      headers: { 'xi-api-key': key }
    });

    if (!testRes.ok) {
      const err = await testRes.text();
      return res.json({ valid: false, error: `Invalid key or unauthorized (${testRes.status}): ${err}` });
    }

    const userData = await testRes.json();
    return res.json({
      valid: true,
      tier: userData?.subscription?.tier || 'Free Tier',
      characterCount: userData?.subscription?.character_count || 0,
      characterLimit: userData?.subscription?.character_limit || 10000
    });
  } catch (err: any) {
    return res.json({ valid: false, error: err?.message || 'Failed to contact ElevenLabs' });
  }
});

// API Endpoint: Check ElevenLabs status and get curated voice list
app.get('/api/elevenlabs/voices', async (_req, res) => {
  const effectiveKey = getEffectiveElevenLabsKey();
  const isConfigured = Boolean(effectiveKey && effectiveKey.length > 5);

  const curatedVoices = [
    { 
      voiceId: 'EXAVITQu4vr4xnSDxMaL', 
      name: 'Nora (ElevenLabs Neural)', 
      tagline: 'Ultra-Lifelike Socratic Voice',
      description: 'Studio-grade neural voice model tailored for Nora. Coming soon with Academic Pro subscriptions.', 
      gender: 'female',
      sampleText: "Hello! I am Nora with ElevenLabs neural studio synthesis. Clear, adaptive tutoring is coming soon.",
      isComingSoon: true,
      badge: 'Coming Soon'
    }
  ];

  return res.json({
    configured: isConfigured,
    serverConfigured: isConfigured,
    defaultVoiceId: getEffectiveElevenLabsVoiceId(),
    voices: curatedVoices
  });
});

// =========================================================================
// Real-Time Active & Offline User Presence Tracker
// =========================================================================
interface UserPresenceRecord {
  lastSeen: number;
  isOnline: boolean;
  role?: string;
}

const activePresenceMap = new Map<string, UserPresenceRecord>();
const deletedUsersSet = new Set<string>(['usr_y0na13', 'demo_user']);
const deletedEmailsSet = new Set<string>(['alex.morgan@learnora.app']);

// Clean up stale presence sessions (> 5 minutes without heartbeat)
setInterval(() => {
  const now = Date.now();
  for (const [uid, record] of activePresenceMap.entries()) {
    if (now - record.lastSeen > 5 * 60 * 1000 || deletedUsersSet.has(uid)) {
      activePresenceMap.delete(uid);
    }
  }
}, 60 * 1000);

// Endpoint: Heartbeat to signal user is actively interacting with the app
app.post('/api/presence/heartbeat', (req, res) => {
  try {
    const { uid, isOnline = true, role } = req.body || {};
    if (!uid || typeof uid !== 'string') {
      return res.status(400).json({ success: false, error: 'User ID is required' });
    }

    if (deletedUsersSet.has(uid) || (req.body.email && deletedEmailsSet.has(req.body.email.toLowerCase().trim()))) {
      activePresenceMap.delete(uid);
      return res.json({ success: false, error: 'User account has been deleted' });
    }

    if (isOnline === false) {
      activePresenceMap.delete(uid);
    } else {
      activePresenceMap.set(uid, {
        lastSeen: Date.now(),
        isOnline: true,
        role
      });
    }

    return res.json({ 
      success: true, 
      activeCount: activePresenceMap.size 
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// Endpoint: Query active online presence stats
app.get('/api/presence/stats', (_req, res) => {
  const now = Date.now();
  const activeUserIds: string[] = [];
  for (const [uid, record] of activePresenceMap.entries()) {
    if (record.isOnline && now - record.lastSeen <= 5 * 60 * 1000) {
      activeUserIds.push(uid);
    } else {
      activePresenceMap.delete(uid);
    }
  }

  return res.json({
    success: true,
    onlineCount: activeUserIds.length,
    activeUserIds
  });
});

// =========================================================================
// Web Push & FCM Server-Side Push Notification Infrastructure
// =========================================================================

const ADMIN_EMAIL = 'adedayoademola171@gmail.com';
const isAdminEmail = (email?: string | null): boolean => 
  Boolean(email && email.trim().toLowerCase() === ADMIN_EMAIL.toLowerCase());

const VAPID_KEY_FILE = path.resolve(__dirname, '.vapid-keys.json');
const PUSH_DEVICES_FILE = path.resolve(__dirname, '.push-devices.json');

// Initialize or load persistent standards-compliant VAPID keys
function initVapidKeys() {
  const envPub = process.env.VAPID_PUBLIC_KEY?.trim();
  const envPriv = process.env.VAPID_PRIVATE_KEY?.trim();
  if (envPub && envPriv && envPub.length > 20 && envPriv.length > 20) {
    return { publicKey: envPub, privateKey: envPriv };
  }

  try {
    if (fs.existsSync(VAPID_KEY_FILE)) {
      const data = JSON.parse(fs.readFileSync(VAPID_KEY_FILE, 'utf8'));
      if (data.publicKey && data.privateKey) {
        return data;
      }
    }
  } catch (_) {}

  // Generate RFC 8292 compliant VAPID keypair
  const generated = webpush.generateVAPIDKeys();
  try {
    fs.writeFileSync(VAPID_KEY_FILE, JSON.stringify(generated, null, 2), 'utf8');
  } catch (_) {}
  return generated;
}

const vapidKeys = initVapidKeys();
try {
  webpush.setVapidDetails(
    'mailto:adedayoademola171@gmail.com',
    vapidKeys.publicKey,
    vapidKeys.privateKey
  );
} catch (e) {
  console.warn('[WebPush] VAPID details configuration notice:', e);
}

// In-memory registry with resilient file backup
const pushDevices = new Map<string, any>();

function loadPushDevices() {
  try {
    if (fs.existsSync(PUSH_DEVICES_FILE)) {
      const list = JSON.parse(fs.readFileSync(PUSH_DEVICES_FILE, 'utf8'));
      if (Array.isArray(list)) {
        list.forEach((d: any) => {
          if (d && d.id) pushDevices.set(d.id, d);
        });
      }
    }
  } catch (_) {}
}

function savePushDevices() {
  try {
    const list = Array.from(pushDevices.values());
    fs.writeFileSync(PUSH_DEVICES_FILE, JSON.stringify(list, null, 2), 'utf8');
  } catch (_) {}
}

loadPushDevices();

// Check if recipient is within active quiet hours
function isWithinQuietHours(preferences?: any): boolean {
  if (!preferences || !preferences.quietHoursEnabled) return false;
  const start = preferences.quietHoursStart || '22:00';
  const end = preferences.quietHoursEnd || '08:00';

  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  const [sH, sM] = start.split(':').map(Number);
  const startMinutes = (sH || 0) * 60 + (sM || 0);

  const [eH, eM] = end.split(':').map(Number);
  const endMinutes = (eH || 0) * 60 + (eM || 0);

  if (startMinutes > endMinutes) {
    // Overnight range, e.g. 22:00 to 08:00
    return currentMinutes >= startMinutes || currentMinutes < endMinutes;
  } else {
    // Same-day range
    return currentMinutes >= startMinutes && currentMinutes < endMinutes;
  }
}

// 1. Expose active VAPID Public Key to clients
app.get('/api/push/vapid-public-key', (_req, res) => {
  return res.json({ publicKey: vapidKeys.publicKey });
});

// 2. Register or update device push subscription
app.post('/api/push/register', (req, res) => {
  try {
    const { deviceId, userId, userEmail, subscription, deviceType, browser, userAgent, preferences } = req.body;

    if (!deviceId || !subscription || !subscription.endpoint) {
      return res.status(400).json({ success: false, error: 'Device ID and valid PushSubscription are required' });
    }

    const existing = pushDevices.get(deviceId) || {};
    const updated = {
      ...existing,
      id: deviceId,
      userId: userId || existing.userId || 'guest',
      userEmail: userEmail || existing.userEmail || '',
      subscription,
      deviceType: deviceType || existing.deviceType || 'unknown',
      browser: browser || existing.browser || 'unknown',
      userAgent: userAgent || existing.userAgent || '',
      enabled: true,
      preferences: preferences || existing.preferences || {
        dailyStudyReminder: true,
        spacedReviewAlerts: true,
        streakProtectionAlerts: true,
        tutorCheckIns: true,
        adminAnnouncements: true,
        quietHoursEnabled: true,
        quietHoursStart: '22:00',
        quietHoursEnd: '08:00'
      },
      createdAt: existing.createdAt || Date.now(),
      updatedAt: Date.now(),
      lastSeenAt: Date.now()
    };

    pushDevices.set(deviceId, updated);
    savePushDevices();

    return res.json({ success: true, deviceId, totalDevices: pushDevices.size });
  } catch (err: any) {
    console.error('[WebPush] Register error:', err);
    return res.status(500).json({ success: false, error: err?.message || 'Registration failed' });
  }
});

// 3. Unregister device (opt-out or logout)
app.post('/api/push/unregister', (req, res) => {
  try {
    const { deviceId, userId } = req.body;
    if (deviceId && pushDevices.has(deviceId)) {
      const dev = pushDevices.get(deviceId);
      dev.enabled = false;
      dev.updatedAt = Date.now();
      pushDevices.set(deviceId, dev);
      savePushDevices();
    } else if (userId) {
      // Disable all devices matching this user
      for (const [id, dev] of pushDevices.entries()) {
        if (dev.userId === userId) {
          dev.enabled = false;
          dev.updatedAt = Date.now();
          pushDevices.set(id, dev);
        }
      }
      savePushDevices();
    }
    return res.json({ success: true });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err?.message });
  }
});

// 4. Update notification preferences
app.post('/api/push/preferences', (req, res) => {
  try {
    const { deviceId, userId, preferences } = req.body;
    let updatedCount = 0;

    if (deviceId && pushDevices.has(deviceId)) {
      const dev = pushDevices.get(deviceId);
      dev.preferences = { ...dev.preferences, ...preferences };
      dev.updatedAt = Date.now();
      pushDevices.set(deviceId, dev);
      updatedCount++;
    } else if (userId) {
      for (const [id, dev] of pushDevices.entries()) {
        if (dev.userId === userId) {
          dev.preferences = { ...dev.preferences, ...preferences };
          dev.updatedAt = Date.now();
          pushDevices.set(id, dev);
          updatedCount++;
        }
      }
    }
    savePushDevices();
    return res.json({ success: true, updatedCount });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err?.message });
  }
});

// 5. Test push notification: sends real system push to this user's device
app.post('/api/push/test', async (req, res) => {
  try {
    const { userId, deviceId } = req.body;
    let targetDevice: any = null;

    if (deviceId && pushDevices.has(deviceId)) {
      targetDevice = pushDevices.get(deviceId);
    } else if (userId) {
      for (const dev of pushDevices.values()) {
        if (dev.userId === userId && dev.enabled && dev.subscription) {
          targetDevice = dev;
          break;
        }
      }
    }

    if (!targetDevice || !targetDevice.subscription) {
      return res.status(404).json({ 
        success: false, 
        error: 'No active push device found for this session. Please enable push notifications in settings first.' 
      });
    }

    const payload = JSON.stringify({
      title: '🧠 Learnora Study Prompt',
      message: 'Native Web Push is active on your device! Your spaced repetition and study reminders will alert you right on schedule.',
      actionUrl: 'review-queue',
      actionLabel: 'Open Review Queue',
      tag: 'learnora-test-prompt-' + Date.now(),
      priority: 'high',
      icon: '/pwa-192x192.png',
      badge: '/favicon-32x32.png'
    });

    try {
      await webpush.sendNotification(targetDevice.subscription, payload);
      targetDevice.lastSeenAt = Date.now();
      savePushDevices();

      return res.json({ 
        success: true, 
        message: `Native push notification delivered to ${targetDevice.deviceType} (${targetDevice.browser})!` 
      });
    } catch (pushErr: any) {
      console.warn('[WebPush] Test push error:', pushErr?.statusCode, pushErr?.message);
      if (pushErr?.statusCode === 410 || pushErr?.statusCode === 404) {
        targetDevice.enabled = false;
        savePushDevices();
        return res.status(410).json({ 
          success: false, 
          error: 'Push subscription expired on the browser push service. Please re-enable notifications.' 
        });
      }
      return res.status(500).json({ 
        success: false, 
        error: pushErr?.message || 'Push delivery failed on provider gateway.' 
      });
    }
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err?.message });
  }
});

// 6. Send broadcast or targeted notification (Admin authorized)
app.post('/api/push/send', async (req, res) => {
  try {
    const adminEmail = (req.headers['x-admin-email'] as string) || req.body.adminEmail;
    if (!isAdminEmail(adminEmail)) {
      return res.status(403).json({ success: false, error: 'Unauthorized: Admin privileges required.' });
    }

    const { 
      title, 
      message, 
      actionUrl = 'review-queue', 
      actionLabel = 'Open Learnora', 
      type = 'announcement', 
      priority = 'high',
      targetUserId,
      ignoreQuietHours = false
    } = req.body;

    if (!title || !message) {
      return res.status(400).json({ success: false, error: 'Title and message are required' });
    }

    const payload = JSON.stringify({
      title,
      message,
      actionUrl,
      actionLabel,
      type,
      priority,
      tag: `learnora-${type}-${Date.now()}`,
      icon: '/pwa-192x192.png',
      badge: '/favicon-32x32.png',
      timestamp: Date.now()
    });

    const activeDevices = Array.from(pushDevices.values()).filter(d => {
      if (!d.enabled || !d.subscription) return false;
      if (targetUserId && targetUserId !== 'all' && d.userId !== targetUserId) return false;
      return true;
    });

    let sentCount = 0;
    let failedCount = 0;
    let quietHoursSkipped = 0;

    for (const dev of activeDevices) {
      // Check quiet hours unless urgent priority
      if (!ignoreQuietHours && priority !== 'urgent' && isWithinQuietHours(dev.preferences)) {
        quietHoursSkipped++;
        continue;
      }

      try {
        await webpush.sendNotification(dev.subscription, payload);
        sentCount++;
        dev.lastSeenAt = Date.now();
      } catch (err: any) {
        failedCount++;
        if (err?.statusCode === 410 || err?.statusCode === 404) {
          // Token expired or uninstalled
          dev.enabled = false;
        }
      }
    }

    savePushDevices();

    return res.json({ 
      success: true, 
      sentCount, 
      failedCount, 
      quietHoursSkipped,
      totalActiveDevices: activeDevices.length,
      totalRegistered: pushDevices.size 
    });
  } catch (err: any) {
    console.error('[WebPush] Send broadcast exception:', err);
    return res.status(500).json({ success: false, error: err?.message });
  }
});

// 7. Get push stats for admin dashboard
app.get('/api/push/stats', (_req, res) => {
  const devices = Array.from(pushDevices.values());
  const active = devices.filter(d => d.enabled);

  const stats = {
    totalDevices: devices.length,
    activeDevices: active.length,
    androidDevices: active.filter(d => d.deviceType === 'android').length,
    iosDevices: active.filter(d => d.deviceType === 'ios').length,
    desktopDevices: active.filter(d => d.deviceType === 'desktop').length,
    mobileDevices: active.filter(d => d.deviceType === 'mobile' || d.deviceType === 'android' || d.deviceType === 'ios').length
  };

  return res.json(stats);
});

// =========================================================================
// Learnora AI Personal Study Companion & Automated Reminder Engine
// =========================================================================

const LEARNING_MEMORIES_FILE = path.resolve(__dirname, '.learning-memories.json');
const REMINDER_LOGS_FILE = path.resolve(__dirname, '.reminder-logs.json');

const learningMemories = new Map<string, any>();
const reminderLogs: any[] = [];
let lastReminderProcessTime = 0;
let nextScheduledReminderTime = Date.now() + 10 * 60 * 1000;

function loadLearningMemories() {
  try {
    if (fs.existsSync(LEARNING_MEMORIES_FILE)) {
      const list = JSON.parse(fs.readFileSync(LEARNING_MEMORIES_FILE, 'utf8'));
      if (Array.isArray(list)) {
        list.forEach((m: any) => {
          if (m && m.userId) learningMemories.set(m.userId, m);
        });
      }
    }
  } catch (_) {}
}

function saveLearningMemories() {
  try {
    const list = Array.from(learningMemories.values());
    fs.writeFileSync(LEARNING_MEMORIES_FILE, JSON.stringify(list, null, 2), 'utf8');
  } catch (_) {}
}

// Permanently delete user account and purge server-side state
app.post('/api/admin/users/delete', (req, res) => {
  try {
    const adminEmail = (req.headers['x-admin-email'] as string) || req.body.adminEmail || ADMIN_EMAIL;
    if (!isAdminEmail(adminEmail)) {
      return res.status(403).json({ success: false, error: 'Unauthorized: Admin privileges required.' });
    }

    const { uid, email } = req.body;
    if (!uid && !email) {
      return res.status(400).json({ success: false, error: 'User UID or email is required' });
    }

    // 1. Purge push devices matching this user
    let devicesRemoved = 0;
    for (const [deviceId, dev] of pushDevices.entries()) {
      if ((uid && dev.userId === uid) || (email && dev.userEmail?.toLowerCase() === email.toLowerCase())) {
        pushDevices.delete(deviceId);
        devicesRemoved++;
      }
    }
    if (devicesRemoved > 0) {
      savePushDevices();
    }

    // 2. Purge learning memories
    let memoryRemoved = false;
    if (uid && learningMemories.has(uid)) {
      learningMemories.delete(uid);
      memoryRemoved = true;
    }
    if (email) {
      const cleanEmail = email.toLowerCase().trim();
      for (const [id, m] of learningMemories.entries()) {
        if (m.userEmail?.toLowerCase()?.trim() === cleanEmail) {
          learningMemories.delete(id);
          memoryRemoved = true;
        }
      }
    }
    if (memoryRemoved) {
      saveLearningMemories();
    }

    // 3. Purge active presence and record server tombstone
    if (uid) {
      deletedUsersSet.add(uid);
      if (typeof activePresenceMap !== 'undefined') {
        activePresenceMap.delete(uid);
      }
    }
    if (email) {
      const cleanEmail = email.toLowerCase().trim();
      deletedEmailsSet.add(cleanEmail);
      if (cleanEmail === 'alex.morgan@learnora.app') {
        deletedUsersSet.add('usr_y0na13');
        deletedUsersSet.add('demo_user');
        if (typeof activePresenceMap !== 'undefined') {
          activePresenceMap.delete('usr_y0na13');
          activePresenceMap.delete('demo_user');
        }
      }
    }

    return res.json({ 
      success: true, 
      message: `User ${uid || email} erased from server state, presence, and push registries.` 
    });
  } catch (err: any) {
    console.error('[Admin] Delete user error:', err);
    return res.status(500).json({ success: false, error: err?.message });
  }
});

function loadReminderLogs() {
  try {
    if (fs.existsSync(REMINDER_LOGS_FILE)) {
      const list = JSON.parse(fs.readFileSync(REMINDER_LOGS_FILE, 'utf8'));
      if (Array.isArray(list)) {
        reminderLogs.push(...list.slice(0, 100));
      }
    }
  } catch (_) {}
}

function saveReminderLogs() {
  try {
    fs.writeFileSync(REMINDER_LOGS_FILE, JSON.stringify(reminderLogs.slice(0, 100), null, 2), 'utf8');
  } catch (_) {}
}

loadLearningMemories();
loadReminderLogs();

// Generates an AI reminder strictly grounded in verified student records
async function generateAiStudyReminder(
  memory: any,
  ruleCategory: string
): Promise<{ title: string; message: string }> {
  const subject = memory.currentSubject || 'African Morphology & Linguistics';
  const topic = memory.currentTopic || 'Word Formation Processes';
  const lessonTitle = memory.lastLessonAccessed?.title || memory.unfinishedLessons?.[0]?.title || '';
  const weakArea = memory.weakAreas?.[0]?.topic || '';
  const lastActiveTimestamp = memory.lastStudyActivity?.timestamp || memory.updatedAt || Date.now();
  const hoursSinceActive = Math.max(1, Math.round((Date.now() - lastActiveTimestamp) / (1000 * 3600)));

  try {
    const client = getGeminiClient();
    const candidateModels = [
      'gemini-3.1-flash-lite',
      'gemini-flash-latest',
      'gemini-3.8-flash'
    ];

    const prompt = `You are the Learnora AI Personal Study Companion (Nora).
Generate a concise, encouraging push notification for a student.

GROUNDED STUDENT RECORDS (DO NOT DEVIATE OR INVENT FACTS):
- Reminder Category: ${ruleCategory}
- Active Subject: ${subject}
- Active Topic: ${topic}
${lessonTitle ? `- Unfinished Lesson Title: "${lessonTitle}"` : '- No unfinished lesson recorded.'}
${weakArea ? `- Diagnosed Weak Concept to Strengthen: "${weakArea}"` : '- No weak areas diagnosed.'}
- Last Study Session: ${hoursSinceActive} hours ago

STRICT GROUNDING & ACCURACY RULES:
1. Base the notification EXCLUSIVELY on the factual records above.
2. NEVER invent an upcoming exam, test date, assignment deadline, or grades.
3. If no unfinished lesson is listed, do NOT mention an unfinished lesson.
4. If no weak concept is listed, do NOT mention any weakness or struggle.
5. Title MUST be under 38 characters.
6. Message body MUST be under 115 characters.
7. Return ONLY valid JSON: { "title": "...", "message": "..." } with no explanation.`;

    for (const modelToTry of candidateModels) {
      try {
        const response = await client.models.generateContent({
          model: modelToTry,
          contents: prompt,
          config: {
            responseMimeType: 'application/json'
          }
        });
        const parsed = extractJson(response.text || '');
        if (parsed && parsed.title && parsed.message) {
          return {
            title: String(parsed.title).trim().slice(0, 45),
            message: String(parsed.message).trim().slice(0, 130)
          };
        }
      } catch (geminiErr: any) {
        console.warn(`[ReminderEngine] Gemini ${modelToTry} attempt notice:`, geminiErr?.message);
      }
    }
  } catch (err: any) {
    console.warn('[ReminderEngine] AI generation notice:', err?.message);
  }

  // Deterministic Grounded Fallback (100% reliable, zero hallucinations)
  switch (ruleCategory) {
    case 'resume_lesson':
      return {
        title: `Resume: ${lessonTitle ? lessonTitle.slice(0, 28) : topic.slice(0, 28)}`,
        message: lessonTitle 
          ? `You have an unfinished lesson in ${subject}. Ready to pick up where you left off?`
          : `Continue exploring ${topic} with Nora when you're ready.`
      };
    case 'practice_weakness':
      return {
        title: `Strengthen ${weakArea ? weakArea.slice(0, 25) : topic.slice(0, 25)}`,
        message: weakArea 
          ? `Let's tackle two quick practice questions in ${weakArea} to solidify your grasp.`
          : `A quick diagnostic check in ${topic} will boost your confidence today.`
      };
    case 'spaced_review_due':
      return {
        title: `Spaced Review: ${topic.slice(0, 24)}`,
        message: `Your spaced repetition review for ${subject} is ready. 5 minutes today locks it in.`
      };
    case 'planned_study_due':
      return {
        title: `Study Session: ${subject.slice(0, 24)}`,
        message: `Your scheduled study window has arrived. Continue your journey with ${topic}.`
      };
    case 'streak_protection':
      return {
        title: 'Keep Your Study Streak!',
        message: `You haven't completed your daily revision yet. Even 5 minutes keeps your momentum.`
      };
    case 'general_revision':
    default:
      return {
        title: `Learnora: ${subject.slice(0, 26)}`,
        message: `Nora is ready for your next study session. Continue learning whenever you're free!`
      };
  }
}

function selectReminderRule(memory: any): { ruleCategory: string; actionUrl: string; actionLabel: string } {
  const subject = memory.currentSubject || 'African Morphology & Linguistics';
  const topic = memory.currentTopic || 'Word Formation Processes';

  // 1. Unfinished lesson
  if (memory.unfinishedLessons && memory.unfinishedLessons.length > 0) {
    const unfin = memory.unfinishedLessons[0];
    return {
      ruleCategory: 'resume_lesson',
      actionUrl: `tutor?subject=${encodeURIComponent(unfin.subject || subject)}&topic=${encodeURIComponent(unfin.topic || topic)}&resume=1`,
      actionLabel: 'Resume Lesson'
    };
  }
  if (memory.lastLessonAccessed && !memory.lastLessonAccessed.isCompleted) {
    return {
      ruleCategory: 'resume_lesson',
      actionUrl: `tutor?subject=${encodeURIComponent(memory.lastLessonAccessed.subject || subject)}&topic=${encodeURIComponent(memory.lastLessonAccessed.topic || topic)}&resume=1`,
      actionLabel: 'Resume Lesson'
    };
  }

  // 2. Diagnosed weakness
  if (memory.weakAreas && memory.weakAreas.length > 0) {
    const primaryWeakness = memory.weakAreas[0];
    return {
      ruleCategory: 'practice_weakness',
      actionUrl: `tutor?subject=${encodeURIComponent(primaryWeakness.subject || subject)}&topic=${encodeURIComponent(primaryWeakness.topic || topic)}&mode=quiz`,
      actionLabel: 'Practice Concept'
    };
  }

  // 3. Spaced review (> 24 hours since last activity)
  const lastActive = memory.lastStudyActivity?.timestamp || memory.updatedAt || 0;
  const hoursSinceActive = (Date.now() - lastActive) / (1000 * 3600);
  if (hoursSinceActive >= 24) {
    return {
      ruleCategory: 'spaced_review_due',
      actionUrl: 'review-queue',
      actionLabel: 'Open Review Queue'
    };
  }

  // 4. Default / General revision
  return {
    ruleCategory: 'general_revision',
    actionUrl: `tutor?subject=${encodeURIComponent(subject)}&topic=${encodeURIComponent(topic)}`,
    actionLabel: 'Open Nora AI Tutor'
  };
}

// Background Reminder Processor: Evaluates eligible students and dispatches grounded Web Push
async function processAutomatedReminders(options: { force?: boolean; targetUserId?: string } = {}) {
  const { force = false, targetUserId } = options;
  lastReminderProcessTime = Date.now();
  nextScheduledReminderTime = Date.now() + 10 * 60 * 1000;

  const now = Date.now();
  let evaluatedUsers = 0;
  let deliveredCount = 0;
  let skippedQuietHours = 0;
  let skippedInactivity = 0;
  let skippedRateLimit = 0;
  let skippedPaused = 0;

  const devicesByUser = new Map<string, any[]>();
  for (const dev of pushDevices.values()) {
    if (!dev.enabled || !dev.subscription) continue;
    if (targetUserId && dev.userId !== targetUserId) continue;

    const list = devicesByUser.get(dev.userId) || [];
    list.push(dev);
    devicesByUser.set(dev.userId, list);
  }

  for (const [userId, devices] of devicesByUser.entries()) {
    evaluatedUsers++;
    let memory = learningMemories.get(userId);
    if (!memory) {
      memory = {
        userId,
        currentSubject: 'African Morphology & Linguistics',
        currentTopic: 'Word Formation Processes',
        unfinishedLessons: [],
        completedLessons: [],
        weakAreas: [],
        updatedAt: now
      };
      learningMemories.set(userId, memory);
    }

    // 1. Paused check
    if (memory.remindersPaused && !force) {
      skippedPaused++;
      continue;
    }

    // 2. Active study guard: Don't interrupt if studied within past 45 minutes
    const lastActive = memory.lastStudyActivity?.timestamp || 0;
    if (!force && lastActive > 0 && (now - lastActive < 45 * 60 * 1000)) {
      skippedInactivity++;
      continue;
    }

    // 3. Frequency cap: Minimum 4 hours between automated reminders
    if (!force && memory.lastReminderSentAt && (now - memory.lastReminderSentAt < 4 * 3600 * 1000)) {
      skippedRateLimit++;
      continue;
    }

    // Check device quiet hours
    const primaryDevice = devices[0];
    if (!force && isWithinQuietHours(primaryDevice?.preferences)) {
      skippedQuietHours++;
      continue;
    }

    // Select rule category
    const { ruleCategory, actionUrl, actionLabel } = selectReminderRule(memory);

    // Generate grounded notification copy
    const { title, message } = await generateAiStudyReminder(memory, ruleCategory);

    const payload = JSON.stringify({
      title,
      message,
      actionUrl,
      actionLabel,
      type: 'tutor',
      priority: 'high',
      tag: `learnora-reminder-${ruleCategory}-${Date.now()}`,
      icon: '/pwa-192x192.png',
      badge: '/favicon-32x32.png',
      timestamp: now
    });

    let deviceDeliveredForUser = 0;
    for (const dev of devices) {
      if (!force && isWithinQuietHours(dev.preferences)) continue;
      try {
        await webpush.sendNotification(dev.subscription, payload);
        deviceDeliveredForUser++;
        dev.lastSeenAt = now;
      } catch (err: any) {
        if (err?.statusCode === 410 || err?.statusCode === 404) {
          dev.enabled = false;
        }
      }
    }

    if (deviceDeliveredForUser > 0) {
      deliveredCount += deviceDeliveredForUser;
      memory.lastReminderSentAt = now;
      memory.lastReminderType = ruleCategory;
      saveLearningMemories();

      // Log delivery attempt
      const logRecord = {
        id: 'log_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7),
        userId,
        userEmail: memory.userEmail || primaryDevice?.userEmail,
        ruleCategory,
        groundedFacts: {
          subject: memory.currentSubject || 'African Morphology & Linguistics',
          topic: memory.currentTopic || 'Word Formation Processes',
          lessonTitle: memory.lastLessonAccessed?.title || memory.unfinishedLessons?.[0]?.title,
          weakArea: memory.weakAreas?.[0]?.topic,
          lastActiveHoursAgo: Math.max(0, Math.round((now - lastActive) / (1000 * 3600)))
        },
        generatedTitle: title,
        generatedMessage: message,
        actionUrl,
        actionLabel,
        devicesDelivered: deviceDeliveredForUser,
        status: 'delivered',
        timestamp: now
      };
      reminderLogs.unshift(logRecord);
      if (reminderLogs.length > 100) reminderLogs.pop();
      saveReminderLogs();
    }
  }

  savePushDevices();

  return {
    evaluatedUsers,
    deliveredCount,
    skippedQuietHours,
    skippedInactivity,
    skippedRateLimit,
    skippedPaused,
    processedAt: now
  };
}

// Recurring Background Scheduler (every 10 minutes - works independently of open browser tabs)
setInterval(() => {
  processAutomatedReminders().catch(err => {
    console.error('[ReminderEngine] Scheduled processing error:', err);
  });
}, 10 * 60 * 1000);

// API Endpoints for Learnora Reminder Engine

// 1. Get engine status & health
app.get('/api/reminders/status', (_req, res) => {
  return res.json({
    status: 'active',
    intervalMinutes: 10,
    lastProcessedAt: lastReminderProcessTime,
    nextScheduledAt: nextScheduledReminderTime,
    totalMemoriesTracked: learningMemories.size,
    totalReminderLogs: reminderLogs.length,
    activeSubscribers: Array.from(pushDevices.values()).filter(d => d.enabled).length
  });
});

// 2. Trigger automated reminder processing (Admin or Cloud Scheduler)
app.post('/api/reminders/process', async (req, res) => {
  try {
    const { userId, force } = req.body;
    const result = await processAutomatedReminders({ force: Boolean(force), targetUserId: userId });
    return res.json({ success: true, ...result });
  } catch (err: any) {
    console.error('[ReminderEngine] Process trigger error:', err);
    return res.status(500).json({ success: false, error: err?.message });
  }
});

// 3. Sync student learning memory from client
app.post('/api/reminders/memory', (req, res) => {
  try {
    const memory = req.body;
    if (!memory || !memory.userId) {
      return res.status(400).json({ success: false, error: 'Valid memory with userId required' });
    }
    const existing = learningMemories.get(memory.userId) || {};
    const merged = { ...existing, ...memory, updatedAt: Date.now() };
    learningMemories.set(memory.userId, merged);
    saveLearningMemories();
    return res.json({ success: true, memory: merged });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err?.message });
  }
});

// 4. Retrieve student learning memory
app.get('/api/reminders/memory/:userId', (req, res) => {
  const mem = learningMemories.get(req.params.userId);
  if (!mem) {
    return res.status(404).json({ success: false, error: 'Memory not found' });
  }
  return res.json({ success: true, memory: mem });
});

// 5. Retrieve recent automated reminder delivery logs
app.get('/api/reminders/logs', (req, res) => {
  const { userId } = req.query;
  let logs = reminderLogs;
  if (userId) {
    logs = logs.filter(l => l.userId === userId);
  }
  return res.json({ success: true, logs: logs.slice(0, 30) });
});

// Google Search Console Site Verification file handler
app.get('/google67fdd007c40ce08b.html', (_req, res) => {
  res.type('text/html').send('google-site-verification: google67fdd007c40ce08b.html');
});

// Dynamic Sitemap generator - ensures URLs inside sitemap match the host used in Google Search Console
app.get('/sitemap.xml', (req, res) => {
  const forwardedHost = req.get('x-forwarded-host');
  const host = forwardedHost ? forwardedHost.split(',')[0].trim() : (req.get('host') || 'learnora.app');
  const forwardedProto = req.get('x-forwarded-proto');
  const proto = forwardedProto ? forwardedProto.split(',')[0].trim() : (req.secure ? 'https' : 'http');
  const baseUrl = `${proto}://${host}`;
  const today = new Date().toISOString().split('T')[0];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${baseUrl}/</loc>
    <lastmod>${today}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>${baseUrl}/?view=library</loc>
    <lastmod>${today}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>${baseUrl}/?view=tutor</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>${baseUrl}/?view=review-queue</loc>
    <lastmod>${today}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>${baseUrl}/?view=community</loc>
    <lastmod>${today}</lastmod>
    <changefreq>hourly</changefreq>
    <priority>0.8</priority>
  </url>
</urlset>`;

  res.header('Content-Type', 'application/xml');
  res.send(xml);
});

// Mount Vite middleware in development
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { 
        middlewareMode: true,
        hmr: false
      },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`Learnora server running on http://0.0.0.0:${PORT}`);
  });

  server.on('error', (err: any) => {
    if (err.code === 'EADDRINUSE') {
      console.warn(`[Server] Port ${PORT} already in use, exiting cleanly for supervisor restart...`);
      process.exit(1);
    } else {
      console.error('[Server] Listen error:', err);
    }
  });

  const handleShutdown = () => {
    server.close(() => {
      process.exit(0);
    });
  };
  process.on('SIGTERM', handleShutdown);
  process.on('SIGINT', handleShutdown);
}

startServer();
