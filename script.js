// تسجيل Service Worker
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('sw.js')
            .then(registration => console.log('Service Worker مسجل'))
            .catch(error => console.log('فشل تسجيل Service Worker:', error));
    });
}

// البيانات الأساسية
const app = {
    counter: 0,
    goal: 0,
    history: [],
    dailyData: {},
    currentDhikr: 'subhan-allah',
    soundEnabled: true,
    vibrationEnabled: true,
    notificationEnabled: true,
    theme: 'auto',
    fontSize: 'medium',
    ratings: []
};

// قاموس الأذكار
const dhikrList = {
    'subhan-allah': {
        text: 'سبحان الله',
        meaning: 'تنزيه الله عن كل نقص',
        count: 33,
        reference: 'رواه مسلم'
    },
    'alhamdulillah': {
        text: 'الحمد لله',
        meaning: 'الحمد والشكر لله على نعمه',
        count: 33,
        reference: 'رواه مسلم'
    },
    'allahu-akbar': {
        text: 'الله أكبر',
        meaning: 'تعظيم الله تعالى',
        count: 34,
        reference: 'رواه مسلم'
    },
    'la-ilaha': {
        text: 'لا إله إلا الله',
        meaning: 'التوحيد الخالص',
        count: 100,
        reference: 'من لا يشرك بربه أحدا'
    },
    'astagh-fir': {
        text: 'أستغفر الله',
        meaning: 'طلب المغفرة من الله',
        count: 70,
        reference: 'سيد الاستغفار'
    },
    'allahumma-salli': {
        text: 'اللهم صل على محمد',
        meaning: 'الصلاة والسلام على النبي',
        count: 100,
        reference: 'من أكثر الصلاة علي'
    },
    'la-hawla': {
        text: 'لا حول ولا قوة إلا بالله',
        meaning: 'الاستعانة بالله والتوكل عليه',
        count: 100,
        reference: 'كنز تحت العرش'
    },
    'subhan-allahi-wabihamdihi': {
        text: 'سبحان الله وبحمده',
        meaning: 'تسبيح وحمد مجموع',
        count: 100,
        reference: 'أحب الكلام إلى الله'
    }
};

// تحميل البيانات من LocalStorage
function loadData() {
    const saved = localStorage.getItem('masbahaData');
    if (saved) {
        const data = JSON.parse(saved);
        Object.assign(app, data);
    }
    loadTodayData();
}

// حفظ البيانات
function saveData() {
    localStorage.setItem('masbahaData', JSON.stringify(app));
}

// تحميل بيانات اليوم
function loadTodayData() {
    const today = new Date().toISOString().split('T')[0];
    if (!app.dailyData[today]) {
        app.dailyData[today] = {
            count: 0,
            dhikrs: {}
        };
    }
}

// تحديث العداد
function incrementCounter() {
    app.counter++;
    const today = new Date().toISOString().split('T')[0];
    app.dailyData[today].count++;
    
    if (!app.dailyData[today].dhikrs[app.currentDhikr]) {
        app.dailyData[today].dhikrs[app.currentDhikr] = 0;
    }
    app.dailyData[today].dhikrs[app.currentDhikr]++;
    
    app.history.push(app.counter);
    saveData();
    updateDisplay();
    playSound();
    vibrate();
    checkGoal();
}

// تحديث العرض
function updateDisplay() {
    document.getElementById('counter-value').textContent = app.counter;
    updateGoalProgress();
}

// تحديث شريط التقدم
function updateGoalProgress() {
    if (app.goal > 0) {
        const percentage = (app.counter / app.goal) * 100;
        const progressFill = document.getElementById('progress-fill');
        const goalText = document.getElementById('goal-text');
        
        if (progressFill) {
            progressFill.style.width = Math.min(percentage, 100) + '%';
        }
        
        if (goalText) {
            const remaining = Math.max(0, app.goal - app.counter);
            if (remaining === 0) {
                goalText.textContent = '✅ تم تحقيق الهدف!';
                goalText.style.color = '#27ae60';
            } else {
                goalText.textContent = `${remaining} متبقي من ${app.goal}`;
            }
        }
    }
}

// تشغيل صوت
function playSound() {
    if (!app.soundEnabled) return;
    
    try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.value = 800;
        oscillator.type = 'sine';
        
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.1);
    } catch (e) {
        console.log('لا يمكن تشغيل الصوت');
    }
}

// اهتزاز
function vibrate() {
    if (!app.vibrationEnabled) return;
    if (navigator.vibrate) {
        navigator.vibrate(50);
    }
}

