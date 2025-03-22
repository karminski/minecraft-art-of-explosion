// 道具栏功能
const inventory = {
    items: [
        { name: 'pickaxe', texture: 'assets/images/pickaxe.png', count: 1 },
        { name: 'tnt', texture: 'assets/images/tnt-side.jpg', count: 10 },
        { name: 'dirt', texture: 'assets/images/dirt.png', count: 0 },
        { name: 'stone', texture: 'assets/images/stone.png', count: 0 },
        { name: 'tree', texture: 'assets/images/tree.png', count: 0 },
        { name: 'leaves', texture: 'assets/images/leaves.png', count: 0 },
        { name: 'empty', texture: '', count: 0 },
        { name: 'empty', texture: '', count: 0 }
    ],
    selectedIndex: 0,
    infiniteMode: false // 添加无限模式标志
};

// 添加这个全局变量用于存储手持物品引用
let heldItemMesh = null;

// 创建道具栏
function createInventoryUI(config) {

    // 获取配置并设置TNT数量
    const tntDefaultNum = config.gameConfig.tntDefaultNum;
    inventory.items[1].count = tntDefaultNum;

    // 创建道具栏UI
    const inventoryElement = document.getElementById('inventory');
    inventoryElement.innerHTML = '';

    inventory.items.forEach((item, index) => {
        const slotElement = document.createElement('div');
        slotElement.className = 'inventory-slot';
        if (index === inventory.selectedIndex) {
            slotElement.classList.add('selected');
        }

        if (item.texture) {
            const itemElement = document.createElement('img');
            itemElement.src = item.texture;
            itemElement.className = 'inventory-item';
            slotElement.appendChild(itemElement);
        }

        // 添加数量显示
        if (item.count > 0) {
            const countElement = document.createElement('div');
            countElement.className = 'item-count';
            countElement.textContent = `x${item.count}`;
            slotElement.appendChild(countElement);
        }

        slotElement.addEventListener('click', () => {
            inventory.selectedIndex = index;
            updateInventoryUI();
        });

        inventoryElement.appendChild(slotElement);
    });
}


// 更新道具栏UI
function updateInventoryUI(character, blockTypes, textures, materials) {
    const slots = document.querySelectorAll('.inventory-slot');
    slots.forEach((slot, index) => {
        // 更新选中状态
        slot.classList.remove('selected');
        if (index === inventory.selectedIndex) {
            slot.classList.add('selected');
        }

        // 清除旧的计数元素
        const countElements = slot.getElementsByClassName('item-count');
        while (countElements.length > 0) {
            slot.removeChild(countElements[0]);
        }

        // 添加新的计数显示
        const count = inventory.items[index].count;
        if (count > 0 || (inventory.infiniteMode && inventory.items[index].name !== 'empty')) {
            const countElement = document.createElement('div');
            countElement.className = 'item-count';
            
            // 在无限模式下，显示∞符号而不是数量
            if (inventory.infiniteMode && inventory.items[index].name !== 'empty') {
                countElement.textContent = '∞';
                countElement.style.fontSize = '24px'; // 增大∞符号的显示
                countElement.style.color = '#ffd700'; // 金色，增强视觉效果
            } else {
                countElement.textContent = `x${count}`;
            }
            
            slot.appendChild(countElement);
        }
    });

    // 调试信息
    console.log("物品栏已更新:", inventory.items.map(item => item.count));

    // 更新手持物品
    updateHeldItem(character, blockTypes, textures, materials);
}


// 添加这个新函数来更新手持物品
function updateHeldItem(character, blockTypes, textures, materials) {
    // 先移除旧的手持物品（如果存在）
    if (heldItemMesh) {
        character.rightArm.remove(heldItemMesh);
        heldItemMesh.geometry.dispose();
        if (heldItemMesh.material) {
            if (Array.isArray(heldItemMesh.material)) {
                heldItemMesh.material.forEach(m => m.dispose());
            } else {
                heldItemMesh.material.dispose();
            }
        }
        heldItemMesh = null;
    }

    // 获取当前选中的物品
    const selectedItem = inventory.items[inventory.selectedIndex];

    // 如果物品数量为0或者是道具1（矿镐）则不创建手持物品
    if (selectedItem.count <= 0 && inventory.selectedIndex !== 0) {
        return;
    }

    // 根据选中的物品创建对应的方块
    if (inventory.selectedIndex >= 1) {
        let blockType;
        switch (inventory.selectedIndex) {
            case 1: // TNT
                blockType = blockTypes.tnt;
                break;
            case 2: // 泥土
                blockType = blockTypes.dirt;
                break;
            case 3: // 石头
                blockType = blockTypes.stone;
                break;
            case 4: // 木头
                blockType = blockTypes.tree;
                break;
            case 5: // 树叶
                blockType = blockTypes.leaves;
                break;
            default:
                return; // 其他道具暂不处理
        }

        // 创建半尺寸的方块几何体
        const geometry = new THREE.BoxGeometry(0.5, 0.5, 0.5);

        let material;

        // 根据方块类型创建材质
        if (blockType === blockTypes.tnt) {
            // TNT使用多种材质
            material = [
                new THREE.MeshPhongMaterial({ map: textures.tntSide }), // 右侧
                new THREE.MeshPhongMaterial({ map: textures.tntSide }), // 左侧
                new THREE.MeshPhongMaterial({ map: textures.tntTop }), // 顶部
                new THREE.MeshPhongMaterial({ map: textures.tntBottom }), // 底部
                new THREE.MeshPhongMaterial({ map: textures.tntSide }), // 前侧
                new THREE.MeshPhongMaterial({ map: textures.tntSide })  // 后侧
            ];
        } else {
            // 其他方块使用单一材质
            material = materials[Object.keys(blockTypes).find(key => blockTypes[key] === blockType)].clone();
        }

        // 创建方块mesh
        heldItemMesh = new THREE.Mesh(geometry, material);

        // 定位方块位置 - 放在右手前端
        heldItemMesh.position.set(0, -1.2, -0.5);

        // 添加到右手
        character.rightArm.add(heldItemMesh);
    }
}

// 增加一个函数来修改物品数量
function changeItemCount(itemIndex, amount) {
    // 如果在无限模式下，不减少物品
    if (inventory.infiniteMode && amount < 0) {
        return true; // 返回成功，但实际上不扣除
    }
    
    // 常规模式下检查和更新数量
    const newCount = inventory.items[itemIndex].count + amount;
    if (newCount < 0) {
        return false; // 数量不足
    }
    
    inventory.items[itemIndex].count = newCount;
    return true;
}

// 添加事件监听器，处理无限模式切换
document.addEventListener('DOMContentLoaded', () => {
    document.addEventListener('infinite-items', (event) => {
        inventory.infiniteMode = event.detail.active;
        console.log(`道具栏无限模式: ${inventory.infiniteMode ? '开启' : '关闭'}`);
        
        // 更新UI显示
        updateInventoryUI(window.MinecraftArtOfExplode.character, 
                         window.MinecraftArtOfExplode.blockTypes, 
                         window.MinecraftArtOfExplode.textures, 
                         window.MinecraftArtOfExplode.materials);
    });
});

export {
    inventory,
    heldItemMesh,
    createInventoryUI,
    updateInventoryUI,
    updateHeldItem,
    changeItemCount
};
