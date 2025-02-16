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

        function logGuide(isEncryption = true) {
            storeStep('=== PROCESS GUIDE ===', window.cryptoLogs.styles.header);
            if (isEncryption) {
                storeStep('Encryption Steps:', window.cryptoLogs.styles.subHeader);
                storeStep('1. Input is processed character by character', window.cryptoLogs.styles.guide);
                storeStep('2. For letters:', window.cryptoLogs.styles.guide);
                storeStep('   - Uses reversed alphabet position (a=26, b=25, ..., z=1)', window.cryptoLogs.styles.guide);
                storeStep('3. For symbols:', window.cryptoLogs.styles.guide);
                storeStep('   - Uses extended positions after 26 (e.g., ?=27, @=28, etc.)', window.cryptoLogs.styles.guide);
                storeStep('4. For numbers:', window.cryptoLogs.styles.guide);
                storeStep('   - Preserved with "n" prefix (e.g., "5" becomes "n5")', window.cryptoLogs.styles.guide);
                storeStep('5. For character pairs:', window.cryptoLogs.styles.guide);
                storeStep('   - Format: [pos1×pos2]-[pos2]-[case1][case2]', window.cryptoLogs.styles.guide);
                storeStep('   - Case flags: 1=uppercase, 0=lowercase', window.cryptoLogs.styles.guide);
                storeStep('   - Example: "He" → "48-2-10" (24×2=48, e=2, H=upper, e=lower)', window.cryptoLogs.styles.guide);
                storeStep('6. For single characters:', window.cryptoLogs.styles.guide);
                storeStep('   - Format: [position]-[case]', window.cryptoLogs.styles.guide);
                storeStep('   - Example: "A" → "26-1" (a=26, uppercase=1)', window.cryptoLogs.styles.guide);
                storeStep('7. Spaces become "/"', window.cryptoLogs.styles.guide);
                storeStep('8. Invalid characters are ignored', window.cryptoLogs.styles.guide);
                storeStep('9. All parts are joined with commas', window.cryptoLogs.styles.guide);
            } else {
                storeStep('Decryption Steps:', window.cryptoLogs.styles.subHeader);
                storeStep('1. Input is split by commas into parts', window.cryptoLogs.styles.guide);
                storeStep('2. Each part is processed based on its format:', window.cryptoLogs.styles.guide);
                storeStep('   a. "/" → converts to space', window.cryptoLogs.styles.guide);
                storeStep('   b. "n" prefix → original number (e.g., "n5" → "5")', window.cryptoLogs.styles.guide);
                storeStep('   c. Three segments (x-y-zz):', window.cryptoLogs.styles.guide);
                storeStep('      - First position = x ÷ y', window.cryptoLogs.styles.guide);
                storeStep('      - Second position = y', window.cryptoLogs.styles.guide);
                storeStep('      - Last two digits = case flags for both characters', window.cryptoLogs.styles.guide);
                storeStep('   d. Two segments (x-y):', window.cryptoLogs.styles.guide);
                storeStep('      - x = position in reversed alphabet', window.cryptoLogs.styles.guide);
                storeStep('      - y = case flag (1=upper, 0=lower)', window.cryptoLogs.styles.guide);
                storeStep('3. Positions are converted back to characters:', window.cryptoLogs.styles.guide);
                storeStep('   - 1-26: reversed alphabet (26=a, 25=b, ..., 1=z)', window.cryptoLogs.styles.guide);
                storeStep('   - 27+: symbols (?=27, @=28, etc.)', window.cryptoLogs.styles.guide);
            }
            storeStep(''); // Empty line for spacing
        }
        

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

        // Get position from letter or symbol (reversed alphabet)
        function getPosition(char) {
            if (char === ' ') return 'space';
            if (symbolMap[char.toLowerCase()]) return symbolMap[char.toLowerCase()];
            // Reverse the alphabet position (a=26, b=25, ..., z=1)
            return 27 - (char.toLowerCase().charCodeAt(0) - 96);
        }

        // Get letter or symbol from position (reversed alphabet)
        function getLetter(position, isUpperCase = false) {
            if (position === 'space') return ' ';
            if (position > 26) return reverseSymbolMap[position] || '';
            // Reverse the calculation to get correct letter
            const letter = String.fromCharCode(123 - position);
            return isUpperCase ? letter.toUpperCase() : letter;
        }

        // Function to check if character is uppercase
        function isUpperCase(char) {
            return char === char.toUpperCase() && char !== char.toLowerCase();
        }

        // Function to check if character is valid for encryption
        function isValidChar(char) {
            return /[a-zA-Z0-9]/.test(char) || symbolMap.hasOwnProperty(char.toLowerCase());
        }

        // Function to check if character is a number
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
            const message = document.getElementById('message').value;

            // Check if textarea is empty
            if (!message.trim()) {
                Swal.fire({
                    icon: 'warning',
                    title: 'Empty Input',
                    text: 'Please enter a message to encrypt'
                });
                return;
            }
            
            let encrypted = [];
            
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
                    encrypted.push(`n${currentChar}`);
                    storeStep(`Preserving number "${currentChar}":`, window.cryptoLogs.styles.subHeader);
                    storeStep(`→ Storing as n${currentChar}\n`, window.cryptoLogs.styles.result);
                    continue;
                }
                
                const pos1 = getPosition(currentChar);
                const isFirstUpper = isUpperCase(currentChar);
                
                // Check if next character exists and is valid
                if (nextChar && nextChar !== ' ' && 
                    (/[a-zA-Z]/.test(nextChar) || symbolMap.hasOwnProperty(nextChar.toLowerCase()))) {
                    const pos2 = getPosition(nextChar);
                    const isSecondUpper = isUpperCase(nextChar);
                    const multiplication = pos1 * pos2;
                    
                    // Format: multiplication-secondPosition-caseFlags
                    encrypted.push(`${multiplication}-${pos2}-${isFirstUpper ? '1' : '0'}${isSecondUpper ? '1' : '0'}`);
                    
                    storeStep(`Processing pair "${currentChar}${nextChar}":`, window.cryptoLogs.styles.subHeader);
                    storeStep(`→ Positions: ${pos1} × ${pos2} = ${multiplication}`, window.cryptoLogs.styles.detail);
                    storeStep(`→ Case flags: ${isFirstUpper ? 'upper' : 'lower'}${isSecondUpper ? 'upper' : 'lower'}`, window.cryptoLogs.styles.detail);
                    
                    i++; // Skip next character
                } else {
                    // Format: position-caseFlag
                    encrypted.push(`${pos1}-${isFirstUpper ? '1' : '0'}`);
                    
                    storeStep(`Processing single character "${currentChar}":`, window.cryptoLogs.styles.subHeader);
                    storeStep(`→ Position: ${pos1}`, window.cryptoLogs.styles.detail);
                    storeStep(`→ Case flag: ${isFirstUpper ? 'upper' : 'lower'}`, window.cryptoLogs.styles.detail);
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
                
                const segments = part.split('-');
                
                if (segments.length === 3) { // Pair of characters
                    const [multiplication, pos2, caseFlags] = segments;
                    const pos1 = parseInt(multiplication) / parseInt(pos2);
                    const isFirstUpper = caseFlags[0] === '1';
                    const isSecondUpper = caseFlags[1] === '1';
                    
                    const char1 = getLetter(pos1, isFirstUpper);
                    const char2 = getLetter(parseInt(pos2), isSecondUpper);
                    decrypted += char1 + char2;
                    
                    storeStep(`Processing pair "${part}":`, window.cryptoLogs.styles.subHeader);
                    storeStep(`→ First character: position ${pos1}, case ${isFirstUpper ? 'upper' : 'lower'}`, window.cryptoLogs.styles.detail);
                    storeStep(`→ Second character: position ${pos2}, case ${isSecondUpper ? 'upper' : 'lower'}`, window.cryptoLogs.styles.detail);
                    storeStep(`→ Decoded as: ${char1}${char2}\n`, window.cryptoLogs.styles.result);
                } else if (segments.length === 2) { // Single character
                    const [pos, caseFlag] = segments;
                    const isUpper = caseFlag === '1';
                    const char = getLetter(parseInt(pos), isUpper);
                    decrypted += char;
                    
                    storeStep(`Processing single character "${part}":`, window.cryptoLogs.styles.subHeader);
                    storeStep(`→ Position ${pos}, Case = ${isUpper ? 'upper' : 'lower'}`, window.cryptoLogs.styles.detail);
                    storeStep(`→ Decoded as: ${char}\n`, window.cryptoLogs.styles.result);
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