// فحص الهدف
function checkGoal() {
    if (app.goal > 0 && app.counter === app.goal && app.notificationEnabled) {
        showNotification('تم تحقيق الهدف! 🎉', 'لقد وصلت إلى هدفك المحدد');
    }
}

// إظهار الإشعار
function showNotification(title, message) {
    if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(title, {
            body: message,
            icon: '🌙'
        });
    }
}

// إعادة تعيين العداد
function resetCounter() {
    if (confirm('هل أنت متأكد من إعادة تعيين العداد؟')) {
        app.counter = 0;
        app.history = [];
        saveData();
        updateDisplay();
    }
}

// التراجع
function undoCounter() {
    if (app.history.length > 0) {
        app.history.pop();
        const today = new Date().toISOString().split('T')[0];
        app.dailyData[today].count--;
        if (app.dailyData[today].dhikrs[app.currentDhikr] > 0) {
            app.dailyData[today].dhikrs[app.currentDhikr]--;
        }
        app.counter--;
        saveData();
        updateDisplay();
    }
}

// تعيين الهدف
function setGoal() {
    const goalInput = document.getElementById('goal-input');
    const goalValue = parseInt(goalInput.value);
    
    if (isNaN(goalValue) || goalValue <= 0) {
        alert('الرجاء إدخال رقم صحيح');
        return;
    }
    
    app.goal = goalValue;
    saveData();
    updateGoalProgress();
    alert('تم تعيين الهدف: ' + goalValue);
}

// تحديث قائمة الأذكار
function updateDhikrList() {
    const dhikrListDiv = document.getElementById('dhikr-list');
    if (!dhikrListDiv) return;
    
    dhikrListDiv.innerHTML = '';
    
    for (const [key, dhikr] of Object.entries(dhikrList)) {
        const dhikrItem = document.createElement('div');
        dhikrItem.className = 'dhikr-item';
        dhikrItem.innerHTML = `
            <h3>${dhikr.text}</h3>
            <p><strong>المعنى:</strong> ${dhikr.meaning}</p>
            <p><strong>العدد المستحب:</strong> ${dhikr.count}</p>
            <div class="reference">${dhikr.reference}</div>
        `;
        dhikrItem.onclick = () => {
            app.currentDhikr = key;
            document.getElementById('dhikr-select').value = key;
            const customInput = document.getElementById('custom-dhikr');
            if (customInput) customInput.style.display = 'none';
            saveData();
        };
        dhikrListDiv.appendChild(dhikrItem);
    }
}

// معالج تغيير الذكر
function handleDhikrChange() {
    const select = document.getElementById('dhikr-select');
    const customInput = document.getElementById('custom-dhikr');
    
    if (select.value === 'custom') {
        customInput.style.display = 'block';
        customInput.focus();
    } else {
        customInput.style.display = 'none';
        app.currentDhikr = select.value;
        saveData();
    }
}

// تحديث الإحصائيات
function updateStats() {
    const today = new Date().toISOString().split('T')[0];
    const todayCount = app.dailyData[today]?.count || 0;
    const totalCount = Object.values(app.dailyData).reduce((sum, day) => sum + (day.count || 0), 0);
    
    const bestDay = Math.max(...Object.values(app.dailyData).map(d => d.count || 0), 0);
    
    const todayStats = document.getElementById('today-stats');
    const totalStats = document.getElementById('total-stats');
    const bestDayStats = document.getElementById('best-day-stats');
    
    if (todayStats) todayStats.textContent = todayCount;
    if (totalStats) totalStats.textContent = totalCount;
    if (bestDayStats) bestDayStats.textContent = bestDay;
}

// معالجة التبويبات
function setupTabs() {
    const navButtons = document.querySelectorAll('.nav-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    
    navButtons.forEach(button => {
        button.addEventListener('click', () => {
            const tabName = button.getAttribute('data-tab');
            
            navButtons.forEach(btn => btn.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));
            
            button.classList.add('active');
            document.getElementById(tabName).classList.add('active');
            
            if (tabName === 'dhikr') {
                updateDhikrList();
            }
        });
    });
}

// إعدادات المظهر
function setupTheme() {
    const themeSelect = document.getElementById('theme-select');
    const fontSizeSelect = document.getElementById('font-size-select');
    
    if (themeSelect) {
        themeSelect.value = app.theme;
        themeSelect.addEventListener('change', () => {
            app.theme = themeSelect.value;
            applyTheme();
            saveData();
        });
    }
    
    if (fontSizeSelect) {
        fontSizeSelect.value = app.fontSize;
        fontSizeSelect.addEventListener('change', () => {
            app.fontSize = fontSizeSelect.value;
            applyFontSize();
            saveData();
        });
    }
    
    applyTheme();
    applyFontSize();
}

