import React, { memo, useCallback, useEffect, useMemo, useRef } from "react";
import { useThree } from "react-three-fiber";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import * as THREE from "three";
import {
  SkinnedMesh,
  Mesh,
  MeshBasicMaterial,
  SphereBufferGeometry,
  MeshStandardMaterial,
  GridHelper,
  Color,
} from "three";
import { useTransformOnClick } from "@hooks/useTransformOnClick";
import { useLoader } from "@hooks/useLoader";
import { MODEL_NAME } from "@constants/name";
import { getModelCenter } from "@utils/geometry";
import { useLoadedModel } from "@stores/loadedModel";
import { useEnvironment } from "@stores/environment";
import { useMaterial } from "@stores/material";

function _ModelContainer() {
  const { scene, gl, camera } = useThree();
  const gridHelperRef = useRef<GridHelper>(null);

  const modelName = useLoadedModel((state) => state.name);
  const { showGrid } = useEnvironment();
  const { wireframe, materialColor } = useMaterial();

  useEffect(() => {
    if (gridHelperRef.current) {
      scene.remove(gridHelperRef.current);
    }

    if (showGrid) {
      const gridHelper = new GridHelper(1000, 50);
      gridHelperRef.current = gridHelper;
      scene.add(gridHelper);
    }
  }, [showGrid]);

  const orbitalControls = useMemo(() => {
    const orbitalControls = new OrbitControls(camera, gl.domElement);
    orbitalControls.maxDistance = 500;
    orbitalControls.minDistance = 50;
    orbitalControls.screenSpacePanning = true;
    return orbitalControls;
  }, []);

  const boneMeshMaterial = useMemo(
    () =>
      new MeshBasicMaterial({
        color: "red",
        wireframe: true,
      }),
    []
  );

  useTransformOnClick(orbitalControls);

  useEffect(() => {
    const model = scene.getObjectByName(MODEL_NAME);

    model?.traverse((object) => {
      if (object instanceof SkinnedMesh) {
        if (object.material instanceof MeshStandardMaterial) {
          object.material.wireframe = wireframe;
        }
      }
    });
  }, [wireframe]);

  useEffect(() => {
    const model = scene.getObjectByName(MODEL_NAME);

    model?.traverse((object) => {
      if (object instanceof SkinnedMesh) {
        if (object.material instanceof MeshStandardMaterial) {
          object.material.color = new Color(materialColor);
        }
      }
    });
  }, [materialColor]);

  const reset = useCallback(() => {
    const model = scene.getObjectByName(MODEL_NAME);
    orbitalControls.target = getModelCenter(model, modelName);
    orbitalControls.update();
  }, [scene, orbitalControls, modelName]);

  const onLoad = useCallback(() => {
    const model = scene.getObjectByName(MODEL_NAME);

    model.traverse((object) => {
      if (object instanceof SkinnedMesh) {
        if (object.material instanceof MeshStandardMaterial) {
          object.material.wireframe = wireframe;
        }

        const bbox = object.geometry.boundingBox;
        const rootBone = object.skeleton.bones[0];

        const mesh = new Mesh(new SphereBufferGeometry(2.5), boneMeshMaterial);
        mesh.name = object.id.toString(10);
        rootBone.add(mesh);

        bbox.setFromObject(rootBone);
      }
    });
    reset();
  }, [wireframe]);

  useLoader(modelName, onLoad);

  useEffect(() => {
    const spotLight = new THREE.SpotLight(0xffffff, 0.7);
    spotLight.position.set(50, 50, 300);
    scene.add(spotLight);

    const spotLightBack = new THREE.SpotLight(0xffffff, 0.7);
    spotLightBack.position.set(50, 50, -300);
    scene.add(spotLightBack);
  }, []);

  return null;
}

export const ModelContainer = memo(_ModelContainer);
