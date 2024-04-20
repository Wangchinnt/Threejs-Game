import * as THREE from 'three';
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader.js';
import {FBXLoader} from 'three/examples/jsm/loaders/FBXLoader.js';

import {entity} from './entity.js';

// This is a component for static models and animated models, that allow to load a model .glb or.fbx
export const gltf_component = (() => {
  class StaticModelComponent extends entity.Component {
    constructor(params) {
      super();
      this._Init(params);   
    }
  
    _Init(params) {
      this._params = params;
      this._LoadModels();
    }
    // don't use yet
    InitComponent() {
      this._RegisterHandler('update.position', (m) => { this._OnPosition(m); });
      this._RegisterHandler('update.quaternion', (m) => { this._OnQuaternion(m); });
    }
    // don't use yet
    _OnPosition(m) {
      if (this._target) {
        this._target.position.copy(m.value);
      }
    }
    _OnQuaternion(m) {
      if (this._target) {
        this._target.quaternion.copy(m.value);
      }
    }
    // load the models
    _LoadModels() {
      if (this._params.resourceName.endsWith('glb') || this._params.resourceName.endsWith('gltf')) {
        this._LoadGLB();
      } else if (this._params.resourceName.endsWith('fbx')) {
        this._LoadFBX();
      }
    }

    _OnLoaded(obj) {
      this._target = obj;
      this._target.scale.setScalar(this._params.scale);
      this._target.position.copy(this._parent._position);
      this._target.quaternion.copy(this._parent._quaternion);
      let baseColorTexture = null;
      let metallicTexture = null;
    
      // Load basecolor texture
      if (this._params.baseColorTexture) {
        const baseColorTexLoader = new THREE.TextureLoader();
        baseColorTexture = baseColorTexLoader.load(this._params.baseColorTexture);
        baseColorTexture.encoding = THREE.sRGBEncoding; // Set encoding
      }
    
      // Load metallic texture
      if (this._params.metallicTexture) {
        const metallicTexLoader = new THREE.TextureLoader();
        metallicTexture = metallicTexLoader.load(this._params.metallicTexture);
        metallicTexture.encoding = THREE.sRGBEncoding; // Set encoding
      }

      // Traverse through the model and apply textures to materials
      this._target.traverse(c => {
        if (c.isMesh) {
          const materials = Array.isArray(c.material) ? c.material : [c.material];
          materials.forEach(material => {
            if (baseColorTexture) {
              material.map = baseColorTexture;
            }
            if (metallicTexture) {
              material.metalnessMap = metallicTexture;
            }
            if (this._params.specular) {
              material.specular = this._params.specular;
            }
            if (this._params.emissive) {
              material.emissive = this._params.emissive;
            }
          });
        }
        if (this._params.receiveShadow != undefined) {
          c.receiveShadow = this._params.receiveShadow;
          }
            if (this._params.castShadow != undefined) {
              c.castShadow = this._params.castShadow;
            }
            if (this._params.visible != undefined) {
              c.visible = this._params.visible;
            }
      });
    }

    _LoadGLB() {
      const loader = new GLTFLoader();
      loader.setPath(this._params.resourcePath);
      loader.load(this._params.resourceName, (glb) => {
        this._OnLoaded(glb.scene);
      });
    }

    _LoadFBX() {
      const loader = new FBXLoader();
      loader.setPath(this._params.resourcePath);
      loader.load(this._params.resourceName, (fbx) => {
        this._OnLoaded(fbx);
      });
    }

    Update(timeInSeconds) {
      if (this._target != null && this._parent.GetActive()) {
      this._params.scene.add(this._target);
      }
      else if (this._target != null && !this._parent.GetActive()){
        this._params.scene.remove(this._target);
      }
    }

  };


  class AnimatedModelComponent extends entity.Component {
    constructor(params) {
      super();
      this._Init(params);
    }
  
    InitComponent() {
      this._RegisterHandler('update.position', (m) => { this._OnPosition(m); });
    }

    _OnPosition(m) {
      if (this._target) {
        this._target.position.copy(m.value);
        this._target.position.y = 0.35;
      }
    }

    _Init(params) {
      this._params = params;
  
      this._LoadModels();
    }
  
    _LoadModels() {
      if (this._params.resourceName.endsWith('glb') || this._params.resourceName.endsWith('gltf')) {
        this._LoadGLB();
      } else if (this._params.resourceName.endsWith('fbx')) {
        this._LoadFBX();
      }
    }

    _OnLoaded(obj, animations) {
      this._target = obj;
      this._params.scene.add(this._target);
      this._target.scale.setScalar(this._params.scale);
      this._target.position.copy(this._parent._position);
      this._target.quaternion.copy(this._parent._quaternion);
      let baseColorTexture = null;
      let metallicTexture = null;
    
      // Load basecolor texture
      if (this._params.baseColorTexture) {
        const baseColorTexLoader = new THREE.TextureLoader();
        baseColorTexture = baseColorTexLoader.load(this._params.baseColorTexture);
        baseColorTexture.encoding = THREE.sRGBEncoding; // Set encoding
      }
    
      // Load metallic texture
      if (this._params.metallicTexture) {
        const metallicTexLoader = new THREE.TextureLoader();
        metallicTexture = metallicTexLoader.load(this._params.metallicTexture);
        metallicTexture.encoding = THREE.sRGBEncoding; // Set encoding
      }

      // Traverse through the model and apply textures to materials
      this._target.traverse(c => {
        if (c.isMesh) {
          const materials = Array.isArray(c.material) ? c.material : [c.material];
          materials.forEach(material => {
            if (baseColorTexture) {
              material.map = baseColorTexture;
            }
            if (metallicTexture) {
              material.metalnessMap = metallicTexture;
            }
            if (this._params.specular) {
              material.specular = this._params.specular;
            }
            if (this._params.emissive) {
              material.emissive = this._params.emissive;
            }
            if (this._params.emissiveIntensity) {
              material.emissiveIntensity = this._params.emissiveIntensity;
            }
            material.shininess = 50;
            material.color = material.color.clone().multiplyScalar(0.5); // Điều chỉnh tương phản
          });
        }
        if (this._params.receiveShadow != undefined) {
          c.receiveShadow = this._params.receiveShadow;
          }
            if (this._params.castShadow != undefined) {
              c.castShadow = this._params.castShadow;
            }
            if (this._params.visible != undefined) {
              c.visible = this._params.visible;
            }
      });
      

      const _OnLoad = (anim) => {
        const clip = anim.animations[0];
        const action = this._mixer.clipAction(clip);
  
        action.play();
      };

      const loader = new FBXLoader();
      loader.setPath(this._params.resourcePath);
      loader.load(this._params.resourceAnimation, (a) => { _OnLoad(a); });

      this._mixer = new THREE.AnimationMixer(this._target);

      this._parent._mesh = this._target;
      this.Broadcast({
          topic: 'load.character',
          model: this._target,
      });
    }

    _LoadGLB() {
      const loader = new GLTFLoader();
      loader.setPath(this._params.resourcePath);
      loader.load(this._params.resourceName, (glb) => {
        this._OnLoaded(glb.scene, glb.animations);
      });
    }

    _LoadFBX() {
      const loader = new FBXLoader();
      loader.setPath(this._params.resourcePath);
      loader.load(this._params.resourceName, (fbx) => {
        this._OnLoaded(fbx);
      });
    }

    Update(timeInSeconds) {
      if (this._mixer) {
        this._mixer.update(timeInSeconds);
      }
    }
  };


  return {
      StaticModelComponent: StaticModelComponent,
      AnimatedModelComponent: AnimatedModelComponent,
  };

})();