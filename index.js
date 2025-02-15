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

        // Store step with its style
        function storeStep(message, style = window.cryptoLogs.styles.step) {
            window.cryptoLogs.steps.push({ message, style });
        }

        // Function to display all stored logs
        window.show_steps = function() {
            console.clear();
            window.cryptoLogs.steps.forEach(step => {
                console.log('%c' + step.message, step.style);
            });
        };

        // Get position from letter (1 to 26)
        function getPosition(char) {
            if (char === ' ') return 'space';
            return char.toLowerCase().charCodeAt(0) - 96;
        }

        // Get letter from position
        function getLetter(position) {
            if (position === 'space') return ' ';
            return String.fromCharCode(position + 96);
        }

        function logGuide(isEncryption = true) {
            storeStep('=== PROCESS GUIDE ===', window.cryptoLogs.styles.header);
            if (isEncryption) {
                storeStep('Encryption Steps:', window.cryptoLogs.styles.subHeader);
                storeStep('1. Each letter uses alphabet position (a=1, b=2, ..., z=26)', window.cryptoLogs.styles.guide);
                storeStep('2. For letter pairs: multiply positions and append second position', window.cryptoLogs.styles.guide);
                storeStep('3. Format: [multiplication]-[second position]', window.cryptoLogs.styles.guide);
                storeStep('4. Single letters use position only', window.cryptoLogs.styles.guide);
                storeStep('5. Spaces become "/"', window.cryptoLogs.styles.guide);
            } else {
                storeStep('Decryption Steps:', window.cryptoLogs.styles.subHeader);
                storeStep('1. Split input by commas', window.cryptoLogs.styles.guide);
                storeStep('2. For pairs (with "-"): divide first number by second number', window.cryptoLogs.styles.guide);
                storeStep('3. Convert positions to letters (normal alphabet)', window.cryptoLogs.styles.guide);
                storeStep('4. "/" becomes space', window.cryptoLogs.styles.guide);
            }
            storeStep(''); // Empty line for spacing
        }

        function encrypt() {
            const message = document.getElementById('message').value.toLowerCase();
            let encrypted = [];
            
            // Reset steps array
            window.cryptoLogs.steps = [];
            
            // Store header and guide
            storeStep('=== ENCRYPTION PROCESS ===', window.cryptoLogs.styles.header);
            logGuide(true);
            
            for (let i = 0; i < message.length; i++) {
                const currentChar = message[i];
                const nextChar = message[i + 1];
                
                if (currentChar === ' ') {
                    encrypted.push('/');
                    storeStep('Found space:', window.cryptoLogs.styles.space);
                    storeStep('→ Converting to /', window.cryptoLogs.styles.detail);
                    continue;
                }
                
                if (!/[a-z]/.test(currentChar)) continue;
                
                const pos1 = getPosition(currentChar);
                
                if (nextChar && nextChar !== ' ' && /[a-z]/.test(nextChar)) {
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
                    
                    storeStep(`Processing single letter "${currentChar}":`, window.cryptoLogs.styles.subHeader);
                    storeStep(`→ Position = ${pos1}`, window.cryptoLogs.styles.detail);
                    storeStep(`→ Using position directly: ${pos1}\n`, window.cryptoLogs.styles.result);
                }
            }

            document.getElementById('result').innerHTML = `
                <strong>Encrypted Message:</strong><br>
                ${encrypted.join(',')}
            `;
            
            storeStep('=== FINAL ENCRYPTED MESSAGE ===', window.cryptoLogs.styles.header);
            storeStep(encrypted.join(','), window.cryptoLogs.styles.result);
        }

        function decrypt() {
            const message = document.getElementById('message').value;
            let decrypted = '';
            
            // Reset steps array
            window.cryptoLogs.steps = [];
            
            // Store header and guide
            storeStep('=== DECRYPTION PROCESS ===', window.cryptoLogs.styles.header);
            logGuide(false);
            
            const parts = message.split(',');
            
            for (let part of parts) {
                if (part === '/') {
                    decrypted += ' ';
                    storeStep('Found /', window.cryptoLogs.styles.space);
                    storeStep('→ Converting to space\n', window.cryptoLogs.styles.detail);
                    continue;
                }
                
                if (part.includes('-')) {
                    const [multiplication, pos2] = part.split('-').map(Number);
                    const pos1 = multiplication / pos2;
                    const letter1 = getLetter(pos1);
                    const letter2 = getLetter(pos2);
                    decrypted += letter1 + letter2;
                    
                    storeStep(`Processing pair number "${part}":`, window.cryptoLogs.styles.subHeader);
                    storeStep(`→ Splitting ${multiplication}-${pos2}`, window.cryptoLogs.styles.detail);
                    storeStep(`→ Calculating first position: ${multiplication} ÷ ${pos2} = ${pos1}`, window.cryptoLogs.styles.detail);
                    storeStep(`→ Converting positions to letters: ${pos1} → ${letter1}, ${pos2} → ${letter2}\n`, window.cryptoLogs.styles.result);
                } else {
                    const pos = parseInt(part);
                    const letter = getLetter(pos);
                    decrypted += letter;
                    
                    storeStep(`Processing single number "${part}":`, window.cryptoLogs.styles.subHeader);
                    storeStep(`→ Converting position ${pos} to letter: ${letter}\n`, window.cryptoLogs.styles.result);
                }
            }

            document.getElementById('result').innerHTML = `
                <strong>Decrypted Message:</strong><br>
                ${decrypted}
            `;
            
            storeStep('=== FINAL DECRYPTED MESSAGE ===', window.cryptoLogs.styles.header);
            storeStep(decrypted, window.cryptoLogs.styles.result);
        }