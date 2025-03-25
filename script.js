document.addEventListener("DOMContentLoaded", () => {
    // عناصر DOM الجديدة لشاشة البداية
    const startScreen = document.getElementById("start-screen");
    const gameWrapper = document.querySelector(".game-wrapper");
    const startGameBtn = document.getElementById("start-game-btn");
    const howToPlayBtn = document.getElementById("how-to-play-btn");
    const settingsBtn = document.getElementById("settings-btn");
    const instructions = document.getElementById("instructions");
    const startSettings = document.getElementById("start-settings");
    const backBtn = document.getElementById("back-btn");
    const backSettingsBtn = document.getElementById("back-settings-btn");
    const saveStartSettingsBtn = document.getElementById("save-start-settings");
    const startDifficultySelect = document.getElementById("start-difficulty");
    const startPlayerColorInput = document.getElementById("start-player-color");

    // عناصر DOM الأصلية
    const gameContainer = document.getElementById("game-container");
    const player = document.getElementById("player");
    const scoreDisplay = document.getElementById("score");
    const highScoreDisplay = document.getElementById("high-score");
    const timerDisplay = document.getElementById("timer");
    const levelDisplay = document.getElementById("level");
    const livesDisplay = document.getElementById("lives");
    const streakDisplay = document.getElementById("streak");
    const startBtn = document.getElementById("start-btn");
    const pauseBtn = document.getElementById("pause-btn");
    const restartBtn = document.getElementById("restart-btn");
    const soundBtn = document.getElementById("sound-btn");
    const shopBtn = document.getElementById("shop-btn");
    const closeShopBtn = document.getElementById("close-shop");
    const saveSettingsBtn = document.getElementById("save-settings");
    const shopMenu = document.getElementById("shop-menu");
    const settingsMenu = document.getElementById("settings-menu");
    const progressBar = document.getElementById("progress-bar");
    const progressLabel = document.getElementById("progress-label");
    const comboDisplay = document.getElementById("combo-display");
    const playerColorInput = document.getElementById("player-color");
    const difficultySelect = document.getElementById("difficulty");

    // الأصوات
    const sounds = {
        treasure: document.getElementById("treasure-sound"),
        bomb: document.getElementById("bomb-sound"),
        special: document.getElementById("special-sound"),
        life: document.getElementById("life-sound"),
        levelup: document.getElementById("levelup-sound"),
        combo: document.getElementById("combo-sound"),
        background: document.getElementById("background-music")
    };

    // متغيرات اللعبة
    let gameState = {
        score: 0,
        highScore: localStorage.getItem('highScore') || 0,
        timeLeft: 60,
        level: 1,
        lives: 3,
        streak: 0,
        running: false,
        paused: false,
        soundOn: true,
        missedTreasures: 0,
        fallingSpeed: 3,
        challengeCount: 0,
        lastItemTime: 0,
        playerSkin: 'default',
        difficulty: 'easy',
        achievements: {
            'first-game': false,
            'treasure-hunter': false,
            'bomb-dodger': false,
            'combo-master': false
        },
        items: [],
        animationFrameId: null,
        gameInterval: null,
        comboTimeout: null,
        isDragging: false,
        dragStartX: 0,
        playerStartX: 0
    };

    const settings = {
        easy: { treasureRate: 0.8, bombRate: 0.2, speed: 3, lives: 3 },
        medium: { treasureRate: 0.7, bombRate: 0.3, speed: 5, lives: 2 },
        hard: { treasureRate: 0.6, bombRate: 0.4, speed: 7, lives: 1 }
    };

    // تهيئة اللعبة
    function initGame() {
        const savedSettings = localStorage.getItem('gameSettings');
        if (savedSettings) {
            const settings = JSON.parse(savedSettings);
            gameState.difficulty = settings.difficulty || 'easy';
            gameState.playerSkin = settings.playerSkin || 'default';
            gameState.soundOn = settings.soundOn !== false;
            difficultySelect.value = gameState.difficulty;
            playerColorInput.value = settings.playerColor || '#4facfe';
            startDifficultySelect.value = gameState.difficulty;
            startPlayerColorInput.value = settings.playerColor || '#4facfe';
            updatePlayerAppearance();
        }
        
        highScoreDisplay.textContent = `✨ أعلى نتيجة: ${gameState.highScore}`;
        updateUI();
        setupEventListeners();
    }

    function setupEventListeners() {
        // أحداث شاشة البداية
        startGameBtn.addEventListener("click", () => {
            startScreen.style.display = "none";
            gameWrapper.style.display = "block";
        });
        
        howToPlayBtn.addEventListener("click", () => {
            instructions.style.display = "block";
            startSettings.style.display = "none";
        });
        
        settingsBtn.addEventListener("click", () => {
            startSettings.style.display = "block";
            instructions.style.display = "none";
        });
        
        backBtn.addEventListener("click", () => {
            instructions.style.display = "none";
        });
        
        backSettingsBtn.addEventListener("click", () => {
            startSettings.style.display = "none";
        });
        
        saveStartSettingsBtn.addEventListener("click", () => {
            gameState.difficulty = startDifficultySelect.value;
            playerColorInput.value = startPlayerColorInput.value;
            startSettings.style.display = "none";
            saveSettings();
        });

        // أحداث الأزرار الأصلية
        startBtn.addEventListener("click", startGame);
        pauseBtn.addEventListener("click", togglePause);
        restartBtn.addEventListener("click", startGame);
        soundBtn.addEventListener("click", toggleSound);
        shopBtn.addEventListener("click", toggleShop);
        closeShopBtn.addEventListener("click", toggleShop);
        saveSettingsBtn.addEventListener("click", saveSettings);

        // أحداث المتجر
        document.querySelectorAll('.shop-item').forEach(item => {
            item.addEventListener('click', () => {
                const itemType = item.dataset.item;
                const itemCost = parseInt(item.dataset.cost);
                buyItem(itemType, itemCost);
            });
        });

        // أحداث الماوس واللمس
        player.addEventListener("mousedown", startDrag);
        player.addEventListener("touchstart", startDrag);
        
        document.addEventListener("mousemove", duringDrag);
        document.addEventListener("touchmove", duringDrag);
        
        document.addEventListener("mouseup", endDrag);
        document.addEventListener("touchend", endDrag);
        
        gameContainer.addEventListener("click", moveToPosition);
        gameContainer.addEventListener("touchstart", (e) => {
            if (e.target === gameContainer) {
                moveToPosition(e);
            }
        });

        // أحداث لوحة المفاتيح
        document.addEventListener("keydown", handleKeyDown);
    }

    function handleKeyDown(e) {
        if (!gameState.running || gameState.paused) return;
        
        const moveAmount = 20;
        const currentLeft = parseInt(player.style.left) || (gameContainer.clientWidth / 2 - player.clientWidth / 2);
        const maxX = gameContainer.clientWidth - player.clientWidth;
        
        if (e.key === "ArrowLeft" || e.key === "Left") {
            player.style.left = Math.max(0, currentLeft - moveAmount) + "px";
        } else if (e.key === "ArrowRight" || e.key === "Right") {
            player.style.left = Math.min(maxX, currentLeft + moveAmount) + "px";
        } else if (e.key === "p" || e.key === "P") {
            togglePause();
        }
    }

    function updateUI() {
        scoreDisplay.textContent = `🌟 النقاط: ${gameState.score}`;
        highScoreDisplay.textContent = `✨ أعلى نتيجة: ${gameState.highScore}`;
        timerDisplay.textContent = `⏱ الوقت: ${gameState.timeLeft}`;
        levelDisplay.textContent = `📊 المستوى: ${gameState.level}`;
        livesDisplay.textContent = `❤️ الأرواح: ${gameState.lives}`;
        streakDisplay.textContent = `🔥 تسلسل: ${gameState.streak}`;
        
        const progress = (gameState.score % 100) / 100 * 100;
        progressBar.style.width = `${progress}%`;
        progressLabel.textContent = `التقدم نحو المستوى التالي: ${Math.round(progress)}%`;
        
        soundBtn.textContent = gameState.soundOn ? "🔊 الصوت" : "🔇 كتم";
    }

    function updatePlayerAppearance() {
        player.className = '';
        if (gameState.playerSkin === 'skin1') {
            player.classList.add('player-skin1');
        }
        
        const color = playerColorInput.value;
        player.style.background = `linear-gradient(to right, ${color}, ${lightenColor(color, 20)})`;
        player.style.boxShadow = `0 0 10px ${color}80`;
    }

    function lightenColor(color, percent) {
        const num = parseInt(color.replace("#", ""), 16);
        const amt = Math.round(2.55 * percent);
        const R = (num >> 16) + amt;
        const G = (num >> 8 & 0x00FF) + amt;
        const B = (num & 0x0000FF) + amt;
        
        return `#${(
            0x1000000 +
            (R < 255 ? (R < 1 ? 0 : R) : 255) * 0x10000 +
            (G < 255 ? (G < 1 ? 0 : G) : 255) * 0x100 +
            (B < 255 ? (B < 1 ? 0 : B) : 255)
        ).toString(16).slice(1)}`;
    }

    function startGame() {
        if (gameState.running) return;
        
        // تنظيف اللعبة السابقة
        clearAllItems();
        cancelAnimationFrame(gameState.animationFrameId);
        clearInterval(gameState.gameInterval);
        
        // تهيئة حالة اللعبة الجديدة
        gameState = {
            ...gameState,
            score: 0,
            level: 1,
            lives: settings[gameState.difficulty].lives,
            streak: 0,
            running: true,
            paused: false,
            missedTreasures: 0,
            timeLeft: 60,
            fallingSpeed: settings[gameState.difficulty].speed,
            challengeCount: 0,
            lastItemTime: 0,
            items: []
        };
        
        updateUI();
        pauseBtn.textContent = "⏸ إيقاف مؤقت";
        restartBtn.style.display = "none";
        
        player.style.left = "50%";
        if (gameState.soundOn) sounds.background.play();
        
        // بدء دورة اللعبة
        gameState.gameInterval = setInterval(gameLoop, 1000);
        gameState.animationFrameId = requestAnimationFrame(updateGame);
        
        unlockAchievement('first-game');
    }

    function clearAllItems() {
        gameState.items.forEach(item => {
            if (item.element && item.element.parentNode) {
                gameContainer.removeChild(item.element);
            }
        });
        gameState.items = [];
    }

    function gameLoop() {
        if (!gameState.running || gameState.paused) return;
        
        gameState.timeLeft--;
        timerDisplay.textContent = `⏱ الوقت: ${gameState.timeLeft}`;
        
        if (gameState.timeLeft <= 0) {
            endGame("🎉 انتهى الوقت! لقد فزت!");
            return;
        }
        
        const now = Date.now();
        if (now - gameState.lastItemTime > 500) {
            gameState.lastItemTime = now;
            const rand = Math.random();
            let itemType;
            
            if (rand < 0.7) itemType = "treasure";
            else if (rand < 0.85) itemType = "bomb";
            else if (rand < 0.95) itemType = "special-treasure";
            else itemType = "life-item";
            
            spawnItem(itemType);
        }
        
        if (gameState.timeLeft % 10 === 0) {
            gameState.fallingSpeed += 0.2;
        }
    }

    function updateGame() {
        if (!gameState.running || gameState.paused) {
            gameState.animationFrameId = requestAnimationFrame(updateGame);
            return;
        }
        
        // تحديث مواقع الكرات
        gameState.items = gameState.items.filter(item => {
            if (!item.element.parentNode) return false;
            
            item.y += gameState.fallingSpeed;
            item.element.style.transform = `translateY(${item.y}px)`;
            
            // اكتشاف التصادم مع اللاعب
            if (checkCollision(item)) {
                handleItemCollection(item.type);
                gameContainer.removeChild(item.element);
                return false;
            }
            
            // إزالة الكرات التي تجاوزت الحدود
            if (item.y > gameContainer.clientHeight) {
                if (item.type === "treasure") {
                    gameState.missedTreasures++;
                    if (gameState.missedTreasures >= 3) {
                        endGame("💔 لقد خسرت! فاتتك 3 كنوز.");
                    }
                }
                gameContainer.removeChild(item.element);
                return false;
            }
            
            return true;
        });
        
        gameState.animationFrameId = requestAnimationFrame(updateGame);
    }

    function spawnItem(type) {
        if (!gameState.running || gameState.paused) return;
        
        const element = document.createElement("div");
        element.className = type.includes("treasure") ? "treasure" : "bomb";
        if (type !== "treasure" && type !== "bomb") {
            element.classList.add(type);
        }
        
        element.style.left = Math.random() * (gameContainer.clientWidth - 40) + "px";
        element.style.top = "0px";
        gameContainer.appendChild(element);
        
        gameState.items.push({
            element,
            type,
            x: parseInt(element.style.left),
            y: 0,
            width: 30,
            height: 30
        });
    }

    function checkCollision(item) {
        const playerRect = player.getBoundingClientRect();
        const itemRect = item.element.getBoundingClientRect();
        
        return playerRect.left < itemRect.right &&
               playerRect.right > itemRect.left &&
               playerRect.top < itemRect.bottom &&
               playerRect.bottom > itemRect.top;
    }

    function handleItemCollection(type) {
        switch(type) {
            case "treasure":
                updateScore(10);
                gameState.streak++;
                updateStreak();
                gameState.challengeCount++;
                updateChallengeProgress();
                playSound('treasure');
                break;
                
            case "special-treasure":
                updateScore(30);
                gameState.streak += 3;
                updateStreak();
                playSound('special');
                break;
                
            case "life-item":
                gameState.lives = Math.min(3, gameState.lives + 1);
                updateUI();
                playSound('life');
                break;
                
            case "bomb":
                gameState.lives--;
                gameState.streak = 0;
                updateStreak();
                updateUI();
                playSound('bomb');
                
                if (gameState.lives <= 0) {
                    endGame("💥 لقد انفجرت! حاول مرة أخرى.");
                } else {
                    showCombo("💣 خسرت حياة!", "#ff3333");
                }
                break;
        }
        
        updateLevel();
    }

    function playSound(type) {
        if (gameState.soundOn && sounds[type]) {
            sounds[type].currentTime = 0;
            sounds[type].play();
        }
    }

    function updateScore(points) {
        gameState.score += points;
        if (gameState.score > gameState.highScore) {
            gameState.highScore = gameState.score;
            localStorage.setItem('highScore', gameState.highScore);
        }
        updateUI();
        
        if (gameState.score >= 100 && !gameState.achievements['treasure-hunter']) {
            unlockAchievement('treasure-hunter');
        }
    }

    function updateLevel() {
        const newLevel = Math.floor(gameState.score / 100) + 1;
        if (newLevel > gameState.level) {
            gameState.level = newLevel;
            playSound('levelup');
            showCombo(`🎊 المستوى ${gameState.level}!`, "#4facfe");
        }
        updateUI();
    }

    function updateStreak() {
        if (gameState.streak > 0) {
            streakDisplay.textContent = `🔥 تسلسل: ${gameState.streak}`;
            
            if (gameState.streak >= 10 && !gameState.achievements['combo-master']) {
                unlockAchievement('combo-master');
            }
            
            if (gameState.streak % 5 === 0) {
                showCombo(`🔥 تسلسل ${gameState.streak}!`, "#ff9900");
                playSound('combo');
            }
        } else {
            streakDisplay.textContent = `🔥 تسلسل: 0`;
        }
    }

    function showCombo(message, color) {
        comboDisplay.textContent = message;
        comboDisplay.style.color = color;
        comboDisplay.style.display = "block";
        comboDisplay.style.opacity = "1";
        comboDisplay.style.transform = "translate(-50%, -60%)";
        
        clearTimeout(gameState.comboTimeout);
        gameState.comboTimeout = setTimeout(() => {
            comboDisplay.style.opacity = "0";
            comboDisplay.style.transform = "translate(-50%, -50%)";
            setTimeout(() => {
                comboDisplay.style.display = "none";
            }, 300);
        }, 1500);
    }

    function updateChallengeProgress() {
        const progress = (gameState.challengeCount / 20) * 100;
        document.querySelector('.progress-fill').style.width = `${progress}%`;
        document.querySelector('.progress-text').textContent = `${gameState.challengeCount}/20`;
        
        if (gameState.challengeCount >= 20) {
            updateScore(50);
            gameState.challengeCount = 0;
            showCombo("🎯 أكملت التحدي!", "gold");
        }
    }

    function unlockAchievement(id) {
        if (gameState.achievements[id]) return;
        
        gameState.achievements[id] = true;
        const achievement = document.querySelector(`.achievement[data-id="${id}"]`);
        if (achievement) {
            achievement.dataset.unlocked = "true";
            achievement.querySelector('.achievement-icon').textContent = "🏆";
            
            playSound('special');
            showCombo(`🏆 فتحت إنجاز: ${achievement.querySelector('.achievement-title').textContent}`, "gold");
        }
    }

    function togglePause() {
        if (!gameState.running) return;
        
        gameState.paused = !gameState.paused;
        pauseBtn.textContent = gameState.paused ? "▶ استئناف" : "⏸ إيقاف مؤقت";
        
        if (gameState.paused) {
            sounds.background.pause();
        } else if (gameState.soundOn) {
            sounds.background.play();
        }
    }

    function toggleSound() {
        gameState.soundOn = !gameState.soundOn;
        updateUI();
        
        if (gameState.soundOn && gameState.running && !gameState.paused) {
            sounds.background.play();
        } else {
            sounds.background.pause();
        }
    }

    function toggleShop() {
        shopMenu.style.display = shopMenu.style.display === "none" ? "block" : "none";
        settingsMenu.style.display = "none";
    }

    function buyItem(item, cost) {
        if (gameState.score >= cost) {
            gameState.score -= cost;
            updateScore(0);
            
            if (item === 'player-skin1') {
                gameState.playerSkin = 'skin1';
                updatePlayerAppearance();
                showCombo("🛍 تم شراء المظهر!", "#ff9966");
            } else if (item === 'extra-life') {
                gameState.lives = Math.min(3, gameState.lives + 1);
                updateUI();
                showCombo("❤️ حياة إضافية!", "#00ff00");
            }
        } else {
            alert("لا تملك نقاطًا كافية!");
        }
    }

    function saveSettings() {
        gameState.difficulty = difficultySelect.value;
        gameState.lives = settings[gameState.difficulty].lives;
        gameState.fallingSpeed = settings[gameState.difficulty].speed;
        updatePlayerAppearance();
        updateUI();
        settingsMenu.style.display = "none";
        
        localStorage.setItem('gameSettings', JSON.stringify({
            difficulty: gameState.difficulty,
            playerSkin: gameState.playerSkin,
            soundOn: gameState.soundOn,
            playerColor: playerColorInput.value
        }));
    }

    function startDrag(e) {
        if (!gameState.running || gameState.paused) return;
        
        gameState.isDragging = true;
        gameState.dragStartX = e.clientX || e.touches[0].clientX;
        gameState.playerStartX = player.offsetLeft;
        e.preventDefault();
    }

    function duringDrag(e) {
        if (!gameState.isDragging) return;
        
        const clientX = e.clientX || e.touches[0].clientX;
        const deltaX = clientX - gameState.dragStartX;
        let newX = gameState.playerStartX + deltaX;
        
        const maxX = gameContainer.clientWidth - player.clientWidth;
        newX = Math.max(0, Math.min(newX, maxX));
        
        player.style.left = newX + "px";
    }

    function endDrag() {
        gameState.isDragging = false;
    }

    function moveToPosition(e) {
        if (!gameState.running || gameState.paused || gameState.isDragging) return;
        
        const clientX = e.clientX || e.touches[0].clientX;
        const gameRect = gameContainer.getBoundingClientRect();
        const relativeX = clientX - gameRect.left;
        const maxX = gameContainer.clientWidth - player.clientWidth;
        
        let newX = relativeX - (player.clientWidth / 2);
        newX = Math.max(0, Math.min(newX, maxX));
        
        player.style.left = newX + "px";
    }

    function endGame(message) {
        gameState.running = false;
        clearInterval(gameState.gameInterval);
        cancelAnimationFrame(gameState.animationFrameId);
        clearAllItems();
        sounds.background.pause();
        
        localStorage.setItem('gameSettings', JSON.stringify({
            difficulty: gameState.difficulty,
            playerSkin: gameState.playerSkin,
            soundOn: gameState.soundOn,
            playerColor: playerColorInput.value
        }));
        
        alert(message);
        restartBtn.style.display = "inline-block";
    }

    // بدء اللعبة
    initGame();
});