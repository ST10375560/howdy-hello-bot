import https from 'https';
import fs from 'fs';
import path from 'path';

export interface SSLConfig {
  keyPath: string;
  certPath: string;
  caPath?: string;
}

export function generateSelfSignedCert(): SSLConfig {
  const certsDir = path.join(__dirname, '../../certs');
  
  // Create certs directory if it doesn't exist
  if (!fs.existsSync(certsDir)) {
    fs.mkdirSync(certsDir, { recursive: true });
  }

  const keyPath = path.join(certsDir, 'server.key');
  const certPath = path.join(certsDir, 'server.crt');

  // Check if certificates already exist
  if (fs.existsSync(keyPath) && fs.existsSync(certPath)) {
    return { keyPath, certPath };
  }

  // Generate self-signed certificate using openssl
  const { execSync } = require('child_process');
  
  try {
    // Generate private key
    execSync(`openssl genrsa -out "${keyPath}" 2048`);
    
    // Generate certificate
    execSync(`openssl req -new -x509 -key "${keyPath}" -out "${certPath}" -days 365 -subj "/C=US/ST=State/L=City/O=Organization/CN=localhost"`);
    
    console.log('✅ Self-signed SSL certificates generated successfully');
    return { keyPath, certPath };
  } catch (error) {
    console.error('❌ Failed to generate SSL certificates:', error);
    throw new Error('SSL certificate generation failed');
  }
}

export function createHttpsServer(app: any, sslConfig: SSLConfig): https.Server {
  try {
    const options = {
      key: fs.readFileSync(sslConfig.keyPath),
      cert: fs.readFileSync(sslConfig.certPath),
    };

    return https.createServer(options, app);
  } catch (error) {
    console.error('❌ Failed to create HTTPS server:', error);
    throw new Error('HTTPS server creation failed');
  }
}

