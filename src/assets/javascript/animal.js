// 导入Three.js库（假设已在全局范围内）
// import * as THREE from 'three';
import { mapBlockUVs, createAnimalTexture } from './utils.js';

// 羊驼模型创建函数
function createLlamaModel(scene, textureLoader) {
    const llamaGroup = new THREE.Group();
    
    // 随机选择一种羊驼纹理
    const llamaColors = ['brown', 'creamy', 'gray', 'white'];
    const randomColor = llamaColors[Math.floor(Math.random() * llamaColors.length)];
    const texturePath = `assets/images/llama/${randomColor}.png`;
    
    // 创建材质
    const llamaMaterial = createAnimalTexture(textureLoader, texturePath);
    const woolMaterial = new THREE.MeshLambertMaterial({ color: 0xEEEEDD }); // 更浅色的毛皮
    
    // 基于Minecraft的ModelQuadruped和ModelLlama重新构建
    // 头部
    const head = new THREE.Group();
    
    // 主吻部 (基于0, 0区域的纹理，4x4x9大小)
    const snoutGeometry = new THREE.BoxGeometry(0.8, 0.8, 0.8);
    // 设置吻部UV映射 - 根据ModelLlama.java中的纹理坐标
    mapBlockUVs(snoutGeometry, {
        top: [9/128, 1 - 5/64, 13/128, 1 - 9/64],
        bottom: [13/128, 1 - 5/64, 17/128, 1 - 9/64],
        front: [9/128, 1 - 9/64, 13/128, 1 - 13/64],
        back: [12/128, 1 - 4/64, 17/128, 1 - 9/64],
        right: [5 / 128, 1 - 9 / 64, 9 / 128, 1 - 13 / 64],
        left: [13 / 128, 1 - 9 / 64, 17 / 128, 1 - 13 / 64]
    });
    const snout = new THREE.Mesh(snoutGeometry, llamaMaterial);
    snout.position.set(0, 0.2, -1.0);
    
    // 主要头部 (基于0, 14区域的纹理，8x18x6大小)
    const headMainGeometry = new THREE.BoxGeometry(1.6, 3.2, 1.2);
    // 设置头部UV映射
    mapBlockUVs(headMainGeometry, {
        top: [13/128, 1 - 19/64, 7/128, 1 - 15/64],
        bottom: [14/128, 1 - 14/64, 22/128, 1 - 20/64],
        front: [6/128, 1 - 20/64, 14/128, 1 - 38/64],
        back: [14/128, 1 - 20/64, 22/128, 1 - 38/64],
        right: [22/128, 1 - 20/64, 28/128, 1 - 38/64],
        left: [0/128, 1 - 20/64, 6/128, 1 - 38/64]
    });
    const headMain = new THREE.Mesh(headMainGeometry, llamaMaterial);
    headMain.position.set(0, -0.6, 0);
    
    // 左耳 (基于17, 0区域的纹理, 3x3x2大小)
    const leftEarGeometry = new THREE.BoxGeometry(0.6, 0.6, 0.4);
    mapBlockUVs(leftEarGeometry, {
        top: [19/128, 1 - 0/64, 22/128, 1 - 2/64],
        bottom: [22/128, 1 - 0/64, 25/128, 1 - 2/64],
        front: [19/128, 1 - 2/64, 22/128, 1 - 5/64],
        back: [22/128, 1 - 2/64, 25/128, 1 - 5/64],
        right: [25/128, 1 - 2/64, 27/128, 1 - 5/64],
        left: [17/128, 1 - 2/64, 19/128, 1 - 5/64]
    });
    const leftEar = new THREE.Mesh(leftEarGeometry, llamaMaterial);
    leftEar.position.set(-0.5, 1.2, 0.0);
    
    // 右耳 (同左耳)
    const rightEarGeometry = new THREE.BoxGeometry(0.6, 0.6, 0.4);
    mapBlockUVs(rightEarGeometry, {
        top: [19/128, 1 - 0/64, 22/128, 1 - 2/64],
        bottom: [22/128, 1 - 0/64, 25/128, 1 - 2/64],
        front: [19/128, 1 - 2/64, 22/128, 1 - 5/64],
        back: [22/128, 1 - 2/64, 25/128, 1 - 5/64],
        right: [25/128, 1 - 2/64, 27/128, 1 - 5/64],
        left: [17/128, 1 - 2/64, 19/128, 1 - 5/64]
    });
    const rightEar = new THREE.Mesh(rightEarGeometry, llamaMaterial);
    rightEar.position.set(0.5, 1.2, 0.0);
    
    // 头部整体
    head.add(snout, headMain, leftEar, rightEar);
    head.position.set(0, 2.5, -2.0);
    
    // 身体 (基于29, 0区域的纹理，12x18x10大小)
    const bodyGeometry = new THREE.BoxGeometry(2.4, 3.6, 2.0);
    mapBlockUVs(bodyGeometry, {
        top: [39/128, 1 - 10/64, 49/128, 1 - 28/64],
        bottom: [49/128, 1 - 10/64, 63/128, 1 - 28/64],
        front: [39/128, 1 - 0/64, 49/128, 1 - 10/64],
        back: [50/128, 1 - 0/64, 63/128, 1 - 10/64],
        right: [63/128, 1 - 10/64, 73/128, 1 - 28/64],
        left: [29/128, 1 - 10/64, 39/128, 1 - 28/64]
    });
    const body = new THREE.Mesh(bodyGeometry, llamaMaterial);
    body.position.set(0, 0.5, 0);
    body.rotation.x = Math.PI / 2; // 关键！垂直放置身体
    
    // 腿部 (基于29, 29区域的纹理，每条腿4x14x4大小)
    function createLeg(x, z) {
        const legGeometry = new THREE.BoxGeometry(0.8, 2.8, 0.8);
        legGeometry.translate(0, -1.4, 0); // 移动半个高度
        
        mapBlockUVs(legGeometry, {
            top: [33/128, 1 - 29/64, 37/128, 1 - 33/64],
            bottom: [37/128, 1 - 29/64, 41/128, 1 - 33/64],
            front: [33/128, 1 - 33/64, 37/128, 1 - 47/64],
            back: [37/128, 1 - 33/64, 41/128, 1 - 47/64],
            right: [41/128, 1 - 33/64, 45/128, 1 - 47/64],
            left: [29/128, 1 - 33/64, 33/128, 1 - 47/64]
        });
        const leg = new THREE.Mesh(legGeometry, llamaMaterial);
        leg.position.set(x, -0.4, z);
        return leg;
    }
    
    // 腿部位置基于ModelLlama.java的设置
    const legFrontLeft = createLeg(-0.5, -0.8);
    const legFrontRight = createLeg(0.5, -0.8);
    const legBackLeft = createLeg(-0.5, 1.2);
    const legBackRight = createLeg(0.5, 1.2);
    
    // 箱子 (基于45, 28和45, 41区域的纹理, 8x8x3大小)
    const chest1Geometry = new THREE.BoxGeometry(0.6, 1.6, 1.6);
    mapBlockUVs(chest1Geometry, {
        top: [45/128, 1 - 28/64, 53/128, 1 - 31/64],
        bottom: [53/128, 1 - 28/64, 61/128, 1 - 31/64],
        front: [45/128, 1 - 31/64, 53/128, 1 - 39/64],
        back: [61/128, 1 - 31/64, 69/128, 1 - 39/64],
        right: [53/128, 1 - 31/64, 61/128, 1 - 39/64],
        left: [69/128, 1 - 31/64, 77/128, 1 - 39/64]
    });
    const chest1 = new THREE.Mesh(chest1Geometry, woolMaterial);
    chest1.position.set(-1.7, 0.6, 0.6);
    chest1.rotation.y = Math.PI / 2;
    chest1.visible = false;
    
    const chest2Geometry = new THREE.BoxGeometry(0.6, 1.6, 1.6);
    mapBlockUVs(chest2Geometry, {
        top: [45/128, 1 - 41/64, 53/128, 1 - 44/64],
        bottom: [53/128, 1 - 41/64, 61/128, 1 - 44/64],
        front: [45/128, 1 - 44/64, 53/128, 1 - 52/64],
        back: [61/128, 1 - 44/64, 69/128, 1 - 52/64],
        right: [53/128, 1 - 44/64, 61/128, 1 - 52/64],
        left: [69/128, 1 - 44/64, 77/128, 1 - 52/64]
    });
    const chest2 = new THREE.Mesh(chest2Geometry, woolMaterial);
    chest2.position.set(1.7, 0.6, 0.6);
    chest2.rotation.y = Math.PI / 2;
    chest2.visible = false;
    
    // 添加所有部分到羊驼组
    llamaGroup.add(head, body, legFrontLeft, legFrontRight, legBackLeft, legBackRight, chest1, chest2);
    
    // 设置整体比例和位置
    llamaGroup.scale.set(0.4, 0.4, 0.4); // 调整为游戏比例
    llamaGroup.position.y = 0.6;
    
    // 添加更新方法以显示/隐藏箱子
    llamaGroup.setHasChest = function(hasChest) {
        chest1.visible = hasChest;
        chest2.visible = hasChest;
    };
    
    // 随机决定是否有箱子 (25%几率)
    if (Math.random() < 0.25) {
        llamaGroup.setHasChest(true);
    }
    
    // 添加默认移动速度 - 增加速度
    llamaGroup.defaultSpeed = 0.005; // 提高速度，原来是0.0015
    
    // 添加动画参数
    llamaGroup.animProps = {
        animationTime: 0,
        walkingSpeed: 0.2,
        maxSwingAngle: Math.PI / 6 // 羊驼腿摆动的最大角度 (30度)
    };
    
    return llamaGroup;
}

