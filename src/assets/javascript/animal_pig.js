// 导入Three.js库（假设已在全局范围内）
// import * as THREE from 'three';
import { mapBlockUVs, createAnimalTexture } from './utils.js';
import { AnimalBase } from './animal.js';

// 猪特有的配置和行为
class PigAnimal extends AnimalBase {
    constructor(scene, textureLoader) {
        super();
        
        // 猪特有的参数
        this.type = 'pig';
        this.defaultSpeed = 0.03; // 猪的速度比羊驼慢一点
        this.animProps = {
            animationTime: 0,
            walkingSpeed: 0.15,
            maxSwingAngle: Math.PI / 7 // 猪腿摆动的最大角度
        };
        
        // 创建模型
        this.model = this.createModel(scene, textureLoader);
        
        // 返回模型引用
        return this.model;
    }
    
    // 创建猪模型
    createModel(scene, textureLoader) {
        const pigGroup = new THREE.Group();
        
        // 随机选择一种猪纹理
        const pigColors = ['pig']; // 不同的猪皮肤
        const randomColor = pigColors[Math.floor(Math.random() * pigColors.length)];
        const texturePath = `assets/images/pig/${randomColor}.png`;
        
        // 创建材质
        const pigMaterial = createAnimalTexture(textureLoader, texturePath);
        
        // 构建猪的身体部件
        // 头部
        const head = new THREE.Group();
        
        // 主要头部
        const headGeometry = new THREE.BoxGeometry(0.8, 0.8, 0.8);
        mapBlockUVs(headGeometry, {
            top: [8/64, 1 - 0/32, 16/64, 1 - 8/32],
            bottom: [16/64, 1 - 0/32, 24/64, 1 - 8/32],
            front: [8/64, 1 - 8/32, 16/64, 1 - 16/32],
            back: [24/64, 1 - 8/32, 32/64, 1 - 16/32],
            right: [0/64, 1 - 8/32, 8/64, 1 - 16/32],
            left: [16/64, 1 - 8/32, 24/64, 1 - 16/32]
        });
        const headMain = new THREE.Mesh(headGeometry, pigMaterial);
        
        // 吻部（鼻子）
        const snoutGeometry = new THREE.BoxGeometry(0.4, 0.3, 0.1);
        mapBlockUVs(snoutGeometry, {
            top: [17/64, 1 - 16/32, 21/64, 1 - 17/32],
            bottom: [21/64, 1 - 16/32, 25/64, 1 - 17/32],
            front: [17/64, 1 - 17/32, 21/64, 1 - 20/32],
            back: [0/64, 1 - 0/32, 0/64, 1 - 0/32], // 不可见
            right: [21/64, 1 - 17/32, 22/64, 1 - 20/32],
            left: [16/64, 1 - 17/32, 17/64, 1 - 20/32]
        });
        const snout = new THREE.Mesh(snoutGeometry, pigMaterial);
        snout.position.set(0, -0.1, -0.5);
        
        // 头部整体
        head.add(headMain, snout);
        head.position.set(0.0, -0.7, -0.8);
        
        // 身体（圆胖）
        const bodyGeometry = new THREE.BoxGeometry(1.0, 0.8, 1.6);
        mapBlockUVs(bodyGeometry, {
            top: [36/64, 1 - 16/32, 46/64, 1 - 32/32],
            bottom: [56/64, 1 - 16/32, 64/64, 1 - 32/32],
            front: [36/64, 1 - 8/32, 46/64, 1 - 16/32],
            back: [46/64, 1 - 8/32, 56/64, 1 - 16/32],
            right: [46/64, 1 - 16/32, 56/64, 1 - 32/32],
            left: [28/64, 1 - 16/32, 36/64, 1 - 32/32]
        });
        const body = new THREE.Mesh(bodyGeometry, pigMaterial);
        body.position.set(0, -0.9, 0.2);
        
        // 创建腿部
        function createLeg(x, z, name) {
            const legGeometry = new THREE.BoxGeometry(0.4, 0.6, 0.4);
            mapBlockUVs(legGeometry, {
                top: [4/64, 1 - 16/32, 8/64, 1 - 20/32],
                bottom: [8/64, 1 - 16/32, 12/64, 1 - 20/32],
                front: [4/64, 1 - 20/32, 8/64, 1 - 26/32],
                back: [12/64, 1 - 20/32, 16/64, 1 - 26/32],
                right: [8/64, 1 - 20/32, 12/64, 1 - 26/32],
                left: [0/64, 1 - 20/32, 4/64, 1 - 26/32]
            });
            
            const leg = new THREE.Mesh(legGeometry, pigMaterial);
            leg.position.set(x, -1.6, z);
            leg.name = name;  // 添加名称标识
            return leg;
        }
        
        // 腿部位置
        const legFrontLeft = createLeg(-0.3, -0.3, 'frontLeftLeg');
        const legFrontRight = createLeg(0.3, -0.3, 'frontRightLeg');
        const legBackLeft = createLeg(-0.3, 0.9, 'backLeftLeg');
        const legBackRight = createLeg(0.3, 0.9, 'backRightLeg');
        
        // 添加所有部分到猪组
        pigGroup.add(head, body, legFrontLeft, legFrontRight, legBackLeft, legBackRight);
        
        // 设置整体比例和位置
        pigGroup.scale.set(0.5, 0.5, 0.5); // 猪比羊驼小一些
        
        // 添加默认移动速度和动画参数
        pigGroup.defaultSpeed = this.defaultSpeed;
        pigGroup.animProps = this.animProps;
        
        // 添加类型标识
        pigGroup.animalType = 'pig';
        
        // 添加对这个类的引用，用于调用动画方法
        pigGroup.controller = this;
        
        return pigGroup;
    }
    
