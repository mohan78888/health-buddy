// HealthBuddy AI - Complete JavaScript Logic

// ==================== CONFIGURATION ====================
const GEMINI_KEY = "AIzaSyAAWKtc9ffm066wG4D_P-1M0hGG5BO4_WY";
// API endpoints - Updated to use v1 API (more stable)
const GEMINI_TEXT_API = "https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent";
const GEMINI_VISION_API = "https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent";
// Fallback endpoints
const GEMINI_TEXT_API_FALLBACK = "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent";
const GEMINI_VISION_API_FALLBACK = "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro-vision:generateContent";

// ==================== STATE MANAGEMENT ====================
let recognition = null;
let isListening = false;
let remindersEnabled = false;
let reminderCheckInterval = null;
let triggeredReminders = new Set(); // Track triggered reminders to prevent duplicates

// ==================== INITIALIZATION ====================
document.addEventListener('DOMContentLoaded', () => {
    initializeSpeechRecognition();
    loadReminders();
    startReminderChecker();
    setupEventListeners();
    setupNavbarScroll();
    setupThemeToggle();
    loadTheme();
    loadChatHistory();
    setupChatListeners();
});

// ==================== NAVBAR SCROLL EFFECT ====================
function setupNavbarScroll() {
    const navbar = document.querySelector('nav');
    if (navbar) {
        window.addEventListener('scroll', () => {
            if (window.scrollY > 50) {
                navbar.classList.add('scrolled');
            } else {
                navbar.classList.remove('scrolled');
            }
        });
    }
}

// ==================== THEME TOGGLE ====================
function setupThemeToggle() {
    const themeToggle = document.getElementById('themeToggle');
    const sunIcon = document.getElementById('sunIcon');
    const moonIcon = document.getElementById('moonIcon');
    
    if (themeToggle) {
        themeToggle.addEventListener('click', () => {
            const currentTheme = document.body.getAttribute('data-theme');
            const newTheme = currentTheme === 'light' ? 'dark' : 'light';
            
            document.body.setAttribute('data-theme', newTheme);
            localStorage.setItem('theme', newTheme);
            
            // Toggle icons
            if (newTheme === 'dark') {
                sunIcon.classList.add('hidden');
                moonIcon.classList.remove('hidden');
            } else {
                sunIcon.classList.remove('hidden');
                moonIcon.classList.add('hidden');
            }
        });
    }
}

function loadTheme() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.body.setAttribute('data-theme', savedTheme);
    
    const sunIcon = document.getElementById('sunIcon');
    const moonIcon = document.getElementById('moonIcon');
    
    if (savedTheme === 'dark') {
        if (sunIcon) sunIcon.classList.add('hidden');
        if (moonIcon) moonIcon.classList.remove('hidden');
    } else {
        if (sunIcon) sunIcon.classList.remove('hidden');
        if (moonIcon) moonIcon.classList.add('hidden');
    }
}

// ==================== SPEECH RECOGNITION SETUP ====================
function initializeSpeechRecognition() {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = 'en-US';

        recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            // Check if voice chat is active
            const voiceChatBtn = document.getElementById('voiceChatBtn');
            if (voiceChatBtn && voiceChatBtn.classList.contains('voice-active')) {
                // Voice chat mode
                document.getElementById('chatInput').value = transcript;
                sendChatMessage();
                voiceChatBtn.classList.remove('voice-active');
            } else {
                // Regular voice command
                handleVoiceCommand(transcript);
            }
        };

        recognition.onerror = (event) => {
            console.error('Speech recognition error:', event.error);
            stopListening();
            showNotification('Error: ' + event.error, 'error');
        };

        recognition.onend = () => {
            stopListening();
        };
    } else {
        showNotification('Speech recognition not supported in this browser', 'error');
    }
}

