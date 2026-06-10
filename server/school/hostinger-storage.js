const path = require('path');
const { Readable } = require('stream');
const ftp = require('basic-ftp');

const maxImageSizeBytes = 5 * 1024 * 1024;
const imageExtensions = {
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
  'image/svg+xml': 'svg'
};

function boolFromEnv(value) {
  return ['1', 'true', 'yes', 'y'].includes(String(value || '').trim().toLowerCase());
}

function stripSlashes(value) {
  return String(value || '').replace(/^\/+|\/+$/g, '');
}

function normalizeRemoteDir(value) {
  const cleaned = String(value || '').trim().replace(/\\/g, '/');
  if (!cleaned || cleaned === '/') {
    return '/';
  }

  return `/${stripSlashes(cleaned)}`;
}

function joinRemotePath(...segments) {
  const cleaned = segments
    .filter((segment) => segment !== undefined && segment !== null && String(segment).trim() !== '')
    .map((segment) => stripSlashes(String(segment).replace(/\\/g, '/')))
    .filter(Boolean);

  return `/${cleaned.join('/')}`;
}

function sanitizeSegment(value, fallback) {
  const safe = String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

  return safe || fallback;
}

function sanitizeFileBase(value) {
  const parsed = path.parse(String(value || 'image'));
  return sanitizeSegment(parsed.name, 'image');
}

