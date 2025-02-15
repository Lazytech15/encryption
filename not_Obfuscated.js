// Global variable to store process logs
window.cryptoLogs = {
    steps: [],
    styles: {
        header: 'color: #4CAF50; font-size: 14px; font-weight: bold; text-decoration: underline;',
        subHeader: 'color: #2196F3; font-weight: bold;',
        step: 'color: #333; font-size: 12px;',
        detail: 'color: #666; font-size: 12px; margin-left: 20px;',
        result: 'color: #E91E63; font-weight: bold;',
        space: 'color: #9C27B0; font-style: italic;',
        guide: 'color: #4CAF50; font-size: 12px; margin-left: 20px;'
    }
};

let encrypted = [];

// Symbol mapping (continuing after 26 for letters)
const symbolMap = {
    '?': 27,
    '@': 28,
    '.': 29,
    ',': 30,
    '!': 31,
    '#': 32,
    '$': 33,
    '%': 34,
    '&': 35,
    '*': 36,
    '(': 37,
    ')': 38,
    '-': 39,
    '+': 40,
    '=': 41,
    ':': 42,
    ';': 43
};

// Reverse symbol mapping for decryption
const reverseSymbolMap = Object.fromEntries(
    Object.entries(symbolMap).map(([key, value]) => [value, key])
);

// Store step with its style
function storeStep(message, style = window.cryptoLogs.styles.step) {
    window.cryptoLogs.steps.push({ message, style });
}

// Function to copy text to clipboard
function copyToClipboard(text) {
    const tempInput = document.createElement('textarea');
    tempInput.value = text;
    document.body.appendChild(tempInput);
    tempInput.select();
    try {
        document.execCommand('copy');
        Swal.fire({
            icon: 'success',
            title: 'Copied!',
            text: 'Text has been copied to clipboard',
            timer: 1500,
            showConfirmButton: false
        });
    } catch (err) {
        Swal.fire({
            icon: 'error',
            title: 'Oops...',
            text: 'Failed to copy text to clipboard'
        });
    }
    document.body.removeChild(tempInput);
}

// Function to display all stored logs
window.show_steps = function() {
    console.clear();
    window.cryptoLogs.steps.forEach(step => {
        console.log('%c' + step.message, step.style);
    });
};

// Get position from letter or symbol
function getPosition(char) {
    if (char === ' ') return 'space';
    if (symbolMap[char]) return symbolMap[char];
    return char.toLowerCase().charCodeAt(0) - 96;
}

// Get letter or symbol from position
function getLetter(position) {
    if (position === 'space') return ' ';
    if (position > 26) return reverseSymbolMap[position] || '';
    return String.fromCharCode(position + 96);
}

// Log the guide for encryption or decryption process
function logGuide(isEncryption = true) {
    storeStep('=== PROCESS GUIDE ===', window.cryptoLogs.styles.header);
    if (isEncryption) {
        storeStep('Encryption Steps:', window.cryptoLogs.styles.subHeader);
        storeStep('1. Each letter uses alphabet position (a=1, b=2, ..., z=26)', window.cryptoLogs.styles.guide);
        storeStep('2. Symbols use extended positions (e.g., ?=27, @=28, etc.)', window.cryptoLogs.styles.guide);
        storeStep('3. For character pairs: multiply positions and append second position', window.cryptoLogs.styles.guide);
        storeStep('4. Format: [multiplication]-[second position]', window.cryptoLogs.styles.guide);
        storeStep('5. Single characters use position only', window.cryptoLogs.styles.guide);
        storeStep('6. Spaces become "/"', window.cryptoLogs.styles.guide);
    } else {
        storeStep('Decryption Steps:', window.cryptoLogs.styles.subHeader);
        storeStep('1. Split input by commas', window.cryptoLogs.styles.guide);
        storeStep('2. For pairs (with "-"): divide first number by second number', window.cryptoLogs.styles.guide);
        storeStep('3. Convert positions to letters or symbols', window.cryptoLogs.styles.guide);
        storeStep('4. "/" becomes space', window.cryptoLogs.styles.guide);
    }
    storeStep(''); // Empty line for spacing
}

// Function to check if character is valid for encryption
function isValidChar(char) {
    return /[a-z0-9]/.test(char) || symbolMap.hasOwnProperty(char);
}

// Add new function to check if character is a number
function isNumber(char) {
    return /[0-9]/.test(char);
}

