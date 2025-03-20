// Game scoring and timer system
import { initUserDataSystem } from './user_data.js';

export function initScoreSystem(document, tearDownMouseLock, mouseLockListeners, tearDownMouseControls, mouseControlsListeners, tearDownAdvancedMouseControls, advancedMouseControlsListeners, tearDownKeyboardControls, keyboardControlsListeners) {
    let score = 0;
    let gameActive = true;
    let timeLeft = 60000; // 60秒，以毫秒为单位
    let timerInterval = null;
    
    // 升级配置
    const UPGRADE_CONFIG = {
        cost: 1000,  // 每1%升级需要的奖金点数
        maxLevel: 100 // 最大升级等级
    };
    
    // 初始化用户数据系统
    const userDataSystem = initUserDataSystem();
    const currentBonusPoints = userDataSystem.getBonusPoints();
    
    // 获取所有升级进度
    const allUpgrades = userDataSystem.getAllUpgradeProgress();
    
    // 创建分数和计时器显示容器
    const gameInfoDisplay = document.createElement('div');
    gameInfoDisplay.id = 'game-info-display';
    gameInfoDisplay.style.position = 'absolute';
    gameInfoDisplay.style.top = '20px';
    gameInfoDisplay.style.left = '50%';
    gameInfoDisplay.style.transform = 'translateX(-50%)';
    gameInfoDisplay.style.color = 'white';
    gameInfoDisplay.style.fontSize = '48px';
    gameInfoDisplay.style.fontWeight = 'bold';
    gameInfoDisplay.style.textShadow = '2px 2px 4px #000000';
    gameInfoDisplay.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
    gameInfoDisplay.style.padding = '10px 20px';
    gameInfoDisplay.style.borderRadius = '10px';
    gameInfoDisplay.style.display = 'flex';
    gameInfoDisplay.style.flexDirection = 'column';
    gameInfoDisplay.style.alignItems = 'center';
    gameInfoDisplay.style.gap = '10px';
    gameInfoDisplay.style.zIndex = '1000';
    document.body.appendChild(gameInfoDisplay);
    
    // 创建计时器显示元素
    const timerDisplay = document.createElement('div');
    timerDisplay.id = 'timer-display';
    timerDisplay.innerHTML = formatTime(timeLeft);
    gameInfoDisplay.appendChild(timerDisplay);
    
    // 创建分数显示元素
    const scoreDisplay = document.createElement('div');
    scoreDisplay.id = 'score-display';
    scoreDisplay.innerHTML = `分数: ${score}`;
    gameInfoDisplay.appendChild(scoreDisplay);
    
    // 创建游戏结束界面
    const gameOverDisplay = document.createElement('div');
    gameOverDisplay.id = 'game-over';
    gameOverDisplay.style.position = 'fixed';
    gameOverDisplay.style.top = '0';
    gameOverDisplay.style.left = '0';
    gameOverDisplay.style.width = '100%';
    gameOverDisplay.style.height = '100%';
    gameOverDisplay.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
    gameOverDisplay.style.color = 'white';
    gameOverDisplay.style.fontSize = '36px';
    gameOverDisplay.style.fontWeight = 'bold';
    gameOverDisplay.style.textAlign = 'center';
    gameOverDisplay.style.display = 'flex';
    gameOverDisplay.style.flexDirection = 'column';
    gameOverDisplay.style.justifyContent = 'center';
    gameOverDisplay.style.alignItems = 'center';
    gameOverDisplay.style.zIndex = '2000';
    gameOverDisplay.style.display = 'none';
    document.body.appendChild(gameOverDisplay);
    
    // 动态生成游戏结束界面的HTML，包括升级系统
    function generateGameOverHTML() {
        // 获取最新的奖金和升级数据
        const latestBonusPoints = userDataSystem.getBonusPoints();
        const latestUpgrades = userDataSystem.getAllUpgradeProgress();
        
        return `
        <div style="background-color: rgba(50, 50, 50, 0.9); padding: 40px; border-radius: 20px; box-shadow: 0 0 20px rgba(255, 255, 255, 0.3);">
            <div style="font-size: 48px; margin-bottom: 20px;">游戏结束</div>
            <div id="final-score" style="font-size: 36px; margin-bottom: 15px;">最终分数: ${score}</div>
            <div id="bonus-points" style="font-size: 28px; margin-bottom: 30px; color: gold;">总奖金: ${latestBonusPoints}</div>
            
            <!-- 升级系统区域 -->
            <div id="upgrade-system" style="margin-bottom: 30px; width: 100%;">
                <div style="font-size: 24px; margin-bottom: 15px; color: #4CAF50;">可升级项目 (1000奖金 = 1%升级)</div>
                
                <!-- 第一行升级项 -->
                <div style="display: flex; justify-content: center; gap: 20px; margin-bottom: 20px;">
                    <!-- 军火商 -->
                    <div class="upgrade-item" style="width: 150px; background-color: rgba(30, 30, 30, 0.7); border-radius: 10px; padding: 10px; box-shadow: 0 0 10px rgba(0, 0, 0, 0.5);">
                        <div class="upgrade-icon" style="width: 150px; height: 150px; background-color: #333; border-radius: 5px; margin-bottom: 10px; display: flex; justify-content: center; align-items: center; color: #666; font-size: 16px;"><img src="assets/images/arms_dealer.png" alt="军火商" style="width: 100%; height: 100%; object-fit: cover;"></div>
                        <div class="upgrade-title" style="font-size: 18px; margin-bottom: 5px;">军火商</div>
                        <div class="upgrade-desc" style="font-size: 14px; color: #aaa; margin-bottom: 10px; height: 40px;">每增加一点, TNT 初始数量 + 1</div>
                        <div class="progress-container" style="width: 100%; height: 15px; background-color: #222; border-radius: 7px; overflow: hidden;">
                            <div class="progress-bar" data-type="armsDealer" style="width: ${latestUpgrades.armsDealer}%; height: 100%; background-color: #ff5722; transition: width 0.3s;"></div>
                        </div>
                        <div class="progress-text" style="display: flex; justify-content: space-between; font-size: 12px; margin-top: 5px;">
                            <span>${latestUpgrades.armsDealer}</span>
                            <span>${UPGRADE_CONFIG.maxLevel}</span>
                        </div>
                        <button class="upgrade-button" data-type="armsDealer" style="width: 100%; padding: 8px; margin-top: 10px; background-color: ${latestBonusPoints >= UPGRADE_CONFIG.cost && latestUpgrades.armsDealer < UPGRADE_CONFIG.maxLevel ? '#4CAF50' : '#666'}; color: white; border: none; border-radius: 5px; cursor: ${latestBonusPoints >= UPGRADE_CONFIG.cost && latestUpgrades.armsDealer < UPGRADE_CONFIG.maxLevel ? 'pointer' : 'not-allowed'}; transition: background-color 0.3s;">升级 (1000)</button>
                    </div>
                    
                    <!-- 核爆 -->
                    <div class="upgrade-item" style="width: 150px; background-color: rgba(30, 30, 30, 0.7); border-radius: 10px; padding: 10px; box-shadow: 0 0 10px rgba(0, 0, 0, 0.5);">
                        <div class="upgrade-icon" style="width: 150px; height: 150px; background-color: #333; border-radius: 5px; margin-bottom: 10px; display: flex; justify-content: center; align-items: center; color: #666; font-size: 16px;"><img src="assets/images/abomb.png" alt="核爆" style="width: 100%; height: 100%; object-fit: cover;"></div>
                        <div class="upgrade-title" style="font-size: 18px; margin-bottom: 5px;">核爆</div>
                        <div class="upgrade-desc" style="font-size: 14px; color: #aaa; margin-bottom: 10px; height: 40px;">每增加一点, TNT 爆炸范围 + 1</div>
                        <div class="progress-container" style="width: 100%; height: 15px; background-color: #222; border-radius: 7px; overflow: hidden;">
                            <div class="progress-bar" data-type="nuclearBomb" style="width: ${latestUpgrades.nuclearBomb}%; height: 100%; background-color: #ff5722; transition: width 0.3s;"></div>
                        </div>
                        <div class="progress-text" style="display: flex; justify-content: space-between; font-size: 12px; margin-top: 5px;">
                            <span>${latestUpgrades.nuclearBomb}</span>
                            <span>${UPGRADE_CONFIG.maxLevel}</span>
                        </div>
                        <button class="upgrade-button" data-type="nuclearBomb" style="width: 100%; padding: 8px; margin-top: 10px; background-color: ${latestBonusPoints >= UPGRADE_CONFIG.cost && latestUpgrades.nuclearBomb < UPGRADE_CONFIG.maxLevel ? '#4CAF50' : '#666'}; color: white; border: none; border-radius: 5px; cursor: ${latestBonusPoints >= UPGRADE_CONFIG.cost && latestUpgrades.nuclearBomb < UPGRADE_CONFIG.maxLevel ? 'pointer' : 'not-allowed'}; transition: background-color 0.3s;">升级 (1000)</button>
                    </div>
                    
                    <!-- 羊驼奶 -->
                    <div class="upgrade-item" style="width: 150px; background-color: rgba(30, 30, 30, 0.7); border-radius: 10px; padding: 10px; box-shadow: 0 0 10px rgba(0, 0, 0, 0.5);">
                        <div class="upgrade-icon" style="width: 150px; height: 150px; background-color: #333; border-radius: 5px; margin-bottom: 10px; display: flex; justify-content: center; align-items: center; color: #666; font-size: 16px;"><img src="assets/images/llama-feed.png" alt="羊驼奶" style="width: 100%; height: 100%; object-fit: cover;"></div>
                        <div class="upgrade-title" style="font-size: 18px; margin-bottom: 5px;">羊驼奶</div>
                        <div class="upgrade-desc" style="font-size: 14px; color: #aaa; margin-bottom: 10px; height: 40px;">每增加一点, 羊驼的生成最大数量 + 10</div>
                        <div class="progress-container" style="width: 100%; height: 15px; background-color: #222; border-radius: 7px; overflow: hidden;">
                            <div class="progress-bar" data-type="llamaMilk" style="width: ${latestUpgrades.llamaMilk}%; height: 100%; background-color: #ff5722; transition: width 0.3s;"></div>
                        </div>
                        <div class="progress-text" style="display: flex; justify-content: space-between; font-size: 12px; margin-top: 5px;">
                            <span>${latestUpgrades.llamaMilk}</span>
                            <span>${UPGRADE_CONFIG.maxLevel}</span>
                        </div>
                        <button class="upgrade-button" data-type="llamaMilk" style="width: 100%; padding: 8px; margin-top: 10px; background-color: ${latestBonusPoints >= UPGRADE_CONFIG.cost && latestUpgrades.llamaMilk < UPGRADE_CONFIG.maxLevel ? '#4CAF50' : '#666'}; color: white; border: none; border-radius: 5px; cursor: ${latestBonusPoints >= UPGRADE_CONFIG.cost && latestUpgrades.llamaMilk < UPGRADE_CONFIG.maxLevel ? 'pointer' : 'not-allowed'}; transition: background-color 0.3s;">升级 (1000)</button>
                    </div>
                    
                    <!-- 猪饲料 -->
                    <div class="upgrade-item" style="width: 150px; background-color: rgba(30, 30, 30, 0.7); border-radius: 10px; padding: 10px; box-shadow: 0 0 10px rgba(0, 0, 0, 0.5);">
                        <div class="upgrade-icon" style="width: 150px; height: 150px; background-color: #333; border-radius: 5px; margin-bottom: 10px; display: flex; justify-content: center; align-items: center; color: #666; font-size: 16px;"><img src="assets/images/pig-feed.png" alt="猪饲料" style="width: 100%; height: 100%; object-fit: cover;"></div>
                        <div class="upgrade-title" style="font-size: 18px; margin-bottom: 5px;">猪饲料</div>
                        <div class="upgrade-desc" style="font-size: 14px; color: #aaa; margin-bottom: 10px; height: 40px;">每增加一点, 猪猪的生成最大数量 + 1</div>
                        <div class="progress-container" style="width: 100%; height: 15px; background-color: #222; border-radius: 7px; overflow: hidden;">
                            <div class="progress-bar" data-type="pigFeed" style="width: ${latestUpgrades.pigFeed}%; height: 100%; background-color: #ff5722; transition: width 0.3s;"></div>
                        </div>
                        <div class="progress-text" style="display: flex; justify-content: space-between; font-size: 12px; margin-top: 5px;">
                            <span>${latestUpgrades.pigFeed}</span>
                            <span>${UPGRADE_CONFIG.maxLevel}</span>
                        </div>
                        <button class="upgrade-button" data-type="pigFeed" style="width: 100%; padding: 8px; margin-top: 10px; background-color: ${latestBonusPoints >= UPGRADE_CONFIG.cost && latestUpgrades.pigFeed < UPGRADE_CONFIG.maxLevel ? '#4CAF50' : '#666'}; color: white; border: none; border-radius: 5px; cursor: ${latestBonusPoints >= UPGRADE_CONFIG.cost && latestUpgrades.pigFeed < UPGRADE_CONFIG.maxLevel ? 'pointer' : 'not-allowed'}; transition: background-color 0.3s;">升级 (1000)</button>
                    </div>
                </div>
                
                <!-- 第二行升级项 -->
                <div style="display: flex; justify-content: center; gap: 20px;">
                    <!-- 长者的眼镜 -->
                    <div class="upgrade-item" style="width: 150px; background-color: rgba(30, 30, 30, 0.7); border-radius: 10px; padding: 10px; box-shadow: 0 0 10px rgba(0, 0, 0, 0.5);">
                        <div class="upgrade-icon" style="width: 150px; height: 150px; background-color: #333; border-radius: 5px; margin-bottom: 10px; display: flex; justify-content: center; align-items: center; color: #666; font-size: 16px;"><img src="assets/images/glasses.png" alt="长者的眼镜" style="width: 100%; height: 100%; object-fit: cover;"></div>
                        <div class="upgrade-title" style="font-size: 18px; margin-bottom: 5px;">长者的眼镜</div>
                        <div class="upgrade-desc" style="font-size: 14px; color: #aaa; margin-bottom: 10px; height: 40px;">每增加一点, 每局游戏最大时长 + 1s</div>
                        <div class="progress-container" style="width: 100%; height: 15px; background-color: #222; border-radius: 7px; overflow: hidden;">
                            <div class="progress-bar" data-type="glasses" style="width: ${latestUpgrades.glasses}%; height: 100%; background-color: #ff5722; transition: width 0.3s;"></div>
                        </div>
                        <div class="progress-text" style="display: flex; justify-content: space-between; font-size: 12px; margin-top: 5px;">
                            <span>${latestUpgrades.glasses}</span>
                            <span>${UPGRADE_CONFIG.maxLevel}</span>
                        </div>
                        <button class="upgrade-button" data-type="glasses" style="width: 100%; padding: 8px; margin-top: 10px; background-color: ${latestBonusPoints >= UPGRADE_CONFIG.cost && latestUpgrades.glasses < UPGRADE_CONFIG.maxLevel ? '#4CAF50' : '#666'}; color: white; border: none; border-radius: 5px; cursor: ${latestBonusPoints >= UPGRADE_CONFIG.cost && latestUpgrades.glasses < UPGRADE_CONFIG.maxLevel ? 'pointer' : 'not-allowed'}; transition: background-color 0.3s;">升级 (1000)</button>
                    </div>
                    
                    <!-- 奇怪的收购者 -->
                    <div class="upgrade-item" style="width: 150px; background-color: rgba(30, 30, 30, 0.7); border-radius: 10px; padding: 10px; box-shadow: 0 0 10px rgba(0, 0, 0, 0.5);">
                        <div class="upgrade-icon" style="width: 150px; height: 150px; background-color: #333; border-radius: 5px; margin-bottom: 10px; display: flex; justify-content: center; align-items: center; color: #666; font-size: 16px;"><img src="assets/images/acquirer.png" alt="奇怪的收购者" style="width: 100%; height: 100%; object-fit: cover;"></div>
                        <div class="upgrade-title" style="font-size: 18px; margin-bottom: 5px;">奇怪的收购者</div>
                        <div class="upgrade-desc" style="font-size: 14px; color: #aaa; margin-bottom: 10px; height: 40px;">每增加一点, 消灭一只动物的得分增加10%</div>
                        <div class="progress-container" style="width: 100%; height: 15px; background-color: #222; border-radius: 7px; overflow: hidden;">
                            <div class="progress-bar" data-type="acquirer" style="width: ${latestUpgrades.acquirer}%; height: 100%; background-color: #ff5722; transition: width 0.3s;"></div>
                        </div>
                        <div class="progress-text" style="display: flex; justify-content: space-between; font-size: 12px; margin-top: 5px;">
                            <span>${latestUpgrades.acquirer}</span>
                            <span>${UPGRADE_CONFIG.maxLevel}</span>
                        </div>
                        <button class="upgrade-button" data-type="acquirer" style="width: 100%; padding: 8px; margin-top: 10px; background-color: ${latestBonusPoints >= UPGRADE_CONFIG.cost && latestUpgrades.acquirer < UPGRADE_CONFIG.maxLevel ? '#4CAF50' : '#666'}; color: white; border: none; border-radius: 5px; cursor: ${latestBonusPoints >= UPGRADE_CONFIG.cost && latestUpgrades.acquirer < UPGRADE_CONFIG.maxLevel ? 'pointer' : 'not-allowed'}; transition: background-color 0.3s;">升级 (1000)</button>
                    </div>
                    
                    <!-- 幸运星 -->
                    <div class="upgrade-item" style="width: 150px; background-color: rgba(30, 30, 30, 0.7); border-radius: 10px; padding: 10px; box-shadow: 0 0 10px rgba(0, 0, 0, 0.5);">
                        <div class="upgrade-icon" style="width: 150px; height: 150px; background-color: #333; border-radius: 5px; margin-bottom: 10px; display: flex; justify-content: center; align-items: center; color: #666; font-size: 16px;"><img src="assets/images/izumi.png" alt="幸运星" style="width: 100%; height: 100%; object-fit: cover;"></div>
                        <div class="upgrade-title" style="font-size: 18px; margin-bottom: 5px;">幸运星</div>
                        <div class="upgrade-desc" style="font-size: 14px; color: #aaa; margin-bottom: 10px; height: 40px;">每增加一点, 猪猪的道具掉落概率增加 2%</div>
                        <div class="progress-container" style="width: 100%; height: 15px; background-color: #222; border-radius: 7px; overflow: hidden;">
                            <div class="progress-bar" data-type="clover" style="width: ${latestUpgrades.clover}%; height: 100%; background-color: #ff5722; transition: width 0.3s;"></div>
                        </div>
                        <div class="progress-text" style="display: flex; justify-content: space-between; font-size: 12px; margin-top: 5px;">
                            <span>${latestUpgrades.clover}</span>
                            <span>${UPGRADE_CONFIG.maxLevel}</span>
                        </div>
                        <button class="upgrade-button" data-type="clover" style="width: 100%; padding: 8px; margin-top: 10px; background-color: ${latestBonusPoints >= UPGRADE_CONFIG.cost && latestUpgrades.clover < UPGRADE_CONFIG.maxLevel ? '#4CAF50' : '#666'}; color: white; border: none; border-radius: 5px; cursor: ${latestBonusPoints >= UPGRADE_CONFIG.cost && latestUpgrades.clover < UPGRADE_CONFIG.maxLevel ? 'pointer' : 'not-allowed'}; transition: background-color 0.3s;">升级 (1000)</button>
                    </div>
                    
                    <!-- 肌肉狂 -->
                    <div class="upgrade-item" style="width: 150px; background-color: rgba(30, 30, 30, 0.7); border-radius: 10px; padding: 10px; box-shadow: 0 0 10px rgba(0, 0, 0, 0.5);">
                        <div class="upgrade-icon" style="width: 150px; height: 150px; background-color: #333; border-radius: 5px; margin-bottom: 10px; display: flex; justify-content: center; align-items: center; color: #666; font-size: 16px;"><img src="assets/images/muscle.png" alt="肌肉狂" style="width: 100%; height: 100%; object-fit: cover;"></div>
                        <div class="upgrade-title" style="font-size: 18px; margin-bottom: 5px;">肌肉狂</div>
                        <div class="upgrade-desc" style="font-size: 14px; color: #aaa; margin-bottom: 10px; height: 40px;">每增加一点, 人物的移动速度和跳跃高度增加 1%</div>
                        <div class="progress-container" style="width: 100%; height: 15px; background-color: #222; border-radius: 7px; overflow: hidden;">
                            <div class="progress-bar" data-type="muscle" style="width: ${latestUpgrades.muscle}%; height: 100%; background-color: #ff5722; transition: width 0.3s;"></div>
                        </div>
                        <div class="progress-text" style="display: flex; justify-content: space-between; font-size: 12px; margin-top: 5px;">
                            <span>${latestUpgrades.muscle}</span>
                            <span>${UPGRADE_CONFIG.maxLevel}</span>
                        </div>
                        <button class="upgrade-button" data-type="muscle" style="width: 100%; padding: 8px; margin-top: 10px; background-color: ${latestBonusPoints >= UPGRADE_CONFIG.cost && latestUpgrades.muscle < UPGRADE_CONFIG.maxLevel ? '#4CAF50' : '#666'}; color: white; border: none; border-radius: 5px; cursor: ${latestBonusPoints >= UPGRADE_CONFIG.cost && latestUpgrades.muscle < UPGRADE_CONFIG.maxLevel ? 'pointer' : 'not-allowed'}; transition: background-color 0.3s;">升级 (1000)</button>
                    </div>
                </div>
            </div>
            
            <button id="restart-button" style="padding: 15px 30px; font-size: 24px; background-color: #4CAF50; color: white; border: none; border-radius: 10px; cursor: pointer; transition: background-color 0.3s;">再来一次</button>
        </div>
    `;
    }
    
    // 格式化时间为 MM:SS.MS 格式
    function formatTime(ms) {
        const seconds = Math.floor(ms / 1000);
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        const milliseconds = Math.floor((ms % 1000) / 10);
        
        return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}.${milliseconds.toString().padStart(2, '0')}`;
    }
    
    // 处理升级事件
    function handleUpgrade(upgradeType) {
        const currentProgress = userDataSystem.getUpgradeProgress(upgradeType);
        const currentBonus = userDataSystem.getBonusPoints();
        
        // 检查是否可以升级
        if (currentBonus >= UPGRADE_CONFIG.cost && currentProgress < UPGRADE_CONFIG.maxLevel) {
            // 扣除奖金
            const newBonus = userDataSystem.deductBonusPoints(UPGRADE_CONFIG.cost);
            
            // 增加升级进度
            userDataSystem.increaseUpgradeProgress(upgradeType, 1);
            
            // 更新UI
            updateGameOverUI();
            
            // 提供升级反馈
            showUpgradeFeedback(upgradeType);
        }
    }
    
    // 显示升级反馈动画
    function showUpgradeFeedback(upgradeType) {
        const progressBar = document.querySelector(`.progress-bar[data-type="${upgradeType}"]`);
        if (progressBar) {
            progressBar.style.backgroundColor = '#4CAF50';
            setTimeout(() => {
                progressBar.style.backgroundColor = '#ff5722';
            }, 500);
        }
    }
    
    // 更新游戏结束界面
    function updateGameOverUI() {
        gameOverDisplay.innerHTML = generateGameOverHTML();
        
        // 重新添加升级按钮事件
        document.querySelectorAll('.upgrade-button').forEach(button => {
            button.addEventListener('click', function() {
                const upgradeType = this.getAttribute('data-type');
                handleUpgrade(upgradeType);
            });
        });
        
        // 重新添加重新开始按钮事件
        document.getElementById('restart-button').addEventListener('click', () => {
            window.location.reload();
        });
    }
    
    
    // 开始计时器
    function startTimer() {
        // 检查是否有长者眼镜升级，增加游戏时间
        const glassesLevel = userDataSystem.getUpgradeProgress('glasses');
        // 每级增加1秒，基础时间是60秒
        const baseTime = 60000;
        timeLeft = baseTime + (glassesLevel * 1000);
        
        const startTime = Date.now();
        timerInterval = setInterval(() => {
            // 基于实际流逝的时间计算
            const elapsedTime = Date.now() - startTime;
            timeLeft = Math.max((baseTime + (glassesLevel * 1000)) - elapsedTime, 0);
            
            timerDisplay.innerHTML = formatTime(timeLeft);
            
            // 检查时间是否已到
            if (timeLeft <= 0) {
                endGame();
            }
        }, 100);
    }
    
    // 开始计时器
    startTimer();
    
    // 返回控制接口
    return {
        updateScore: function(points) {
            if (!gameActive) return;
            
            // 检查是否有收购者升级，增加动物击杀得分
            const acquirerLevel = userDataSystem.getUpgradeProgress('acquirer');
            // 每级增加10%的分数
            const bonusMultiplier = 1 + (acquirerLevel * 0.1);
            const adjustedPoints = Math.round(points * bonusMultiplier);
            
            score += adjustedPoints;
            scoreDisplay.innerHTML = `分数: ${score}`;
            
            // 添加得分动画
            const scoreAnimation = document.createElement('div');
            scoreAnimation.textContent = `+${adjustedPoints}`;
            scoreAnimation.style.position = 'absolute';
            scoreAnimation.style.top = '360px';
            scoreAnimation.style.left = '50%';
            scoreAnimation.style.transform = 'translateX(-50%)';
            scoreAnimation.style.color = '#ffff00';
            scoreAnimation.style.fontSize = '60px';
            scoreAnimation.style.fontWeight = 'bold';
            scoreAnimation.style.textShadow = '2px 2px 4px #000000';
            scoreAnimation.style.opacity = '1';
            scoreAnimation.style.transition = 'top 1s, opacity 1s';
            document.body.appendChild(scoreAnimation);
            
            // 动画效果
            setTimeout(() => {
                scoreAnimation.style.top = '20px';
                scoreAnimation.style.opacity = '0';
            }, 50);
            
            // 移除元素
            setTimeout(() => {
                document.body.removeChild(scoreAnimation);
            }, 1100);
        },
        endGame: function() {
            endGame();
        },
        isGameActive: function() {
            return gameActive;
        },
        getCurrentScore: function() {
            return score;
        },
        getTimeLeft: function() {
            return timeLeft;
        },
        getUserDataSystem: function() {
            return userDataSystem;
        }
    };
    
    // 游戏结束函数，修改为保存分数到奖金
    function endGame() {
        console.log('endGame');

        // 无论鼠标是否锁定，都解除所有监听
        tearDownMouseLock(document, mouseLockListeners);
        tearDownMouseControls(document, mouseControlsListeners);
        tearDownAdvancedMouseControls(document, advancedMouseControlsListeners);
        tearDownKeyboardControls(document, keyboardControlsListeners);
        
        // 强制退出指针锁定
        if (document.pointerLockElement) {
            document.exitPointerLock();
        }

        if (!gameActive) return;
        
        gameActive = false;
        clearInterval(timerInterval);
        
        // 更新奖金
        const newBonusPoints = userDataSystem.addBonusPoints(score);
        console.log('newBonusPoints:', newBonusPoints);
        
        // 生成结束界面HTML
        gameOverDisplay.innerHTML = generateGameOverHTML();
        
        // 添加升级按钮事件
        document.querySelectorAll('.upgrade-button').forEach(button => {
            button.addEventListener('click', function() {
                const upgradeType = this.getAttribute('data-type');
                handleUpgrade(upgradeType);
            });
        });
        
        // 显示游戏结束界面
        gameOverDisplay.style.display = 'flex';
    }
}