// ==================== EVENT LISTENERS ====================
function setupEventListeners() {
    // Voice Search Button
    document.getElementById('voiceSearchBtn').addEventListener('click', () => {
        if (!isListening) {
            startVoiceSearch();
        } else {
            stopListening();
        }
    });

    // Voice Reminder Button
    document.getElementById('voiceReminderBtn').addEventListener('click', () => {
        if (!isListening) {
            startVoiceReminder();
        } else {
            stopListening();
        }
    });

    // Add Reminder Button (opens modal)
    document.getElementById('addReminderBtn').addEventListener('click', () => {
        openReminderModal();
    });

    // Close Modal Buttons
    document.getElementById('closeModalBtn').addEventListener('click', closeReminderModal);
    document.getElementById('cancelReminderBtn').addEventListener('click', closeReminderModal);

    // Reminder Form Submit
    document.getElementById('reminderForm').addEventListener('submit', (e) => {
        e.preventDefault();
        handleManualReminder();
    });

    // Close modal when clicking outside
    document.getElementById('reminderModal').addEventListener('click', (e) => {
        if (e.target.id === 'reminderModal') {
            closeReminderModal();
        }
    });

    // Reminder Toggle (Desktop)
    const reminderToggle = document.getElementById('reminderToggle');
    if (reminderToggle) {
        reminderToggle.addEventListener('click', toggleReminders);
    }

    // Reminder Toggle (Mobile)
    const reminderToggleMobile = document.getElementById('reminderToggleMobile');
    if (reminderToggleMobile) {
        reminderToggleMobile.addEventListener('click', toggleReminders);
    }

    // Mobile Menu Toggle
    const mobileMenuBtn = document.getElementById('mobileMenuBtn');
    const mobileMenu = document.getElementById('mobileMenu');
    if (mobileMenuBtn && mobileMenu) {
        mobileMenuBtn.addEventListener('click', () => {
            mobileMenu.classList.toggle('hidden');
            // Toggle hamburger icon
            const icon = mobileMenuBtn.querySelector('svg');
            if (mobileMenu.classList.contains('hidden')) {
                icon.innerHTML = '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"></path>';
            } else {
                icon.innerHTML = '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>';
            }
        });
    }

    // Smooth scrolling for navigation links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;
            
            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                const offsetTop = targetElement.offsetTop - 80; // Account for sticky navbar
                window.scrollTo({
                    top: offsetTop,
                    behavior: 'smooth'
                });
                // Close mobile menu if open
                if (mobileMenu && !mobileMenu.classList.contains('hidden')) {
                    mobileMenu.classList.add('hidden');
                    const icon = mobileMenuBtn.querySelector('svg');
                    icon.innerHTML = '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"></path>';
                }
            }
        });
    });

    // Medicine Image Input
    document.getElementById('medicineImageInput').addEventListener('change', handleMedicineImageScan);

    // Prescription Input
    document.getElementById('prescriptionInput').addEventListener('change', handlePrescriptionScan);

    // Clear Chat Button
    const clearChatBtn = document.getElementById('clearChatBtn');
    if (clearChatBtn) {
        clearChatBtn.addEventListener('click', clearChat);
    }

    // Voice Chat Button
    const voiceChatBtn = document.getElementById('voiceChatBtn');
    if (voiceChatBtn) {
        voiceChatBtn.addEventListener('click', startVoiceChat);
    }
}

// ==================== CHAT LISTENERS ====================
function setupChatListeners() {
    // Make functions globally available
    window.sendChatMessage = sendChatMessage;
    window.startVoiceChat = startVoiceChat;
    window.clearChat = clearChat;
}

