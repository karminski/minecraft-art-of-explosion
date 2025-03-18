// 导入Three.js库（假设已在全局范围内）
// import * as THREE from 'three';

// 羊驼模型创建函数
function createLlamaModel() {
    const llamaGroup = new THREE.Group();
    
    // 创建材质
    const llamaMaterial = new THREE.MeshLambertMaterial({ color: 0xDDCCAA }); // 浅棕色
    const woolMaterial = new THREE.MeshLambertMaterial({ color: 0xEEEEDD }); // 更浅色的毛皮
    
    // 基于Minecraft的ModelQuadruped和ModelLlama重新构建
    // 头部
    const head = new THREE.Group();
    
    // 主吻部 (基于0, 0区域的纹理，4x4x9大小)
    const snout = new THREE.Mesh(
        new THREE.BoxGeometry(0.8, 0.8, 0.8),
        llamaMaterial
    );
    snout.position.set(0, 0, -1.0);
    
    // 主要头部 (基于0, 14区域的纹理，8x18x6大小)
    const headMain = new THREE.Mesh(
        new THREE.BoxGeometry(1.6, 3.2, 1.2),
        llamaMaterial
    );
    headMain.position.set(0, -0.6, 0);
    
    // 左耳 (基于17, 0区域的纹理, 3x3x2大小)
    const leftEar = new THREE.Mesh(
        new THREE.BoxGeometry(0.6, 0.6, 0.4),
        llamaMaterial
    );
    leftEar.position.set(-0.5, 1.2, 0.0);
    
    // 右耳 (同左耳)
    const rightEar = new THREE.Mesh(
        new THREE.BoxGeometry(0.6, 0.6, 0.4),
        llamaMaterial
    );
    rightEar.position.set(0.5, 1.2, 0.0);
    
    // 头部整体
    head.add(snout, headMain, leftEar, rightEar);
    head.position.set(0, 2.5, -2.0);
    
    // 身体 (基于29, 0区域的纹理，12x18x10大小)
    // 注意：Minecraft中身体是垂直放置的（绕X轴旋转90度）
    const body = new THREE.Mesh(
        new THREE.BoxGeometry(2.4, 3.6, 2.0),
        llamaMaterial
    );
    body.position.set(0, 0.5, 0);
    body.rotation.x = Math.PI / 2; // 关键！垂直放置身体
    
    // 腿部 (基于29, 29区域的纹理，每条腿4x14x4大小)
    function createLeg(x, z) {
        const leg = new THREE.Mesh(
            new THREE.BoxGeometry(0.8, 2.8, 0.8),
            llamaMaterial
        );
        leg.position.set(x, -1.0, z);
        return leg;
    }
    
    // 腿部位置基于ModelLlama.java的设置
    const legFrontLeft = createLeg(-0.5, -0.8);
    const legFrontRight = createLeg(0.5, -0.8);
    const legBackLeft = createLeg(-0.5, 1.2);
    const legBackRight = createLeg(0.5, 1.2);
    
    // 箱子 (基于45, 28和45, 41区域的纹理, 8x8x3大小)
    const chest1 = new THREE.Mesh(
        new THREE.BoxGeometry(0.6, 1.6, 1.6),
        woolMaterial
    );
    chest1.position.set(-1.7, 0.6, 0.6);
    chest1.rotation.y = Math.PI / 2;
    chest1.visible = false;
    
    const chest2 = new THREE.Mesh(
        new THREE.BoxGeometry(0.6, 1.6, 1.6),
        woolMaterial
    );
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
    
    return llamaGroup;
}

// 在世界中随机放置羊驼
function placeLlamasRandomly(scene, world, worldSize) {
    const llamas = [];
    // 减少生成数量，便于调试
    const count = 3; // 固定生成3只进行测试
    
    console.log(`尝试生成 ${count} 只羊驼...`);
    console.log(`世界大小: ${worldSize}`);
    console.log(`blockTypes.air = ${window.blockTypes.air}`);
    
    for (let i = 0; i < count; i++) {
        try {
            // 创建一只新羊驼
            const llama = createLlamaModel();
            
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

// 更新所有羊驼的位置(模拟重力和碰撞)
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
        
        // 检查羊驼下方是否有方块(碰撞检测)
        const position = new THREE.Vector3().copy(llama.position);
        const blockX = Math.floor(position.x);
        const blockY = Math.floor(position.y - 0.5); // 检查脚下
        const blockZ = Math.floor(position.z);
        
        // 如果出现任何NaN坐标，跳过这一帧的更新
        if (isNaN(blockX) || isNaN(blockY) || isNaN(blockZ)) {
            console.error(`羊驼方块坐标有NaN: x=${blockX}, y=${blockY}, z=${blockZ}, 跳过更新`);
            return;
        }
        
        // 安全地检查是否在世界边界内
        const inBounds = (
            blockX >= 0 && blockX < worldSize && 
            blockY >= 0 && blockY < worldSize && 
            blockZ >= 0 && blockZ < worldSize
        );
        
        // 如果超出边界，重置到安全位置
        if (!inBounds) {
            console.log(`羊驼超出边界: x=${blockX}, y=${blockY}, z=${blockZ}`);
            // 将羊驼移到安全位置
            let safeY = Math.max(1, position.y);
            if (isNaN(safeY)) safeY = 10; // 如果还是NaN，使用固定值
            
            llama.position.y = safeY;
            llama.velocity.y = 0;
            return;
        }
        
        // 安全地访问世界数组
        let isCollidingWithGround = false;
        try {
            isCollidingWithGround = world[blockX][blockY][blockZ] !== window.blockTypes.air;
        } catch (e) {
            console.error(`访问世界数组错误: x=${blockX}, y=${blockY}, z=${blockZ}`, e);
            return; // 跳过此羊驼的更新
        }
        
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
            // 确保正好站在方块顶部
            llama.position.y = blockY + 1.5; // +1是方块高度，+0.5是羊驼中心点
            llama.isGrounded = true;
        }
        
        // 应用速度前检查是否为NaN
        if (!isNaN(llama.velocity.y)) {
            llama.position.y += llama.velocity.y;
        } else {
            console.error(`羊驼Y速度是NaN，重置为0`);
            llama.velocity.y = 0;
        }
        
        // 最后检查位置是否合法
        if (isNaN(llama.position.y)) {
            console.error(`更新后羊驼Y坐标是NaN，重置为安全值`);
            llama.position.y = 10;
        }
    });
}

// 初始化动物系统
function initAnimalSystem(scene, world, worldSize) {
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
            llamas: placeLlamasRandomly(scene, world, worldSize)
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