function applyTheme() {
    const body = document.body;
    body.classList.remove('light-mode', 'dark-mode');
    
    if (app.theme === 'auto') {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        body.classList.add(prefersDark ? 'dark-mode' : 'light-mode');
    } else {
        body.classList.add(app.theme + '-mode');
    }
}

function applyFontSize() {
    const body = document.body;
    body.classList.remove('font-small', 'font-medium', 'font-large', 'font-xlarge');
    body.classList.add('font-' + app.fontSize);
}

// إعدادات الصوت والاهتزاز
function setupSettings() {
    const soundToggle = document.getElementById('sound-toggle');
    const vibrationToggle = document.getElementById('vibration-toggle');
    const notificationToggle = document.getElementById('notification-toggle');
    
    if (soundToggle) {
        soundToggle.checked = app.soundEnabled;
        soundToggle.addEventListener('change', () => {
            app.soundEnabled = soundToggle.checked;
            saveData();
        });
    }
    
    if (vibrationToggle) {
        vibrationToggle.checked = app.vibrationEnabled;
        vibrationToggle.addEventListener('change', () => {
            app.vibrationEnabled = vibrationToggle.checked;
            saveData();
        });
    }
    
    if (notificationToggle) {
        notificationToggle.checked = app.notificationEnabled;
        notificationToggle.addEventListener('change', () => {
            app.notificationEnabled = notificationToggle.checked;
            saveData();
        });
    }
}