function safeDecodeURIComponent(value) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function normalizeFtpHost(value) {
  const rawValue = String(value || '').trim();
  if (!rawValue) {
    return '';
  }

  try {
    return new URL(rawValue.includes('://') ? rawValue : `ftp://${rawValue}`).hostname;
  } catch {
    return rawValue.replace(/^ftp:\/\//i, '').split('/')[0].trim();
  }
}

function storageConfig() {
  return {
    host: normalizeFtpHost(process.env.HOSTINGER_FTP_HOST),
    user: process.env.HOSTINGER_FTP_USER,
    password: process.env.HOSTINGER_FTP_PASSWORD,
    port: Number(process.env.HOSTINGER_FTP_PORT || 21),
    secure: boolFromEnv(process.env.HOSTINGER_FTP_SECURE),
    baseDir: normalizeRemoteDir(process.env.HOSTINGER_FTP_BASE_DIR || '/public_html/uploads/school'),
    publicBaseUrl: String(process.env.HOSTINGER_PUBLIC_BASE_URL || '').replace(/\/+$/g, '')
  };
}

function assertStorageConfigured(config = storageConfig()) {
  if (!config.host || !config.user || !config.password || !config.publicBaseUrl) {
    const error = new Error('Hostinger image storage is not configured.');
    error.statusCode = 503;
    throw error;
  }
}

function uploadConnectionError(error, config) {
  const code = String(error.code || '').toUpperCase();
  const message = String(error.message || '');
  const statusError = new Error(message || 'Unable to connect to Hostinger image storage.');
  statusError.statusCode = 502;

  if (['ENOTFOUND', 'EAI_AGAIN'].includes(code)) {
    statusError.message = `Unable to resolve Hostinger FTP host "${config.host}". Check HOSTINGER_FTP_HOST in lot.env.local. Use the FTP hostname or server IP from Hostinger hPanel, without http://, https://, or any folder path.`;
    return statusError;
  }

  if (['ECONNREFUSED', 'ETIMEDOUT', 'ENETUNREACH'].includes(code)) {
    statusError.message = `Unable to connect to Hostinger FTP host "${config.host}" on port ${config.port}. Check HOSTINGER_FTP_HOST, HOSTINGER_FTP_PORT, and HOSTINGER_FTP_SECURE.`;
    return statusError;
  }

  if (message.includes('530')) {
    statusError.statusCode = 401;
    statusError.message = 'Hostinger FTP login failed. Check HOSTINGER_FTP_USER and HOSTINGER_FTP_PASSWORD.';
    return statusError;
  }

  return statusError;
}

function publicUrlForRelativePath(config, relativePath) {
  return `${config.publicBaseUrl}/${relativePath.split('/').map(encodeURIComponent).join('/')}`;
}

function validateImageFile(file) {
  const selectedFile = Array.isArray(file) ? file[0] : file;
  if (!selectedFile || !selectedFile.data || !Buffer.isBuffer(selectedFile.data)) {
    const error = new Error('Image file is required.');
    error.statusCode = 400;
    throw error;
  }

  const mimetype = String(selectedFile.mimetype || '').toLowerCase();
  if (!mimetype.startsWith('image/')) {
    const error = new Error('Only image files are allowed.');
    error.statusCode = 400;
    throw error;
  }

  if (selectedFile.data.length > maxImageSizeBytes) {
    const error = new Error('Image must be 5 MB or smaller.');
    error.statusCode = 413;
    throw error;
  }

  return selectedFile;
}

function buildUploadTarget(file, options = {}) {
  const clientSegment = `client-${sanitizeSegment(options.clientId, 'common')}`;
  const folderSegment = sanitizeSegment(options.folder, 'general');
  const extension = imageExtensions[String(file.mimetype || '').toLowerCase()] || sanitizeSegment(path.extname(file.name).slice(1), 'jpg');
  const nameBase = sanitizeFileBase(file.name);
  const nonce = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  const fileName = `${nameBase}-${nonce}.${extension}`;
  const relativeDir = `${clientSegment}/${folderSegment}`;
  const relativePath = `${relativeDir}/${fileName}`;

  return {
    relativeDir,
    relativePath,
    fileName
  };
}

async function withFtpClient(callback) {
  const config = storageConfig();
  assertStorageConfigured(config);

  const client = new ftp.Client(30000);
  client.ftp.verbose = false;

  try {
    try {
      await client.access({
        host: config.host,
        user: config.user,
        password: config.password,
        port: config.port,
        secure: config.secure
      });
    } catch (error) {
      throw uploadConnectionError(error, config);
    }

    return await callback(client, config);
  } finally {
    client.close();
  }
}

async function uploadImage(file, options = {}) {
  const selectedFile = validateImageFile(file);
  return withFtpClient(async (client, config) => {
    const target = buildUploadTarget(selectedFile, options);
    const remoteDir = joinRemotePath(config.baseDir, target.relativeDir);
    const remotePath = joinRemotePath(config.baseDir, target.relativePath);

    await client.ensureDir(remoteDir);
    await client.uploadFrom(Readable.from(selectedFile.data), remotePath);

    return {
      url: publicUrlForRelativePath(config, target.relativePath),
      path: target.relativePath,
      fileName: target.fileName,
      size: selectedFile.data.length,
      mimetype: selectedFile.mimetype
    };
  });
}

function isHostedUrl(url) {
  const config = storageConfig();
  if (!url || !config.publicBaseUrl) {
    return false;
  }

  try {
    const parsedUrl = new URL(String(url));
    const parsedBase = new URL(config.publicBaseUrl);
    const basePath = parsedBase.pathname.replace(/\/+$/g, '');

    return parsedUrl.origin === parsedBase.origin && (
      parsedUrl.pathname === basePath ||
      parsedUrl.pathname.startsWith(`${basePath}/`)
    );
  } catch {
    return false;
  }
}

function hostedUrlToRemotePath(url, config = storageConfig()) {
  const parsedUrl = new URL(String(url));
  const parsedBase = new URL(config.publicBaseUrl);
  const basePath = parsedBase.pathname.replace(/\/+$/g, '');
  const relativePath = parsedUrl.pathname
    .slice(basePath.length)
    .replace(/^\/+/, '')
    .split('/')
    .filter(Boolean)
    .map(safeDecodeURIComponent)
    .join('/');

  if (!relativePath || relativePath.includes('..')) {
    const error = new Error('Invalid hosted image URL.');
    error.statusCode = 400;
    throw error;
  }

  return joinRemotePath(config.baseDir, relativePath);
}

async function deleteHostedFile(url) {
  if (!isHostedUrl(url)) {
    return false;
  }

  return withFtpClient(async (client, config) => {
    const remotePath = hostedUrlToRemotePath(url, config);
    try {
      await client.remove(remotePath);
      return true;
    } catch (error) {
      const message = String(error.message || '').toLowerCase();
      if (message.includes('not found') || message.includes('no such') || message.includes('550')) {
        return false;
      }

      throw error;
    }
  });
}

module.exports = {
  uploadImage,
  deleteHostedFile,
  isHostedUrl
};
