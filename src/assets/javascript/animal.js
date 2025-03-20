// 导入Three.js库（假设已在全局范围内）
// import * as THREE from 'three';
import { mapBlockUVs, createAnimalTexture } from './utils.js';

// 动物基类 - 提供所有动物共享的基础功能
class AnimalBase {
    constructor() {
        // 基础属性
        this.type = 'animal'; // 动物类型标识符
        this.defaultSpeed = 0.003; // 默认移动速度
        this.gravity = 0.005; // 默认重力值
        this.model = null; // 动物模型
        this.animProps = {
            animationTime: 0,
            walkingSpeed: 0.1,
            maxSwingAngle: Math.PI / 8 // 默认摆动角度
        };
    }
    
    // 创建模型 - 需要被子类重写
    createModel(scene, textureLoader) {
        console.warn("createModel必须被子类实现");
        return new THREE.Group(); // 返回空模型作为默认值
    }
    
    // 默认的腿部动画方法 - 可被子类重写
    animateLegs(animal, deltaTime) {
        console.warn("animateLegs必须被子类实现");
    }
    
    // 静态方法：在世界中随机放置动物 - 需要被子类重写
    static placeRandomly(scene, world, worldSize, textureLoader, count) {
        console.warn("placeRandomly必须被子类实现");
        return [];
    }
    
    // 静态方法：找到生成高度 - 通用方法
    static findSpawnHeight(world, x, z, worldSize) {
    // 找到该坐标上最高的非空气方块
    let highestY = 0;
    
    // 确保坐标在范围内
    if (x < 0 || x >= worldSize || z < 0 || z >= worldSize) {
        console.error(`生成坐标超出范围: x=${x}, z=${z}`);
        return 10; // 返回一个默认高度
    }
    
    try {
        // 显式检查世界数组
        if (!world || !Array.isArray(world) || !world[x] || !Array.isArray(world[x])) {
            console.error(`世界数组结构无效: world[${x}]`);
            return 10;
        }
        
        for (let y = worldSize - 1; y >= 0; y--) {
            // 检查数组访问的有效性
            if (!world[x][y] || !Array.isArray(world[x][y])) {
                console.error(`世界数组结构无效: world[${x}][${y}]`);
                continue;
            }
            
            if (world[x][y][z] !== window.blockTypes.air) {
                highestY = y + 1; // 站在方块上方
                break;
            }
        }
    } catch (e) {
        console.error(`查找生成高度错误: x=${x}, z=${z}`, e);
        return 10; // 发生错误时返回默认高度
    }
    
    // 确保至少有1格高度安全位置，并检查NaN
    const result = Math.max(highestY, 1);
    return isNaN(result) ? 10 : result;
}

    // 静态方法：补充动物 - 需要被子类实现
    static replenish(scene, world, worldSize, textureLoader, animals, countToAdd) {
        console.warn("replenish必须被子类实现");
        return 0;
    }
}

// 更新所有动物的位置(模拟重力、碰撞和随机移动)
function updateAnimals(animals, world, worldSize, deltaTime, player = null) {
    // 防止deltaTime过大或为NaN
    if (isNaN(deltaTime) || deltaTime > 1000) {
        console.error(`无效的deltaTime: ${deltaTime}, 使用默认值`);
        deltaTime = 16; // 使用16ms作为默认值
    }
    
    // 遍历所有动物类型
    Object.keys(animals).forEach(animalType => {
        animals[animalType].forEach(animal => {
            // 先检查动物位置是否有效
            if (isNaN(animal.position.x) || isNaN(animal.position.y) || isNaN(animal.position.z)) {
                console.error(`${animalType}位置包含NaN，重置到安全位置`);
                animal.position.set(
                    isNaN(animal.position.x) ? Math.floor(worldSize/2) : animal.position.x,
                20, // 固定高度
                    isNaN(animal.position.z) ? Math.floor(worldSize/2) : animal.position.z
                );
                animal.velocity.set(0, 0, 0);
            }
            
            // 应用物理和移动更新
            updateAnimalPhysics(animal, world, worldSize);
            
            // 应用随机移动
            moveAnimalRandomly(animal, deltaTime, world, worldSize, player, animals);
            
            // 调用特定动物类型的动画更新
            if (animal.controller && typeof animal.controller.animateLegs === 'function') {
                animal.controller.animateLegs(animal, deltaTime);
            }
        });
    });
}

