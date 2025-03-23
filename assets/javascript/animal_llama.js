// 导入Three.js库（假设已在全局范围内）
// import * as THREE from 'three';
import { mapBlockUVs, createAnimalTexture } from './utils.js';
import { AnimalBase } from './animal.js';

// 羊驼特有的配置和行为
class LlamaAnimal extends AnimalBase {
    constructor(scene, textureLoader) {
        super();
        
        // 羊驼特有的参数
        this.type = 'llama';
        this.defaultSpeed = 0.005; // 提高速度，原来是0.0015
        this.animProps = {
            animationTime: 0,
            walkingSpeed: 0.2,
            maxSwingAngle: Math.PI / 6 // 羊驼腿摆动的最大角度 (30度)
        };
        
        // 创建模型
        this.model = this.createModel(scene, textureLoader);
        
        // 返回模型引用
        return this.model;
    }
    
    // 创建羊驼模型
    createModel(scene, textureLoader) {
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
        function createLeg(x, z, name) {
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
            leg.name = name;  // 添加名称标识
            return leg;
        }
        
        // 腿部位置基于ModelLlama.java的设置
        const legFrontLeft = createLeg(-0.5, -0.8, 'frontLeftLeg');
        const legFrontRight = createLeg(0.5, -0.8, 'frontRightLeg');
        const legBackLeft = createLeg(-0.5, 1.2, 'backLeftLeg');
        const legBackRight = createLeg(0.5, 1.2, 'backRightLeg');
        
        // 添加所有部分到羊驼组
        llamaGroup.add(head, body, legFrontLeft, legFrontRight, legBackLeft, legBackRight);
        
        // 设置整体比例和位置
        llamaGroup.scale.set(0.4, 0.4, 0.4); // 调整为游戏比例
        
        // 添加默认移动速度和动画参数
        llamaGroup.defaultSpeed = this.defaultSpeed;
        llamaGroup.animProps = this.animProps;
        
        // 添加类型标识
        llamaGroup.animalType = 'llama';
        
        // 添加对这个类的引用，用于调用动画方法
        llamaGroup.controller = this;
        
        return llamaGroup;
    }
    
    // 羊驼特有的腿部动画
    animateLegs(animal, deltaTime) {
        // 如果羊驼被标记为暂停动画，则跳过动画更新
        if (animal.pauseAnimation) return;
        
        // 如果羊驼正在移动
        if (animal.moveProps && animal.moveProps.state === 'walking') {
            // 更新动画计时器
            animal.animProps.animationTime += animal.animProps.walkingSpeed * (deltaTime / 16);
            
            // 计算腿部摆动角度(使用正弦函数)
            const swingAngle = Math.sin(animal.animProps.animationTime) * animal.animProps.maxSwingAngle;
            
            // 通过名称获取四条腿
            const frontLeftLeg = animal.getObjectByName('frontLeftLeg');
            const frontRightLeg = animal.getObjectByName('frontRightLeg');
            const backLeftLeg = animal.getObjectByName('backLeftLeg');
            const backRightLeg = animal.getObjectByName('backRightLeg');
            
            // 对角腿同步摆动（类似于四足动物的跑步模式）
            if (frontLeftLeg) frontLeftLeg.rotation.x = swingAngle;
            if (backRightLeg) backRightLeg.rotation.x = swingAngle;
            
            if (frontRightLeg) frontRightLeg.rotation.x = -swingAngle;
            if (backLeftLeg) backLeftLeg.rotation.x = -swingAngle;
        } else {
            // 如果羊驼静止，重置腿部位置
            animal.animProps.animationTime = 0;
            
            // 获取所有腿并重置
            const legs = ['frontLeftLeg', 'frontRightLeg', 'backLeftLeg', 'backRightLeg'];
            legs.forEach(legName => {
                const leg = animal.getObjectByName(legName);
                if (leg) leg.rotation.x = 0;
            });
        }
    }

    // 在世界中随机放置羊驼
    static placeRandomly(scene, world, worldSize, textureLoader, count = 120, blockTypes) {
        const llamas = [];
        
        console.log(`尝试生成 ${count} 只羊驼...`);
        console.log(`世界大小: ${worldSize}`);
        
        for (let i = 0; i < count; i++) {
            try {
                // 创建一只新羊驼
                const llama = new LlamaAnimal(scene, textureLoader);
                
                // 设置安全边界距离，避免生成在世界边缘
                const safeMargin = 5;
                
                // 在安全范围内随机生成坐标
                const x = safeMargin + Math.floor(Math.random() * (worldSize - 2 * safeMargin));
                const z = safeMargin + Math.floor(Math.random() * (worldSize - 2 * safeMargin));
                
                console.log(`生成羊驼 #${i} 在坐标: x=${x}, z=${z}`);
                
                // 安全地找到生成高度
                let spawnY = 30; // 默认高度
                try {
                    spawnY = LlamaAnimal.findSpawnHeight(world, x, z, worldSize, blockTypes) + 5;
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
    static findSpawnHeight(world, x, z, worldSize, blockTypes) {
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
                
                if (world[x][y][z] !== blockTypes.air) {
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
    
    // 补充羊驼
    static replenish(scene, world, worldSize, textureLoader, animals, countToAdd, blockTypes) {
        console.log(`准备补充 ${countToAdd} 只羊驼`);
        
        try {
            // 一次最多补充500只，避免突然生成太多导致卡顿
            const batchSize = Math.min(countToAdd, 500);
            
            // 创建新羊驼并添加到现有数组中
            for (let i = 0; i < batchSize; i++) {
                const llama = new LlamaAnimal(scene, textureLoader);
                
                // 在整个世界范围内随机生成羊驼，而不是只在边缘
                const safeMargin = 5; // 保留边界安全距离
                
                // 在安全范围内随机生成坐标
                const x = safeMargin + Math.floor(Math.random() * (worldSize - 2 * safeMargin));
                const z = safeMargin + Math.floor(Math.random() * (worldSize - 2 * safeMargin));
                
                // 确定安全的生成高度
                const spawnY = LlamaAnimal.findSpawnHeight(world, x, z, worldSize, blockTypes);
                
                // 设置新羊驼的位置和物理属性
                llama.position.set(x + 0.5, spawnY, z + 0.5);
                llama.velocity = new THREE.Vector3(0, 0, 0);
                llama.gravity = 0.005;
                llama.isGrounded = false;
                
                // 添加到场景和数组
                scene.add(llama);
                animals.llamas.push(llama);
            }
            
            console.log(`成功补充 ${batchSize} 只羊驼，当前总数: ${animals.llamas.length}`);
            return batchSize;
        } catch (e) {
            console.error("补充羊驼时出错:", e);
            return 0;
        }
    }
}

// 导出羊驼类
export { LlamaAnimal };
