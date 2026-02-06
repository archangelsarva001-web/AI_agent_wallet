export const isValidWebhookUrl = (url: string): { valid: boolean; error?: string } => {
  if (!url) return { valid: true };
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== 'https:') return { valid: false, error: 'Webhook URL must use HTTPS protocol' };
    const hostname = parsed.hostname.toLowerCase();

    // Block localhost
    if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '[::1]' || hostname === '0.0.0.0') {
      return { valid: false, error: 'Localhost URLs are not allowed' };
    }

    // Block private IP ranges (10.x.x.x)
    if (/^10\./.test(hostname)) return { valid: false, error: 'Private IP addresses are not allowed' };

    // Block private IP ranges (192.168.x.x)
    if (/^192\.168\./.test(hostname)) return { valid: false, error: 'Private IP addresses are not allowed' };

    // Block private IP ranges (172.16-31.x.x)
    if (/^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(hostname)) return { valid: false, error: 'Private IP addresses are not allowed' };

    // Block link-local / metadata endpoints (169.254.x.x)
    if (/^169\.254\./.test(hostname)) return { valid: false, error: 'Metadata/link-local addresses are not allowed' };

    // Block other common internal hostnames
    if (hostname.endsWith('.internal') || hostname.endsWith('.local')) {
      return { valid: false, error: 'Internal network addresses are not allowed' };
    }

    return { valid: true };
  } catch {
    return { valid: false, error: 'Invalid URL format' };
  }
};
