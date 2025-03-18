// 添加简化版柏林噪声函数
function perlinNoise2D() {
    // 创建梯度网格
    const gradients = {};
    const gridSize = 8; // 网格大小

    // 创建随机梯度向量
    function createGradient(ix, iz) {
        const key = ix + "," + iz;
        if (!gradients[key]) {
            const angle = Math.random() * Math.PI * 2;
            gradients[key] = [Math.cos(angle), Math.sin(angle)];
        }
        return gradients[key];
    }

    // 点积计算
    function dotProduct(ix, iz, x, z) {
        const gradient = createGradient(ix, iz);
        const dx = x - ix;
        const dz = z - iz;
        return dx * gradient[0] + dz * gradient[1];
    }

    // 平滑插值
    function smootherStep(t) {
        return t * t * t * (t * (t * 6 - 15) + 10);
    }

    // 线性插值
    function interpolate(a, b, t) {
        return a + smootherStep(t) * (b - a);
    }

    // 生成噪声
    return function (x, z) {
        // 缩放坐标到网格大小
        x = x / gridSize;
        z = z / gridSize;

        // 获取网格单元坐标
        const x0 = Math.floor(x);
        const z0 = Math.floor(z);
        const x1 = x0 + 1;
        const z1 = z0 + 1;

        // 计算相对坐标
        const sx = x - x0;
        const sz = z - z0;

        // 计算四个角的贡献
        const n0 = dotProduct(x0, z0, x, z);
        const n1 = dotProduct(x1, z0, x, z);
        const ix0 = interpolate(n0, n1, sx);

        const n2 = dotProduct(x0, z1, x, z);
        const n3 = dotProduct(x1, z1, x, z);
        const ix1 = interpolate(n2, n3, sx);

        // 最终插值
        const value = interpolate(ix0, ix1, sz);

        // 映射到[0,1]范围
        return (value + 1) * 0.5;
    };
}

// 生成地形
function generateTerrain(world, worldSize, blockTypes) {
    console.log("使用柏林噪声生成地形...");

    // 创建柏林噪声函数
    const noise = perlinNoise2D();

    // 创建初始高度图
    const heightMap = [];
    for (let x = 0; x < worldSize; x++) {
        heightMap[x] = [];
        for (let z = 0; z < worldSize; z++) {
            // 使用柏林噪声，计算高度，范围为2-6
            // 使用多个频率的噪声相加，创造更丰富的地形
            const baseNoise = noise(x, z);
            const detailNoise = noise(x * 2, z * 2) * 0.5;

            // 混合基础噪声和细节噪声
            const combinedNoise = baseNoise * 0.7 + detailNoise * 0.3;

            // 将噪声值映射到高度范围2-6
            heightMap[x][z] = Math.floor(combinedNoise * 4) + 2;
        }
    }

    // 使用高度图生成实际地形
    for (let x = 0; x < worldSize; x++) {
        for (let z = 0; z < worldSize; z++) {
            const height = heightMap[x][z];

            // 修改这里：从y=1开始而不是y=0，保留底层的基岩
            for (let y = 1; y < height + 1; y++) {
                if (y === height) {
                    world[x][y][z] = blockTypes.grass;
                } else if (y >= height - 2) { // 泥土层厚度调整
                    world[x][y][z] = blockTypes.dirt;
                } else {
                    world[x][y][z] = blockTypes.stone;
                }
            }
        }
    }

    // 添加一些随机变化，使地形更自然
    const smoothingPasses = 1;
    for (let pass = 0; pass < smoothingPasses; pass++) {
        for (let x = 1; x < worldSize - 1; x++) {
            for (let z = 1; z < worldSize - 1; z++) {
                // 有10%的概率在平坦区域创建小山丘或洼地
                if (Math.random() < 0.3) {
                    const currentHeight = heightMap[x][z];
                    const neighborAvg = (heightMap[x - 1][z] + heightMap[x + 1][z] +
                        heightMap[x][z - 1] + heightMap[x][z + 1]) / 4;

                    // 如果周围较平坦，则添加一些随机变化
                    if (Math.abs(currentHeight - neighborAvg) < 0.5) {
                        const newHeight = currentHeight + (Math.random() > 0.5 ? 1 : -1);
                        // 确保高度在有效范围内
                        const adjustedHeight = Math.max(2, Math.min(6, newHeight));

                        // 如果高度增加，需要添加方块
                        if (adjustedHeight > currentHeight) {
                            for (let y = currentHeight; y < adjustedHeight; y++) {
                                if (y === adjustedHeight - 1) {
                                    world[x][y][z] = blockTypes.grass;
                                    // 将之前的草方块转为泥土
                                    if (currentHeight > 0) {
                                        world[x][currentHeight - 1][z] = blockTypes.dirt;
                                    }
                                } else {
                                    world[x][y][z] = blockTypes.dirt;
                                }
                            }
                        }
                        // 如果高度减少，需要移除方块并将新的顶层设为草
                        else if (adjustedHeight < currentHeight) {
                            for (let y = adjustedHeight; y < currentHeight; y++) {
                                world[x][y][z] = blockTypes.air;
                            }
                            if (adjustedHeight > 0) {
                                world[x][adjustedHeight - 1][z] = blockTypes.grass;
                            }
                        }

                        heightMap[x][z] = adjustedHeight;
                    }
                }
            }
        }
    }
    
    return heightMap; // 返回高度图以供其他函数使用
}