function downloadAsFile(text, filename) {
    const blob = new Blob([text], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
    Swal.fire({
        icon: 'success',
        title: 'Downloaded!',
        text: 'Text has been downloaded as a file',
        timer: 1500,
        showConfirmButton: false
    });
}

// Function to encrypt the input message
function encrypt() {
    const message = document.getElementById('message').value.toLowerCase();

    // Check if textarea is empty
    if (!message.trim()) {
        Swal.fire({
            icon: 'warning',
            title: 'Empty Input',
            text: 'Please enter a message to encrypt'
        });
        return;
    }
    
    encrypted = [];
    
    // Reset steps array
    window.cryptoLogs.steps = [];
    
    // Store header and guide
    storeStep('=== ENCRYPTION PROCESS ===', window.cryptoLogs.styles.header);
    logGuide(true);
    
    for (let i = 0; i < message.length; i++) {
        const currentChar = message[i];
        const nextChar = message[i + 1];
        
        // Handle spaces
        if (currentChar === ' ') {
            encrypted.push('/');
            storeStep('Found space:', window.cryptoLogs.styles.space);
            storeStep('→ Converting to /', window.cryptoLogs.styles.detail);
            continue;
        }
        
        // Skip invalid characters
        if (!isValidChar(currentChar)) continue;
        
        // Preserve numbers as is
        if (isNumber(currentChar)) {
            encrypted.push(`n${currentChar}`); // Prefix with 'n' to identify numbers during decryption
            storeStep(`Preserving number "${currentChar}":`, window.cryptoLogs.styles.subHeader);
            storeStep(`→ Storing as n${currentChar}\n`, window.cryptoLogs.styles.result);
            continue;
        }
        
        const pos1 = getPosition(currentChar);
        
        // Check if next character exists and is valid
        if (nextChar && nextChar !== ' ' && isValidChar(nextChar)) {
            // If next character is a number, process current character alone
            if (isNumber(nextChar)) {
                encrypted.push(pos1.toString());
                storeStep(`Processing single character "${currentChar}":`, window.cryptoLogs.styles.subHeader);
                storeStep(`→ Position = ${pos1}`, window.cryptoLogs.styles.detail);
                storeStep(`→ Using position directly: ${pos1}\n`, window.cryptoLogs.styles.result);
                continue;
            }
            
            const pos2 = getPosition(nextChar);
            const multiplication = pos1 * pos2;
            encrypted.push(`${multiplication}-${pos2}`);
            
            storeStep(`Processing pair "${currentChar}${nextChar}":`, window.cryptoLogs.styles.subHeader);
            storeStep(`→ ${currentChar} = position ${pos1}`, window.cryptoLogs.styles.detail);
            storeStep(`→ ${nextChar} = position ${pos2}`, window.cryptoLogs.styles.detail);
            storeStep(`→ Multiplying positions: ${pos1} × ${pos2} = ${multiplication}`, window.cryptoLogs.styles.detail);
            storeStep(`→ Final format: ${multiplication}-${pos2}\n`, window.cryptoLogs.styles.result);
            
            i++; // Skip next character as it's been processed
        } else {
            encrypted.push(pos1.toString());
            
            storeStep(`Processing single character "${currentChar}":`, window.cryptoLogs.styles.subHeader);
            storeStep(`→ Position = ${pos1}`, window.cryptoLogs.styles.detail);
            storeStep(`→ Using position directly: ${pos1}\n`, window.cryptoLogs.styles.result);
        }
    }

    const encryptedMessage = encrypted.join(',');
    document.getElementById('result').innerHTML = `
        <strong>Encrypted Message:</strong><br>
        ${encryptedMessage}
        <div class="button-group">
            <button class="copyclipboard" onclick="copyToClipboard('${encryptedMessage}')">Copy Encrypted</button>
            <button class="downloadencrypted" onclick="downloadAsFile('${encryptedMessage}', 'encrypted_message.txt')">Download .txt</button>
        </div>
    `;
    
    storeStep('=== FINAL ENCRYPTED MESSAGE ===', window.cryptoLogs.styles.header);
    storeStep(encryptedMessage, window.cryptoLogs.styles.result);
}

// Function to decrypt the input message
function decrypt() {
    const message = document.getElementById('message').value;
    
    if (!message.trim()) {
        Swal.fire({
            icon: 'warning',
            title: 'Empty Input',
            text: 'Please enter a valid encrypted message to decrypt'
        });
        return;
    }

    let decrypted = '';
    
    // Reset steps array
    window.cryptoLogs.steps = [];
    
    // Store header and guide
    storeStep('=== DECRYPTION PROCESS ===', window.cryptoLogs.styles.header);
    logGuide(false);
    
    const parts = message.split(',');
    
    for (let part of parts) {
        // Handle spaces
        if (part === '/') {
            decrypted += ' ';
            storeStep('Found /', window.cryptoLogs.styles.space);
            storeStep('→ Converting to space\n', window.cryptoLogs.styles.detail);
            continue;
        }
        
        // Handle preserved numbers
        if (part.startsWith('n')) {
            const number = part.slice(1);
            decrypted += number;
            storeStep(`Found preserved number "${number}":`, window.cryptoLogs.styles.subHeader);
            storeStep(`→ Restoring number directly\n`, window.cryptoLogs.styles.result);
            continue;
        }
        
        // Handle encrypted pairs
        if (part.includes('-')) {
            const [multiplication, pos2] = part.split('-').map(Number);
            const pos1 = multiplication / pos2;
            const char1 = getLetter(pos1);
            const char2 = getLetter(pos2);
            decrypted += char1 + char2;
            
            storeStep(`Processing pair number "${part}":`, window.cryptoLogs.styles.subHeader);
            storeStep(`→ Splitting ${multiplication}-${pos2}`, window.cryptoLogs.styles.detail);
            storeStep(`→ Calculating first position: ${multiplication} ÷ ${pos2} = ${pos1}`, window.cryptoLogs.styles.detail);
            storeStep(`→ Converting positions to characters: ${pos1} → ${char1}, ${pos2} → ${char2}\n`, window.cryptoLogs.styles.result);
        } else {
            // Handle single encrypted characters
            const pos = parseInt(part);
            const char = getLetter(pos);
            decrypted += char;
            
            storeStep(`Processing single number "${part}":`, window.cryptoLogs.styles.subHeader);
            storeStep(`→ Converting position ${pos} to character: ${char}\n`, window.cryptoLogs.styles.result);
        }
    }

    document.getElementById('result').innerHTML = `
        <strong>Decrypted Message:</strong><br>
        ${decrypted}
        <button class="copyclipboard" onclick="copyToClipboard('${decrypted}')">Copy Decrypted</button>
    `;
    
    storeStep('=== FINAL DECRYPTED MESSAGE ===', window.cryptoLogs.styles.header);
    storeStep(decrypted, window.cryptoLogs.styles.result);
}