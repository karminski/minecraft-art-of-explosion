// 设置UV映射 - 通用方法
export function mapBlockUVs(geometry, uvMap) {
    // 获取几何体的UV属性
    const uvAttribute = geometry.getAttribute('uv');

    // Three.js BoxGeometry的UV索引顺序:
    // 0-1-2-3: 右侧 (px)
    // 4-5-6-7: 左侧 (nx)
    // 8-9-10-11: 顶部 (py)
    // 12-13-14-15: 底部 (ny)
    // 16-17-18-19: 前面 (pz)
    // 20-21-22-23: 后面 (nz)

    // 右侧面
    if (uvMap.right) {
        updateFaceUVs(uvAttribute, 0, uvMap.right);
    }

    // 左侧面
    if (uvMap.left) {
        updateFaceUVs(uvAttribute, 4, uvMap.left);
    }

    // 顶部
    if (uvMap.top) {
        updateFaceUVs(uvAttribute, 8, uvMap.top);
    }

    // 底部
    if (uvMap.bottom) {
        updateFaceUVs(uvAttribute, 12, uvMap.bottom);
    }

    // 前面
    if (uvMap.front) {
        updateFaceUVs(uvAttribute, 20, uvMap.front);
    }

    // 后面
    if (uvMap.back) {
        updateFaceUVs(uvAttribute, 16, uvMap.back);
    }

    // 确保UV更新
    uvAttribute.needsUpdate = true;
}

// 辅助函数：更新特定面的UV坐标
export function updateFaceUVs(uvAttribute, startIndex, uvCoords) {
    const [u1, v1, u2, v2] = uvCoords;

    // 四个顶点的UV坐标
    // 左上
    uvAttribute.setXY(startIndex, u1, v1);
    // 右上
    uvAttribute.setXY(startIndex + 1, u2, v1);
    // 左下
    uvAttribute.setXY(startIndex + 2, u1, v2);
    // 右下
    uvAttribute.setXY(startIndex + 3, u2, v2);
}

// 为动物创建纹理材质
export function createAnimalTexture(textureLoader, texturePath) {
    const texture = textureLoader.load(texturePath);
    texture.magFilter = THREE.NearestFilter; // 像素风格，防止模糊
    return new THREE.MeshPhongMaterial({
        map: texture,
        color: 0xffffff,
        transparent: true,
        alphaTest: 0.5 // 处理透明部分
    });
}
