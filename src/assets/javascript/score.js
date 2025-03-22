// Game scoring and timer system
import { initUserDataSystem } from './user_data.js';

export function initScoreSystem(config, document, tearDownMouseLock, mouseLockListeners, tearDownMouseControls, mouseControlsListeners, tearDownAdvancedMouseControls, advancedMouseControlsListeners, tearDownKeyboardControls, keyboardControlsListeners) {
    let score = 0;
    let gameActive = true;
    let timeLeft = config.gameConfig.gameTime; // 60秒，以毫秒为单位
    let timerInterval = null;
    
    // 添加时间暂停相关变量
    let isTimerPaused = false;
    let pauseStartTime = 0;
    let totalPausedTime = 0;
    
    // 升级配置
    const UPGRADE_CONFIG = {
        armsDealer: {
            cost: 500,  // 每1%升级需要的奖金点数
            maxLevel: 100 // 最大升级等级
        },
        nuclearBomb: {
            cost: 1000,  // 每1%升级需要的奖金点数
            maxLevel: 20 // 最大升级等级
        },
        llamaMilk: {
            cost: 1000,  // 每1%升级需要的奖金点数
            maxLevel: 20 // 最大升级等级
        },
        pigFeed: {
            cost: 1000,  // 每1%升级需要的奖金点数
            maxLevel: 20 // 最大升级等级
        },
        glasses: {
            cost: 200,  // 每1%升级需要的奖金点数
            maxLevel: 100 // 最大升级等级
        },
        acquirer: {
            cost: 500,  // 每1%升级需要的奖金点数
            maxLevel: 100 // 最大升级等级
        },
        clover: {
            cost: 1000,  // 每1%升级需要的奖金点数
            maxLevel: 50 // 最大升级等级
        },
        muscle: {
            cost: 1500,  // 每1%升级需要的奖金点数
            maxLevel: 20 // 最大升级等级
        }
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
                <div style="font-size: 24px; margin-bottom: 15px; color: #4CAF50;">可升级项目</div>
                
                <!-- 第一行升级项 -->
                <div style="display: flex; justify-content: center; gap: 20px; margin-bottom: 20px;">
                    <!-- 军火商 -->
                    <div class="upgrade-item" style="width: 150px; background-color: rgba(30, 30, 30, 0.7); border-radius: 10px; padding: 10px; box-shadow: 0 0 10px rgba(0, 0, 0, 0.5);">
                        <div class="upgrade-icon" style="width: 150px; height: 150px; background-color: #333; border-radius: 5px; margin-bottom: 10px; display: flex; justify-content: center; align-items: center; color: #666; font-size: 16px;"><img src="assets/images/arms_dealer.png" alt="军火商" style="width: 100%; height: 100%; object-fit: cover;"></div>
                        <div class="upgrade-title" style="font-size: 18px; margin-bottom: 5px;">军火商</div>
                        <div class="upgrade-desc" style="font-size: 14px; color: #aaa; margin-bottom: 10px; height: 40px;">每增加一点, TNT 初始数量 + 1</div>
                        <div class="progress-container" style="width: 100%; height: 15px; background-color: #222; border-radius: 7px; overflow: hidden;">
                            <div class="progress-bar" data-type="armsDealer" style="width: ${(latestUpgrades.armsDealer / UPGRADE_CONFIG.armsDealer.maxLevel) * 100}%; height: 100%; background-color: #ff5722; transition: width 0.3s;"></div>
                        </div>
                        <div class="progress-text" style="display: flex; justify-content: space-between; font-size: 12px; margin-top: 5px;">
                            <span>${latestUpgrades.armsDealer}</span>
                            <span>${UPGRADE_CONFIG.armsDealer.maxLevel}</span>
                        </div>
                        <button class="upgrade-button" data-type="armsDealer" style="width: 100%; padding: 8px; margin-top: 10px; background-color: ${latestBonusPoints >= UPGRADE_CONFIG.armsDealer.cost && latestUpgrades.armsDealer < UPGRADE_CONFIG.armsDealer.maxLevel ? '#4CAF50' : '#666'}; color: white; border: none; border-radius: 5px; cursor: ${latestBonusPoints >= UPGRADE_CONFIG.armsDealer.cost && latestUpgrades.armsDealer < UPGRADE_CONFIG.armsDealer.maxLevel ? 'pointer' : 'not-allowed'}; transition: background-color 0.3s;">升级 (${UPGRADE_CONFIG.armsDealer.cost})</button>
                    </div>
                    
                    <!-- 核爆 -->
                    <div class="upgrade-item" style="width: 150px; background-color: rgba(30, 30, 30, 0.7); border-radius: 10px; padding: 10px; box-shadow: 0 0 10px rgba(0, 0, 0, 0.5);">
                        <div class="upgrade-icon" style="width: 150px; height: 150px; background-color: #333; border-radius: 5px; margin-bottom: 10px; display: flex; justify-content: center; align-items: center; color: #666; font-size: 16px;"><img src="assets/images/abomb.png" alt="核爆" style="width: 100%; height: 100%; object-fit: cover;"></div>
                        <div class="upgrade-title" style="font-size: 18px; margin-bottom: 5px;">核爆</div>
                        <div class="upgrade-desc" style="font-size: 14px; color: #aaa; margin-bottom: 10px; height: 40px;">每增加一点, TNT 爆炸范围 + 1</div>
                        <div class="progress-container" style="width: 100%; height: 15px; background-color: #222; border-radius: 7px; overflow: hidden;">
                            <div class="progress-bar" data-type="nuclearBomb" style="width: ${(latestUpgrades.nuclearBomb / UPGRADE_CONFIG.nuclearBomb.maxLevel) * 100}%; height: 100%; background-color: #ff5722; transition: width 0.3s;"></div>
                        </div>
                        <div class="progress-text" style="display: flex; justify-content: space-between; font-size: 12px; margin-top: 5px;">
                            <span>${latestUpgrades.nuclearBomb}</span>
                            <span>${UPGRADE_CONFIG.nuclearBomb.maxLevel}</span>
                        </div>
                        <button class="upgrade-button" data-type="nuclearBomb" style="width: 100%; padding: 8px; margin-top: 10px; background-color: ${latestBonusPoints >= UPGRADE_CONFIG.nuclearBomb.cost && latestUpgrades.nuclearBomb < UPGRADE_CONFIG.nuclearBomb.maxLevel ? '#4CAF50' : '#666'}; color: white; border: none; border-radius: 5px; cursor: ${latestBonusPoints >= UPGRADE_CONFIG.nuclearBomb.cost && latestUpgrades.nuclearBomb < UPGRADE_CONFIG.nuclearBomb.maxLevel ? 'pointer' : 'not-allowed'}; transition: background-color 0.3s;">升级 (${UPGRADE_CONFIG.nuclearBomb.cost})</button>
                    </div>
                    
                    <!-- 羊驼奶 -->
                    <div class="upgrade-item" style="width: 150px; background-color: rgba(30, 30, 30, 0.7); border-radius: 10px; padding: 10px; box-shadow: 0 0 10px rgba(0, 0, 0, 0.5);">
                        <div class="upgrade-icon" style="width: 150px; height: 150px; background-color: #333; border-radius: 5px; margin-bottom: 10px; display: flex; justify-content: center; align-items: center; color: #666; font-size: 16px;"><img src="assets/images/llama-feed.png" alt="羊驼奶" style="width: 100%; height: 100%; object-fit: cover;"></div>
                        <div class="upgrade-title" style="font-size: 18px; margin-bottom: 5px;">羊驼奶</div>
                        <div class="upgrade-desc" style="font-size: 14px; color: #aaa; margin-bottom: 10px; height: 40px;">每增加一点, 羊驼的生成最大数量 + 10</div>
                        <div class="progress-container" style="width: 100%; height: 15px; background-color: #222; border-radius: 7px; overflow: hidden;">
                            <div class="progress-bar" data-type="llamaMilk" style="width: ${(latestUpgrades.llamaMilk / UPGRADE_CONFIG.llamaMilk.maxLevel) * 100}%; height: 100%; background-color: #ff5722; transition: width 0.3s;"></div>
                        </div>
                        <div class="progress-text" style="display: flex; justify-content: space-between; font-size: 12px; margin-top: 5px;">
                            <span>${latestUpgrades.llamaMilk}</span>
                            <span>${UPGRADE_CONFIG.llamaMilk.maxLevel}</span>
                        </div>
                        <button class="upgrade-button" data-type="llamaMilk" style="width: 100%; padding: 8px; margin-top: 10px; background-color: ${latestBonusPoints >= UPGRADE_CONFIG.llamaMilk.cost && latestUpgrades.llamaMilk < UPGRADE_CONFIG.llamaMilk.maxLevel ? '#4CAF50' : '#666'}; color: white; border: none; border-radius: 5px; cursor: ${latestBonusPoints >= UPGRADE_CONFIG.llamaMilk.cost && latestUpgrades.llamaMilk < UPGRADE_CONFIG.llamaMilk.maxLevel ? 'pointer' : 'not-allowed'}; transition: background-color 0.3s;">升级 (${UPGRADE_CONFIG.llamaMilk.cost})</button>
                    </div>
                    
                    <!-- 猪饲料 -->
                    <div class="upgrade-item" style="width: 150px; background-color: rgba(30, 30, 30, 0.7); border-radius: 10px; padding: 10px; box-shadow: 0 0 10px rgba(0, 0, 0, 0.5);">
                        <div class="upgrade-icon" style="width: 150px; height: 150px; background-color: #333; border-radius: 5px; margin-bottom: 10px; display: flex; justify-content: center; align-items: center; color: #666; font-size: 16px;"><img src="assets/images/pig-feed.png" alt="猪饲料" style="width: 100%; height: 100%; object-fit: cover;"></div>
                        <div class="upgrade-title" style="font-size: 18px; margin-bottom: 5px;">猪饲料</div>
                        <div class="upgrade-desc" style="font-size: 14px; color: #aaa; margin-bottom: 10px; height: 40px;">每增加一点, 猪猪的生成最大数量 + 1</div>
                        <div class="progress-container" style="width: 100%; height: 15px; background-color: #222; border-radius: 7px; overflow: hidden;">
                            <div class="progress-bar" data-type="pigFeed" style="width: ${(latestUpgrades.pigFeed / UPGRADE_CONFIG.pigFeed.maxLevel) * 100}%; height: 100%; background-color: #ff5722; transition: width 0.3s;"></div>
                        </div>
                        <div class="progress-text" style="display: flex; justify-content: space-between; font-size: 12px; margin-top: 5px;">
                            <span>${latestUpgrades.pigFeed}</span>
                            <span>${UPGRADE_CONFIG.pigFeed.maxLevel}</span>
                        </div>
                        <button class="upgrade-button" data-type="pigFeed" style="width: 100%; padding: 8px; margin-top: 10px; background-color: ${latestBonusPoints >= UPGRADE_CONFIG.pigFeed.cost && latestUpgrades.pigFeed < UPGRADE_CONFIG.pigFeed.maxLevel ? '#4CAF50' : '#666'}; color: white; border: none; border-radius: 5px; cursor: ${latestBonusPoints >= UPGRADE_CONFIG.pigFeed.cost && latestUpgrades.pigFeed < UPGRADE_CONFIG.pigFeed.maxLevel ? 'pointer' : 'not-allowed'}; transition: background-color 0.3s;">升级 (${UPGRADE_CONFIG.pigFeed.cost})</button>
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
                            <div class="progress-bar" data-type="glasses" style="width: ${(latestUpgrades.glasses / UPGRADE_CONFIG.glasses.maxLevel) * 100}%; height: 100%; background-color: #ff5722; transition: width 0.3s;"></div>
                        </div>
                        <div class="progress-text" style="display: flex; justify-content: space-between; font-size: 12px; margin-top: 5px;">
                            <span>${latestUpgrades.glasses}</span>
                            <span>${UPGRADE_CONFIG.glasses.maxLevel}</span>
                        </div>
                        <button class="upgrade-button" data-type="glasses" style="width: 100%; padding: 8px; margin-top: 10px; background-color: ${latestBonusPoints >= UPGRADE_CONFIG.glasses.cost && latestUpgrades.glasses < UPGRADE_CONFIG.glasses.maxLevel ? '#4CAF50' : '#666'}; color: white; border: none; border-radius: 5px; cursor: ${latestBonusPoints >= UPGRADE_CONFIG.glasses.cost && latestUpgrades.glasses < UPGRADE_CONFIG.glasses.maxLevel ? 'pointer' : 'not-allowed'}; transition: background-color 0.3s;">升级 (${UPGRADE_CONFIG.glasses.cost})</button>
                    </div>
                    
                    <!-- 奇怪的收购者 -->
                    <div class="upgrade-item" style="width: 150px; background-color: rgba(30, 30, 30, 0.7); border-radius: 10px; padding: 10px; box-shadow: 0 0 10px rgba(0, 0, 0, 0.5);">
                        <div class="upgrade-icon" style="width: 150px; height: 150px; background-color: #333; border-radius: 5px; margin-bottom: 10px; display: flex; justify-content: center; align-items: center; color: #666; font-size: 16px;"><img src="assets/images/acquirer.png" alt="奇怪的收购者" style="width: 100%; height: 100%; object-fit: cover;"></div>
                        <div class="upgrade-title" style="font-size: 18px; margin-bottom: 5px;">奇怪的收购者</div>
                        <div class="upgrade-desc" style="font-size: 14px; color: #aaa; margin-bottom: 10px; height: 40px;">每增加一点, 消灭一只动物的得分增加10%</div>
                        <div class="progress-container" style="width: 100%; height: 15px; background-color: #222; border-radius: 7px; overflow: hidden;">
                            <div class="progress-bar" data-type="acquirer" style="width: ${(latestUpgrades.acquirer / UPGRADE_CONFIG.acquirer.maxLevel) * 100}%; height: 100%; background-color: #ff5722; transition: width 0.3s;"></div>
                        </div>
                        <div class="progress-text" style="display: flex; justify-content: space-between; font-size: 12px; margin-top: 5px;">
                            <span>${latestUpgrades.acquirer}</span>
                            <span>${UPGRADE_CONFIG.acquirer.maxLevel}</span>
                        </div>
                        <button class="upgrade-button" data-type="acquirer" style="width: 100%; padding: 8px; margin-top: 10px; background-color: ${latestBonusPoints >= UPGRADE_CONFIG.acquirer.cost && latestUpgrades.acquirer < UPGRADE_CONFIG.acquirer.maxLevel ? '#4CAF50' : '#666'}; color: white; border: none; border-radius: 5px; cursor: ${latestBonusPoints >= UPGRADE_CONFIG.acquirer.cost && latestUpgrades.acquirer < UPGRADE_CONFIG.acquirer.maxLevel ? 'pointer' : 'not-allowed'}; transition: background-color 0.3s;">升级 (${UPGRADE_CONFIG.acquirer.cost})</button>
                    </div>
                    
                    <!-- 幸运星 -->
                    <div class="upgrade-item" style="width: 150px; background-color: rgba(30, 30, 30, 0.7); border-radius: 10px; padding: 10px; box-shadow: 0 0 10px rgba(0, 0, 0, 0.5);">
                        <div class="upgrade-icon" style="width: 150px; height: 150px; background-color: #333; border-radius: 5px; margin-bottom: 10px; display: flex; justify-content: center; align-items: center; color: #666; font-size: 16px;"><img src="assets/images/izumi.png" alt="幸运星" style="width: 100%; height: 100%; object-fit: cover;"></div>
                        <div class="upgrade-title" style="font-size: 18px; margin-bottom: 5px;">幸运星</div>
                        <div class="upgrade-desc" style="font-size: 14px; color: #aaa; margin-bottom: 10px; height: 40px;">每增加一点, 猪猪的道具掉落概率增加 2%</div>
                        <div class="progress-container" style="width: 100%; height: 15px; background-color: #222; border-radius: 7px; overflow: hidden;">
                            <div class="progress-bar" data-type="clover" style="width: ${(latestUpgrades.clover / UPGRADE_CONFIG.clover.maxLevel) * 100}%; height: 100%; background-color: #ff5722; transition: width 0.3s;"></div>
                        </div>
                        <div class="progress-text" style="display: flex; justify-content: space-between; font-size: 12px; margin-top: 5px;">
                            <span>${latestUpgrades.clover}</span>
                            <span>${UPGRADE_CONFIG.clover.maxLevel}</span>
                        </div>
                        <button class="upgrade-button" data-type="clover" style="width: 100%; padding: 8px; margin-top: 10px; background-color: ${latestBonusPoints >= UPGRADE_CONFIG.clover.cost && latestUpgrades.clover < UPGRADE_CONFIG.clover.maxLevel ? '#4CAF50' : '#666'}; color: white; border: none; border-radius: 5px; cursor: ${latestBonusPoints >= UPGRADE_CONFIG.clover.cost && latestUpgrades.clover < UPGRADE_CONFIG.clover.maxLevel ? 'pointer' : 'not-allowed'}; transition: background-color 0.3s;">升级 (${UPGRADE_CONFIG.clover.cost})</button>
                    </div>
                    
                    <!-- 肌肉狂 -->
                    <div class="upgrade-item" style="width: 150px; background-color: rgba(30, 30, 30, 0.7); border-radius: 10px; padding: 10px; box-shadow: 0 0 10px rgba(0, 0, 0, 0.5);">
                        <div class="upgrade-icon" style="width: 150px; height: 150px; background-color: #333; border-radius: 5px; margin-bottom: 10px; display: flex; justify-content: center; align-items: center; color: #666; font-size: 16px;"><img src="assets/images/muscle.png" alt="肌肉狂" style="width: 100%; height: 100%; object-fit: cover;"></div>
                        <div class="upgrade-title" style="font-size: 18px; margin-bottom: 5px;">肌肉狂</div>
                        <div class="upgrade-desc" style="font-size: 14px; color: #aaa; margin-bottom: 10px; height: 40px;">每增加一点, 人物的移动速度和跳跃高度增加 1%</div>
                        <div class="progress-container" style="width: 100%; height: 15px; background-color: #222; border-radius: 7px; overflow: hidden;">
                            <div class="progress-bar" data-type="muscle" style="width: ${(latestUpgrades.muscle / UPGRADE_CONFIG.muscle.maxLevel) * 100}%; height: 100%; background-color: #ff5722; transition: width 0.3s;"></div>
                        </div>
                        <div class="progress-text" style="display: flex; justify-content: space-between; font-size: 12px; margin-top: 5px;">
                            <span>${latestUpgrades.muscle}</span>
                            <span>${UPGRADE_CONFIG.muscle.maxLevel}</span>
                        </div>
                        <button class="upgrade-button" data-type="muscle" style="width: 100%; padding: 8px; margin-top: 10px; background-color: ${latestBonusPoints >= UPGRADE_CONFIG.muscle.cost && latestUpgrades.muscle < UPGRADE_CONFIG.muscle.maxLevel ? '#4CAF50' : '#666'}; color: white; border: none; border-radius: 5px; cursor: ${latestBonusPoints >= UPGRADE_CONFIG.muscle.cost && latestUpgrades.muscle < UPGRADE_CONFIG.muscle.maxLevel ? 'pointer' : 'not-allowed'}; transition: background-color 0.3s;">升级 (${UPGRADE_CONFIG.muscle.cost})</button>
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
        
        // 检查是否可以升级 - 使用动态配置值
        const upgradeCost = UPGRADE_CONFIG[upgradeType].cost;
        const maxLevel = UPGRADE_CONFIG[upgradeType].maxLevel;
        
        if (currentBonus >= upgradeCost && currentProgress < maxLevel) {
            // 扣除奖金 - 使用动态配置值
            const newBonus = userDataSystem.deductBonusPoints(upgradeCost);
            
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
        
        // 使用延时确保DOM完全更新后再添加事件监听
        setTimeout(() => {
            // 重新添加升级按钮事件
            document.querySelectorAll('.upgrade-button').forEach(button => {
                button.addEventListener('click', function(e) {
                    // 阻止事件冒泡
                    e.stopPropagation();
                    const upgradeType = this.getAttribute('data-type');
                    handleUpgrade(upgradeType);
                });
            });
            
            // 重新添加重新开始按钮事件
            const restartButton = document.getElementById('restart-button');
            if (restartButton) {
                restartButton.addEventListener('click', function(e) {
                    // 阻止事件冒泡
                    e.stopPropagation();
                    window.location.reload();
                });
            }
        }, 100);
    }
    
    
    // 开始计时器 - 修改为支持暂停
    function startTimer() {
        // 检查是否有长者眼镜升级，增加游戏时间
        const glassesLevel = userDataSystem.getUpgradeProgress('glasses');
        // 每级增加1秒，基础时间是60秒
        const baseTime = 60000;
        timeLeft = baseTime + (glassesLevel * 1000);
        
        const startTime = Date.now();
        timerInterval = setInterval(() => {
            // 如果计时器被暂停，不更新时间
            if (isTimerPaused) {
                return;
            }
            
            // 基于实际流逝的时间计算，但考虑暂停的总时长
            const elapsedTime = Date.now() - startTime - totalPausedTime;
            timeLeft = Math.max((baseTime + (glassesLevel * 1000)) - elapsedTime, 0);
            
            timerDisplay.innerHTML = formatTime(timeLeft);
            
            // 检查时间是否已到
            if (timeLeft <= 0) {
                endGame();
            }
        }, 100);
    }
    
    // 添加暂停/恢复计时器的方法
    function pauseTimer(pause, skillName) {
        const skillDuration = window.globalConfig.gameConfig.skillCardConfig[skillName].duration;
        console.log(`pauseTimer 被调用: ${pause}, 当前状态: ${isTimerPaused}, 技能持续时间: ${skillDuration}ms`);
        
        if (pause && !isTimerPaused) {
            // 暂停计时器
            isTimerPaused = true;
            pauseStartTime = Date.now();
            console.log('游戏计时器已暂停 - 时间停止技能生效', pauseStartTime);
            
            // 设置自动恢复计时器
            setTimeout(() => {
                if (isTimerPaused) {
                    // 如果仍处于暂停状态，则恢复计时器
                    pauseTimer(false, skillName);
                    console.log('技能持续时间结束，自动恢复计时器');
                }
            }, skillDuration * 1000);
        } else if (!pause && isTimerPaused) {
            // 恢复计时器
            isTimerPaused = false;
            // 计算这次暂停的时长并加到总暂停时间
            const pauseDuration = Date.now() - pauseStartTime;
            totalPausedTime += pauseDuration;
            console.log('游戏计时器已恢复 - 时间停止技能结束', 
                       '暂停持续时间:', pauseDuration, 
                       '总暂停时间:', totalPausedTime);
        }
    }
    
    // 开始计时器
    startTimer();
    
    // 返回控制接口 - 添加pauseTimer方法
    return {
        updateScore: function(points) {
            if (!gameActive) return;
            
            // 检查是否有收购者升级，增加动物击杀得分
            const acquirerLevel = userDataSystem.getUpgradeProgress('acquirer');
            // 每级增加10%的分数
            const bonusMultiplier = 1 + (acquirerLevel * 0.1);
            const adjustedPoints = Math.round(points * 10 * bonusMultiplier); // 每只动物增加10分
            
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
        pauseTimer: pauseTimer, // 添加暂停计时器方法
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
        
        // 显示游戏结束界面
        gameOverDisplay.style.display = 'flex';
        
        // 重要：使用延时确保DOM完全更新后再添加事件监听
        setTimeout(() => {
            // 添加升级按钮事件
            document.querySelectorAll('.upgrade-button').forEach(button => {
                button.addEventListener('click', function(e) {
                    // 阻止事件冒泡
                    e.stopPropagation();
                    const upgradeType = this.getAttribute('data-type');
                    handleUpgrade(upgradeType);
                });
            });
            
            // 添加重启按钮事件
            const restartButton = document.getElementById('restart-button');
            if (restartButton) {
                restartButton.addEventListener('click', function(e) {
                    // 阻止事件冒泡
                    e.stopPropagation();
                    window.location.reload();
                });
            }
            
            console.log('所有游戏结束界面按钮事件已绑定');
        }, 100);
        
        // 移除可能干扰点击的元素
        removeInterferenceElements();
    }

    // 添加这个新函数，用于移除可能干扰点击的元素
    function removeInterferenceElements() {
        // 获取并移除可能遮挡点击的元素
        const possibleInterferences = [
            document.getElementById('crosshair'),
            document.getElementById('debug-panel')
        ];
        
        possibleInterferences.forEach(element => {
            if (element) {
                element.style.pointerEvents = 'none';
            }
        });
        
        // 确保游戏结束界面的点击事件能够正常工作
        gameOverDisplay.style.pointerEvents = 'auto';
        
        console.log('已移除可能干扰点击的元素');
    }
}