// 在世界中随机放置羊驼
function placeLlamasRandomly(scene, world, worldSize, textureLoader) {
    const llamas = [];
    // 减少生成数量，便于调试
    const count = 3; // 固定生成3只进行测试
    
    console.log(`尝试生成 ${count} 只羊驼...`);
    console.log(`世界大小: ${worldSize}`);
    console.log(`blockTypes.air = ${window.blockTypes.air}`);
    
    for (let i = 0; i < count; i++) {
        try {
            // 创建一只新羊驼，传入textureLoader
            const llama = createLlamaModel(scene, textureLoader);
            
            // 指定固定位置进行测试
            // 使用世界中心区域生成
            const x = Math.floor(worldSize / 2) - 5 + i; 
            const z = Math.floor(worldSize / 2) - 5 + i;
            
            console.log(`生成羊驼 #${i} 在坐标: x=${x}, z=${z}`);
            
            // 安全地找到生成高度
            let spawnY = 20; // 默认高度
            try {
                spawnY = findLlamaSpawnHeight(world, x, z, worldSize) + 5;
                console.log(`计算得到生成高度: y=${spawnY}`);
                
                // 确保Y不是NaN
                if (isNaN(spawnY)) {
                    console.error(`生成高度是NaN，使用默认值`);
                    spawnY = 20;
                }
            } catch (e) {
                console.error(`计算生成高度时出错:`, e);
            }
            
            console.log(`羊驼 #${i} 最终生成高度: y=${spawnY}`);
            
            // 设置初始位置和物理属性
            llama.position.set(x + 0.5, spawnY, z + 0.5);
            llama.velocity = new THREE.Vector3(0, 0, 0);
            llama.gravity = 0.005; 
            llama.isGrounded = false;
            
            // 随机旋转
            llama.rotation.y = Math.random() * Math.PI * 2;
            
            // 添加到场景
            scene.add(llama);
            llamas.push(llama);
            
            // 再次检查位置是否有效
            if (isNaN(llama.position.y)) {
                console.error(`生成后的Y坐标是NaN，修正为20`);
                llama.position.y = 20;
            }
        } catch (e) {
            console.error(`生成羊驼 #${i} 时出错:`, e);
        }
    }
    
    console.log(`成功生成 ${llamas.length} 只羊驼`);
    return llamas;
}

