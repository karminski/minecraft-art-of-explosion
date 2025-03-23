/**
 * Creates lighting for the Minecraft world
 * @param {THREE.Scene} scene - The scene to add lights to
 * @returns {Object} The created lights
 */
function createLighting(scene) {
    // 创建环境光
    const ambientLight = new THREE.AmbientLight(0x404040);
    scene.add(ambientLight);

    // 创建方向光
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(100, 100, 50);
    directionalLight.castShadow = true;
    scene.add(directionalLight);

    return { ambientLight, directionalLight };
}

/**
 * Creates a sky sphere for the Minecraft world
 * @param {THREE.Scene} scene - The scene to add the sky to
 * @param {THREE.TextureLoader} textureLoader - Texture loader to load sky texture
 * @param {string} texturePath - Path to the sky texture
 * @returns {THREE.Mesh} The created sky mesh
 */
function createSky(scene, textureLoader, texturePath) {
    // 加载天空纹理
    const skyTexture = textureLoader.load(texturePath);

    // 创建天空球
    const geometry = new THREE.SphereGeometry(800, 128, 128); // 半径足够大，包围整个场景
    const material = new THREE.MeshBasicMaterial({
        map: skyTexture,
        side: THREE.BackSide // 只渲染球体的内侧
    });
    const sky = new THREE.Mesh(geometry, material);
    sky.isSky = true; // 添加标记以便于识别
    scene.add(sky);
    return sky;
}

export { createLighting, createSky };
