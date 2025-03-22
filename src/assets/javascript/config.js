// 需要导入user_data.js中的用户数据系统
import { initUserDataSystem } from './user_data.js';

function getDefaultConfig() {
    return {
        gameInfo: {
            gameName: 'MineCraft-Art-of-Explode',
            gameVersion: '0.1.0',
            gameAuthor: 'karminski-牙医'
        },
        gameConfig: {
            gameTime: 60000, // 游戏时间，单位为毫秒
            tntDefaultExplodeRange: 3.5, // TNT爆炸范围
            tntDefaultNum: 10, // 开局TNT数量
            llamaDefaultNum: 60, // 开局羊驼数量
            pigDefaultNum: 10, // 开局猪猪数量
            defaultKillScore: 10, // 击杀动物得分
            defaultUserMoveSpeed: 0.05, // 默认玩家移动速度
            defaultUserJumpScale: 0.1, // 默认玩家跳跃高度
            skillCardDropProbability: 0.1, // 技能卡掉落概率
            skillCardDropList: { // 默认技能卡掉落列表
                theWorld: 0.1,
                theMagnet: 0.5,
                theNapalm: 0.2,
                theInfinite: 0.2,
            },
            skillCardConfig: {
                theWorld: {
                    duration: 10, // in seconds
                },
                theMagnet: {
                    duration: 10,
                },
                theNapalm: {
                    duration: 10,
                },
                theInfinite: {
                    duration: 10,
                },
            }
        }
    };
}


function getConfig(userDataSystem) {
    // 获取默认配置
    const defaultConfig = getDefaultConfig();
    
    // 获取所有升级进度
    const upgrades = userDataSystem.getAllUpgradeProgress();
    
    // 应用升级效果到配置
    // 军火商: 每增加一点, TNT 初始数量 + 1
    defaultConfig.gameConfig.tntDefaultNum += upgrades.armsDealer || 0;
    
    // 核爆: 每增加一点, TNT 爆炸范围 + 1
    defaultConfig.gameConfig.tntDefaultExplodeRange += upgrades.nuclearBomb || 0;
    
    // 羊驼奶: 每增加一点, 羊驼的生成最大数量 + 10
    defaultConfig.gameConfig.llamaDefaultNum += (upgrades.llamaMilk || 0) * 10;
    
    // 猪饲料: 每增加一点, 猪猪的生成最大数量 + 1
    defaultConfig.gameConfig.pigDefaultNum += upgrades.pigFeed || 0;
    
    // 长者的眼镜: 每增加一点, 每局游戏最大时长 + 1s
    defaultConfig.gameConfig.gameTime += (upgrades.glasses || 0) * 1000; // 1s = 1000ms
    
    // 奇怪的收购者: 每增加一点, 消灭一只动物的得分增加10%
    defaultConfig.gameConfig.defaultKillScore *= (1 + (upgrades.acquirer || 0) * 0.1);
    
    // 幸运星: 每增加一点, 猪猪的道具掉落概率增加 2%
    defaultConfig.gameConfig.itemDropProbability += (upgrades.clover || 0) * 0.02;
    
    // 肌肉狂 的效果需要在游戏逻辑中应用，这里不需要更改配置
    defaultConfig.gameConfig.defaultUserMoveSpeed += (upgrades.muscle || 0) * 0.01;
    defaultConfig.gameConfig.defaultUserJumpScale += (upgrades.muscle || 0) * 0.01;
    
    return defaultConfig;
}



export { getConfig };