    // 猪特有的腿部动画
    animateLegs(animal, deltaTime) {
        // 如果猪被标记为暂停动画，则跳过动画更新
        if (animal.pauseAnimation) return;
        
        // 如果猪正在移动
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
            
            // 对角腿同步摆动
            if (frontLeftLeg) frontLeftLeg.rotation.x = swingAngle;
            if (backRightLeg) backRightLeg.rotation.x = swingAngle;
            
            if (frontRightLeg) frontRightLeg.rotation.x = -swingAngle;
            if (backLeftLeg) backLeftLeg.rotation.x = -swingAngle;
        } else {
            // 如果猪静止，重置腿部位置
            animal.animProps.animationTime = 0;
            
            // 获取所有腿并重置
            const legs = ['frontLeftLeg', 'frontRightLeg', 'backLeftLeg', 'backRightLeg'];
            legs.forEach(legName => {
                const leg = animal.getObjectByName(legName);
                if (leg) leg.rotation.x = 0;
            });
        }
    }

    // 在世界中随机放置猪
    static placeRandomly(scene, world, worldSize, textureLoader, count = 100) {
        const pigs = [];
        
        console.log(`尝试生成 ${count} 只猪...`);
        console.log(`世界大小: ${worldSize}`);
        
        for (let i = 0; i < count; i++) {
            try {
                // 创建一只新猪
                const pig = new PigAnimal(scene, textureLoader);
                
                // 设置安全边界距离，避免生成在世界边缘
                const safeMargin = 5;
                
                // 在安全范围内随机生成坐标
                const x = safeMargin + Math.floor(Math.random() * (worldSize - 2 * safeMargin));
                const z = safeMargin + Math.floor(Math.random() * (worldSize - 2 * safeMargin));
                
                console.log(`生成猪 #${i} 在坐标: x=${x}, z=${z}`);
                
                // 安全地找到生成高度
                let spawnY = 30; // 默认高度
                try {
                    spawnY = PigAnimal.findSpawnHeight(world, x, z, worldSize) + 5;
                    console.log(`计算得到生成高度: y=${spawnY}`);
                    
                    // 确保Y不是NaN
                    if (isNaN(spawnY)) {
                        console.error(`生成高度是NaN，使用默认值`);
                        spawnY = 30;
                    }
                } catch (e) {
                    console.error(`计算生成高度时出错:`, e);
                }
                
                console.log(`猪 #${i} 最终生成高度: y=${spawnY}`);
                
                // 设置初始位置和物理属性
                pig.position.set(x + 0.5, spawnY, z + 0.5);
                pig.velocity = new THREE.Vector3(0, 0, 0);
                pig.gravity = 0.005; 
                pig.isGrounded = false;
                
                // 随机旋转
                pig.rotation.y = Math.random() * Math.PI * 2;
                
                // 添加到场景
                scene.add(pig);
                pigs.push(pig);
                
                // 再次检查位置是否有效
                if (isNaN(pig.position.y)) {
                    console.error(`生成后的Y坐标是NaN，修正为20`);
                    pig.position.y = 20;
                }
            } catch (e) {
                console.error(`生成猪 #${i} 时出错:`, e);
            }
        }
        
        console.log(`成功生成 ${pigs.length} 只猪`);
        return pigs;
    }

    // 补充猪
    static replenish(scene, world, worldSize, textureLoader, animals, countToAdd, blockTypes) {
        console.log(`准备补充 ${countToAdd} 只猪`);
        
        try {
            // 一次最多补充500只，避免突然生成太多导致卡顿
            const batchSize = Math.min(countToAdd, 500);
            
            // 创建新猪并添加到现有数组中
            for (let i = 0; i < batchSize; i++) {
                const pig = new PigAnimal(scene, textureLoader);
                
                // 在世界边缘生成新猪，而不是中心区域
                const edgeOffset = 5;
                // 随机选择一个边缘位置
                let x, z;
                const side = Math.floor(Math.random() * 4); // 0-3表示四个边
                
                switch (side) {
                    case 0: // 北边
                        x = Math.floor(Math.random() * (worldSize - 2 * edgeOffset)) + edgeOffset;
                        z = edgeOffset;
                        break;
                    case 1: // 东边
                        x = worldSize - edgeOffset - 1;
                        z = Math.floor(Math.random() * (worldSize - 2 * edgeOffset)) + edgeOffset;
                        break;
                    case 2: // 南边
                        x = Math.floor(Math.random() * (worldSize - 2 * edgeOffset)) + edgeOffset;
                        z = worldSize - edgeOffset - 1;
                        break;
                    case 3: // 西边
                        x = edgeOffset;
                        z = Math.floor(Math.random() * (worldSize - 2 * edgeOffset)) + edgeOffset;
                        break;
                }
                
                // 确定安全的生成高度
                const spawnY = PigAnimal.findSpawnHeight(world, x, z, worldSize, blockTypes);
                
                // 设置新猪的位置和物理属性
                pig.position.set(x + 0.5, spawnY, z + 0.5);
                pig.velocity = new THREE.Vector3(0, 0, 0);
                pig.gravity = 0.005;
                pig.isGrounded = false;
                
                // 添加到场景和数组
                scene.add(pig);
                animals.pigs.push(pig);
            }
            
            console.log(`成功补充 ${batchSize} 只猪，当前总数: ${animals.pigs.length}`);
            return batchSize;
        } catch (e) {
            console.error("补充猪时出错:", e);
            return 0;
        }
    }
}

// 导出猪类
export { PigAnimal };