// 查找羊驼生成的安全高度
function findLlamaSpawnHeight(world, x, z, worldSize) {
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

// 修改腿部动画函数，更新查找腿部的条件以匹配实际位置
function animateLlamaLegs(llama, deltaTime) {
    // 如果羊驼正在移动
    if (llama.moveProps && llama.moveProps.state === 'walking') {
        // 更新动画计时器
        llama.animProps.animationTime += llama.animProps.walkingSpeed * (deltaTime / 16);
        
        // 计算腿部摆动角度(使用正弦函数)
        const swingAngle = Math.sin(llama.animProps.animationTime) * llama.animProps.maxSwingAngle;
        
        // 获取四条腿的引用 - 修正查找条件，y位置为-0.4
        const legs = llama.children.filter(child => 
            child.position.y === -0.4 && 
            Math.abs(child.position.x) === 0.5
        );
        
        if (legs.length === 4) {
            // 获取各条腿的引用
            const frontLeftLeg = legs.find(leg => leg.position.x === -0.5 && leg.position.z === -0.8);
            const frontRightLeg = legs.find(leg => leg.position.x === 0.5 && leg.position.z === -0.8);
            const backLeftLeg = legs.find(leg => leg.position.x === -0.5 && leg.position.z === 1.2);
            const backRightLeg = legs.find(leg => leg.position.x === 0.5 && leg.position.z === 1.2);
            
            // 对角腿同步摆动（类似于四足动物的跑步模式）
            if (frontLeftLeg) frontLeftLeg.rotation.x = swingAngle;
            if (backRightLeg) backRightLeg.rotation.x = swingAngle;
            
            if (frontRightLeg) frontRightLeg.rotation.x = -swingAngle;
            if (backLeftLeg) backLeftLeg.rotation.x = -swingAngle;
        }
    } else {
        // 如果羊驼静止，重置腿部位置
        llama.animProps.animationTime = 0;
        
        // 获取腿部引用并重置位置 - 同样修正y位置为-0.4
        const legs = llama.children.filter(child => 
            child.position.y === -0.4 && 
            Math.abs(child.position.x) === 0.5
        );
        
        legs.forEach(leg => {
            leg.rotation.x = 0;
        });
    }
}

// 更新所有羊驼的位置(模拟重力、碰撞和随机移动)
function updateLlamas(llamas, world, worldSize, deltaTime) {
    // 防止deltaTime过大或为NaN
    if (isNaN(deltaTime) || deltaTime > 1000) {
        console.error(`无效的deltaTime: ${deltaTime}, 使用默认值`);
        deltaTime = 16; // 使用16ms作为默认值
    }
    
    llamas.forEach(llama => {
        // 先检查羊驼位置是否有效
        if (isNaN(llama.position.x) || isNaN(llama.position.y) || isNaN(llama.position.z)) {
            console.error(`羊驼位置包含NaN，重置到安全位置`);
            llama.position.set(
                isNaN(llama.position.x) ? Math.floor(worldSize/2) : llama.position.x,
                20, // 固定高度
                isNaN(llama.position.z) ? Math.floor(worldSize/2) : llama.position.z
            );
            llama.velocity.set(0, 0, 0);
        }
        
        // 检查羊驼四条腿是否有任何一条与地面接触
        // 定义四条腿的相对位置偏移（基于羊驼的局部坐标系）
        const legOffsets = [
            {x: -0.5, z: -0.8}, // 左前腿
            {x: 0.5, z: -0.8},  // 右前腿
            {x: -0.5, z: 1.2},  // 左后腿
            {x: 0.5, z: 1.2}    // 右后腿
        ];
        
        // 旋转腿部偏移以匹配羊驼的旋转
        const rotatedLegOffsets = legOffsets.map(offset => {
            const sin = Math.sin(llama.rotation.y);
            const cos = Math.cos(llama.rotation.y);
            return {
                x: offset.x * cos - offset.z * sin,
                z: offset.x * sin + offset.z * cos
            };
        });
        
        // 检查每条腿下方是否有方块
        let isCollidingWithGround = false;
        const legY = Math.floor(llama.position.y - 0.8); // 腿部底端位置
        
        for (const offset of rotatedLegOffsets) {
            const legX = Math.floor(llama.position.x + offset.x * llama.scale.x);
            const legZ = Math.floor(llama.position.z + offset.z * llama.scale.z);
            
            // 如果出现任何NaN坐标，跳过这一条腿的检查
            if (isNaN(legX) || isNaN(legY) || isNaN(legZ)) {
                continue;
            }
            
            // 安全地检查是否在世界边界内
            const inBounds = (
                legX >= 0 && legX < worldSize && 
                legY >= 0 && legY < worldSize && 
                legZ >= 0 && legZ < worldSize
            );
            
            if (inBounds) {
                try {
                    // 检查腿部下方的方块
                    if (world[legX][legY][legZ] !== window.blockTypes.air) {
                        isCollidingWithGround = true;
                        break; // 只要有一条腿碰到地面就可以
                    }
                } catch (e) {
                    console.error(`访问世界数组错误: x=${legX}, y=${legY}, z=${legZ}`, e);
                }
            }
        }
        
        // 应用重力和碰撞检测
        // 如果没有碰到地面，应用重力
        if (!isCollidingWithGround) {
            // 安全地更新速度
            const gravityDelta = llama.gravity * deltaTime;
            if (!isNaN(gravityDelta)) {
                llama.velocity.y -= gravityDelta;
            }
            llama.isGrounded = false;
        } else {
            // 碰到地面，停止下落
            llama.velocity.y = 0;
            // 确保正好站在方块顶部，考虑到腿部长度
            llama.position.y = legY + 1 + 0.8; // 方块高度 + 腿部长度
            llama.isGrounded = true;
        }
        
        // 应用速度前检查是否为NaN
        if (!isNaN(llama.velocity.y)) {
            llama.position.y += llama.velocity.y;
        } else {
            console.error(`羊驼Y速度是NaN，重置为0`);
            llama.velocity.y = 0;
        }
        
        // 应用随机移动
        moveAnimalRandomly(llama, deltaTime, world, worldSize);
        
        // 添加动画更新
        animateLlamaLegs(llama, deltaTime);
        
        // 最后检查位置是否合法
        if (isNaN(llama.position.y)) {
            console.error(`更新后羊驼Y坐标是NaN，重置为安全值`);
            llama.position.y = 10;
        }
    });
}

// 修改随机移动函数，确保碰撞后的方向变化与前面的逻辑一致
function moveAnimalRandomly(animal, deltaTime, world, worldSize) {
    // 如果动物没有移动相关属性，初始化它们
    if (!animal.moveProps) {
        animal.moveProps = {
            // 移动状态: idle, walking
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
            directionChangeInterval: 500
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
            
            // 修改：调整方向计算，使羊驼正向前进
            // 由于羊驼模型头部在Z轴负方向，需要反转方向向量
            props.direction.set(
                -Math.sin(angle), // 反转X方向
                0,
                -Math.cos(angle)  // 反转Z方向
            );
            
            // 更新动物朝向 - 反转角度使其面向前进方向
            animal.rotation.y = angle + Math.PI *2; // 添加180度旋转
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
            
            // 检测碰撞
            let hasCollision = false;
            if (inBounds) {
                const floorX = Math.floor(newPosX);
                const floorY = Math.floor(animal.position.y);
                const floorZ = Math.floor(newPosZ);
                
                // 简单碰撞检测：检查前方是否有方块
                if (floorY < worldSize - 1 && floorY >= 0) {
                    try {
                        hasCollision = world[floorX][floorY][floorZ] !== window.blockTypes.air ||
                                      world[floorX][floorY + 1][floorZ] !== window.blockTypes.air;
                    } catch (e) {
                        console.error(`碰撞检测错误: x=${floorX}, y=${floorY}, z=${floorZ}`, e);
                    }
                }
            }
            
            // 如果没有碰撞且在边界内，更新位置
            if (!hasCollision && inBounds) {
                animal.position.x = newPosX;
                animal.position.z = newPosZ;
            } else {
                // 如果发生碰撞或超出边界，改变方向
                const newAngle = Math.random() * Math.PI * 2;
                // 修改：保持与上面相同的反转逻辑
                props.direction.set(
                    -Math.sin(newAngle),
                    0,
                    -Math.cos(newAngle)
                );
                // 修改：保持与上面相同的旋转逻辑
                animal.rotation.y = newAngle + Math.PI;
            }
        }
    }
}

// 初始化动物系统
function initAnimalSystem(scene, world, worldSize, textureLoader) {
    console.log("正在初始化动物系统...");
    
    if (!window.blockTypes) {
        console.error("错误: blockTypes 未定义！");
        return { 
            animals: { llamas: [] }, 
            update: function() {} // 空函数
        };
    }
    
    console.log("blockTypes 已加载:", window.blockTypes);
    
    let animals;
    try {
        animals = {
            llamas: placeLlamasRandomly(scene, world, worldSize, textureLoader)
        };
    } catch (e) {
        console.error("生成羊驼时发生错误:", e);
        animals = { llamas: [] };
    }
    
    console.log(`已创建 ${animals.llamas.length} 只羊驼`);
    
    // 返回包含更新函数的对象
    return {
        animals: animals,
        update: function(deltaTime) {
            try {
                updateLlamas(animals.llamas, world, worldSize, deltaTime);
            } catch (e) {
                console.error("更新羊驼时发生错误:", e);
            }
        }
    };
}

// 导出函数
export {
    createLlamaModel,
    placeLlamasRandomly,
    initAnimalSystem
};
