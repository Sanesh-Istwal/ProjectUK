import fs from 'fs';
import path from 'path';

/**
 * Standard Java-style .properties file parser
 * Supports # and ! comments, key=value, key:value, and trimming.
 */
export function loadPropertiesFile(filePath) {
  const properties = {};

  if (!fs.existsSync(filePath)) {
    return properties;
  }

  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split(/\r?\n/);

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#') || trimmed.startsWith('!')) {
      continue;
    }

    const delimiterIndex = trimmed.search(/[=:]/);
    if (delimiterIndex === -1) continue;

    const key = trimmed.slice(0, delimiterIndex).trim();
    const value = trimmed.slice(delimiterIndex + 1).trim();
    properties[key] = value;
  }

  return properties;
}

export function getAuthConfig() {
  const candidatePaths = [
    path.resolve(process.cwd(), 'auth.properties'),
    path.resolve(process.cwd(), '..', 'auth.properties'),
    path.resolve(process.cwd(), 'apps', 'api', 'auth.properties')
  ];

  let props = {};
  for (const p of candidatePaths) {
    if (fs.existsSync(p)) {
      props = loadPropertiesFile(p);
      break;
    }
  }

  const allowLocalSignup = props['auth.allow_local_signup'] !== 'false';
  const autoVerifyEmail = props['auth.auto_verify_email'] === 'true';
  const defaultRole = props['auth.default_role'] || 'member';

  const seededUsers = [];
  for (const [key, val] of Object.entries(props)) {
    if (key.startsWith('user.')) {
      const [email, password, role, displayName] = val.split(',').map(s => s.trim());
      if (email && password) {
        seededUsers.push({ email, password, role: role || 'member', displayName: displayName || email.split('@')[0] });
      }
    }
  }

  return {
    allowLocalSignup,
    autoVerifyEmail,
    defaultRole,
    seededUsers
  };
}
