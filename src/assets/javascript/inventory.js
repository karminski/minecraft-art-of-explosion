// 道具栏功能 - 改用工厂函数模式
function createInventory(blockTypes) {
    // 创建新的库存对象
    return {
        slots: [
            { type: blockTypes.grass, count: 64 },
            { type: blockTypes.dirt, count: 64 },
            { type: blockTypes.stone, count: 64 },
            { type: blockTypes.cobblestone, count: 64 },
            { type: blockTypes.wood, count: 64 },
            { type: blockTypes.planks, count: 64 },
            { type: blockTypes.sand, count: 64 },
            { type: blockTypes.glass, count: 64 },
            { type: blockTypes.tnt, count: 64 }
        ],
        selectedIndex: 0
    };
}

// 添加这个全局变量用于存储手持物品引用
let heldItemMesh = null;

// 创建道具栏
function createInventoryUI(inventory) {
    const inventoryElement = document.getElementById('inventory');
    inventoryElement.innerHTML = '';

    inventory.slots.forEach((slot, index) => {
        const slotElement = document.createElement('div');
        slotElement.className = 'inventory-slot';
        if (index === inventory.selectedIndex) {
            slotElement.classList.add('selected');
        }

        if (slot.type && slot.type.texture) {
            const itemElement = document.createElement('img');
            itemElement.src = slot.type.texture || '';
            itemElement.className = 'inventory-item';
            slotElement.appendChild(itemElement);
        }

        // 添加数量显示
        if (slot.count > 0) {
            const countElement = document.createElement('div');
            countElement.className = 'item-count';
            countElement.textContent = `x${slot.count}`;
            slotElement.appendChild(countElement);
        }

        slotElement.addEventListener('click', () => {
            inventory.selectedIndex = index;
            updateInventoryUI(inventory);
        });

        inventoryElement.appendChild(slotElement);
    });
}

// 更新道具栏UI
function updateInventoryUI(inventory, character, blockTypes, textures, materials) {
    if (!inventory || !inventory.slots) {
        console.error("Invalid inventory object:", inventory);
        return;
    }
    
    const slots = document.querySelectorAll('.inventory-slot');
    slots.forEach((slot, index) => {
        // 安全检查
        if (index >= inventory.slots.length) return;
        
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
        const count = inventory.slots[index].count;
        if (count > 0) {
            const countElement = document.createElement('div');
            countElement.className = 'item-count';
            countElement.textContent = `x${count}`;
            slot.appendChild(countElement);
        }
    });

    // 调试信息
    console.log("物品栏已更新:", inventory.slots.map(item => item.count));

    // 更新手持物品
    if (character && blockTypes && textures && materials) {
        updateHeldItem(character, blockTypes, textures, materials, inventory);
    }
}

// 添加这个新函数来更新手持物品 - 修改为接收inventory参数
function updateHeldItem(character, blockTypes, textures, materials, inventory) {
    // 安全检查
    if (!character || !inventory || !inventory.slots) {
        console.error("Invalid parameters for updateHeldItem");
        return;
    }
    
    // 先移除旧的手持物品（如果存在）
    if (heldItemMesh) {
        character.rightArm.remove(heldItemMesh);
        if (heldItemMesh.geometry) {
            heldItemMesh.geometry.dispose();
        }
        if (heldItemMesh.material) {
            if (Array.isArray(heldItemMesh.material)) {
                heldItemMesh.material.forEach(m => m && m.dispose());
            } else {
                heldItemMesh.material.dispose();
            }
        }
        heldItemMesh = null;
    }

    // 获取当前选中的物品
    const selectedIndex = inventory.selectedIndex;
    if (selectedIndex < 0 || selectedIndex >= inventory.slots.length) {
        return; // 无效的索引
    }
    
    const selectedItem = inventory.slots[selectedIndex];

    // 如果物品数量为0或者是道具1（矿镐）则不创建手持物品
    if (selectedItem.count <= 0 && inventory.selectedIndex !== 0) {
        return;
    }

    // 根据选中的物品创建对应的方块
    if (inventory.selectedIndex >= 0) {
        let blockType = selectedItem.type;
        if (!blockType) return;
        
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
            const materialKey = Object.keys(blockTypes).find(key => blockTypes[key] === blockType);
            if (materialKey && materials[materialKey]) {
                material = materials[materialKey].clone();
            } else {
                return; // 找不到材质
            }
        }

        // 创建方块mesh
        heldItemMesh = new THREE.Mesh(geometry, material);

        // 定位方块位置 - 放在右手前端
        heldItemMesh.position.set(0, -1.2, -0.5);

        // 添加到右手
        character.rightArm.add(heldItemMesh);
    }
}

export {
    createInventory,
    heldItemMesh,
    createInventoryUI,
    updateInventoryUI,
    updateHeldItem
};
