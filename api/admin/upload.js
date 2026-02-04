/**
 * Admin Upload API
 * POST /api/admin/upload
 * Uploads calligraphy images to Cloudflare R2
 */

const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const { setCorsHeaders, handlePreflight, verifyAdminToken } = require('../lib/security');

// Initialize R2 client
function getR2Client() {
  return new S3Client({
    region: 'auto',
    endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
    },
  });
}

// Parse multipart form data
async function parseMultipartForm(req) {
  return new Promise((resolve, reject) => {
    const boundary = req.headers['content-type'].split('boundary=')[1];
    if (!boundary) {
      return reject(new Error('No boundary found'));
    }

    let body = [];
    req.on('data', chunk => body.push(chunk));
    req.on('end', () => {
      const buffer = Buffer.concat(body);
      const parts = buffer.toString('binary').split(`--${boundary}`);

      const result = {};

      for (const part of parts) {
        if (part.includes('Content-Disposition')) {
          const nameMatch = part.match(/name="([^"]+)"/);
          const filenameMatch = part.match(/filename="([^"]+)"/);

          if (nameMatch) {
            const name = nameMatch[1];

            if (filenameMatch) {
              // File field
              const contentTypeMatch = part.match(/Content-Type: ([^\r\n]+)/);
              const contentType = contentTypeMatch ? contentTypeMatch[1].trim() : 'application/octet-stream';

              // Get file content (after double CRLF)
              const contentStart = part.indexOf('\r\n\r\n') + 4;
              const contentEnd = part.lastIndexOf('\r\n');
              const content = Buffer.from(part.substring(contentStart, contentEnd), 'binary');

              result[name] = {
                filename: filenameMatch[1],
                contentType,
                content
              };
            } else {
              // Regular field
              const valueStart = part.indexOf('\r\n\r\n') + 4;
              const valueEnd = part.lastIndexOf('\r\n');
              result[name] = part.substring(valueStart, valueEnd).trim();
            }
          }
        }
      }

      resolve(result);
    });
    req.on('error', reject);
  });
}

module.exports = async function handler(req, res) {
  setCorsHeaders(req, res);

  if (handlePreflight(req, res)) return;

  if (req.method !== 'POST') {
    return res.status(405).json({ error: { message: 'Method not allowed' } });
  }

  // Verify authentication
  if (!verifyAdminToken(req.headers.authorization)) {
    return res.status(401).json({ error: { message: 'Unauthorized' } });
  }

  try {
    // Check R2 configuration
    if (!process.env.R2_ACCOUNT_ID || !process.env.R2_ACCESS_KEY_ID ||
        !process.env.R2_SECRET_ACCESS_KEY || !process.env.R2_BUCKET_NAME) {
      return res.status(500).json({
        error: { message: 'R2 storage not configured' }
      });
    }

    // Parse multipart form data
    const formData = await parseMultipartForm(req);
    const { image, requestId } = formData;

    if (!image || !requestId) {
      return res.status(400).json({
        error: { message: 'Image and requestId are required' }
      });
    }

    // Generate unique filename
    const timestamp = Date.now();
    const ext = image.filename.split('.').pop() || 'png';
    const filename = `calligraphy/${requestId}_${timestamp}.${ext}`;

    // Upload to R2
    const r2Client = getR2Client();
    const command = new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: filename,
      Body: image.content,
      ContentType: image.contentType,
    });

    await r2Client.send(command);

    // Construct public URL
    const publicUrl = process.env.R2_PUBLIC_URL
      ? `${process.env.R2_PUBLIC_URL}/${filename}`
      : `https://${process.env.R2_BUCKET_NAME}.${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com/${filename}`;

    return res.json({
      success: true,
      imageUrl: publicUrl,
      filename
    });
  } catch (error) {
    console.error('Upload error:', error);
    return res.status(500).json({
      error: { message: error.message || 'Upload failed' }
    });
  }
};
