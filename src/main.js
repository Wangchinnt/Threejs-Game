import * as THREE from 'three';
import { entity } from './entity';
import { entity_manager } from './entity-manager';
import {gltf_component} from './gltf-component.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { player_input } from './player-input.js';
import { player_entity } from './player-entity.js';
import { collider_component } from './collider-component.js';
import { counter_entity } from './counter-entity.js';
import { deliveryManager } from './deliveryManager-component.js';

class GameMenu {
  constructor() {
    this.menuItems = ['Multiplayer', 'Singleplayer', 'Options'];
    this.selectedItemIndex = 0;
    this.render();
    this.addEventListeners();
  }

  render() {
    const menuContainer = document.createElement('div');
    menuContainer.classList.add('menu-container1'); 


    this.menuItems.forEach((item, index) => {
      const menuItem = document.createElement('div'); 
      menuItem.textContent = item; 
      menuItem.classList.add('menu-item'); 

      if (index === this.selectedItemIndex) {
        menuItem.classList.add('selected');
      }

      menuItem.addEventListener('click', () => {
        this.selectedItemIndex = index;
        this.updateMenu();
        this.handleSelection();
      });

      menuContainer.appendChild(menuItem); 

    document.body.appendChild(menuContainer);

    const backgroundImage = document.createElement('img');
    backgroundImage.src = 'Assets/_Assets/Textures/Menu background.jpg';
    backgroundImage.classList.add('menu-background');

    document.body.appendChild(backgroundImage);
  })
  }

  addEventListeners() {
    document.addEventListener('keydown', (event) => {
      if (event.key === 'ArrowUp') {
        this.moveSelectionUp();
      } else if (event.key === 'ArrowDown') {
        this.moveSelectionDown();
      } else if (event.key === 'Enter') {
        this.handleSelection();
      }
    });
  }

  moveSelectionUp() {
    if (this.selectedItemIndex > 0) {
      this.selectedItemIndex--;
      this.updateMenu();
    }
  }

  moveSelectionDown() {
    if (this.selectedItemIndex < this.menuItems.length - 1) {
      this.selectedItemIndex++;
      this.updateMenu();
    }
  }

  updateMenu() {
    const menuItems = document.querySelectorAll('.menu-item');
    menuItems.forEach((menuItem, index) => {
      if (index === this.selectedItemIndex) {
        menuItem.classList.add('selected');
      } else {
        menuItem.classList.remove('selected');
      }
    });
  }

  handleSelection() {
    const selectedItem = this.menuItems[this.selectedItemIndex];
    if (selectedItem === 'Multiplayer') {
      console.log('Multiplayer selected');
    } else if (selectedItem === 'Singleplayer') {
       document.querySelector('.menu-container1').remove();
       document.querySelector('.menu-background').remove();
       _APP = null;
       _APP = new GamePlay();
    } else if (selectedItem === 'Options') {
      // Code to exit the game

    }
  }
}


class GamePlay {
    constructor() {
      this._Initialize();
    }
  
