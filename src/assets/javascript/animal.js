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
    
    
    // 添加所有部分到羊驼组
    llamaGroup.add(head, body, legFrontLeft, legFrontRight, legBackLeft, legBackRight);
    
    // 设置整体比例和位置
    llamaGroup.scale.set(0.4, 0.4, 0.4); // 调整为游戏比例
    llamaGroup.position.y = 0.6;
    
    
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
    const count = 40; // 固定生成3只进行测试
    
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
            let spawnY = 30; // 默认高度
            try {
                spawnY = findLlamaSpawnHeight(world, x, z, worldSize) + 5;
                console.log(`计算得到生成高度: y=${spawnY}`);
                
                // 确保Y不是NaN
                if (isNaN(spawnY)) {
                    console.error(`生成高度是NaN，使用默认值`);
                    spawnY = 30;
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
    // 如果羊驼被标记为暂停动画，则跳过动画更新
    if (llama.pauseAnimation) return;
    
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
function updateLlamas(llamas, world, worldSize, deltaTime, player = null, animals = null) {
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
        let groundHeight = -1;
        
        // 修改为先寻找所有腿下的最高点，然后设置统一高度，避免抖动
        for (const offset of rotatedLegOffsets) {
            const legX = Math.floor(llama.position.x + offset.x * llama.scale.x);
            const legZ = Math.floor(llama.position.z + offset.z * llama.scale.z);
            
            // 如果出现任何NaN坐标，跳过这一条腿的检查
            if (isNaN(legX) || isNaN(legZ)) {
                continue;
            }
            
            // 检查腿下方的几个方块，找出最高的地面
            for (let checkY = Math.floor(llama.position.y - 1); checkY >= 0 && checkY >= Math.floor(llama.position.y) - 3; checkY--) {
                // 安全地检查是否在世界边界内
                const inBounds = (
                    legX >= 0 && legX < worldSize && 
                    checkY >= 0 && checkY < worldSize && 
                    legZ >= 0 && legZ < worldSize
                );
                
                if (inBounds) {
                    try {
                        // 检查腿部下方的方块
                        if (world[legX][checkY][legZ] !== window.blockTypes.air && 
                            world[legX][checkY][legZ] !== window.blockTypes.leaves) {
                            isCollidingWithGround = true;
                            
                            // 修正：调整羊驼站立高度计算
                            // 原来使用 checkY + 1 + 0.8，这可能导致腿部陷入方块
                            // 羊驼模型缩放为0.4，腿部高度约为2.8 * 0.4 = 1.12格
                            // 考虑到腿部位置在-0.4，实际腿部底端距离羊驼中心约为 1.12 + 0.4 = 1.52格
                            // 所以我们需要设置羊驼中心高度为 方块顶面 + 腿部长度一半
                            const thisHeight = checkY + 1 + 1.25; // 方块顶面高度 + 足够腿部高度的偏移
                            
                            groundHeight = Math.max(groundHeight, thisHeight);
                            break; // 找到了这条腿下的地面，不需要继续向下检查
                        }
                    } catch (e) {
                        console.error(`访问世界数组错误: x=${legX}, y=${checkY}, z=${legZ}`, e);
                    }
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
            // 确保正好站在方块顶部，统一高度避免抖动
            if (groundHeight > 0) {
                // 平滑过渡到正确的高度，但增加目标高度的权重确保羊驼不会下沉
                // 从原来的0.5:0.5调整为0.3:0.7，让羊驼更快地达到目标高度
                llama.position.y = llama.position.y * 0.3 + groundHeight * 0.7;
            }
            llama.isGrounded = true;
        }
        
        // 应用速度前检查是否为NaN
        if (!isNaN(llama.velocity.y)) {
            llama.position.y += llama.velocity.y;
        } else {
            console.error(`羊驼Y速度是NaN，重置为0`);
            llama.velocity.y = 0;
        }
        
        // 应用随机移动，传入player和animals参数用于碰撞检测
        moveAnimalRandomly(llama, deltaTime, world, worldSize, player, animals);
        
        // 添加动画更新
        animateLlamaLegs(llama, deltaTime);
        
        // 最后检查位置是否合法
        if (isNaN(llama.position.y)) {
            console.error(`更新后羊驼Y坐标是NaN，重置为安全值`);
            llama.position.y = 10;
        }
    });
}

// 修改随机移动函数，使动物转向更自然
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
            // 新增：目标旋转角度
            targetRotation: 0,
            // 新增：当前转向持续时间
            turningTimeRemaining: 0,
            // 新增：转向速度 (弧度/毫秒)
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
            
            // 修改：调整方向计算，使羊驼正向前进
            // 由于羊驼模型头部在Z轴负方向，需要反转方向向量
            props.direction.set(
                -Math.sin(angle), // 反转X方向
                0,
                -Math.cos(angle)  // 反转Z方向
            );
            
            // 更新动物朝向 - 反转角度使其面向前进方向
            animal.rotation.y = angle + Math.PI * 2; // 添加360度旋转
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
            
            // 增强的碰撞检测
            let hasCollision = false;
            if (inBounds) {
                const floorX = Math.floor(newPosX);
                const floorY = Math.floor(animal.position.y);
                const floorZ = Math.floor(newPosZ);
                
                try {
                    // 定义羊驼的高度范围 (从腿部到头部)
                    // 羊驼缩放为0.4倍，总高度约为4个方块，需要检查的高度是地面以上3格
                    const animalHeight = 3; 
                    
                    // 检测前方各个高度的方块
                    for (let heightOffset = 0; heightOffset < animalHeight; heightOffset++) {
                        const checkY = floorY + heightOffset;
                        
                        // 超出世界边界的不检测
                        if (checkY >= worldSize || checkY < 0) continue;
                        
                        // 获取该位置的方块类型
                        const blockType = world[floorX][checkY][floorZ];
                        
                        // 如果是空气或树叶，则继续检测更高的方块
                        if (blockType === window.blockTypes.air || blockType === window.blockTypes.leaves) continue;
                        
                        // 如果是高度为1的方块并且在地面层，羊驼可以跨过
                        if (heightOffset === 0 && isLowBlock(blockType)) {
                            // 低矮方块不阻挡移动
                            continue;
                        }
                        
                        // 其他情况 (高于1的方块或高度位置不是地面层的方块) 视为碰撞
                        hasCollision = true;
                        break;
                    }
                    
                    // 额外检查头部高度的碰撞
                    // 羊驼头部在前方，需要检查头部区域
                    const headX = Math.floor(newPosX + props.direction.x * 0.8); // 头部前方位置
                    const headZ = Math.floor(newPosZ + props.direction.z * 0.8);
                    
                    // 只有在边界内才检查
                    if (headX >= 0 && headX < worldSize && headZ >= 0 && headZ < worldSize) {
                        // 检查头部高度的方块
                        const headY = floorY + 2; // 头部大约在地面以上2格高
                        
                        if (headY >= 0 && headY < worldSize &&
                            world[headX][headY][headZ] !== window.blockTypes.air &&
                            world[headX][headY][headZ] !== window.blockTypes.leaves) {
                            hasCollision = true;
                        }
                    }
                    
                    // 检查与玩家的碰撞
                    if (player) {
                        const playerPos = player.position;
                        
                        // 使用简单的碰撞盒：距离小于1.5个方块
                        const distanceToPlayer = Math.sqrt(
                            Math.pow(newPosX - playerPos.x, 2) + 
                            Math.pow(newPosZ - playerPos.z, 2)
                        );
                        
                        if (distanceToPlayer < 1.5) {
                            hasCollision = true;
                        }
                    }
                    
                    // 检查与其他羊驼的碰撞
                    if (animals && animals.llamas) {
                        for (const otherLlama of animals.llamas) {
                            // 不要与自己碰撞检测
                            if (otherLlama === animal) continue;
                            
                            // 检查与其他羊驼的距离
                            const distanceToLlama = Math.sqrt(
                                Math.pow(newPosX - otherLlama.position.x, 2) + 
                                Math.pow(newPosZ - otherLlama.position.z, 2)
                            );
                            
                            // 如果太近，视为碰撞
                            if (distanceToLlama < 1.2) {
                                hasCollision = true;
                                break;
                            }
                        }
                    }
                } catch (e) {
                    console.error(`碰撞检测错误: x=${floorX}, y=${floorY}, z=${floorZ}`, e);
                }
            }
            
            // 如果没有碰撞且在边界内，更新位置
            if (!hasCollision && inBounds) {
                animal.position.x = newPosX;
                animal.position.z = newPosZ;
            } else {
                // 如果发生碰撞或超出边界，进入转向状态
                
                // 计算新的前进方向 - 不直接向后转，而是向左或向右避开障碍物
                // 获取当前前进方向角度
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

// 辅助函数：判断方块是否为可以越过的低矮方块(高度为1)
function isLowBlock(blockType) {
    // 定义所有高度为1的方块类型
    const lowBlocks = [
        window.blockTypes.flower,
        window.blockTypes.tallgrass,
        window.blockTypes.redstoneTorch,
        window.blockTypes.fire,
        window.blockTypes.redstoneWire
        // 可以添加其他高度为1的方块类型
    ];
    
    return lowBlocks.includes(blockType);
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
        update: function(deltaTime, player = null) {
            try {
                updateLlamas(animals.llamas, world, worldSize, deltaTime, player, animals);
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
