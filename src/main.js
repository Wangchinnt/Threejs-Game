import * as THREE from 'three';
import { entity } from './entity';
import { entity_manager } from './entity-manager';
import {gltf_component} from './gltf-component.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { player_input } from './player-input.js';
import { player_entity } from './player-entity.js';

class GameDemo {
    constructor() {
      this._Initialize();
    }
  
    _Initialize() {
      this._threejs = new THREE.WebGLRenderer({
        antialias: true,
      });
      //this._threejs.gammaFactor = 2.2;
      this._threejs.shadowMap.enabled = true;
      //this._threejs.shadowMap.type = THREE.PCFSoftShadowMap;
      //this._threejs.setPixelRatio(window.devicePixelRatio);
      this._threejs.setSize(window.innerWidth, window.innerHeight);
      this._threejs.domElement.id = 'threejs';
  
      document.body.appendChild(this._threejs.domElement);
  
      window.addEventListener('resize', () => {
        this._OnWindowResize();
      }, false);
      
      //setup scene
      this._scene = new THREE.Scene();
      //this._scene.background = new THREE.Color(0xFFFFFF);
      this._scene.fog = new THREE.FogExp2(0x89b2eb, 0.002);

      //setup camera
      const fov = 60;
      const aspect = 1920 / 1080;
      const near = 1.0;
      const far = 1000;
      this._camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
      this._camera.position.set(0,15,-10);
      this._camera.rotation.set(-1,0,0);
   
      // setup light
      let light = new THREE.DirectionalLight(0xFFFFFF, 1);
      light.position.set(-15, 30, -23);
      light.castShadow = true;
      light.target.position.set(0, 0, 0);
      light.castShadow = true;
      light.shadow.bias = -0.001;
      light.shadow.mapSize.width = 4096;
      light.shadow.mapSize.height = 4096;
      light.shadow.camera.near = 0.1;
      light.shadow.camera.far = 1000.0;
      light.shadow.camera.left = 100;
      light.shadow.camera.right = -100;
      light.shadow.camera.top = 100;
      light.shadow.camera.bottom = -100;
      this._scene.add(light);
      const helper = new THREE.DirectionalLightHelper( light, 5, 0xffff00 );
      this._scene.add( helper );
      
      // setup control
      this._controls = new OrbitControls( this._camera, this._threejs.domElement);
      
      //setup axesHelper
      const axesHelper = new THREE.AxesHelper(3); 
      axesHelper.position.set(10,5,0);
      this._scene.add( axesHelper );

      //this._sun = light;
      // setup a floor
      /*const floor = new THREE.Mesh(
        new THREE.BoxGeometry(10,0.5,10),
        new THREE.MeshStandardMaterial({
            color: 0x0000ff,
        }))
      floor.receiveShadow = true;
      this._scene.add(floor);*/

      //setup a plane
      const plane = new THREE.Mesh(
        new THREE.PlaneGeometry(50, 50, 10, 10),
        new THREE.MeshStandardMaterial({
            color: 0x1e601c,
          }))
      plane.receiveShadow = true;
      plane.rotation.x = -Math.PI / 2;
      this._scene.add(plane);
      
      // setup a cube
      this._cube = new THREE.Mesh(
        new THREE.BoxGeometry(1,1,1),
        new THREE.MeshStandardMaterial({
            color: 0xff0000,
          }))
      this._cube.position.set(0,2,0);
      this._cube.castShadow = true;
      this._scene.add(this._cube);
      
      this._entityManager = new entity_manager.EntityManager();
      //this._LoadFBX();
      this._LoadPlayer();
      this._LoadFBX();
      // render scene
      this._previousRAF = null;
      this._RAF()
    }

    _LoadFBX() {
       // load fbx
       const pos = new THREE.Vector3(0,0,10);
       const e = new entity.Entity();
       e.AddComponent(new gltf_component.StaticModelComponent({
         scene: this._scene,
         resourcePath: 'Assets/_Assets/Meshes/',
         resourceName: 'MonkeyHeadOnBox.fbx',
         scale: 0.01,
         position: pos,
         emissive: new THREE.Color(0x000000), 
         specular: new THREE.Color(0x000000),
         receiveShadow: false,
         castShadow: true,
       }));
       e.SetPosition(pos);
       this._entityManager.Add(e, 'box');
       e.SetActive(true);
    }

    _LoadPlayer() {
      const params = {
        camera: this._camera,
        scene: this._scene,
      };

      const player = new entity.Entity();
      player.AddComponent(new player_input.BasicCharacterControllerInput());
      player.AddComponent(new player_entity.BasicCharacterController(params));
      this._entityManager.Add(player, 'player');


    }

    _OnWindowResize() {
        this._camera.aspect = window.innerWidth / window.innerHeight;
        this._camera.updateProjectionMatrix();
        this._threejs.setSize(window.innerWidth, window.innerHeight);
      }

    _RAF() {
         requestAnimationFrame((t) => {
          if (this._previousRAF === null) {
            this._previousRAF = t;
          }
    
          this._RAF();
          this._cube.rotation.x +=0.01;
          this._cube.rotation.y +=0.01;
          this._threejs.render(this._scene, this._camera);
          this._Step(t - this._previousRAF);
          this._previousRAF = t;
        });
      }
      _Step(timeElapsed) {
        const timeElapsedS = Math.min(1.0 / 60.0, timeElapsed * 0.001);
        //console.log(timeElapsedS);
    
        //this._UpdateSun();
    
        this._entityManager.updateEntities(timeElapsedS);
      }

}
let _APP = null;

window.addEventListener('DOMContentLoaded', () => {
  _APP = new GameDemo();
  console.log(_APP);
});


