import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import serverless from 'serverless-http';

const app = express();
const router = express.Router();

// Trust the proxy - needed for accurate IP detection
app.set('trust proxy', true);

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    handler: (req, res) => {
        res.status(429).json({
            error: 'Too many requests, please try again later.',
            retryAfter: Math.ceil(req.rateLimit.resetTime / 1000)
        });
    },
    // Custom key generator for serverless environment
    keyGenerator: (req) => {
        // Try different headers that might contain the client IP
        const ip = req.ip || 
                  req.headers['x-forwarded-for'] || 
                  req.headers['x-real-ip'] || 
                  req.connection.remoteAddress || 
                  'unknown';
        
        return Array.isArray(ip) ? ip[0] : ip;
    },
    // Skip if IP cannot be determined
    skip: (req) => {
        const hasValidIp = Boolean(
            req.ip || 
            req.headers['x-forwarded-for'] || 
            req.headers['x-real-ip'] || 
            req.connection.remoteAddress
        );
        return !hasValidIp;
    }
});

// Symbol mapping (continuing after 26 for letters)
const symbolMap = {
    '?': 27, '@': 28, '.': 29, ',': 30, '!': 31, '#': 32,
    '$': 33, '%': 34, '&': 35, '*': 36, '(': 37, ')': 38,
    '-': 39, '+': 40, '=': 41, ':': 42, ';': 43
};

const reverseSymbolMap = Object.fromEntries(
    Object.entries(symbolMap).map(([key, value]) => [value, key])
);

// Helper functions
const getPosition = (char) => {
    if (char === ' ') return 'space';
    if (symbolMap[char.toLowerCase()]) return symbolMap[char.toLowerCase()];
    return 27 - (char.toLowerCase().charCodeAt(0) - 96);
};

const getLetter = (position, isUpperCase = false) => {
    if (position === 'space') return ' ';
    if (position > 26) return reverseSymbolMap[position] || '';
    const letter = String.fromCharCode(123 - position);
    return isUpperCase ? letter.toUpperCase() : letter;
};

const isUpperCase = (char) => char === char.toUpperCase() && char !== char.toLowerCase();
const isValidChar = (char) => /[a-zA-Z0-9]/.test(char) || symbolMap.hasOwnProperty(char.toLowerCase());
const isNumber = (char) => /[0-9]/.test(char);

// Middleware
app.use(cors());
app.use(express.json());
app.use(limiter);
app.use('/.netlify/functions/index', router);

// API Documentation route
router.get('/', (req, res) => {
    res.json({
        name: "Encryption/Decryption API",
        version: "1.0.0",
        description: "API for encrypting and decrypting messages using a custom algorithm",
        endpoints: {
            "/encrypt": {
                method: "POST",
                description: "Encrypt a message",
                request: {
                    body: {
                        message: "string (required) - Message to encrypt"
                    }
                },
                response: {
                    result: "string - Encrypted message"
                }
            },
            "/decrypt": {
                method: "POST",
                description: "Decrypt a message",
                request: {
                    body: {
                        message: "string (required) - Encrypted message to decrypt"
                    }
                },
                response: {
                    result: "string - Decrypted message"
                }
            },
            "/supported-chars": {
                method: "GET",
                description: "Get list of supported characters and symbols",
                response: {
                    characters: "object - Map of supported symbols and their positions"
                }
            }
        }
    });
});

// Get supported characters
router.get('/supported-chars', (req, res) => {
    res.json({
        characters: {
            letters: "A-Z, a-z (reversed alphabet mapping)",
            numbers: "0-9 (preserved with 'n' prefix)",
            symbols: symbolMap,
            space: "Converted to '/' in encrypted form"
        }
    });
});

// Encryption endpoint
router.post('/encrypt', (req, res) => {
    try {
        const { message } = req.body;
        
        if (!message || !message.trim()) {
            return res.status(400).json({ 
                error: 'Message is required',
                example: {
                    request: { message: "Hello World!" },
                    response: { result: "48-2-10,3-0,11-0,11-0,15-0,/" }
                }
            });
        }

        let encrypted = [];

        for (let i = 0; i < message.length; i++) {
            const currentChar = message[i];
            const nextChar = message[i + 1];

            if (currentChar === ' ') {
                encrypted.push('/');
                continue;
            }

            if (!isValidChar(currentChar)) continue;

            if (isNumber(currentChar)) {
                encrypted.push(`n${currentChar}`);
                continue;
            }

            const pos1 = getPosition(currentChar);
            const isFirstUpper = isUpperCase(currentChar);

            if (nextChar && nextChar !== ' ' && 
                (/[a-zA-Z]/.test(nextChar) || symbolMap.hasOwnProperty(nextChar.toLowerCase()))) {
                const pos2 = getPosition(nextChar);
                const isSecondUpper = isUpperCase(nextChar);
                const multiplication = pos1 * pos2;
                
                encrypted.push(`${multiplication}-${pos2}-${isFirstUpper ? '1' : '0'}${isSecondUpper ? '1' : '0'}`);
                i++;
            } else {
                encrypted.push(`${pos1}-${isFirstUpper ? '1' : '0'}`);
            }
        }

        res.json({ 
            result: encrypted.join(','),
            originalLength: message.length,
            encryptedLength: encrypted.join(',').length
        });
    } catch (error) {
        res.status(500).json({ error: 'Encryption failed', details: error.message });
    }
});

// Decryption endpoint
router.post('/decrypt', (req, res) => {
    try {
        const { message } = req.body;
        
        if (!message || !message.trim()) {
            return res.status(400).json({ 
                error: 'Encrypted message is required',
                example: {
                    request: { message: "48-2-10,3-0,11-0,11-0,15-0,/" },
                    response: { result: "Hello World!" }
                }
            });
        }

        let decrypted = '';
        const parts = message.split(',');

        for (let part of parts) {
            if (part === '/') {
                decrypted += ' ';
                continue;
            }

            if (part.startsWith('n')) {
                decrypted += part.slice(1);
                continue;
            }

            const segments = part.split('-');

            if (segments.length === 3) {
                const [multiplication, pos2, caseFlags] = segments;
                const pos1 = parseInt(multiplication) / parseInt(pos2);
                const isFirstUpper = caseFlags[0] === '1';
                const isSecondUpper = caseFlags[1] === '1';

                decrypted += getLetter(pos1, isFirstUpper) + getLetter(parseInt(pos2), isSecondUpper);
            } else if (segments.length === 2) {
                const [pos, caseFlag] = segments;
                decrypted += getLetter(parseInt(pos), caseFlag === '1');
            }
        }

        res.json({ 
            result: decrypted,
            originalLength: message.length,
            decryptedLength: decrypted.length
        });
    } catch (error) {
        res.status(500).json({ error: 'Decryption failed', details: error.message });
    }
});

// Health check endpoint
router.get('/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        timestamp: new Date().toISOString(),
        rateLimit: {
            windowMs: 15 * 60 * 1000,
            maxRequests: 100
        }
    });
});

export const handler = serverless(app);