// 处理动物的物理更新(重力和碰撞)
function updateAnimalPhysics(animal, world, worldSize) {
    // 检查动物是否与地面接触
        let isCollidingWithGround = false;
        let groundHeight = -1;
        
    // 简化的地面检测 - 只检查动物正下方的方块
    const animalX = Math.floor(animal.position.x);
    const animalZ = Math.floor(animal.position.z);
    
    // 安全检查
    if (animalX >= 0 && animalX < worldSize && animalZ >= 0 && animalZ < worldSize) {
        for (let checkY = Math.floor(animal.position.y - 1); checkY >= 0 && checkY >= Math.floor(animal.position.y) - 3; checkY--) {
            if (checkY < 0 || checkY >= worldSize) continue;
            
            try {
                if (world[animalX][checkY][animalZ] !== window.blockTypes.air && 
                    world[animalX][checkY][animalZ] !== window.blockTypes.leaves) {
                            isCollidingWithGround = true;
                    groundHeight = checkY + 1 + 1.0; // 方块顶面高度 + 适当偏移
                    break;
                        }
                    } catch (e) {
                console.error(`物理检测错误: x=${animalX}, y=${checkY}, z=${animalZ}`, e);
                }
            }
        }
        
        // 应用重力和碰撞检测
        if (!isCollidingWithGround) {
            // 安全地更新速度
        const gravityDelta = animal.gravity * 16;
            if (!isNaN(gravityDelta)) {
            animal.velocity.y -= gravityDelta;
            }
        animal.isGrounded = false;
        } else {
            // 碰到地面，停止下落
        animal.velocity.y = 0;
        // 确保正好站在方块顶部
            if (groundHeight > 0) {
            // 平滑过渡到正确的高度
            animal.position.y = animal.position.y * 0.3 + groundHeight * 0.7;
            }
        animal.isGrounded = true;
        }
        
        // 应用速度前检查是否为NaN
    if (!isNaN(animal.velocity.y)) {
        animal.position.y += animal.velocity.y;
        } else {
        console.error(`动物Y速度是NaN，重置为0`);
        animal.velocity.y = 0;
    }
}