    _Initialize() {
      this._isGameStarted = false;
      this._isGameOver = false;
      this._isGamePaused = false;
      this._timer = 9000;
      this._volume = 1;
      this._countdownElement =  document.querySelector('.time');
      this._countdownBackground = document.querySelector('.background');
      this._loadingBackground = document.querySelector('.imageLoading');
      this._threejs = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true
      });
      this._threejs.shadowMap.enabled = true;
      this._threejs.shadowMap.type = THREE.PCFSoftShadowMap;
      this._threejs.setPixelRatio(window.devicePixelRatio);
      this._threejs.setSize(window.innerWidth, window.innerHeight);
      this._threejs.domElement.id = 'threejs';

      document.body.appendChild(this._threejs.domElement);
  
      window.addEventListener('resize', () => {
        this._OnWindowResize();
        this._updateElementsPosition();
      }, false);
      
      //setup scene
      this._scene = new THREE.Scene();
      this._scene.background = new THREE.Color(0x000000);

      //setup camera
      const fov = 60;
      const aspect = 1920 / 1080;
      const near = 1.0;
      const far = 500;
      this._camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
      this._camera.position.set(0,17.5,-9.5);
      this._camera.rotation.set(THREE.MathUtils.degToRad(55),THREE.MathUtils.degToRad(-180),0);
      
      // setup light
      let light = new THREE.DirectionalLight(0xFFFFFF, 3.5);
      light.position.set(-15, 30, -23);
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
      let light1 = new THREE.AmbientLight(0xFFFFFF, 2.75);
      this._scene.add(light1);

      //setup audio 
      this._listener = new THREE.AudioListener();
      this._camera.add(this._listener);

      const backgroundSound = new THREE.Audio(this._listener);
      const audioLoader = new THREE.AudioLoader();
      audioLoader.load('Assets/_Assets/Sounds/Music/Music.wav', function(buffer) {
        backgroundSound.setBuffer(buffer);
        backgroundSound.setLoop(true);
        backgroundSound.setVolume(1);
        backgroundSound.play();
      });
      

      // // setup light helper
      // const helper = new THREE.DirectionalLightHelper( light, 5, 0xffff00 );
      // this._scene.add( helper );

      // const camHelper = new THREE.CameraHelper( this._camera );
      // this._scene.add( camHelper );
  

      // setup control
      //this._controls = new OrbitControls( this._camera, this._threejs.domElement);
      
      // //setup axesHelper
      // const axesHelper = new THREE.AxesHelper(3); 
      // axesHelper.position.set(10,5,0);
      // this._scene.add( axesHelper );

    

      this._entityManager = new entity_manager.EntityManager();
      this._LoadPlayer();
      this._LoadMAP();
      this._updateElementsPosition();
      this._previousRAF = null; 
      this._RAF();
      this._updateTimer(this._timer/100);
      this._countdownBackground.style.visibility = 'visible';
      this._loadingBackground.style.visibility = 'visible';
      setTimeout(() => {
        this._loadingBackground.style.visibility = 'hidden';
        this._isGameStarted = true;
      }, 3200);

    }

    _updateTimer(seconds) {
      const minutes = Math.floor(seconds / 60);
      const remainingSeconds = seconds % 60;
      const formattedMinutes = String(minutes).padStart(2, '0');
      const formattedSeconds = remainingSeconds.toFixed(0).padStart(2, '0');
      this._countdownElement.textContent = `${formattedMinutes}:${formattedSeconds}`;
    }
    _gameOver(){
      this._isGameOver = true;
      this._isGameStarted = false;
      this._isGamePaused = false;
  
      const gameOverBackground = document.createElement('div');
      gameOverBackground.classList.add('gameOver-background'); 
      document.body.appendChild(gameOverBackground);

      const gameText = document.createElement('div');
      gameText.textContent = 'Game Over'; 
      gameText.classList.add('gameOver-text');
      document.body.appendChild(gameText);

      const scoreText = document.createElement('div');
      scoreText.textContent = 'Delivered orders: ' + this._entityManager.Get('Delivery counter').GetComponent('DeliveryCounter').getScore();
      scoreText.classList.add('score-text'); 
      document.body.appendChild(scoreText);
    }
    _gamePause(){

      const pauseMenuBackground = document.createElement('div');
      pauseMenuBackground.classList.add('pause-menu-background');
      document.body.appendChild(pauseMenuBackground);


      const menuContainer = document.createElement('div');
      menuContainer.classList.add('menu-container2');

      const pausedText = document.createElement('div');
      pausedText.textContent = 'Paused';
      pausedText.classList.add('paused-text');

      document.body.appendChild(pausedText);

      const menuItems = ['Resume', 'Options'];
      menuItems.forEach((item, index) => {
      const menuItem = document.createElement('div'); 
      menuItem.textContent = item; 
      menuItem.classList.add('menu-item'); 

      if (index === this.selectedItemIndex) {
        menuItem.classList.add('selected');
      }

      menuItem.addEventListener('click', () => {
        switch (index) {
          case 0: // Resume
            console.log('Resume clicked');
            document.querySelector('.menu-container2').remove();
            document.querySelector('.pause-menu-background').remove();
            document.querySelector('.paused-text').remove();
            this._isGamePaused = false;
            break;
          case 1: // Options
            console.log('Options clicked');
            break;
          default:
            break;
        }
      });
      menuContainer.appendChild(menuItem);
      });

      document.body.appendChild(menuContainer);
    }
    _LoadMAP() {
      this._LoadWall();
      this._LoadClearCounters();
      this._LoadFoodCounters();

      // plate counter
      const pos5 = new THREE.Vector3(-13.2, 0, 3.3);
      const quaternion5 = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI/2 );
      const e5 = new entity.Entity();
      const size5 = new THREE.Vector3(3,3,3);
      const center5 = new THREE.Vector3(0,1,5);
      e5.AddComponent(new gltf_component.StaticModelComponent({
        scene: this._scene,
        resourcePath: 'Assets/_Assets/Meshes/',
        resourceName: 'Kitchen Counter.fbx',
        baseColorTexture: 'Assets/_Assets/Meshes/Textures/Kitchen Counter_AlbedoTransparency.png',
        metallicTexture: 'Assets/_Assets/Meshes/Textures/Kitchen Counter_MetallicSmoothness.png',
        specular : new THREE.Color(1,1,1),
        emissive : new THREE.Color(0x000000),
        scale: 0.035,
        position: pos5,
        receiveShadow: true,
        castShadow: true,
      }));
      e5.AddComponent(new collider_component.BoxColliderComponent({
        center: center5,
        size: size5,
        scene: this._scene,
      }));
      e5.AddComponent(new counter_entity.PlateCounter({
        entitiesManager: this._entityManager,
        scene: this._scene, 
        pos: pos5,
        iconPath: 'Assets/_Assets/Textures/CircleDashed.png',
        listener: this._listener,
        volume: this._volume
        }));
      e5.SetPosition(pos5);
      e5.SetQuaternion(quaternion5);
      this._entityManager.Add(e5, 'Plate counter');
      console.log(e5);

      // cutting counter
      const pos6 = new THREE.Vector3(-3.3 ,0 ,9.9);
      const quaternion6 = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI );
      const e6 = new entity.Entity();
      const size6 = new THREE.Vector3(3,3,3);
      const center6 = new THREE.Vector3(0,1,5);
      e6.AddComponent(new gltf_component.StaticModelComponent({
        scene: this._scene,
        resourcePath: 'Assets/_Assets/Meshes/',
        resourceName: 'Kitchen Counter.fbx',
        baseColorTexture: 'Assets/_Assets/Meshes/Textures/Kitchen Counter_AlbedoTransparency.png',
        metallicTexture: 'Assets/_Assets/Meshes/Textures/Kitchen Counter_MetallicSmoothness.png',
        specular : new THREE.Color(1,1,1),
        emissive : new THREE.Color(0x000000),
        scale: 0.035,
        position: pos6,
        receiveShadow: true,
        castShadow: true,
      }));
      e6.AddComponent(new collider_component.BoxColliderComponent({
        center: center6,
        size: size6,
        scene: this._scene,
      }));
      e6.AddComponent(new counter_entity.CuttingCounter({
        entitiesManager: this._entityManager,
        scene: this._scene, 
        pos: pos6,
        direction: 'up',
        progressBarName: 'progressBar2',
        listener: this._listener,
        volume: this._volume
        }));
      this._entityManager.Add(e6, 'Cutting counter');
      e6.SetPosition(pos6);
      e6.SetQuaternion(quaternion6);
      console.log(e6);

      // trash counter
      const pos7 = new THREE.Vector3(-13.2 ,0 , -3.3);
      const e7 = new entity.Entity();
      const quaternion7 = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI/2);
      const size7 = new THREE.Vector3(3,3,3);
      const center7 = new THREE.Vector3(0,1,5);
      e7.AddComponent(new gltf_component.StaticModelComponent({
        scene: this._scene,
        resourcePath: 'Assets/_Assets/Meshes/',
        resourceName: 'Trash bin.fbx',
        baseColorTexture: 'Assets/_Assets/Meshes/Textures/Trash bin_AlbedoTransparency.png',
        metallicTexture: 'Assets/_Assets/Meshes/Textures/Trash bin_MetallicSmoothness.png',
        specular : new THREE.Color(1,1,1),
        emissive : new THREE.Color(0x000000),
        scale: 0.06,
        position: pos7,
        receiveShadow: true,
        castShadow: true,
      }));
      e7.AddComponent(new collider_component.BoxColliderComponent({
        center: center7,
        size: size7,
        scene: this._scene,
      }));
      e7.AddComponent(new counter_entity.TrashCounter({
        entitiesManager: this._entityManager,
        scene: this._scene, 
        pos: pos7,
        listener: this._listener,
        volume: this._volume
        }));
      this._entityManager.Add(e7, 'Trash counter');
      e7.SetPosition(pos7);
      e7.SetQuaternion(quaternion7);
      console.log(e7);

      // stove counter
      const pos8 = new THREE.Vector3(-13.2 ,0 ,0);
      const quaternion8 = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI/2) ;
      const e8 = new entity.Entity();
      const size8 = new THREE.Vector3(3,3,3);
      const center8 = new THREE.Vector3(0,1,5);
      e8.AddComponent(new gltf_component.StaticModelComponent({
        scene: this._scene,
        resourcePath: 'Assets/_Assets/Meshes/',
        resourceName: 'Kitchen Counter.fbx',
        baseColorTexture: 'Assets/_Assets/Meshes/Textures/Kitchen Counter_AlbedoTransparency.png',
        metallicTexture: 'Assets/_Assets/Meshes/Textures/Kitchen Counter_MetallicSmoothness.png',
        specular : new THREE.Color(1,1,1),
        emissive : new THREE.Color(0x000000),
        scale: 0.035,
        position: pos8,
        receiveShadow: true,
        castShadow: true,
      }));
      e8.AddComponent(new collider_component.BoxColliderComponent({
        center: center8,
        size: size8,
        scene: this._scene,
      }));
      e8.AddComponent(new counter_entity.StoveCounter({
        entitiesManager: this._entityManager,
        scene: this._scene, 
        pos: pos8,
        quaternion: quaternion8,
        progressBarName: 'progressBar4',
        warning: 'imageWarning',
        listener: this._listener,
        volume: this._volume
        }));
      this._entityManager.Add(e8, 'Stove counter');
      e8.SetPosition(pos8);
      e8.SetQuaternion(quaternion8);
      console.log(e8);

      // stove counter 2
      const pos11 = new THREE.Vector3(-6.6 ,0 ,9.9);
      const quaternion11 = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI) ;
      const e11 = new entity.Entity();
      const size11 = new THREE.Vector3(3,3,3);
      const center11 = new THREE.Vector3(0,1,5);
      e11.AddComponent(new gltf_component.StaticModelComponent({
        scene: this._scene,
        resourcePath: 'Assets/_Assets/Meshes/',
        resourceName: 'Kitchen Counter.fbx',
        baseColorTexture: 'Assets/_Assets/Meshes/Textures/Kitchen Counter_AlbedoTransparency.png',
        metallicTexture: 'Assets/_Assets/Meshes/Textures/Kitchen Counter_MetallicSmoothness.png',
        specular : new THREE.Color(1,1,1),
        emissive : new THREE.Color(0x000000),
        scale: 0.035,
        position: pos11,
        receiveShadow: true,
        castShadow: true,
      }));
      e11.AddComponent(new collider_component.BoxColliderComponent({
        center: center11,
        size: size11,
        scene: this._scene,
      }));
      e11.AddComponent(new counter_entity.StoveCounter({
        entitiesManager: this._entityManager,
        scene: this._scene, 
        pos: pos11,
        quaternion: quaternion11,
        progressBarName: 'progressBar3',
        warning: 'imageWarning2',
        listener: this._listener,
        volume: this._volume
        }));
      this._entityManager.Add(e11, 'Stove counter');
      e11.SetPosition(pos11);
      e11.SetQuaternion(quaternion11);
      console.log(e11);
      
      // delivery counter
      const e9 = new entity.Entity();
      const pos9 = new THREE.Vector3(-13.2 ,0 ,6.6);
      const quaternion9 = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI/2 );
      const size9 = new THREE.Vector3(3,3,3);
      const center9 = new THREE.Vector3(0,1,5);
      e9.AddComponent(new gltf_component.StaticModelComponent({
        scene: this._scene,
        resourcePath: 'Assets/_Assets/Meshes/',
        resourceName: 'Kitchen Counter.fbx',
        baseColorTexture: 'Assets/_Assets/Meshes/Textures/Kitchen Counter_AlbedoTransparency.png',
        metallicTexture: 'Assets/_Assets/Meshes/Textures/Kitchen Counter_MetallicSmoothness.png',
        specular : new THREE.Color(1,1,1),
        emissive : new THREE.Color(0x000000),
        scale: 0.035,
        position: pos9,
        receiveShadow: true,
        castShadow: true,
      }));
      e9.AddComponent(new collider_component.BoxColliderComponent({
        center: center9,
        size: size9,
        scene: this._scene,
      }));
      e9.AddComponent(new counter_entity.DeliveryCounter({
        entitiesManager: this._entityManager,
        scene: this._scene, 
        pos: pos9,
        iconPath: 'Assets/_Assets/Textures/Arrow.png',
        listener: this._listener,
        volume: this._volume
        }));
      e9.AddComponent(new deliveryManager.DeliveryManager({
      }));
      this._entityManager.Add(e9, 'Delivery counter');
      e9.SetPosition(pos9);
      e9.SetQuaternion(quaternion9);
      console.log(e9);
      
      // cutting counter
      const pos10 = new THREE.Vector3(-6.6 ,0 ,-6.6);
      const quaternion10 = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), 0);
      const e10 = new entity.Entity();
      const size10 = new THREE.Vector3(3,3,3);
      const center10 = new THREE.Vector3(0,1,5);
      e10.AddComponent(new gltf_component.StaticModelComponent({
        scene: this._scene,
        resourcePath: 'Assets/_Assets/Meshes/',
        resourceName: 'Kitchen Counter.fbx',
        baseColorTexture: 'Assets/_Assets/Meshes/Textures/Kitchen Counter_AlbedoTransparency.png',
        metallicTexture: 'Assets/_Assets/Meshes/Textures/Kitchen Counter_MetallicSmoothness.png',
        specular : new THREE.Color(1,1,1),
        emissive : new THREE.Color(0x000000),
        scale: 0.035,
        position: pos10,
        receiveShadow: true,
        castShadow: true,
      }));
      e10.AddComponent(new collider_component.BoxColliderComponent({
        center: center10,
        size: size10,
        scene: this._scene,
      }));
      e10.AddComponent(new counter_entity.CuttingCounter({
        entitiesManager: this._entityManager,
        scene: this._scene, 
        pos: pos10,
        direction: 'down',
        progressBarName: 'progressBar',
        listener: this._listener,
        volume: this._volume
        }));
      e10.SetPosition(pos10);
      e10.SetQuaternion(quaternion10);
      this._entityManager.Add(e10, 'Cutting counter');
      console.log(e10);
    }
    _LoadClearCounters() {
      // clear counters
      for (let i = 0; i < 6; i++) {
        const pos = new THREE.Vector3(13.2, 0, 9.9-i*3.3);
        const e = new entity.Entity();
        const quaternion = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), - Math.PI/2 );
        const size = new THREE.Vector3(3,3,3);
        const center = new THREE.Vector3(0,1,5);
        e.AddComponent(new gltf_component.StaticModelComponent({
          scene: this._scene,
          resourcePath: 'Assets/_Assets/Meshes/',
          resourceName: 'Kitchen Counter.fbx',
          baseColorTexture: 'Assets/_Assets/Meshes/Textures/Kitchen Counter_AlbedoTransparency.png',
          metallicTexture: 'Assets/_Assets/Meshes/Textures/Kitchen Counter_MetallicSmoothness.png',
          specular : new THREE.Color(1,1,1),
          emissive : new THREE.Color(0x000000),
          scale: 0.035,
          position: pos,
          receiveShadow: true,
          castShadow: true,
        }));
        e.AddComponent(new collider_component.BoxColliderComponent({
           center: center,
           size: size,
           scene: this._scene,
        }));
        e.AddComponent(new counter_entity.ClearCounter({
         entitiesManager: this._entityManager,
         scene: this._scene, 
         quaternion: quaternion,
         listener: this._listener,
         volume: this._volume
       }));
        e.SetPosition(pos);
        e.SetQuaternion(quaternion);
        this._entityManager.Add(e, 'Clear counter' + i);
        e.SetActive(true);
        console.log(e);
       }
      const pos1 = new THREE.Vector3(6.6 ,0 ,9.9);
      const e1 = new entity.Entity();
      const size1 = new THREE.Vector3(3,3,3);
      const center1 = new THREE.Vector3(0,1,5);
      const quaternion1 = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0),  Math.PI);
      e1.AddComponent(new gltf_component.StaticModelComponent({
        scene: this._scene,
        resourcePath: 'Assets/_Assets/Meshes/',
        resourceName: 'Kitchen Counter.fbx',
        baseColorTexture: 'Assets/_Assets/Meshes/Textures/Kitchen Counter_AlbedoTransparency.png',
        metallicTexture: 'Assets/_Assets/Meshes/Textures/Kitchen Counter_MetallicSmoothness.png',
        specular : new THREE.Color(1,1,1),
        emissive : new THREE.Color(0x000000),
        scale: 0.035,
        position: pos1,
        receiveShadow: true,
        castShadow: true,
      }));
      e1.AddComponent(new collider_component.BoxColliderComponent({
        center: center1,
        size: size1,
        scene: this._scene,
      }));
      e1.AddComponent(new counter_entity.ClearCounter({
        entitiesManager: this._entityManager,
        scene: this._scene, 
        listener: this._listener,
        volume: this._volume

      }));
      e1.SetPosition(pos1);
      e1.SetQuaternion(quaternion1);
      this._entityManager.Add(e1, 'Clear counter');
      console.log(e1);

      // clear counter
      const pos2 = new THREE.Vector3(3.3,0 ,9.9);
      const quaternion2 = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0),  Math.PI);
      const e2 = new entity.Entity();
      const size2 = new THREE.Vector3(3,3,3); 
      const center2 = new THREE.Vector3(0,1,5);
      e2.AddComponent(new gltf_component.StaticModelComponent({
        scene: this._scene,
        resourcePath: 'Assets/_Assets/Meshes/',
        resourceName: 'Kitchen Counter.fbx',
        baseColorTexture: 'Assets/_Assets/Meshes/Textures/Kitchen Counter_AlbedoTransparency.png',
        metallicTexture: 'Assets/_Assets/Meshes/Textures/Kitchen Counter_MetallicSmoothness.png',
        specular : new THREE.Color(1,1,1),
        emissive : new THREE.Color(0x000000),
        scale: 0.035,
        position: pos2,
        receiveShadow: true,
        castShadow: true,
      }));
      e2.AddComponent(new collider_component.BoxColliderComponent({
        center: center2,
        size: size2,
        scene: this._scene,
      }));
      e2.AddComponent(new counter_entity.ClearCounter({
        entitiesManager: this._entityManager,
        scene: this._scene, 
        quaternion: quaternion2,
        listener: this._listener,
        volume: this._volume
      }));
      e2.SetPosition(pos2);
      e2.SetQuaternion(quaternion2);
      this._entityManager.Add(e2, 'Clear counter');
      console.log(e2);
      
      // clear counter
      const pos4 = new THREE.Vector3(-13.2 ,0 ,9.9);
      const quaternion4 = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0),  Math.PI);
      const e4 = new entity.Entity();
      const size4 = new THREE.Vector3(3,3,3);
      const center4 = new THREE.Vector3(0,1,5);
      e4.AddComponent(new gltf_component.StaticModelComponent({
        scene: this._scene,
        resourcePath: 'Assets/_Assets/Meshes/',
        resourceName: 'Kitchen Counter.fbx',
        baseColorTexture: 'Assets/_Assets/Meshes/Textures/Kitchen Counter_AlbedoTransparency.png',
        metallicTexture: 'Assets/_Assets/Meshes/Textures/Kitchen Counter_MetallicSmoothness.png',
        specular : new THREE.Color(1,1,1),
        emissive : new THREE.Color(0x000000),
        scale: 0.035,
        position: pos4,
        receiveShadow: true,
        castShadow: true,
      }));
      e4.AddComponent(new collider_component.BoxColliderComponent({
        center: center4,
        size: size4,
        scene: this._scene,
      }));
      e4.AddComponent(new counter_entity.ClearCounter({
        entitiesManager: this._entityManager,
        scene: this._scene, 
        quaternion: quaternion4,
        listener: this._listener,
        volume: this._volume
      }));
      e4.SetPosition(pos4);
      e4.SetQuaternion(quaternion4);
      this._entityManager.Add(e4, 'Clear counter');
      console.log(e4);
      //
      const pos5 = new THREE.Vector3(-13.2 ,0 ,-6.6);
      const quaternion5 = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0),  Math.PI/2);
      const e5 = new entity.Entity();
      const size5 = new THREE.Vector3(3,3,3);
      const center5 = new THREE.Vector3(0,1,5);
      e5.AddComponent(new gltf_component.StaticModelComponent({
        scene: this._scene,
        resourcePath: 'Assets/_Assets/Meshes/',
        resourceName: 'Kitchen Counter.fbx',
        baseColorTexture: 'Assets/_Assets/Meshes/Textures/Kitchen Counter_AlbedoTransparency.png',
        metallicTexture: 'Assets/_Assets/Meshes/Textures/Kitchen Counter_MetallicSmoothness.png',
        specular : new THREE.Color(1,1,1),
        emissive : new THREE.Color(0x000000),
        scale: 0.035,
        position: pos5,
        receiveShadow: true,
        castShadow: true,
      }));
      e5.AddComponent(new collider_component.BoxColliderComponent({
        center: center5,
        size: size5,
        scene: this._scene,
      }));
      e5.AddComponent(new counter_entity.ClearCounter({
        entitiesManager: this._entityManager,
        scene: this._scene, 
        quaternion: quaternion5,
        listener: this._listener,
        volume: this._volume
      }));
      e5.SetPosition(pos5);
      e5.SetQuaternion(quaternion5);
      this._entityManager.Add(e5, 'Clear counter');
      //
      const pos6 = new THREE.Vector3(-9.9,0,-6.6);
      const quaternion6 = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0),  0);
      const e6 = new entity.Entity();
      const size6 = new THREE.Vector3(3,3,3);
      const center6 = new THREE.Vector3(0,1,5);
      e6.AddComponent(new gltf_component.StaticModelComponent({
        scene: this._scene,
        resourcePath: 'Assets/_Assets/Meshes/',
        resourceName: 'Kitchen Counter.fbx',
        baseColorTexture: 'Assets/_Assets/Meshes/Textures/Kitchen Counter_AlbedoTransparency.png',
        metallicTexture: 'Assets/_Assets/Meshes/Textures/Kitchen Counter_MetallicSmoothness.png',
        specular : new THREE.Color(1,1,1),
        emissive : new THREE.Color(0x000000),
        scale: 0.035,
        position: pos6,
        receiveShadow: true,
        castShadow: true,
      }));
      e6.AddComponent(new collider_component.BoxColliderComponent({
        center: center6,
        size: size6,
        scene: this._scene,
      }));
      e6.AddComponent(new counter_entity.ClearCounter({
        entitiesManager: this._entityManager,
        scene: this._scene, 
        quaternion: quaternion6,
        listener: this._listener,
        volume: this._volume
      }));
      e6.SetPosition(pos6);
      e6.SetQuaternion(quaternion6);
      this._entityManager.Add(e6, 'Clear counter');
      //
      const pos7 = new THREE.Vector3(-3.3,0,-6.6);
      const quaternion7 = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0),  0);
      const e7 = new entity.Entity();
      const size7 = new THREE.Vector3(3,3,3);
      const center7 = new THREE.Vector3(0,1,5);
      e7.AddComponent(new gltf_component.StaticModelComponent({
        scene: this._scene,
        resourcePath: 'Assets/_Assets/Meshes/',
        resourceName: 'Kitchen Counter.fbx',
        baseColorTexture: 'Assets/_Assets/Meshes/Textures/Kitchen Counter_AlbedoTransparency.png',
        metallicTexture: 'Assets/_Assets/Meshes/Textures/Kitchen Counter_MetallicSmoothness.png',
        specular : new THREE.Color(1,1,1),
        emissive : new THREE.Color(0x000000),
        scale: 0.035,
        position: pos7,
        receiveShadow: true,
        castShadow: true,
      }));
      e7.AddComponent(new collider_component.BoxColliderComponent({
        center: center7,
        size: size7,
        scene: this._scene,
      }));
      e7.AddComponent(new counter_entity.ClearCounter({
        entitiesManager: this._entityManager,
        scene: this._scene, 
        quaternion: quaternion7,
        listener: this._listener,
        volume: this._volume
      }));
      e7.SetPosition(pos7);
      e7.SetQuaternion(quaternion7);
      this._entityManager.Add(e7, 'Clear counter');

      // clear counter
      const pos8 = new THREE.Vector3(6.6,0,-6.6);
      const quaternion8 = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), 0);
      const e8 = new entity.Entity();
      const size8 = new THREE.Vector3(3,3,3);
      const center8 = new THREE.Vector3(0,1,5);
      e8.AddComponent(new gltf_component.StaticModelComponent({
        scene: this._scene,
        resourcePath: 'Assets/_Assets/Meshes/',
        resourceName: 'Kitchen Counter.fbx',
        baseColorTexture: 'Assets/_Assets/Meshes/Textures/Kitchen Counter_AlbedoTransparency.png',
        metallicTexture: 'Assets/_Assets/Meshes/Textures/Kitchen Counter_MetallicSmoothness.png',
        specular : new THREE.Color(1,1,1),
        emissive : new THREE.Color(0x000000),
        scale: 0.035,
        position: pos8,
        receiveShadow: true,
        castShadow: true,
      }));
      e8.AddComponent(new collider_component.BoxColliderComponent({
        center: center8,
        size: size8,
        scene: this._scene,
      }));
      e8.AddComponent(new counter_entity.ClearCounter({
        entitiesManager: this._entityManager,
        scene: this._scene, 
        quaternion: quaternion8,
        listener: this._listener,
        volume: this._volume
      }));
      e8.SetPosition(pos8);
      e8.SetQuaternion(quaternion8);
      this._entityManager.Add(e8, 'Clear counter');
      // clear counter
      const pos9 = new THREE.Vector3(9.9,0,-6.6);
      const quaternion9 = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0),  0);
      const e9 = new entity.Entity();
      const size9 = new THREE.Vector3(3,3,3);
      const center9 = new THREE.Vector3(0,1,5);
      e9.AddComponent(new gltf_component.StaticModelComponent({
        scene: this._scene,
        resourcePath: 'Assets/_Assets/Meshes/',
        resourceName: 'Kitchen Counter.fbx',
        baseColorTexture: 'Assets/_Assets/Meshes/Textures/Kitchen Counter_AlbedoTransparency.png',
        metallicTexture: 'Assets/_Assets/Meshes/Textures/Kitchen Counter_MetallicSmoothness.png',
        specular : new THREE.Color(1,1,1),
        emissive : new THREE.Color(0x000000),
        scale: 0.035,
        position: pos9,
        receiveShadow: true,
        castShadow: true,
      }));
      e9.AddComponent(new collider_component.BoxColliderComponent({
        center: center9,
        size: size9,
        scene: this._scene,
      }));
      e9.AddComponent(new counter_entity.ClearCounter({
        entitiesManager: this._entityManager,
        scene: this._scene, 
        quaternion: quaternion9,
        listener: this._listener,
        volume: this._volume
      }));
      e9.SetPosition(pos9);
      e9.SetQuaternion(quaternion9);
      this._entityManager.Add(e9, 'Clear counter');
      


    }
    _LoadFoodCounters() {
      // bread counter
      const pos1 = new THREE.Vector3(9.9 ,0 ,9.8);
      const e1 = new entity.Entity();
      const size1 = new THREE.Vector3(3,3,3);
      const center1 = new THREE.Vector3(0,1,5);
      const quaternion1 = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0),  Math.PI / 2);
      e1.AddComponent(new gltf_component.StaticModelComponent({
        scene: this._scene,
        resourcePath: 'Assets/_Assets/Meshes/',
        resourceName: 'FoodCounter.fbx',
        baseColorTexture: 'Assets/_Assets/Meshes/Textures/Kitchen Counter_AlbedoTransparency.png',
        metallicTexture: 'Assets/_Assets/Meshes/Textures/Kitchen Counter_MetallicSmoothness.png',
        specular : new THREE.Color(1,1,1),
        emissive : new THREE.Color(0x000000),
        scale: 0.035,
        position: pos1,
        receiveShadow: true,
        castShadow: true,
      }));
      e1.AddComponent(new collider_component.BoxColliderComponent({
        center: center1,
        size: size1,
        scene: this._scene,
      })); 
      e1.AddComponent(new counter_entity.FoodCounter({
        entitiesManager: this._entityManager,
        scene: this._scene, 
        contain: "Bread",
        loadDoor: true,
        pos: pos1,
        quaternion: quaternion1,
        direction: 'up',
        iconPath: 'Assets/_Assets/Textures/Icons/Bread.png',
        listener: this._listener,
        volume: this._volume
        }));
      e1.SetPosition(pos1);
      e1.SetQuaternion(quaternion1);
      this._entityManager.Add(e1, 'Food counter');
      console.log(e1);


      // cheese counter
      const e = new entity.Entity();
      const pos = new THREE.Vector3(0,0,9.9);
      const quaternion = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI /2);
      const size = new THREE.Vector3(3,3,3);
      const center = new THREE.Vector3(0,1,5);
      e.AddComponent(new gltf_component.StaticModelComponent({
        scene: this._scene,
        resourcePath: 'Assets/_Assets/Meshes/',
        resourceName: 'FoodCounter.fbx',
        baseColorTexture: 'Assets/_Assets/Meshes/Textures/Kitchen Counter_AlbedoTransparency.png',
        metallicTexture: 'Assets/_Assets/Meshes/Textures/Kitchen Counter_MetallicSmoothness.png',
        specular : new THREE.Color(1,1,1),
        emissive : new THREE.Color(0x000000),
        scale: 0.035,
        position: pos,
        receiveShadow: true,
        castShadow: true,
      }));
      e.AddComponent(new collider_component.BoxColliderComponent({
        center: center,
        size: size,
        scene: this._scene,
     }));
      e.AddComponent(new counter_entity.FoodCounter({
        entitiesManager: this._entityManager,
        scene: this._scene, 
        contain: "Cheese",
        loadDoor: true,
        pos: pos,
        quaternion: quaternion,
        direction: 'up',
        iconPath: 'Assets/_Assets/Textures/Icons/CheeseBlock.png',
        listener: this._listener,
        volume: this._volume
        }));  
      e.SetPosition(pos);
      e.SetQuaternion(quaternion);
      this._entityManager.Add(e, 'Food counter');
      console.log(e);
      
      // tomato counter
      const pos2 = new THREE.Vector3(0,0 ,-6.6);
      const quaternion2 = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0),  - Math.PI/2 );
      const e2 = new entity.Entity();
      const size2 = new THREE.Vector3(3,3,3);
      const center2 = new THREE.Vector3(0,1,5);
      e2.AddComponent(new gltf_component.StaticModelComponent({
        scene: this._scene,
        resourcePath: 'Assets/_Assets/Meshes/',
        resourceName: 'FoodCounter.fbx',
        baseColorTexture: 'Assets/_Assets/Meshes/Textures/Kitchen Counter_AlbedoTransparency.png',
        metallicTexture: 'Assets/_Assets/Meshes/Textures/Kitchen Counter_MetallicSmoothness.png',
        specular : new THREE.Color(1,1,1),
        emissive : new THREE.Color(0x000000),
        scale: 0.035,
        position: pos2,
        receiveShadow: true,
        castShadow: true,
      }));
      e2.AddComponent(new collider_component.BoxColliderComponent({
        center: center2,
        size: size2,
        scene: this._scene,
      }));
      e2.AddComponent(new counter_entity.FoodCounter({
        entitiesManager: this._entityManager,
        scene: this._scene, 
        contain: "Tomatoes",
        loadDoor: true,
        pos: pos2,
        quaternion: quaternion2,
        direction: 'down',
        iconPath: 'Assets/_Assets/Textures/Icons/Tomato.png',
        listener: this._listener,
        volume: this._volume
        }));
      e2.SetPosition(pos2);
      e2.SetQuaternion(quaternion2);
      this._entityManager.Add(e2, 'Food counter');
      console.log(e2);

      // cabbage counter
      const pos3 = new THREE.Vector3(3.3 ,0 ,-6.6);
      const quaternion3 = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0),  - Math.PI /2 );
      const e3 = new entity.Entity();
      const size3 = new THREE.Vector3(3,3,3);
      const center3 = new THREE.Vector3(0,1,5);
      e3.AddComponent(new gltf_component.StaticModelComponent({
        scene: this._scene,
        resourcePath: 'Assets/_Assets/Meshes/',
        resourceName: 'FoodCounter.fbx',
        baseColorTexture: 'Assets/_Assets/Meshes/Textures/Kitchen Counter_AlbedoTransparency.png',
        metallicTexture: 'Assets/_Assets/Meshes/Textures/Kitchen Counter_MetallicSmoothness.png',
        specular : new THREE.Color(1,1,1),
        emissive : new THREE.Color(0x000000),
        scale: 0.035,
        position: pos3,
        receiveShadow: true,
        castShadow: true,
      }));
      e3.AddComponent(new collider_component.BoxColliderComponent({
        center: center3,
        size: size3,
        scene: this._scene,
      }));
      e3.AddComponent(new counter_entity.FoodCounter({
        entitiesManager: this._entityManager,
        scene: this._scene, 
        contain: "Cabbages",
        loadDoor: true,
        pos: pos3,
        quaternion: quaternion3,
        direction: 'down',
        iconPath: 'Assets/_Assets/Textures/Icons/Cabbage.png',
        listener: this._listener,
        volume: this._volume
        }));
      e3.SetPosition(pos3);
      e3.SetQuaternion(quaternion3);
      this._entityManager.Add(e3, 'Food counter');
      console.log(e3);
      
      // meat counter
      const pos4 = new THREE.Vector3(-9.9, 0, 9.9);
      const quaternion4 = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0),  Math.PI /2)
      const e4 = new entity.Entity();
      const size4 = new THREE.Vector3(3,3,3);
      const center4 = new THREE.Vector3(0,1,5);
      e4.AddComponent(new gltf_component.StaticModelComponent({
        scene: this._scene,
        resourcePath: 'Assets/_Assets/Meshes/',
        resourceName: 'FoodCounter.fbx',
        baseColorTexture: 'Assets/_Assets/Meshes/Textures/Kitchen Counter_AlbedoTransparency.png',
        metallicTexture: 'Assets/_Assets/Meshes/Textures/Kitchen Counter_MetallicSmoothness.png',
        specular : new THREE.Color(1,1,1),
        emissive : new THREE.Color(0x000000),
        scale: 0.035,
        position: pos4,
        receiveShadow: true,
        castShadow: true,
      }));
      e4.AddComponent(new collider_component.BoxColliderComponent({
        center: center4,
        size: size4,
        scene: this._scene,
      }));
      e4.AddComponent(new counter_entity.FoodCounter({
        entitiesManager: this._entityManager,
        scene: this._scene, 
        contain: "Meats",
        loadDoor: true,
        pos: pos4,
        quaternion: quaternion4,
        direction: 'up',
        iconPath: 'Assets/_Assets/Textures/Icons/MeatPattyUncooked.png',
        listener: this._listener,
        volume: this._volume
        }));
      e4.SetPosition(pos4);
      e4.SetQuaternion(quaternion4);
      this._entityManager.Add(e4, 'Food counter');
    }
    _LoadWall() {
      //setup a plane
      let loader = new THREE.TextureLoader();
      let texture = loader.load('Assets/_Assets/Meshes/Textures/Tiles_06_basecolor.jpg');
      texture.wrapS = THREE.RepeatWrapping; // Cho phép texture lặp lại theo trục S (hoành độ)
      texture.wrapT = THREE.RepeatWrapping; // Cho phép texture lặp lại theo trục T (tung độ)
      texture.repeat.set(10, 10); // Lặp lại texture 10 lần theo cả hai trục
      const plane = new THREE.Mesh(
        new THREE.PlaneGeometry(31.2, 21.3, 10, 10),
        new THREE.MeshPhongMaterial({
           map: texture,
          }))
      plane.receiveShadow = true;
      plane.rotation.x = -Math.PI / 2;
      this._scene.add(plane);
      // setup 4 wall
      const wall1 = new THREE.Mesh(
        new THREE.BoxGeometry(0.75, 14, 21),
        new THREE.MeshToonMaterial({
          color: 0xffff5e,
          fog: true,
          fogColor: 0x3f7b9d,
        }));
      wall1.position.set(13.2 + 2, 0, 2);
      this._scene.add( wall1);
      const wall2 = new THREE.Mesh(
        new THREE.BoxGeometry(0.75, 14, 21),
        new THREE.MeshToonMaterial({
          color: 0xffff5e,
          fog: true,
          fogColor: 0x3f7b9d,
        }));
      wall2.position.set(-13.2 - 2, 0, 2);
      this._scene.add( wall2);
      const wall3 = new THREE.Mesh(
        new THREE.BoxGeometry(30, 14, 0.75),
        new THREE.MeshToonMaterial({
          color: 0xffff5e,
          fog: true,
          fogColor: 0x3f7b9d,
        }));
      wall3.position.set(0, 0, 12);
      this._scene.add( wall3);
    }
    _LoadPlayer() {
      const params = {
        camera: this._camera,
        scene: this._scene,
        listener: this._listener,
        volume: this._volume
      };

      const player = new entity.Entity();
      const size = new THREE.Vector3(1.5,5,1.5);
      const center = new THREE.Vector3(0,2.5,5);
      player.AddComponent(new player_input.BasicCharacterControllerInput());
      player.AddComponent(new player_entity.BasicCharacterController(params));
      player.AddComponent(new collider_component.BoxColliderComponent({
        center: center,
        size: size,
        scene: this._scene,
      }));
      player.SetPosition(new THREE.Vector3(0, 0 ,0)); 
      this._entityManager.Add(player, 'player'); 
      console.log(player);
    this._input = this._entityManager.Get('player').GetComponent('BasicCharacterControllerInput');
    }
    _OnWindowResize() {
      this._camera.aspect = window.innerWidth / window.innerHeight;
      this._camera.updateProjectionMatrix();
      this._threejs.setSize(window.innerWidth, window.innerHeight);
    }
    _updateElementsPosition() {
      // Get elements
      var progressBar = document.getElementById('progressBar');
      var progressBar2 = document.getElementById('progressBar2');
      var progressBar3 = document.getElementById('progressBar3');
      var progressBar4 = document.getElementById('progressBar4');
      var imageWarning = document.getElementById('imageWarning');
      var imageWarning2 = document.getElementById('imageWarning2');
      var imageContainer = document.querySelector('.image-container');

      // Get size of window
      var windowWidth = window.innerWidth;
      var windowHeight = window.innerHeight;
      // progressBar
      progressBar.style.left = (windowWidth * 69) / 100 + 'px';
      progressBar.style.top = (windowHeight * 75.5) / 100 + 'px';
      progressBar.style.width = (windowWidth * 130) / 1920 + 'px';
      // progressBar2
      progressBar2.style.left = (windowWidth * 54.8) / 100 + 'px';
      progressBar2.style.top = (windowHeight * 15.5) / 100 + 'px';
      progressBar2.style.width = (windowWidth * 98) / 1920 + 'px';
      // progressBar3
      progressBar3.style.left = (windowWidth * 61.5) / 100 + 'px';
      progressBar3.style.top = (windowHeight * 15.5) / 100 + 'px';
      progressBar3.style.width = (windowWidth * 98) / 1920 + 'px';
      // progressBar4
      progressBar4.style.left = (windowWidth * 83.5) / 100 + 'px';
      progressBar4.style.top = (windowHeight * 46) / 100 + 'px';
      progressBar4.style.width = (windowWidth * 125) / 1920 + 'px';
      // imageWarning
      imageWarning.style.left = (windowWidth * 85.5) / 100 + 'px';
      imageWarning.style.top = (windowHeight * 41) / 100 + 'px';
      // imageWarning2
      imageWarning2.style.left = (windowWidth * 63) / 100 + 'px';
      imageWarning2.style.top = (windowHeight * 10.5) / 100 + 'px';
      // imageContainer
      imageContainer.style.left = (windowWidth * 65) / 100 + 'px';
      imageContainer.style.top = (windowHeight * 3) / 100 + 'px';
    }
    _RAF() {
         requestAnimationFrame((t) => {
          if (this._previousRAF === null) {
            this._previousRAF = t;
          }
          this._RAF();
          this._threejs.render(this._scene, this._camera);
          this._Step(t - this._previousRAF);
          this._previousRAF = t;
        });
    }
    _Step(timeElapsed) {
      const timeElapsedS = Math.min(1.0 / 60.0, timeElapsed * 0.001);
      if (this._input._keys.pause)
      {
        this._isGamePaused = !this._isGamePaused;
        console.log('pause');
        this._input._keys.pause = false;
        if (this._isGamePaused)
        {
          this._gamePause();
        } else
        {
          document.querySelector('.menu-container2').remove();
          document.querySelector('.pause-menu-background').remove();
          document.querySelector('.paused-text').remove();
          this._isGamePaused = false;
        }
      }
      if (!this._isGamePaused && !this._isGameOver)
      { 
        this._entityManager.updateEntities(timeElapsedS);
        if(this._isGameStarted && !this._isGameOver)
        {
          this._timer-=1;
          this._updateTimer(this._timer/100);
        }
      }
      if (this._timer == 0)
      {
        this._gameOver();
        this._timer = 9000;
      }
    }
}
let _APP = null;

window.addEventListener('DOMContentLoaded', () => {
  _APP = new GameMenu();
  console.log(_APP);
});