// تصدير البيانات
function exportData() {
    const dataStr = JSON.stringify(app, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `masbaha-backup-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
}

// استيراد البيانات
function importData() {
    const fileInput = document.getElementById('import-file');
    fileInput.click();
    
    fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const imported = JSON.parse(event.target.result);
                Object.assign(app, imported);
                saveData();
                location.reload();
                alert('تم استيراد البيانات بنجاح!');
            } catch (error) {
                alert('خطأ في الملف');
            }
        };
        reader.readAsText(file);
    });
}

// إعادة تعيين الكل
function resetAll() {
    if (confirm('هل أنت متأكد؟ سيتم حذف جميع البيانات!')) {
        localStorage.clear();
        location.reload();
    }
}

// الأزرار السريعة
function setupQuickButtons() {
    const quickButtons = document.querySelectorAll('.quick-btn');
    quickButtons.forEach(button => {
        button.addEventListener('click', () => {
            const increment = parseInt(button.getAttribute('data-increment'));
            for (let i = 0; i < increment; i++) {
                incrementCounter();
            }
        });
    });
}

// مفاتيح لوحة المفاتيح
function setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
        if (e.code === 'Space' || e.code === 'Enter') {
            e.preventDefault();
            incrementCounter();
        }
    });
}

// ========================= وظائف التقييم =========================

let currentRating = 0;

function openRating() {
    const popup = document.getElementById('ratingPopup');
    popup.classList.add('show');
    currentRating = 0;
    resetRatingUI();
}

function closeRating() {
    const popup = document.getElementById('ratingPopup');
    popup.classList.remove('show');
    currentRating = 0;
    resetRatingUI();
}

function resetRatingUI() {
    const stars = document.querySelectorAll('.star');
    const labels = document.querySelectorAll('.label');
    const message = document.getElementById('ratingMessage');
    const feedbackText = document.getElementById('feedback-text');
    const submitBtn = document.getElementById('submitRatingBtn');
    
    stars.forEach(star => star.classList.remove('active'));
    labels.forEach(label => label.classList.remove('active'));
    
    message.textContent = 'اختر عدد النجوم';
    message.classList.remove('rated');
    feedbackText.style.display = 'none';
    submitBtn.style.display = 'none';
}

function setupRating() {
    const stars = document.querySelectorAll('.star');
    const labels = document.querySelectorAll('.label');
    const message = document.getElementById('ratingMessage');
    const feedbackText = document.getElementById('feedback-text');
    const submitBtn = document.getElementById('submitRatingBtn');
    
    stars.forEach(star => {
        star.addEventListener('click', () => {
            currentRating = parseInt(star.getAttribute('data-value'));
            
            // تحديث النجوم
            stars.forEach(s => s.classList.remove('active'));
            for (let i = 0; i < currentRating; i++) {
                stars[i].classList.add('active');
            }
            
            // تحديث التسميات
            labels.forEach(l => l.classList.remove('active'));
            labels[currentRating - 1].classList.add('active');
            
            // تحديث الرسالة
            const messages = [
                'نعتذر لعدم إعجابك بالموقع',
                'نسعى لتحسين الخدمة',
                'شكراً على التقييم',
                'شكراً على تقييمك الممتاز',
                'شكراً! نسعى للأفضل دائماً'
            ];
            
            message.textContent = 'تقييمك: ' + currentRating + '/5 - ' + messages[currentRating - 1];
            message.classList.add('rated');
            
            // إظهار حقل التعليق والزر
            feedbackText.style.display = 'block';
            submitBtn.style.display = 'block';
            
            // تشغيل صوت
            if (app.soundEnabled) {
                try {
                    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
                    const osc = audioContext.createOscillator();
                    const gain = audioContext.createGain();
                    osc.connect(gain);
                    gain.connect(audioContext.destination);
                    osc.frequency.value = 600 + (currentRating * 100);
                    gain.gain.setValueAtTime(0.2, audioContext.currentTime);
                    gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
                    osc.start(audioContext.currentTime);
                    osc.stop(audioContext.currentTime + 0.2);
                } catch (e) {}
            }
        });
        
        // تأثير Hover
        star.addEventListener('mouseenter', () => {
            const value = parseInt(star.getAttribute('data-value'));
            stars.forEach(s => {
                if (parseInt(s.getAttribute('data-value')) <= value) {
                    s.style.color = '#f1c40f';
                } else {
                    s.style.color = '#555';
                }
            });
        });
    });
    
    document.addEventListener('mouseleave', () => {
        if (currentRating === 0) {
            stars.forEach(s => s.style.color = '#555');
        } else {
            stars.forEach((s, index) => {
                if (index < currentRating) {
                    s.style.color = '#f1c40f';
                } else {
                    s.style.color = '#555';
                }
            });
        }
    });
}

function submitRating() {
    if (currentRating === 0) {
        alert('الرجاء اختيار عدد النجوم');
        return;
    }
    
    const feedbackText = document.getElementById('feedback-text').value;
    const rating = {
        stars: currentRating,
        feedback: feedbackText,
        date: new Date().toISOString()
    };
    
    app.ratings.push(rating);
    saveData();
    
    closeRating();
    showThankYouMessage();
}

function showThankYouMessage() {
    const message = document.getElementById('thankYouMessage');
    const text = document.getElementById('thankYouText');
    
    const messages = [
        'شكراً لتقييمك! 🙏',
        'نقدر آراءك وملاحظاتك',
        'سعيد بتقييمك لنا',
        'شكراً على الثقة بنا',
        'شكراً لدعمك لنا 💪'
    ];
    
    text.textContent = messages[Math.floor(Math.random() * messages.length)];
    message.classList.add('show');
    
    setTimeout(() => {
        message.classList.remove('show');
    }, 4000);
}

// التهيئة الرئيسية
document.addEventListener('DOMContentLoaded', () => {
    loadData();
    setupTabs();
    setupTheme();
    setupSettings();
    setupQuickButtons();
    setupKeyboardShortcuts();
    setupRating();
    updateDisplay();
    updateDhikrList();
    updateStats();
    
    // ربط الأزرار
    const addBtn = document.getElementById('add-btn');
    const resetBtn = document.getElementById('reset-btn');
    const undoBtn = document.getElementById('undo-btn');
    const setGoalBtn = document.getElementById('set-goal-btn');
    const dhikrSelect = document.getElementById('dhikr-select');
    const exportBtn = document.getElementById('export-btn');
    const importBtn = document.getElementById('import-btn');
    const resetAllBtn = document.getElementById('reset-all-btn');
    
    if (addBtn) addBtn.addEventListener('click', incrementCounter);
    if (resetBtn) resetBtn.addEventListener('click', resetCounter);
    if (undoBtn) undoBtn.addEventListener('click', undoCounter);
    if (setGoalBtn) setGoalBtn.addEventListener('click', setGoal);
    if (dhikrSelect) dhikrSelect.addEventListener('change', handleDhikrChange);
    if (exportBtn) exportBtn.addEventListener('click', exportData);
    if (importBtn) importBtn.addEventListener('click', importData);
    if (resetAllBtn) resetAllBtn.addEventListener('click', resetAll);
    
    // طلب صلاحية الإشعارات
    if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission();
    }
});

// تحديث الإحصائيات كل ثانية
setInterval(updateStats, 1000);

// إغلاق Popup عند الضغط خارجها
document.addEventListener('click', (e) => {
    const popup = document.getElementById('ratingPopup');
    if (e.target === popup) {
        closeRating();
    }
});