// 动物随机移动逻辑
function moveAnimalRandomly(animal, deltaTime, world, worldSize, player = null, animals = null) {
    // 如果动物没有移动相关属性，初始化它们
    if (!animal.moveProps) {
        animal.moveProps = {
            // 移动状态: idle, walking, turning
            state: 'idle',
            // 移动方向
            direction: new THREE.Vector3(0, 0, 0),
            // 当前移动剩余时间
            moveTimeRemaining: 0,
            // 当前休息剩余时间
            idleTimeRemaining: Math.random() * 5000,
            // 上次改变方向的时间
            lastDirectionChange: 0,
            // 移动速度 (每毫秒移动的单位)
            speed: animal.defaultSpeed || 0.001,
            // 方向改变的最小间隔 (毫秒)
            directionChangeInterval: 500,
            // 目标旋转角度
            targetRotation: 0,
            // 当前转向持续时间
            turningTimeRemaining: 0,
            // 转向速度 (弧度/毫秒)
            turningSpeed: 0.005
        };
    }
    
    const props = animal.moveProps;
    
    // 更新计时器
    if (props.state === 'idle') {
        props.idleTimeRemaining -= deltaTime;
        
        // 休息时间结束，开始移动
        if (props.idleTimeRemaining <= 0) {
            // 切换到移动状态
            props.state = 'walking';
            // 设置移动时间 (1-3秒)
            props.moveTimeRemaining = 1000 + Math.random() * 2000;
            
            // 设置随机移动方向
            const angle = Math.random() * Math.PI * 2;
            
            // 调整方向计算
            props.direction.set(
                -Math.sin(angle), // 反转X方向
                0,
                -Math.cos(angle)  // 反转Z方向
            );
            
            // 更新动物朝向
            animal.rotation.y = angle + Math.PI * 2; 
        }
    } else if (props.state === 'turning') {
        // 处理转向状态
        props.turningTimeRemaining -= deltaTime;
        
        // 计算当前转向进度
        const turningProgress = Math.min(1.0, 1.0 - props.turningTimeRemaining / 500);
        
        // 使用LERP平滑插值当前角度到目标角度
        const currentY = animal.rotation.y;
        let targetY = props.targetRotation;
        
        // 处理角度循环，选择最短的旋转路径
        while (targetY - currentY > Math.PI) targetY -= Math.PI * 2;
        while (targetY - currentY < -Math.PI) targetY += Math.PI * 2;
        
        // 应用平滑旋转
        animal.rotation.y = currentY + (targetY - currentY) * turningProgress;
        
        // 转向完成后开始移动
        if (props.turningTimeRemaining <= 0) {
            // 确保方向向量与最终旋转角度一致
            props.direction.set(
                -Math.sin(props.targetRotation),
                0,
                -Math.cos(props.targetRotation)
            );
            
            // 转向完成，切换回行走状态
            props.state = 'walking';
            props.moveTimeRemaining = 1000 + Math.random() * 1000; // 转向后移动1-2秒
        }
    } else if (props.state === 'walking') {
        props.moveTimeRemaining -= deltaTime;
        
        // 移动时间结束，回到休息状态
        if (props.moveTimeRemaining <= 0) {
            // 切换到休息状态
            props.state = 'idle';
            // 设置休息时间 (2-6秒)
            props.idleTimeRemaining = 2000 + Math.random() * 4000;
            return;
        }
        
        // 只有在地面上时才移动
        if (animal.isGrounded) {
            // 计算移动距离
            const moveDistance = props.speed * deltaTime;
            
            // 计算新位置
            const newPosX = animal.position.x + props.direction.x * moveDistance;
            const newPosZ = animal.position.z + props.direction.z * moveDistance;
            
            // 检查边界
            const boundaryMargin = 2;
            const inBounds = (
                newPosX >= boundaryMargin && 
                newPosX < worldSize - boundaryMargin &&
                newPosZ >= boundaryMargin && 
                newPosZ < worldSize - boundaryMargin
            );
            
            // 碰撞检测
            let hasCollision = checkCollision(animal, newPosX, newPosZ, world, worldSize, player, animals);
            
            // 如果没有碰撞且在边界内，更新位置
            if (!hasCollision && inBounds) {
                animal.position.x = newPosX;
                animal.position.z = newPosZ;
            } else {
                // 如果发生碰撞或超出边界，进入转向状态
                
                // 计算新的前进方向
                const currentAngle = animal.rotation.y;
                
                // 计算一个避免向后的新角度 (左转或右转70-110度)
                const turnLeft = Math.random() > 0.5;
                const turnAngle = (Math.PI / 2) * (0.8 + Math.random() * 0.4); // 70-110度的转向角
                let newAngle;
                
                if (turnLeft) {
                    newAngle = currentAngle + turnAngle;
                } else {
                    newAngle = currentAngle - turnAngle;
                }
                
                // 规范化角度到0-2π范围
                while (newAngle < 0) newAngle += Math.PI * 2;
                while (newAngle >= Math.PI * 2) newAngle -= Math.PI * 2;
                
                // 设置转向目标和时间
                props.targetRotation = newAngle;
                props.turningTimeRemaining = 500; // 500毫秒完成转向
                props.state = 'turning';
            }
        }
    }
}