// 生成单棵树
function generateTree(world, worldSize, blockTypes, x, y, z) {
    const height = Math.floor(Math.random() * 3) + 4;
    // 树干
    for (let dy = 1; dy <= height; dy++) {
        if (y + dy < worldSize) {
            world[x][y + dy][z] = blockTypes.tree;
        }
    }
    // 树冠
    const crownSize = Math.floor(Math.random() * 2) + 2;
    for (let dx = -crownSize; dx <= crownSize; dx++) {
        for (let dz = -crownSize; dz <= crownSize; dz++) {
            for (let dy = height; dy < height + crownSize; dy++) {
                const distance = Math.sqrt(dx * dx + dz * dz);
                if (distance < crownSize && Math.random() > 0.3) {
                    const tx = x + dx;
                    const ty = y + dy;
                    const tz = z + dz;

                    // 确保在世界范围内
                    if (tx >= 0 && tx < worldSize &&
                        ty >= 0 && ty < worldSize &&
                        tz >= 0 && tz < worldSize) {
                        world[tx][ty][tz] = blockTypes.leaves;
                    }
                }
            }
        }
    }
}

// 随机生成树
function generateTrees(world, worldSize, blockTypes) {
    // 增加树木数量为5-10棵
    const treeCount = Math.floor(Math.random() * 6) + 5;
    console.log(`正在生成 ${treeCount} 棵树...`);

    // 追踪已放置的树
    let placedTrees = 0;
    let attempts = 0;
    const maxAttempts = 100; // 防止无限循环

    while (placedTrees < treeCount && attempts < maxAttempts) {
        const x = Math.floor(Math.random() * worldSize);
        const z = Math.floor(Math.random() * worldSize);

        // 找到该位置的地面高度
        let groundY = -1;
        for (let y = worldSize - 1; y >= 0; y--) {
            if (world[x][y][z] === blockTypes.grass) {
                groundY = y;
                break;
            }
        }

        // 如果找到草地，且周围有足够空间，则种树
        if (groundY >= 0) {
            // 检查是否与其他树太近
            let tooClose = false;
            const minTreeDistance = 5; // 树之间的最小距离

            // 简单检查：如果4个方向都有足够的空间
            for (let dx = -minTreeDistance; dx <= minTreeDistance; dx++) {
                for (let dz = -minTreeDistance; dz <= minTreeDistance; dz++) {
                    const nx = x + dx;
                    const nz = z + dz;

                    // 跳过自己的位置
                    if (dx === 0 && dz === 0) continue;

                    // 确保在边界内
                    if (nx >= 0 && nx < worldSize && nz >= 0 && nz < worldSize) {
                        // 检查该位置是否为树干
                        for (let y = groundY + 1; y < groundY + 5; y++) {
                            if (y < worldSize && world[nx][y][nz] === blockTypes.tree) {
                                tooClose = true;
                                break;
                            }
                        }
                    }

                    if (tooClose) break;
                }

                if (tooClose) break;
            }

            if (!tooClose) {
                generateTree(world, worldSize, blockTypes, x, groundY, z);
                placedTrees++;
            }
        }

        attempts++;
    }
}

// 创建世界数组
function createWorld(worldSize, defaultBlock) {
    const world = [];
    for (let x = 0; x < worldSize; x++) {
        world[x] = [];
        for (let y = 0; y < worldSize; y++) {
            world[x][y] = [];
            for (let z = 0; z < worldSize; z++) {
                world[x][y][z] = defaultBlock;
            }
        }
    }
    return world;
}

// 初始化并渲染世界
function initWorld(worldSize, blockTypes, renderCallback) {
    // 创建世界数组
    const world = createWorld(worldSize, blockTypes.air);
    
    // 添加基岩层 - 在最底层 (y=0) 生成一层基岩
    for (let x = 0; x < worldSize; x++) {
        for (let z = 0; z < worldSize; z++) {
            world[x][0][z] = blockTypes.bedrock; // 将底层全部设为基岩
        }
    }
    
    // 生成地形 - 现在地形生成从y=1开始，不会覆盖基岩
    generateTerrain(world, worldSize, blockTypes);
    
    // 生成树木
    generateTrees(world, worldSize, blockTypes);
    
    // 如果提供了渲染回调，则渲染世界
    if (renderCallback) {
        renderCallback(world);
    }
    
    return world;
}

export { 
    perlinNoise2D, 
    generateTerrain, 
    generateTree, 
    generateTrees, 
    createWorld,
    initWorld
};
