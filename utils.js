import * as THREE from 'three';

  const fitCameraToCenteredObject = function (
    camera,
    object,
    offset,
    orbitControls,
  ) {
    const boundingBox = new THREE.Box3();
    boundingBox.setFromObject(object);

    var size = new THREE.Vector3();
    boundingBox.getSize(size);
    const fov = camera.fov * (Math.PI / 180);
    const fovh = 2 * Math.atan(Math.tan(fov / 2) * camera.aspect);
    let dx = size.z / 2 + Math.abs(size.x / 2 / Math.tan(fovh / 2));
    let dy = size.z / 2 + Math.abs(size.y / 2 / Math.tan(fov / 2));
    let cameraZ = Math.max(dx, dy);

    // offset the camera, if desired (to avoid filling the whole canvas)
    if (offset !== undefined && offset !== 0) cameraZ *= offset;

    camera.position.set(0, 0, cameraZ);

    // set the far plane of the camera so that it easily encompasses the whole object
    const minZ = boundingBox.min.z;
    const cameraToFarEdge = minZ < 0 ? -minZ + cameraZ : cameraZ - minZ;

    camera.far = cameraToFarEdge * 3;
    camera.updateProjectionMatrix();

    if (orbitControls !== undefined) {
      // set camera to rotate around the center
      orbitControls.target = new THREE.Vector3(0, 0, 0);

      // prevent camera from zooming out far enough to create far plane cutoff
      orbitControls.maxDistance = cameraToFarEdge * 2;
    }
  };

  export { fitCameraToCenteredObject };
