// 用户数据管理系统
export function initUserDataSystem() {
    // 定义所有升级项目的键名
    const upgradeKeys = {
        armsDealer: 'minefract_upgrade_armsDealer',
        nuclearBomb: 'minefract_upgrade_nuclearBomb',
        llamaMilk: 'minefract_upgrade_llamaMilk',
        pigFeed: 'minefract_upgrade_pigFeed',
        glasses: 'minefract_upgrade_glasses',
        acquirer: 'minefract_upgrade_acquirer',
        clover: 'minefract_upgrade_clover',
        muscle: 'minefract_upgrade_muscle'
    };
    
    // 从localStorage获取奖金，如果不存在则初始化为0
    function getBonusPoints() {
        const bonusPoints = localStorage.getItem('minefractBonusPoints');
        return bonusPoints ? parseInt(bonusPoints) : 0;
    }

    // 保存奖金到localStorage
    function saveBonusPoints(points) {
        localStorage.setItem('minefractBonusPoints', points.toString());
    }

    // 添加奖金（新游戏分数累加到总奖金）
    function addBonusPoints(newPoints) {
        const currentBonus = getBonusPoints();
        const newBonus = currentBonus + newPoints;
        saveBonusPoints(newBonus);
        return newBonus;
    }

    // 扣除奖金
    function deductBonusPoints(points) {
        const currentBonus = getBonusPoints();
        const newBonus = Math.max(0, currentBonus - points);
        saveBonusPoints(newBonus);
        return newBonus;
    }

    // 重置奖金
    function resetBonusPoints() {
        saveBonusPoints(0);
        return 0;
    }
    
    // 初始化升级项目进度
    function initializeUpgrades() {
        Object.values(upgradeKeys).forEach(key => {
            if (localStorage.getItem(key) === null) {
                localStorage.setItem(key, '0');
            }
        });
    }
    
    // 获取特定升级项目的进度
    function getUpgradeProgress(upgradeType) {
        const key = upgradeKeys[upgradeType];
        if (!key) return 0;
        
        const progress = localStorage.getItem(key);
        return progress ? parseInt(progress) : 0;
    }
    
    // 获取所有升级项目的进度
    function getAllUpgradeProgress() {
        const progress = {};
        Object.keys(upgradeKeys).forEach(type => {
            progress[type] = getUpgradeProgress(type);
        });
        return progress;
    }
    
    // 设置特定升级项目的进度
    function setUpgradeProgress(upgradeType, progress) {
        const key = upgradeKeys[upgradeType];
        if (!key) return false;
        
        // 确保进度在0-100之间
        const validProgress = Math.max(0, Math.min(100, progress));
        localStorage.setItem(key, validProgress.toString());
        return true;
    }
    
    // 增加特定升级项目的进度
    function increaseUpgradeProgress(upgradeType, amount) {
        const currentProgress = getUpgradeProgress(upgradeType);
        return setUpgradeProgress(upgradeType, currentProgress + amount);
    }
    
    // 初始化所有升级进度
    initializeUpgrades();

    return {
        getBonusPoints,
        saveBonusPoints,
        addBonusPoints,
        deductBonusPoints,
        resetBonusPoints,
        getUpgradeProgress,
        getAllUpgradeProgress,
        setUpgradeProgress,
        increaseUpgradeProgress,
        upgradeKeys
    };
}