// 检查碰撞
function checkCollision(animal, newPosX, newPosZ, world, worldSize, player, animals) {
    const floorX = Math.floor(newPosX);
    const floorY = Math.floor(animal.position.y);
    const floorZ = Math.floor(newPosZ);
    
    try {
        // 检查是否在世界边界内
        if (floorX < 0 || floorX >= worldSize || floorZ < 0 || floorZ >= worldSize) {
            return true; // 世界边界碰撞
        }
        
        // 检查前方方块
        // 根据动物类型定义高度
        const animalHeight = 3; // 默认高度
        
        // 检测前方各个高度的方块
        for (let heightOffset = 0; heightOffset < animalHeight; heightOffset++) {
            const checkY = floorY + heightOffset;
            
            // 超出世界边界的不检测
            if (checkY >= worldSize || checkY < 0) continue;
            
            // 获取该位置的方块类型
            const blockType = world[floorX][checkY][floorZ];
            
            // 如果是空气或树叶，则继续检测更高的方块
            if (blockType === window.blockTypes.air || blockType === window.blockTypes.leaves) continue;
            
            // 如果是高度为1的方块并且在地面层，动物可以跨过
            if (heightOffset === 0 && isLowBlock(blockType)) {
                continue;
            }
            
            // 其他情况视为碰撞
            return true;
        }
        
        // 检查与玩家的碰撞
        if (player) {
            const playerPos = player.position;
            
            const distanceToPlayer = Math.sqrt(
                Math.pow(newPosX - playerPos.x, 2) + 
                Math.pow(newPosZ - playerPos.z, 2)
            );
            
            if (distanceToPlayer < 1.5) {
                return true;
            }
        }
        
        // 检查与其他动物的碰撞
        if (animals) {
            // 遍历所有动物类型
            for (const type in animals) {
                for (const otherAnimal of animals[type]) {
                    // 不要与自己碰撞检测
                    if (otherAnimal === animal) continue;
                    
                    // 检查与其他动物的距离
                    const distanceToAnimal = Math.sqrt(
                        Math.pow(newPosX - otherAnimal.position.x, 2) + 
                        Math.pow(newPosZ - otherAnimal.position.z, 2)
                    );
                    
                    // 如果太近，视为碰撞
                    if (distanceToAnimal < 1.2) {
                        return true;
                    }
                }
            }
        }
        
    } catch (e) {
        console.error(`碰撞检测错误: x=${floorX}, y=${floorY}, z=${floorZ}`, e);
        return true; // 出错时视为碰撞
    }
    
    return false; // 无碰撞
}

// 判断方块是否为可以越过的低矮方块(高度为1)
function isLowBlock(blockType) {
    // 定义所有高度为1的方块类型
    const lowBlocks = [
        window.blockTypes.flower,
        window.blockTypes.tallgrass,
        window.blockTypes.redstoneTorch,
        window.blockTypes.fire,
        window.blockTypes.redstoneWire
    ];
    
    return lowBlocks.includes(blockType);
}

// 初始化动物系统
function initAnimalSystem(scene, world, worldSize, textureLoader) {
    console.log("正在初始化动物系统...");
    
    // 检查全局 blockTypes 是否存在
    if (!window.blockTypes) {
        console.error("错误: window.blockTypes 未定义，需要延迟初始化");
        // 创建一个基本的动物系统，稍后会重新初始化
        window.animalSystem = {
            animals: { llamas: [] },
            initialCounts: { llamas: 0 },
            initialized: false,
            update: function(deltaTime, player) {
                // 延迟初始化：检查 blockTypes 是否已设置
                if (window.blockTypes && !this.initialized) {
                    console.log("检测到 blockTypes 已设置，重新初始化动物系统");
                    this.initialized = true;
                    // 重新调用初始化
                    initializeAnimals(scene, world, worldSize, textureLoader);
                } else {
                    console.log("等待 blockTypes 初始化...");
                }
            }
        };
        return;
    }
    
    // blockTypes 存在，正常初始化
    initializeAnimals(scene, world, worldSize, textureLoader);
}