// ==================== VOICE COMMAND HANDLER ====================
function handleVoiceCommand(transcript) {
    const lowerText = transcript.toLowerCase();
    
    // Check if it's a reminder command (more flexible patterns)
    const reminderKeywords = ['reminder', 'remind', 'alarm', 'time', 'medicine', 'take', 'le lo', 'ka reminder'];
    const hasReminderKeyword = reminderKeywords.some(keyword => lowerText.includes(keyword));
    const hasTimePattern = /(\d{1,2}):?(\d{2})?\s*(AM|PM|am|pm|o'clock)/i.test(transcript);
    
    // If user clicked voice reminder button, always treat as reminder
    const reminderBtn = document.getElementById('voiceReminderBtn');
    const isReminderMode = reminderBtn.classList.contains('voice-active') || 
                          reminderBtn.querySelector('span').textContent.includes('Listening');
    
    if (isReminderMode || (hasReminderKeyword && hasTimePattern)) {
        parseReminderCommand(transcript);
    } else if (hasTimePattern && (lowerText.includes('medicine') || lowerText.includes('take'))) {
        // If has time and medicine keywords, treat as reminder
        parseReminderCommand(transcript);
    } else {
        // Otherwise, treat it as medicine search
        searchMedicine(transcript);
    }
}

// ==================== VOICE SEARCH ====================
function startVoiceSearch() {
    if (!recognition) {
        showNotification('Speech recognition not available', 'error');
        return;
    }

    isListening = true;
    recognition.start();
    const btn = document.getElementById('voiceSearchBtn');
    const text = document.getElementById('voiceSearchText');
    btn.classList.add('voice-active');
    text.textContent = 'Listening...';
}

// ==================== VOICE REMINDER ====================
function startVoiceReminder() {
    if (!recognition) {
        showNotification('Speech recognition not available', 'error');
        return;
    }

    isListening = true;
    recognition.start();
    const btn = document.getElementById('voiceReminderBtn');
    btn.classList.add('voice-active');
    btn.querySelector('span').textContent = 'Listening...';
    
    // Show helpful message
    showNotification('Bol rahe hain: "8 PM par Paracetamol" ya "Set reminder for 8 PM for Medicine Name"', 'info');
    speakText('Please say the reminder. For example, 8 PM par Paracetamol');
}

function stopListening() {
    if (recognition && isListening) {
        recognition.stop();
    }
    isListening = false;
    
    // Reset buttons
    document.getElementById('voiceSearchBtn').classList.remove('voice-active');
    document.getElementById('voiceSearchText').textContent = 'Click to Search by Voice';
    const reminderBtn = document.getElementById('voiceReminderBtn');
    reminderBtn.classList.remove('voice-active');
    reminderBtn.querySelector('span').textContent = 'Set Reminder by Voice';
    
    // Reset voice chat button
    const voiceChatBtn = document.getElementById('voiceChatBtn');
    if (voiceChatBtn) {
        voiceChatBtn.classList.remove('voice-active');
    }
}

// ==================== REMINDER SYSTEM ====================
function parseReminderCommand(text) {
    // Parse various formats:
    // "Set reminder for 8 PM for Paracetamol"
    // "Remind me at 3:30 PM to take Aspirin"
    // "8 PM par Paracetamol"
    // "3:30 PM medicine"
    
    // More flexible time pattern
    const timePattern = /(\d{1,2}):?(\d{2})?\s*(AM|PM|am|pm|o'clock|o clock)/i;
    const match = text.match(timePattern);
    
    if (!match) {
        showNotification('Time nahi mila. Please say: "8 PM par Paracetamol" ya "Set reminder for 8 PM for Medicine Name"', 'error');
        speakText('Time nahi mila. Please try again with time like 8 PM');
        return;
    }

    let hours = parseInt(match[1]);
    const minutes = match[2] ? parseInt(match[2]) : 0;
    const period = (match[3] || '').toUpperCase();

    // Convert to 24-hour format
    if (period.includes('PM') && hours !== 12) {
        hours += 12;
    } else if (period.includes('AM') && hours === 12) {
        hours = 0;
    } else if (!period || period.includes('O\'CLOCK')) {
        // If no AM/PM, assume PM for hours 1-11, AM for 12
        if (hours >= 1 && hours <= 11) {
            hours += 12;
        }
    }

    // Extract medicine name - try multiple patterns
    let medicineName = 'Medicine';
    
    // Pattern 1: "for [medicine]" or "to take [medicine]"
    let medicineMatch = text.match(/(?:for|to take|par|ka|ke liye)\s+([^.]+?)(?:\s+at|\s+par|\s*$)/i);
    if (medicineMatch) {
        medicineName = medicineMatch[1].trim();
    } else {
        // Pattern 2: Medicine before time
        const beforeTime = text.substring(0, text.indexOf(match[0])).trim();
        if (beforeTime && beforeTime.length > 2) {
            // Remove common words
            medicineName = beforeTime.replace(/(set|reminder|remind|me|at|for|to take|par|ka|ke liye)/gi, '').trim();
        }
        // Pattern 3: Medicine after time
        if (medicineName === 'Medicine' || medicineName.length < 2) {
            const afterTime = text.substring(text.indexOf(match[0]) + match[0].length).trim();
            if (afterTime && afterTime.length > 2) {
                medicineName = afterTime.replace(/(set|reminder|remind|me|at|for|to take|par|ka|ke liye|medicine)/gi, '').trim();
            }
        }
    }
    
    // Clean up medicine name
    medicineName = medicineName.replace(/^(for|to take|par|ka|ke liye|medicine|take|le lo)\s+/i, '');
    medicineName = medicineName.replace(/\s+(for|at|par|ka|ke liye)$/i, '');
    
    if (!medicineName || medicineName.length < 2) {
        medicineName = 'Medicine';
    }

    // Create reminder
    const reminder = {
        id: Date.now(),
        medicine: medicineName,
        time: `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`,
        createdAt: new Date().toISOString()
    };

    saveReminder(reminder);
    
    // Convert to 12-hour format for display
    const hour12 = hours % 12 || 12;
    const periodDisplay = hours >= 12 ? 'PM' : 'AM';
    const displayTime = `${hour12}:${String(minutes).padStart(2, '0')} ${periodDisplay}`;
    
    showNotification(`✅ Reminder set for ${medicineName} at ${displayTime}`, 'success');
    speakText(`Reminder set for ${medicineName} at ${displayTime}`);
}

function saveReminder(reminder) {
    const reminders = getReminders();
    reminders.push(reminder);
    localStorage.setItem('healthBuddyReminders', JSON.stringify(reminders));
    displayReminders();
}

function getReminders() {
    const stored = localStorage.getItem('healthBuddyReminders');
    return stored ? JSON.parse(stored) : [];
}

function loadReminders() {
    displayReminders();
}

function displayReminders() {
    const reminders = getReminders();
    const container = document.getElementById('remindersList');
    
    if (reminders.length === 0) {
        container.innerHTML = '<p class="opacity-70 text-center py-4">No reminders set. Use voice command to add one.</p>';
        return;
    }

    container.innerHTML = reminders.map(reminder => {
        const [hours, minutes] = reminder.time.split(':');
        const hourNum = parseInt(hours);
        const hour12 = hourNum % 12 || 12;
        const period = hourNum >= 12 ? 'PM' : 'AM';
        const displayTime = `${hour12}:${String(minutes).padStart(2, '0')} ${period}`;
        
        return `
            <div class="reminder-card glass-card rounded-lg p-4 flex items-center justify-between">
                <div class="flex-1">
                    <h3 class="font-semibold">${reminder.medicine}</h3>
                    <p class="text-sm opacity-70">⏰ ${displayTime}</p>
                </div>
                <button onclick="deleteReminder(${reminder.id})" class="ml-4 px-3 py-1 glass-card-red text-white rounded-lg hover:opacity-80 transition-all">
                    Delete
                </button>
            </div>
        `;
    }).join('');
}

function deleteReminder(id) {
    const reminders = getReminders().filter(r => r.id !== id);
    localStorage.setItem('healthBuddyReminders', JSON.stringify(reminders));
    displayReminders();
}

function toggleReminders() {
    remindersEnabled = !remindersEnabled;
    
    // Update desktop status
    const statusEl = document.getElementById('reminderStatus');
    if (statusEl) {
        statusEl.textContent = `Reminders: ${remindersEnabled ? 'On' : 'Off'}`;
        const parent = statusEl.parentElement;
        // Theme colors are handled by CSS classes, just update text
    }
    
    // Update mobile status
    const statusElMobile = document.getElementById('reminderStatusMobile');
    if (statusElMobile) {
        statusElMobile.textContent = `Reminders: ${remindersEnabled ? 'On' : 'Off'}`;
        // Theme colors are handled by CSS classes, just update text
    }
}

function startReminderChecker() {
    // Check reminders every 10 seconds
    reminderCheckInterval = setInterval(() => {
        if (!remindersEnabled) return;

        const now = new Date();
        const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
        
        const reminders = getReminders();
        reminders.forEach(reminder => {
            const reminderKey = `${reminder.id}-${reminder.time}`;
            if (reminder.time === currentTime && !triggeredReminders.has(reminderKey)) {
                triggerReminder(reminder);
                triggeredReminders.add(reminderKey);
                
                // Clear triggered reminders after 1 minute to allow re-triggering next day
                setTimeout(() => {
                    triggeredReminders.delete(reminderKey);
                }, 60000);
            }
        });
    }, 10000); // Check every 10 seconds
}

function triggerReminder(reminder) {
    // Show flash alert
    const alert = document.getElementById('flashAlert');
    const alertText = document.getElementById('flashAlertText');
    alertText.textContent = `⏰ Time ho gaya! ${reminder.medicine} le lo!`;
    alert.classList.remove('hidden');
    alert.classList.add('show');

    // Speak reminder in Hindi/English mix
    speakText(`Time ho gaya! ${reminder.medicine} le lo! Medicine le lo!`);

    // Hide alert after 15 seconds (longer for user to see)
    setTimeout(() => {
        alert.classList.remove('show');
        setTimeout(() => {
            alert.classList.add('hidden');
        }, 300);
    }, 15000);
}

// ==================== REMINDER MODAL FUNCTIONS ====================
function openReminderModal() {
    const modal = document.getElementById('reminderModal');
    modal.classList.remove('hidden');
    // Set default time to current time + 1 hour
    const now = new Date();
    now.setHours(now.getHours() + 1);
    const timeString = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    document.getElementById('reminderTimeInput').value = timeString;
    document.getElementById('medicineNameInput').focus();
}

function closeReminderModal() {
    const modal = document.getElementById('reminderModal');
    modal.classList.add('hidden');
    document.getElementById('reminderForm').reset();
}

function handleManualReminder() {
    const medicineName = document.getElementById('medicineNameInput').value.trim();
    const timeValue = document.getElementById('reminderTimeInput').value;

    if (!medicineName || !timeValue) {
        showNotification('Please fill all fields', 'error');
        return;
    }

    // Create reminder object
    const reminder = {
        id: Date.now(),
        medicine: medicineName,
        time: timeValue, // Already in HH:MM format
        createdAt: new Date().toISOString()
    };

    saveReminder(reminder);
    
    // Convert to 12-hour format for display
    const [hours, minutes] = timeValue.split(':');
    const hour12 = hours % 12 || 12;
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayTime = `${hour12}:${minutes} ${period}`;
    
    showNotification(`Reminder set for ${medicineName} at ${displayTime}`, 'success');
    speakText(`Reminder set for ${medicineName} at ${displayTime}`);
    
    closeReminderModal();
}

// ==================== HELPER: API CALL WITH FALLBACK ====================
async function callGeminiAPI(apiUrl, fallbackUrl, requestBody) {
    try {
        console.log('Calling Gemini API:', apiUrl);
        console.log('Request body:', JSON.stringify(requestBody, null, 2));
        
        // Try primary API
        const response = await fetch(`${apiUrl}?key=${GEMINI_KEY}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody)
        });

        console.log('Response status:', response.status, response.statusText);
        
        const data = await response.json();
        console.log('Response data:', data);
        
        if (!response.ok) {
            // Log detailed error
            console.error('API Error Details:', {
                status: response.status,
                statusText: response.statusText,
                error: data.error,
                fullResponse: data
            });
            
            // If primary fails and we have a fallback, try it
            if (fallbackUrl && data.error?.code !== 401 && data.error?.code !== 403) {
                console.log('Primary API failed, trying fallback:', fallbackUrl);
                try {
                    const fallbackResponse = await fetch(`${fallbackUrl}?key=${GEMINI_KEY}`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify(requestBody)
                    });
                    const fallbackData = await fallbackResponse.json();
                    
                    if (!fallbackResponse.ok) {
                        console.error('Fallback API also failed:', fallbackData);
                        const errorMsg = fallbackData.error?.message || fallbackData.error || fallbackResponse.statusText;
                        throw new Error(`API Error: ${errorMsg} (Status: ${fallbackResponse.status})`);
                    }
                    
                    console.log('Fallback API succeeded!');
                    return fallbackData;
                } catch (fallbackError) {
                    console.error('Fallback API error:', fallbackError);
                    throw new Error(`Both APIs failed. Primary: ${data.error?.message || response.statusText}, Fallback: ${fallbackError.message}`);
                }
            }
            
            // Build detailed error message
            let errorMsg = `API Error (${response.status}): `;
            if (data.error) {
                errorMsg += data.error.message || JSON.stringify(data.error);
                if (data.error.code) {
                    errorMsg += ` (Code: ${data.error.code})`;
                }
            } else {
                errorMsg += response.statusText || 'Unknown error';
            }
            
            throw new Error(errorMsg);
        }

        return data;
    } catch (error) {
        console.error('API Call Error:', error);
        
        // If network error and we have fallback, try it
        if (fallbackUrl && (error.message.includes('fetch') || error.message.includes('Network') || error.name === 'TypeError')) {
            console.log('Network error detected, trying fallback...');
            try {
                const fallbackResponse = await fetch(`${fallbackUrl}?key=${GEMINI_KEY}`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(requestBody)
                });
                const fallbackData = await fallbackResponse.json();
                
                if (!fallbackResponse.ok) {
                    const errorMsg = fallbackData.error?.message || fallbackData.error || fallbackResponse.statusText;
                    throw new Error(`Fallback API Error: ${errorMsg} (Status: ${fallbackResponse.status})`);
                }
                
                console.log('Fallback API succeeded after network error!');
                return fallbackData;
            } catch (fallbackError) {
                console.error('Fallback also failed:', fallbackError);
                throw new Error(`Network error and fallback failed: ${error.message}`);
            }
        }
        throw error;
    }
}

// ==================== AI MEDICINE SEARCH ====================
async function searchMedicine(medicineName) {
    if (!medicineName || medicineName.trim() === '') {
        showNotification('Please provide a medicine name', 'error');
        return;
    }

    if (GEMINI_KEY === "YOUR_GEMINI_API_KEY_HERE") {
        showNotification('Please set your Gemini API key in script.js', 'error');
        return;
    }

    showLoading('searchResults', 'searchContent');
    document.getElementById('searchResults').classList.remove('hidden');

    try {
        const prompt = `Provide detailed information about the medicine "${medicineName}" including:
1. Description/What it is
2. Usage/Indications
3. Dosage information
4. Side effects
5. Warnings and precautions

Format the response in a clear, easy-to-read way.`;

        const requestBody = {
            contents: [{
                parts: [{
                    text: prompt
                }]
            }]
        };

        const data = await callGeminiAPI(GEMINI_TEXT_API, GEMINI_TEXT_API_FALLBACK, requestBody);

        if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
            throw new Error('Invalid response format from API');
        }

        const resultText = data.candidates[0].content.parts[0].text;

        displaySearchResults(resultText);
        speakText(`Information about ${medicineName}. ${resultText.substring(0, 200)}`);

    } catch (error) {
        console.error('Search error:', error);
        const errorMsg = error.message || 'Unknown error occurred';
        document.getElementById('searchContent').innerHTML = `
            <div class="text-red-600 p-4 bg-red-50 rounded-lg">
                <p class="font-semibold mb-2">⚠️ Error:</p>
                <p class="mb-2">${errorMsg}</p>
                <p class="text-sm text-gray-600">Please check your API key and try again.</p>
            </div>
        `;
        showNotification('Search failed: ' + errorMsg, 'error');
    }
}

function displaySearchResults(text) {
    const content = document.getElementById('searchContent');
    content.innerHTML = `
        <div class="result-card space-y-4">
            <div class="prose max-w-none">
                ${formatTextAsHTML(text)}
            </div>
        </div>
    `;
}

// ==================== MEDICINE IMAGE SCAN ====================
async function handleMedicineImageScan(event) {
    const file = event.target.files[0];
    if (!file) return;

    if (GEMINI_KEY === "YOUR_GEMINI_API_KEY_HERE") {
        showNotification('Please set your Gemini API key in script.js', 'error');
        return;
    }

    showLoading('scanResults', 'scanContent');
    document.getElementById('scanResults').classList.remove('hidden');

    try {
        const base64 = await fileToBase64(file);
        
        const requestBody = {
            contents: [{
                parts: [
                    {
                        text: "Analyze this medicine image and provide: 1. Medicine name, 2. Purpose/Indication, 3. Dosage information, 4. Warnings and precautions. Format clearly."
                    },
                    {
                        inline_data: {
                            mime_type: file.type,
                            data: base64.split(',')[1]
                        }
                    }
                ]
            }]
        };

        const data = await callGeminiAPI(GEMINI_VISION_API, GEMINI_VISION_API_FALLBACK, requestBody);

        if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
            throw new Error('Invalid response format from API');
        }

        const resultText = data.candidates[0].content.parts[0].text;

        displayScanResults(resultText, file);
        speakText(`Medicine scan complete. ${resultText.substring(0, 200)}`);

    } catch (error) {
        console.error('Scan error:', error);
        const errorMsg = error.message || 'Unknown error occurred';
        document.getElementById('scanContent').innerHTML = `
            <div class="text-red-600 p-4 bg-red-50 rounded-lg">
                <p class="font-semibold mb-2">⚠️ Error:</p>
                <p class="mb-2">${errorMsg}</p>
                <p class="text-sm text-gray-600">Please check your API key and try again.</p>
            </div>
        `;
        showNotification('Scan failed: ' + errorMsg, 'error');
    }
}

function displayScanResults(text, file) {
    const content = document.getElementById('scanContent');
    const imageUrl = URL.createObjectURL(file);
    
    content.innerHTML = `
        <div class="result-card space-y-4">
            <img src="${imageUrl}" alt="Scanned medicine" class="image-preview w-full max-w-xs mx-auto rounded-lg shadow-md">
            <div class="prose max-w-none">
                ${formatTextAsHTML(text)}
            </div>
        </div>
    `;
}

// ==================== PRESCRIPTION READER ====================
async function handlePrescriptionScan(event) {
    const file = event.target.files[0];
    if (!file) return;

    if (GEMINI_KEY === "YOUR_GEMINI_API_KEY_HERE") {
        showNotification('Please set your Gemini API key in script.js', 'error');
        return;
    }

    showLoading('prescriptionResults', 'prescriptionContent');
    document.getElementById('prescriptionResults').classList.remove('hidden');

    try {
        const base64 = await fileToBase64(file);
        
        const requestBody = {
            contents: [{
                parts: [
                    {
                        text: "Analyze this prescription image and extract: 1. All medicine names, 2. Dosage for each (morning/evening/night), 3. Duration, 4. Any special instructions or precautions. Format as a clear list."
                    },
                    {
                        inline_data: {
                            mime_type: file.type,
                            data: base64.split(',')[1]
                        }
                    }
                ]
            }]
        };

        const data = await callGeminiAPI(GEMINI_VISION_API, GEMINI_VISION_API_FALLBACK, requestBody);

        if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
            throw new Error('Invalid response format from API');
        }

        const resultText = data.candidates[0].content.parts[0].text;

        displayPrescriptionResults(resultText, file);
        speakText(`Prescription analyzed. ${resultText.substring(0, 200)}`);

    } catch (error) {
        console.error('Prescription scan error:', error);
        const errorMsg = error.message || 'Unknown error occurred';
        document.getElementById('prescriptionContent').innerHTML = `
            <div class="text-red-600 p-4 bg-red-50 rounded-lg">
                <p class="font-semibold mb-2">⚠️ Error:</p>
                <p class="mb-2">${errorMsg}</p>
                <p class="text-sm text-gray-600">Please check your API key and try again.</p>
            </div>
        `;
        showNotification('Prescription scan failed: ' + errorMsg, 'error');
    }
}

function displayPrescriptionResults(text, file) {
    const content = document.getElementById('prescriptionContent');
    const imageUrl = URL.createObjectURL(file);
    
    content.innerHTML = `
        <div class="result-card space-y-4">
            <img src="${imageUrl}" alt="Prescription" class="image-preview w-full max-w-md mx-auto rounded-lg shadow-md">
            <div class="prose max-w-none">
                ${formatTextAsHTML(text)}
            </div>
        </div>
    `;
}

// ==================== UTILITY FUNCTIONS ====================
function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

function formatTextAsHTML(text) {
    // Convert markdown-like formatting to HTML
    let html = text
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.+?)\*/g, '<em>$1</em>')
        .replace(/\n\n/g, '</p><p>')
        .replace(/\n/g, '<br>')
        .replace(/^(.+)$/, '<p>$1</p>');
    
    // Format numbered lists
    html = html.replace(/(\d+\.\s+.+?)(?=\d+\.|$)/g, '<li>$1</li>');
    html = html.replace(/(<li>.*<\/li>)/s, '<ol>$1</ol>');
    
    return html;
}

function showLoading(containerId, contentId) {
    document.getElementById(contentId).innerHTML = `
        <div class="flex items-center justify-center py-8">
            <div class="spinner"></div>
            <span class="ml-3 text-gray-600">Processing...</span>
        </div>
    `;
}

function speakText(text) {
    if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(text);
        // Use Hindi for better pronunciation of Hindi words
        utterance.lang = 'hi-IN';
        utterance.rate = 0.9;
        utterance.pitch = 1.0;
        window.speechSynthesis.speak(utterance);
    }
}

function showNotification(message, type = 'info') {
    // Simple notification (you can enhance this)
    console.log(`[${type.toUpperCase()}] ${message}`);
    // You could add a toast notification here
}

// ==================== AI CHAT DASHBOARD ====================
let chatHistory = [];

function loadChatHistory() {
    const saved = localStorage.getItem('healthBuddyChatHistory');
    if (saved) {
        chatHistory = JSON.parse(saved);
        if (chatHistory.length > 0) {
            displayChatHistory();
        }
    }
}

function saveChatHistory() {
    localStorage.setItem('healthBuddyChatHistory', JSON.stringify(chatHistory));
}

function addMessageToChat(role, content) {
    chatHistory.push({ role, content, timestamp: new Date().toISOString() });
    saveChatHistory();
    displayMessage(role, content);
}

function displayMessage(role, content) {
    const chatMessages = document.getElementById('chatMessages');
    const messageDiv = document.createElement('div');
    messageDiv.className = 'flex items-start space-x-2 animate-fadeIn';
    
    if (role === 'user') {
        messageDiv.innerHTML = `
            <div class="flex-1"></div>
            <div class="glass-card-red rounded-lg p-3 max-w-[80%] text-white">
                <p class="text-sm">${escapeHtml(content)}</p>
            </div>
            <div class="w-8 h-8 glass-card rounded-full flex items-center justify-center flex-shrink-0">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                </svg>
            </div>
        `;
    } else {
        messageDiv.innerHTML = `
            <div class="w-8 h-8 glass-card-red rounded-full flex items-center justify-center flex-shrink-0">
                <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path>
                </svg>
            </div>
            <div class="glass-card rounded-lg p-3 max-w-[80%]">
                <p class="text-sm opacity-90">${formatChatResponse(content)}</p>
            </div>
        `;
    }
    
    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function displayChatHistory() {
    const chatMessages = document.getElementById('chatMessages');
    chatMessages.innerHTML = '';
    
    chatHistory.forEach(msg => {
        displayMessage(msg.role, msg.content);
    });
}

async function sendChatMessage() {
    const input = document.getElementById('chatInput');
    const message = input.value.trim();
    
    if (!message) return;
    
    if (GEMINI_KEY === "YOUR_GEMINI_API_KEY_HERE") {
        showNotification('Please set your Gemini API key', 'error');
        return;
    }
    
    // Add user message
    addMessageToChat('user', message);
    input.value = '';
    
    // Show typing indicator
    showTypingIndicator();
    
    try {
        // Prepare conversation context
        const conversationContext = chatHistory.slice(-5).map(msg => 
            `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`
        ).join('\n');
        
        const prompt = `You are a helpful AI health assistant. Answer questions about medicines, health, and medications clearly and accurately. 

Previous conversation:
${conversationContext}

User: ${message}
Assistant:`;

        const requestBody = {
            contents: [{
                parts: [{
                    text: prompt
                }]
            }]
        };

        const data = await callGeminiAPI(GEMINI_TEXT_API, GEMINI_TEXT_API_FALLBACK, requestBody);

        if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
            throw new Error('Invalid response format from API');
        }

        const aiResponse = data.candidates[0].content.parts[0].text;
        
        // Remove typing indicator
        removeTypingIndicator();
        
        // Add AI response
        addMessageToChat('assistant', aiResponse);
        
        // Speak the response
        speakText(aiResponse.substring(0, 200));

    } catch (error) {
        removeTypingIndicator();
        console.error('Chat error:', error);
        const errorMsg = error.message || 'Failed to get response';
        addMessageToChat('assistant', `Sorry, I encountered an error: ${errorMsg}. Please try again.`);
    }
}

function showTypingIndicator() {
    const chatMessages = document.getElementById('chatMessages');
    const typingDiv = document.createElement('div');
    typingDiv.id = 'typingIndicator';
    typingDiv.className = 'flex items-start space-x-2';
    typingDiv.innerHTML = `
        <div class="w-8 h-8 glass-card-red rounded-full flex items-center justify-center flex-shrink-0">
            <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path>
            </svg>
        </div>
        <div class="glass-card rounded-lg p-3">
            <div class="flex space-x-1">
                <div class="w-2 h-2 bg-current rounded-full animate-bounce" style="animation-delay: 0s"></div>
                <div class="w-2 h-2 bg-current rounded-full animate-bounce" style="animation-delay: 0.2s"></div>
                <div class="w-2 h-2 bg-current rounded-full animate-bounce" style="animation-delay: 0.4s"></div>
            </div>
        </div>
    `;
    chatMessages.appendChild(typingDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function removeTypingIndicator() {
    const typingIndicator = document.getElementById('typingIndicator');
    if (typingIndicator) {
        typingIndicator.remove();
    }
}

function startVoiceChat() {
    if (!recognition) {
        showNotification('Speech recognition not available', 'error');
        return;
    }

    isListening = true;
    recognition.start();
    const btn = document.getElementById('voiceChatBtn');
    btn.classList.add('voice-active');
    
    showNotification('Listening... Speak your question', 'info');
}

function clearChat() {
    if (confirm('Are you sure you want to clear the chat history?')) {
        chatHistory = [];
        saveChatHistory();
        const chatMessages = document.getElementById('chatMessages');
        chatMessages.innerHTML = `
            <div class="flex items-start space-x-2">
                <div class="w-8 h-8 glass-card-red rounded-full flex items-center justify-center flex-shrink-0">
                    <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path>
                    </svg>
                </div>
                <div class="glass-card rounded-lg p-3 max-w-[80%]">
                    <p class="text-sm opacity-90">Chat cleared! How can I help you today?</p>
                </div>
            </div>
        `;
    }
}

function formatChatResponse(text) {
    // Format markdown-like text to HTML
    let html = escapeHtml(text)
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.+?)\*/g, '<em>$1</em>')
        .replace(/\n\n/g, '</p><p>')
        .replace(/\n/g, '<br>');
    
    return `<p>${html}</p>`;
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ==================== API TEST FUNCTION ====================
async function testGeminiAPI() {
    console.log('=== Testing Gemini API ===');
    console.log('API Key:', GEMINI_KEY ? GEMINI_KEY.substring(0, 10) + '...' : 'NOT SET');
    
    // Show loading in chat
    const chatMessages = document.getElementById('chatMessages');
    const testDiv = document.createElement('div');
    testDiv.id = 'apiTestResult';
    testDiv.className = 'flex items-start space-x-2';
    testDiv.innerHTML = `
        <div class="w-8 h-8 glass-card-red rounded-full flex items-center justify-center flex-shrink-0">
            <svg class="w-5 h-5 text-white animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
            </svg>
        </div>
        <div class="glass-card rounded-lg p-3 max-w-[80%]">
            <p class="text-sm opacity-90">Testing API connection...</p>
        </div>
    `;
    chatMessages.appendChild(testDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
    
    const testRequestBody = {
        contents: [{
            parts: [{
                text: "Say 'Hello, API is working!' if you can read this."
            }]
        }]
    };
    
    try {
        console.log('Testing primary API:', GEMINI_TEXT_API);
        const response = await fetch(`${GEMINI_TEXT_API}?key=${GEMINI_KEY}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(testRequestBody)
        });
        
        console.log('Response Status:', response.status);
        const data = await response.json();
        console.log('Response Data:', data);
        
        // Update test result in UI
        const resultDiv = document.getElementById('apiTestResult');
        if (response.ok && data.candidates && data.candidates[0]) {
            const responseText = data.candidates[0].content.parts[0].text;
            resultDiv.innerHTML = `
                <div class="w-8 h-8 glass-card-red rounded-full flex items-center justify-center flex-shrink-0">
                    <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                </div>
                <div class="glass-card rounded-lg p-3 max-w-[80%]">
                    <p class="text-sm opacity-90 font-semibold text-green-600">✅ API Test Successful!</p>
                    <p class="text-sm opacity-90 mt-1">${responseText}</p>
                    <p class="text-xs opacity-70 mt-2">Status: ${response.status} | Model: gemini-1.5-flash</p>
                </div>
            `;
            console.log('✅ API is working!');
            return { success: true, message: 'API is working correctly' };
        } else {
            const errorDetails = data.error || {};
            resultDiv.innerHTML = `
                <div class="w-8 h-8 glass-card-red rounded-full flex items-center justify-center flex-shrink-0">
                    <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                    </svg>
                </div>
                <div class="glass-card rounded-lg p-3 max-w-[80%]">
                    <p class="text-sm opacity-90 font-semibold text-red-600">❌ API Test Failed</p>
                    <p class="text-sm opacity-90 mt-1">Status: ${response.status}</p>
                    <p class="text-xs opacity-70 mt-2">Error: ${errorDetails.message || JSON.stringify(errorDetails)}</p>
                    <p class="text-xs opacity-70 mt-1">Code: ${errorDetails.code || 'N/A'}</p>
                </div>
            `;
            console.error('❌ API Error:', data);
            return { 
                success: false, 
                error: errorDetails,
                status: response.status 
            };
        }
    } catch (error) {
        console.error('❌ Network/Request Error:', error);
        const resultDiv = document.getElementById('apiTestResult');
        resultDiv.innerHTML = `
            <div class="w-8 h-8 glass-card-red rounded-full flex items-center justify-center flex-shrink-0">
                <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
                </svg>
            </div>
            <div class="glass-card rounded-lg p-3 max-w-[80%]">
                <p class="text-sm opacity-90 font-semibold text-red-600">❌ Network Error</p>
                <p class="text-sm opacity-90 mt-1">${error.message}</p>
                <p class="text-xs opacity-70 mt-2">Check console (F12) for more details</p>
            </div>
        `;
        return { 
            success: false, 
            error: error.message,
            type: 'Network Error'
        };
    } finally {
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }
}

// Make test function available globally
window.testGeminiAPI = testGeminiAPI;