// 将实际初始化逻辑提取到单独的函数
function initializeAnimals(scene, world, worldSize, textureLoader) {
    // 创建一个基本的动物系统
    const tempSystem = {
        animals: { llamas: [], pigs: [] },
        initialCounts: { llamas: 0, pigs: 0 },
        initialized: true,
        update: function(deltaTime, player) {
            console.log("动物系统正在加载中...");
        }
    };
    
    // 立即设置临时系统
    window.animalSystem = tempSystem;
    
    // 导入所有动物类型
    Promise.all([
        import('./animal_llama.js'),
        import('./animal_pig.js')
    ]).then(([{ LlamaAnimal }, { PigAnimal }]) => {
        console.log("开始初始化动物...");
        console.log("blockTypes 状态:", window.blockTypes ? "已定义" : "未定义");
        
        if (!window.blockTypes) {
            console.error("错误: 导入动物后 blockTypes 仍未定义！");
            return;
        }
        
        // 创建动物容器
        let animals = {
            llamas: [], // 羊驼
            pigs: []    // 猪
        };
        
        try {
            // 放置羊驼
            animals.llamas = LlamaAnimal.placeRandomly(scene, world, worldSize, textureLoader, 120);
            console.log(`已创建 ${animals.llamas.length} 只羊驼`);
            
            // 放置猪
            animals.pigs = PigAnimal.placeRandomly(scene, world, worldSize, textureLoader, 10);
            console.log(`已创建 ${animals.pigs.length} 只猪`);
        } catch (e) {
            console.error("生成动物时发生错误:", e);
            console.error(e.stack); // 打印完整堆栈
        }
        
        // 记录初始数量
        const initialCounts = {
            llamas: animals.llamas.length,
            pigs: animals.pigs.length
        };
        
        let lastReplenishCheck = 0;
        
        // 更新全局动物系统对象
        window.animalSystem = {
            animals: animals,
            initialCounts: initialCounts,
            initialized: true,
            update: function(deltaTime, player = null) {
                try {
                    // 更新所有动物
                    updateAnimals(animals, world, worldSize, deltaTime, player);
                    
                    // 动物补充逻辑
                    const currentTime = performance.now();
                    if (currentTime - lastReplenishCheck > 10000) { // 每10秒检查一次
                        replenishAnimals(scene, world, worldSize, textureLoader, animals, initialCounts);
                        lastReplenishCheck = currentTime;
                    }
                } catch (e) {
                    console.error("更新动物时发生错误:", e);
                }
            }
        };
        
        console.log("动物系统初始化完成!");
    }).catch(error => {
        console.error("导入动物模块时出错:", error);
    });
}

// 动物补充功能
function replenishAnimals(scene, world, worldSize, textureLoader, animals, initialCounts) {
    // 动态导入所有动物类
    Promise.all([
        import('./animal_llama.js'),
        import('./animal_pig.js')
    ]).then(([{ LlamaAnimal }, { PigAnimal }]) => {
        // 检查羊驼数量
        if (animals.llamas.length < initialCounts.llamas) {
            const countToAdd = initialCounts.llamas - animals.llamas.length;
            LlamaAnimal.replenish(scene, world, worldSize, textureLoader, animals, countToAdd);
        }
        
        // 检查猪的数量
        if (animals.pigs.length < initialCounts.pigs) {
            const countToAdd = initialCounts.pigs - animals.pigs.length;
            PigAnimal.replenish(scene, world, worldSize, textureLoader, animals, countToAdd);
        }
        
        // 未来可以在这里添加其他动物的补充逻辑
    });
}

// 导出函数和类
export {
    AnimalBase,
    initAnimalSystem,
    updateAnimals,
    moveAnimalRandomly,
    replenishAnimals
};
