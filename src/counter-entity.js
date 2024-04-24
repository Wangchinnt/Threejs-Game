import * as THREE from 'three';
import {entity} from './entity.js';
import {gltf_component} from './gltf-component.js';
import {plate_entity} from './plate-entity.js';

export const counter_entity = (() => {
    class Counter extends entity.Component {
        constructor() {
            super();
        }
        
        _Init(params) {
        }
        interact(item) {
            // Override this method in child classes
        }
        _loadIcon(iconPath, scene, pos, scale, rotation) {
            // Override this method in child classes
            const loader = new THREE.TextureLoader();
            var iconTexture = loader.load(iconPath);
            const plane = new THREE.Mesh(
            new THREE.PlaneGeometry(1, 1),
            new THREE.MeshBasicMaterial({
            map: iconTexture,
            side: THREE.DoubleSide,
            transparent: true,
            }));
            plane.position.set(pos.x, pos.y, pos.z);
            plane.scale.set(scale, scale, scale);
            plane.rotateX(rotation);
            scene.add(plane);
            return plane;
        }
        _loadAudio(audioPath, loop, volume)
        {
            const sound = new THREE.Audio(this._listener);
            const audioLoader = new THREE.AudioLoader();
            audioLoader.load(audioPath, function(buffer) {
              sound.setBuffer(buffer);
              sound.setLoop(loop);
              sound.setVolume(volume);
              sound.play();
            });
        }
        Update(timeElapsed) { 

        }
    }
    class ClearCounter extends Counter {
        constructor(params) {
            super();
            this._Init(params);
           
        }
    
        _Init(params) {
            this._hasFood = false;
            this._food = null;
            this._interact = false;
            this._quaternion = params.quaternion;
            this._listener = params.listener;
            this._volume = params.volume;
            this._audioPickup ='Assets/_Assets/Sounds/SFX/SFX_object_pickup01.wav';
            this._audioDrop = 'Assets/_Assets/Sounds/SFX/SFX_object_drop01.wav';
        }

        _loadAudio(audioPath, loop, volume) {
            super._loadAudio(audioPath, loop, volume);
        }
    
        interact(item) {
            this._interact = true;
            // Thực hiện logic interact
            if (!this._hasFood && item != null) {
                this._loadAudio(this._audioDrop, false, this._volume);
                console.log('Pushed item on the ', this._parent.GetName());
                this._food = item;
                this._hasFood = true;
                console.log('Clear counter is full');
                return null;
            } else if (this._hasFood && item == null) {
                this._loadAudio(this._audioPickup, false, this._volume);
                console.log('Take the food from the ' , this._parent.GetName());
                let food = this._food;
                this._food = null;
                this._hasFood = false;
                return food;
            }
            else if(this._hasFood && item != null && this._food.GetName() != 'Plate' && item.GetName() != 'Plate') {
                console.log('Clear counter is full');
                return item;
            }
            else if(this._hasFood && this._food.GetName() == 'Plate' && item != null) {
                console.log('there is a plate on the counter');
                if (this._food.GetComponent('PlateEntity').AddIngredients(item)) {
                    this._loadAudio(this._audioDrop, false, this._volume);
                    return null;
                }
                return item;
            }
            else if(this._hasFood && this._food.GetName() != 'Plate' && item != null && item.GetName() == 'Plate') {
                if (item.GetComponent('PlateEntity').AddIngredients(this._food)) {
                    this._loadAudio(this._audioDrop, false, this._volume);
                    console.log('Push food from the counter on the plate ');
                    this._food = null;
                    this._hasFood = false;
                } 
                return item;   
            }
               
        }
        Update() {
            if (this._interact && this._food != null) {
                let pos = new THREE.Vector3(this._parent.GetPosition().x, 3, this._parent.GetPosition().z);
                let quaternion = this._parent.GetQuaternion().clone()
                this._food.SetPosition(pos);
                if (this._food.GetName() != 'Plate') {
                this._food.SetQuaternion(quaternion.multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI/2)));
                }
                this._interact = false;
            }
        }
    }
    class FoodCounter extends Counter {
        constructor(params) {
            super();
            this._Init(params);
        }

        _Init(params) {
            // Init method if needed
            this._scene = params.scene;
            this._entitiesManager = params.entitiesManager;
            this._food = null;
            this._contain = params.contain;
            this._pos = params.pos;
            this._quaternion = params.quaternion;
            this._direction = params.direction;
            this._listener = params.listener;
            this._volume = params.volume;
            this._audioPickup ='Assets/_Assets/Sounds/SFX/SFX_object_pickup01.wav';
            this._icon = this._loadIcon(params.iconPath, this._scene, this._pos.clone().add(new THREE.Vector3(0, 3, 0)), 1);
            this._door = this._loadDoor(this._quaternion, this._direction);
            this._SpawnFood(this._pos.clone().add(new THREE.Vector3(0, 1.5, 0)));

        }
        _loadIcon(iconPath, scene, pos, scale) {
            if (this._direction == 'up'){
                return super._loadIcon(iconPath, scene, pos, scale, Math.PI / 2);
            } 
            return super._loadIcon(iconPath, scene, pos, scale, -Math.PI / 2); 
        }
        _loadAudio(audioPath, loop, volume) {
            super._loadAudio(audioPath, loop, volume);
        }
        _loadDoor(quaternion, direction) {
            const e = new entity.Entity();
            e.AddComponent(new gltf_component.StaticModelComponent({
                scene: this._scene,
                resourcePath: 'Assets/_Assets/Meshes/',
                resourceName: 'Single door.fbx',
                baseColorTexture: 'Assets/_Assets/Meshes/Textures/Kitchen Counter_AlbedoTransparency.png',
                metallicTexture: 'Assets/_Assets/Meshes/Textures/Kitchen Counter_MetallicSmoothness.png',
                specular : new THREE.Color(1,1,1),
                emissive : new THREE.Color(0x000000),
                scale: 0.035,
                receiveShadow: true,
                castShadow: true,
            }));
            if (direction == 'up'){
                e.SetPosition(this._pos.clone().add(new THREE.Vector3(-0.1, 2.8, 1)));
            } else {
                e.SetPosition(this._pos.clone().add(new THREE.Vector3(0.1, 2.8, -1)));
            }
            e.SetQuaternion(quaternion);
            this._entitiesManager.Add(e, 'Door');
            e.SetParent(this._parent);
            return e;
        }
        _RotateDoor(){
            let quaternion = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), Math.PI/4);
            let combinedQuaternion = this._door.GetQuaternion().multiply(quaternion);
            this._door.SetQuaternion(this._door.GetQuaternion().slerp(combinedQuaternion, 0.1));
            if (this._direction == 'up'){
                this._icon.rotateX(Math.PI / 4 + Math.PI);
                this._icon.position.set(this._pos.x, 3.75, this._pos.z + 0.55);
            } else {
                this._icon.rotateX(-Math.PI / 4);
                this._icon.position.set(this._pos.x, 3.75, this._pos.z - 0.55);
            }
        }
        _ResetDoor(){
            this._door.SetQuaternion(this._quaternion);
            if (this._direction == 'up') {
                this._icon.rotateX(- Math.PI / 4 + Math.PI);
            } 
            else {
                this._icon.rotateX(Math.PI / 4);
            }
            this._icon.position.set(this._pos.x, 3, this._pos.z);
        }
        _SpawnFood(pos) {
            if (this._contain == "Cheese")
            {
                this._food = new entity.Entity();
                this._food.AddComponent(new gltf_component.StaticModelComponent({
                    scene: this._scene,
                    resourcePath: 'Assets/_Assets/Meshes/',
                    resourceName: 'Cheese block.fbx',
                    baseColorTexture: 'Assets/_Assets/Meshes/Textures/cheese_AlbedoTransparency.png',
                    metallicTexture: 'Assets/_Assets/Meshes/Textures/cheese_MetallicSmoothness.png',
                    specular : new THREE.Color(1,1,1),
                    emissive : new THREE.Color(0x000000),
                    scale: 0.045,
                    receiveShadow: true,
                    castShadow: true,
                }));
                this._entitiesManager.Add(this._food, 'Cheese');
                this._food.SetActive(true);    
                //this._food.SetQuaternion(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI));
            }
            else if (this._contain == "Bread")
            {
                this._food = new entity.Entity();
                this._food.AddComponent(new gltf_component.StaticModelComponent({
                    scene: this._scene,
                    resourcePath: 'Assets/_Assets/Meshes/',
                    resourceName: 'Bread.fbx',
                    baseColorTexture: 'Assets/_Assets/Meshes/Textures/Bread_AlbedoTransparency.png',
                    metallicTexture: 'Assets/_Assets/Meshes/Textures/Bread_MetallicSmoothness.png',
                    specular : new THREE.Color(1,1,1),
                    emissive : new THREE.Color(0x000000),
                    scale: 0.045,
                    receiveShadow: true,
                    castShadow: true,
                }));
                this._entitiesManager.Add(this._food, 'Bread');
                this._food.SetActive(true);    
                //this._food.SetQuaternion(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), - Math.PI/2));
            }
            else if (this._contain == "Tomatoes")
            {
                this._food = new entity.Entity();
                this._food.AddComponent(new gltf_component.StaticModelComponent({
                    scene: this._scene,
                    resourcePath: 'Assets/_Assets/Meshes/',
                    resourceName: 'Tomato.fbx',
                    baseColorTexture: 'Assets/_Assets/Meshes/Textures/Tomato_AlbedoTransparency.png',
                    metallicTexture: 'Assets/_Assets/Meshes/Textures/Tomato_MetallicSmoothness.png',
                    specular : new THREE.Color(1,1,1),
                    emissive : new THREE.Color(0x000000),
                    scale: 0.045,
                    receiveShadow: true,
                    castShadow: true,
                }));
                this._entitiesManager.Add(this._food, 'Tomato');
                this._food.SetActive(true);    
            }
            else if (this._contain == "Cabbages")
            {
                this._food = new entity.Entity();
                this._food.AddComponent(new gltf_component.StaticModelComponent({
                    scene: this._scene,
                    resourcePath: 'Assets/_Assets/Meshes/',
                    resourceName: 'Cabbage.fbx',
                    baseColorTexture: 'Assets/_Assets/Meshes/Textures/Cabbage_AlbedoTransparency.png',
                    metallicTexture: 'Assets/_Assets/Meshes/Textures/Cabbage_MetallicSmoothness.png',
                    specular : new THREE.Color(1,1,1),
                    emissive : new THREE.Color(0x000000),
                    scale: 0.045,
                    receiveShadow: true,
                    castShadow: true,
                }));
                this._entitiesManager.Add(this._food, 'Cabbage');
                this._food.SetActive(true);    
            }
            else if (this._contain == "Meats")
            {
                this._food = new entity.Entity();
                this._food.AddComponent(new gltf_component.StaticModelComponent({
                    scene: this._scene,
                    resourcePath: 'Assets/_Assets/Meshes/',
                    resourceName: 'Uncooked meat patty.fbx',
                    baseColorTexture: 'Assets/_Assets/Meshes/Textures/Meat_AlbedoTransparency.png',
                    metallicTexture: 'Assets/_Assets/Meshes/Textures/Meat_MetallicSmoothness.png',
                    specular : new THREE.Color(1,1,1),
                    emissive : new THREE.Color(0x000000),
                    scale: 0.045,
                    receiveShadow: true,
                    castShadow: true,
                }));
                this._entitiesManager.Add(this._food, 'Meat');
                this._food.SetActive(true);    
            }
            if (pos != null) this._food.SetPosition(pos);
        }
        interact(){
            // ["chesse", "hamburgers", "tomatoes", "cabbages", "meats", "plates"]
            // Thực hiện logic interact
            this._loadAudio(this._audioPickup, false, this._volume);
            let food = this._food;
            this._RotateDoor();
            setTimeout(() => {
                this._SpawnFood(this._pos.clone().add(new THREE.Vector3(0, 1.5, 0)));
                this._ResetDoor()
            }, 150);
            return food;
        }
        
        Update(timeElapsed) {
            
        }

    }
    class PlateCounter extends Counter {
        constructor(params) {
            super();
            this._Init(params);
        }
        _Init(params) {
            // Init method if needed
            this._scene = params.scene;
            this._entitiesManager = params.entitiesManager;
            this._pos = params.pos;
            this._icon = this._loadIcon(params.iconPath, this._scene, this._pos.clone().add(new THREE.Vector3(0, 3, 0)), 1);
            this._plates = [];
            this._listener = params.listener;
            this._volume = params.volume;
            this._audioPickup ='Assets/_Assets/Sounds/SFX/SFX_object_pickup01.wav';
        }
        _loadIcon(iconPath, scene, pos, scale, rotation) {
            return super._loadIcon(iconPath, scene, pos, scale, rotation);
        }
        _loadAudio(audioPath, loop, volume) {
            super._loadAudio(audioPath, loop, volume);
        }
        _SpawnPlate(pos) {
            let plate = new entity.Entity();
            plate.AddComponent(new gltf_component.StaticModelComponent({
                scene: this._scene,
                resourcePath: 'Assets/_Assets/Meshes/',
                resourceName: 'Plate.fbx',
                baseColorTexture: 'Assets/_Assets/Meshes/Textures/Plate_AlbedoTransparency.png',
                metallicTexture: 'Assets/_Assets/Meshes/Textures/Plate_MetallicSmoothness.png',
                specular : new THREE.Color(1,1,1),
                emissive : new THREE.Color(0x000000),
                scale: 0.045,
                receiveShadow: true,
                castShadow: true,
            }));
            plate.AddComponent(new plate_entity.PlateEntity({
                entitiesManager: this._entitiesManager,
                scene: this._scene,
            }));
            this._entitiesManager.Add(plate, 'Plate');
            plate.SetActive(true);  
            plate.SetPosition(pos);
            this._plates.push(plate);
        }
        interact() {
            this._loadAudio(this._audioPickup, false, this._volume);
            let plate = this._plates.at(-1);
            this._plates.pop();
            return plate;
        }

        Update(timeElapsed) {
            if (this._plates.length < 3) {
                this._SpawnPlate(this._pos.clone().add(new THREE.Vector3(0, 3 + (this._plates.length) * 0.1 , 0 )));
            }
        }

    }
    class CuttingCounter extends Counter {
        constructor(params) {
            super();
            this._Init(params);
        }

        _Init(params) {
            // Init method if needed
            this._scene = params.scene;
            this._entitiesManager = params.entitiesManager;
            this._food = null;
            this._pos = params.pos;
            this._direction = params.direction
            this._cuttingProcess = 0;
            this._cutting = false;
            this._progressBar = document.getElementById(params.progressBarName);
            this._progressFill = document.getElementById(params.progressBarName +'Fill');
            this._percentFill = 34;
            this._choppingBoard = new entity.Entity();
            this._choppingBoard.AddComponent(new gltf_component.StaticModelComponent({
                scene: this._scene,
                resourcePath: 'Assets/_Assets/Meshes/',
                resourceName: 'Chopping Board.fbx',
                baseColorTexture: 'Assets/_Assets/Meshes/Textures/Chopping board_AlbedoTransparency.png',
                metallicTexture: 'Assets/_Assets/Meshes/Textures/Chopping board_MetallicSmoothness.png',
                specular : new THREE.Color(1,1,1),
                emissive : new THREE.Color(0x000000),
                scale: 0.035,
                receiveShadow: true,
                castShadow: true,
            }));
            this._entitiesManager.Add(this._choppingBoard, 'Chopping Board');
            this._choppingBoard.SetActive(true);    
            this._choppingBoard.SetParent(this);
            this._choppingBoard.SetPosition(new THREE.Vector3(this._pos.x, 3.05, this._pos.z));
            if (this._direction == 'up') {
                this._choppingBoard.SetQuaternion(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI));
            } else {
                this._choppingBoard.SetQuaternion(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), - Math.PI));
            }
            this._Knife = new entity.Entity();
            this._Knife.AddComponent(new gltf_component.StaticModelComponent({
                scene: this._scene,
                resourcePath: 'Assets/_Assets/Meshes/',
                resourceName: 'Knife.fbx',
                baseColorTexture: 'Assets/_Assets/Meshes/Textures/Knife_AlbedoTransparency.png',
                metallicTexture: 'Assets/_Assets/Meshes/Textures/Knife_MetallicSmoothness.png',
                specular : new THREE.Color(1,1,1),
                emissive : new THREE.Color(0x000000),
                scale: 0.035,
                receiveShadow: true,
                castShadow: true,
            }));
            this._entitiesManager.Add(this._Knife, 'Knife');
            this._Knife.SetActive(true);
            this._resetKnife();
            this._Knife.SetParent(this);   
            this._listener = params.listener;
            this._volume = params.volume;
            this._audioPickup ='Assets/_Assets/Sounds/SFX/SFX_object_pickup01.wav';
            this._audioDrop = 'Assets/_Assets/Sounds/SFX/SFX_object_drop01.wav';
            this._audioChop = 'Assets/_Assets/Sounds/SFX/SFX_chop01.wav';
        }
        _resetKnife() {
            if (this._direction == 'up') {
                this._Knife.SetQuaternion(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI/2));
                this._Knife.SetPosition(new THREE.Vector3(this._pos.x + 0.8, 3, this._pos.z - 1));
            } else {
                this._Knife.SetQuaternion(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), -Math.PI/2));
                this._Knife.SetPosition(new THREE.Vector3(this._pos.x - 0.8, 3, this._pos.z + 1));
            }
        
            this._cuttingProcess = 0;
        }
        _loadAudio(audioPath, loop, volume) {
            super._loadAudio(audioPath, loop, volume);
        }
        interact(item, input) {
            this._interact = true;
            // Thực hiện logic interact
            if (!input && item != null && item.GetName() != 'Tomato' & item.GetName() != 'Cabbage' & item.GetName() != 'Cheese'){
                console.log('This is not a item for cutting');
                if (item.GetName() == 'Plate' && item.GetComponent('PlateEntity').AddIngredients(this._food)) {
                    this._loadAudio(this._audioPickup, false, this._volume);
                    console.log('Push food from the counter on the plate ');
                    this._food = null;
                    this._hasFood = false;
                } 
                return item;
            } else if (!this._hasFood && item != null && !input) {
                this._loadAudio(this._audioDrop, false, this._volume);
                console.log('Pushed item on the ', this._parent.GetName());
                this._food = item;
                this._hasFood = true;
                this._cutting = false;
                return null;
            } else if (this._hasFood && item == null && !input) {
                this._loadAudio(this._audioPickup, false, this._volume);
                console.log('Take the food from the ' , this._parent.GetName());
                let food = this._food;
                this._food = null;
                this._hasFood = false;
                this._resetKnife();
                this.hideProgressBar();
                return food;
            } else if (this._hasFood && input && item == null && this._food.GetName() != 'Tomato slice' & this._food.GetName() != 'Cabbage slice' & this._food.GetName() != 'Cheese slice') { 
                this._loadAudio(this._audioChop, false, this._volume);
                this._cuttingProcess += 1;
                this.showProgressBar();
                this.updateProgressBar(this._cuttingProcess * this._percentFill);
                if (this._cuttingProcess == 3){
                    this._food = this.CutFood();
                    this._cutting = false;
                }
                else {
                    this.CutFoodProcess();
                    this._cutting = true;
                }
                if (!this._cutting) {
                    this._resetKnife()
                    this.hideProgressBar();
                }
                return null; 
            } else if (this._hasFood && item != null && item.GetName() != 'Plate' && !input) {
                console.log('Clear counter is full');
                return item;
            } else if (!this._hasFood && item != null && input) {
                console.log('Wrong key input');
                return item;  
            }
        }

        Update(timeElapsed) {
            if (this._interact && this._food != null) {
                let pos = new THREE.Vector3(this._parent.GetPosition().x, 3.1, this._parent.GetPosition().z);
                // let quaternion = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI);
                this._food.SetPosition(pos);
                //this._food.SetQuaternion(quaternion);
                this._interact = false;
            }
            if (this._cutting && this._food != null){
                
                var rotationSpeed = 6;

                if (this._direction == 'up'){
                    // Định vị dao góc quay trên không
                    var quaternion1 = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI);
                    var quaternion2 = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), Math.PI/2);
                    // Góc chém của dao
                    var quaternion3 = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI/9);
                } else {
                    // Định vị dao góc quay trên không
                    var quaternion1 = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), 0);
                    var quaternion2 = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), Math.PI/2);
                    // Góc chém của dao
                    var quaternion3 = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI/9)
                }

                // Kết hợp ba quaternion lại với nhau
                var combinedQuaternion = new THREE.Quaternion();
                combinedQuaternion.multiplyQuaternions(quaternion1, quaternion2);
                combinedQuaternion.multiplyQuaternions(combinedQuaternion, quaternion3);
                this._Knife.SetQuaternion(this._Knife.GetQuaternion().slerp(combinedQuaternion, rotationSpeed * timeElapsed)); 
            }
      
           
        }   
        CutFood(){
            let foodName = this._food.GetName();
            this._food.SetActive(false);
            this._entitiesManager.Remove(this._food);
            this._food = null;
            console.log('Cutting the food');
            let food = new entity.Entity();
                food.AddComponent(new gltf_component.StaticModelComponent({
                    scene: this._scene,
                    resourcePath: 'Assets/_Assets/Meshes/',
                    resourceName: foodName + ' slice.fbx',
                    baseColorTexture: 'Assets/_Assets/Meshes/Textures/'+ foodName +'_AlbedoTransparency.png',
                    metallicTexture: 'Assets/_Assets/Meshes/Textures/'+ foodName +'_MetallicSmoothness.png',
                    specular : new THREE.Color(1,1,1),
                    emissive : new THREE.Color(0x000000),
                    scale: 0.045,
                    receiveShadow: true,
                    castShadow: true,
                }));
            this._entitiesManager.Add(food, foodName +' slice');
            food.SetActive(true);  
            return food; 
        }
        CutFoodProcess() {
        
        if (this._direction == 'up'){
            // set vị trí của dao lên cao
            this._Knife.SetPosition(new THREE.Vector3(this._pos.x, 3.7, this._pos.z-1));
            // góc dao chém
            var quaternion1 = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI);
            var quaternion2 = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), Math.PI/2);
        } else {
            // set vị trí của dao lên cao
            this._Knife.SetPosition(new THREE.Vector3(this._pos.x, 3.7, this._pos.z+1));
            // góc dao chém
            var quaternion1 = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), 0);
            var quaternion2 = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), Math.PI/2);
        }

        var combinedQuaternion = new THREE.Quaternion();
        combinedQuaternion.multiplyQuaternions(quaternion1, quaternion2);
        this._Knife.SetQuaternion(combinedQuaternion); 

        }
        //Định nghĩa hàm hiển thị thanh tiến trình
        showProgressBar() {
            this._progressBar.style.visibility = 'visible';
        }

        // Định nghĩa hàm cập nhật phần trăm của thanh tiến trình
        updateProgressBar(percent) {
            this._progressFill.style.width = percent + '%';
        }

        // Định nghĩa hàm ẩn thanh tiến trình
        hideProgressBar() {
            this._progressBar.style.visibility = 'hidden';
        }   

    }
    class TrashCounter extends Counter {
        constructor(params) {
            super();
            this._Init(params);
        }
        _Init(params) {
            // Init method if needed
            this._scene = params.scene;
            this._entitiesManager = params.entitiesManager;
            this._food = null;
            this._listener = params.listener;
            this._volume = params.volume;
            this._audioTrash = 'Assets/_Assets/Sounds/SFX/SFX_trash02.wav';
            
        }
        _loadAudio(audioPath, loop, volume) {
            super._loadAudio(audioPath, loop, volume);
        }
        interact(item) {
            // Thực hiện logic interact
            this._loadAudio(this._audioTrash, false, this._volume);
            console.log('Throw the food to the trash');
            if (item.GetName() == 'Plate') {
                item.GetComponent('PlateEntity').ClearPlate();
            }
            this._entitiesManager.Remove(item);
            item.SetActive(false);
            return null;
        }
    }
    class StoveCounter extends Counter {
        constructor(params) {
            super();
            this._Init(params);
        }
        _Init(params) {
            this._scene = params.scene;
            this._entitiesManager = params.entitiesManager;
            this._pos = params.pos;
            this._quaternion = params.quaternion;
            this._listener = params.listener;
            this._volume = params.volume;
            this._audioPickup ='Assets/_Assets/Sounds/SFX/SFX_object_pickup01.wav';
            this._audioDrop = 'Assets/_Assets/Sounds/SFX/SFX_object_drop01.wav';
            this._audioWarning = 'Assets/_Assets/Sounds/SFX/SFX_warning01.wav';
            this._audioFrying = 'Assets/_Assets/Sounds/SFX/SFX_pan_sizzle_loop.wav';
            this._food = null;
            this._frying = false;
            this._fryingProcess = 0;
            this._fryingFood = null;
            this._burnedFood = null;
            this._progressBar = document.getElementById(params.progressBarName);
            this._progressFill = document.getElementById(params.progressBarName+'Fill');
            this._percentFill = 0.2;
            this._warning = document.getElementById(params.warning);
            this._sound = null;
            this._sound2 = null;
            this._stove = new entity.Entity();
            this._stove.AddComponent(new gltf_component.StaticModelComponent({
                scene: this._scene,
                resourcePath: 'Assets/_Assets/Meshes/',
                resourceName: 'Stove Counter.fbx',
                baseColorTexture: 'Assets/_Assets/Meshes/Textures/Stove_AlbedoTransparency.png',
                metallicTexture: 'Assets/_Assets/Meshes/Textures/Stove_MetallicSmoothness.png',
                specular : new THREE.Color(1,1,1),
                emissive : new THREE.Color(0x000000),
                scale: 0.035,
                receiveShadow: true,
                castShadow: true,
            }));
            this._entitiesManager.Add(this._stove, 'Stove');
            this._stove.SetActive(true);
            this._stove.SetParent(this);
            this._stove.SetPosition(new THREE.Vector3(this._pos.x, 3.2, this._pos.z));
            this._stove.SetQuaternion(this._quaternion);

            this._pan = new entity.Entity();
            this._pan.AddComponent(new gltf_component.StaticModelComponent({
                scene: this._scene,
                resourcePath: 'Assets/_Assets/Meshes/',
                resourceName: 'Frying Pan.fbx',
                baseColorTexture: 'Assets/_Assets/Meshes/Textures/Frying pan_AlbedoTransparency.png',
                metallicTexture: 'Assets/_Assets/Meshes/Textures/Frying pan_MetallicSmoothness.png',
                specular : new THREE.Color(1,1,1),
                emissive : new THREE.Color(0x000000),
                scale: 0.035,
                receiveShadow: true,
                castShadow: true,
            }));
            this._entitiesManager.Add(this._pan, 'Pan');
            this._pan.SetActive(true);
            this._pan.SetParent(this);
            this._pan.SetPosition(new THREE.Vector3(this._pos.x, 3.1, this._pos.z));
            this._pan.SetQuaternion(this._quaternion.clone().multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI / 9)));
        }
        _loadAudio(audioPath, loop, volume, duration) {
            const sound = new THREE.Audio(this._listener);
            const audioLoader = new THREE.AudioLoader();
            audioLoader.load(audioPath, function(buffer) {
              sound.setBuffer(buffer);
              sound.setLoop(loop);
              sound.setVolume(volume);
              sound.play();
              if(duration != null) {
                setTimeout(() => {
                    sound.stop();
                  }, duration * 1000);
              }
            });
            return sound;
        }
        interact(item) {
            // Thực hiện logic interact
            if (item != null && item.GetName() != 'Meat'){
                if (item.GetName() == 'Plate' && item.GetComponent('PlateEntity').AddIngredients(this._food)) {
                    if (this._sound != null) this._sound.stop();
                    if (this._sound2 != null) this._sound2.stop();
                    console.log('Push food from the counter on the plate ');
                    this._food = null;
                    this._hasFood = false;
                    this._frying = false;
                    this._fryingProcess = 0;
                    this.hideProgressBar();
                    this.hideWarning();
                } else console.log('This is not a item for frying');
                return item;
            } else if (!this._hasFood && item != null ) {
                this._loadAudio(this._audioDrop, false, this._volume);
                console.log('Pushed item on the ', this._parent.GetName());
                this._food = item;
                this._food.SetPosition(new THREE.Vector3(this._pos.x, 3.2, this._pos.z));
                this._hasFood = true;
                this._sound = this._loadAudio(this._audioFrying, true, this._volume);
                this._frying = true;
                console.log('Frying');
                return null;
            } else if (this._hasFood && item == null) {
                if (this._sound != null) this._sound.stop();
                if (this._sound2 != null) this._sound2.stop();
                this._loadAudio(this._audioPickup, false, this._volume);
                console.log('Take the food from the ' , this._parent.GetName());
                let food = this._food;
                this._food = null;
                this._hasFood = false;
                this._frying = false;
                this._fryingProcess = 0;
                this.hideWarning();
                this.hideProgressBar();
                return food;
            } else if (this._hasFood && item != null && item.GetName() != 'Plate') {
                console.log('Clear counter is full');
                return item;
            } else if (this._hasFood && item != null && item.GetName() == 'Plate') {
                if (item.GetComponent('PlateEntity').AddIngredients(this._food)) {
                    console.log('Push food from the counter on the plate ');
                    this._food = null;
                    this._hasFood = false;
                } 
                return item;   
            }
        }
        Update() {  
            if (this._frying) {
                this.showProgressBar();
                this.updateProgressBar(this._fryingProcess % 250 * 0.4 );
                this._fryingProcess ++;
                let modelComponent = this._stove.GetComponent("StaticModelComponent")._target;
                modelComponent.traverse(c => {
                    if (c.isMesh) {
                        const materials = Array.isArray(c.material) ? c.material : [c.material];
                        materials.forEach(material => {
                            if (material && material.emissive) {
                                // Thiết lập màu đỏ như máu
                                material.emissive.set(0xff0000);
                                material.emissiveIntensity = 0.5;
                            } else {
                                // Nếu vật liệu không có thuộc tính emissive, hiển thị thông báo lỗi
                                console.log("Material or emissive property is undefined.");
                            }
                        });
                    }
                });
            } else {
                let modelComponent = this._stove.GetComponent("StaticModelComponent")._target;
                if (modelComponent) {
                    modelComponent.traverse(c => {
                        if (c.isMesh) {
                            const materials = Array.isArray(c.material) ? c.material : [c.material];
                            materials.forEach(material => {
                                if (material && material.emissive) {
                                    // Thiết lập màu đỏ như máu
                                    material.emissive.set(0x000000);
                                    material.emissiveIntensity = 0.5;
                                } else {
                                    // Nếu vật liệu không có thuộc tính emissive, hiển thị thông báo lỗi
                                    console.log("Material or emissive property is undefined.");
                                }
                            });
                        }
                    });
                }
            }

            if (this._fryingProcess == 235 ){
                this._fryingFood = new entity.Entity();
                this._fryingFood.AddComponent(new gltf_component.StaticModelComponent({
                    scene: this._scene,
                    resourcePath: 'Assets/_Assets/Meshes/',
                    resourceName: 'Cooked meat patty.fbx',
                    baseColorTexture: 'Assets/_Assets/Meshes/Textures/Meat_AlbedoTransparency.png',
                    metallicTexture: 'Assets/_Assets/Meshes/Textures/Meat_MetallicSmoothness.png',
                    specular : new THREE.Color(1,1,1),
                    emissive : new THREE.Color(0x000000),
                    scale: 0.035,
                    receiveShadow: true,
                    castShadow: true,
                }));
                this._entitiesManager.Add(this._fryingFood, 'Cooked Meat');
                this._fryingFood.SetPosition(this._food.GetPosition());
                this._fryingFood.SetActive(false);
            }
            else if (this._fryingProcess == 475 ) {
                this._burnedFood = new entity.Entity();
                this._burnedFood.AddComponent(new gltf_component.StaticModelComponent({
                    scene: this._scene,
                    resourcePath: 'Assets/_Assets/Meshes/',
                    resourceName: 'Burned meat patty.fbx',
                    baseColorTexture: 'Assets/_Assets/Meshes/Textures/Meat_AlbedoTransparency.png',
                    metallicTexture: 'Assets/_Assets/Meshes/Textures/Meat_MetallicSmoothness.png',
                    specular : new THREE.Color(1,1,1),
                    emissive : new THREE.Color(0x000000),
                    scale: 0.035,
                    receiveShadow: true,
                    castShadow: true,
                }));
                this._entitiesManager.Add(this._burnedFood, 'Burned Meat');
                this._burnedFood.SetActive(false);
                this._burnedFood.SetPosition(this._food.GetPosition());
            }
            if (this._fryingProcess == 250  && this._fryingFood != null && this._food != null) {
                this._food.SetActive(false);
                this._entitiesManager.Remove(this._food);
                
                this._fryingFood.SetActive(true);
                this._food = this._fryingFood;
                
            }
            if (this._fryingProcess == 300) {
                this._sound2 = this._loadAudio(this._audioWarning, true, this._volume,);
                this.showWarning();
            }
            if (this._fryingProcess == 500 ){
                if (this._fryingFood != null && this._burnedFood != null) {
                    this._fryingFood.SetActive(false);
                    this._entitiesManager.Remove(this._fryingFood);
                    this._burnedFood.SetActive(true);
                    this._food = this._burnedFood;
                }   
                this._fryingProcess = 0;
                this._frying = false;
                this._sound.stop();
                this._sound2.stop();
                this.hideProgressBar();
                this.hideWarning();
            }
        }

        //Định nghĩa hàm hiển thị thanh tiến trình
        showProgressBar() {
            this._progressBar.style.visibility = 'visible';
        }

        // Định nghĩa hàm cập nhật phần trăm của thanh tiến trình
        updateProgressBar(percent) {
            this._progressFill.style.width = percent + '%';
        }

        // Định nghĩa hàm ẩn thanh tiến trình
        hideProgressBar() {
            this._progressBar.style.visibility = 'hidden';
        } 
        showWarning() {
            this._warning.style.visibility = 'visible';
        }
        hideWarning() {
            this._warning.style.visibility = 'hidden';
        }
    }
    class DeliveryCounter extends Counter {
        constructor(params) {
            super();
            this._Init(params);
        }

        _Init(params) {
            // Init method if needed
            this._scene = params.scene;
            this._entitiesManager = params.entitiesManager;
            this._food = null;
            this._pos = params.pos;
            this._icon = this._loadIcon(params.iconPath, this._scene, this._pos.clone().add(new THREE.Vector3(-0.65 , 3, 0)), 1.5, new THREE.Vector3(Math.PI/2, Math.PI, 0));
            this._icon2 = this._loadIcon(params.iconPath, this._scene, this._pos.clone().add(new THREE.Vector3(0.85, 3, 0)), 1.5, new THREE.Vector3(Math.PI/2, Math.PI, 0));
            this._successImage = document.getElementById('imageSuccessful');
            this._failedImage = document.getElementById('imageFailed');
            this._iconSpeed = 0.55;
            this._minX = this._pos.x + 1.2;
            this._maxX = this._pos.x - 1.7;
            this._listener = params.listener;
            this._volume = params.volume;
            this._score = 0;
            this._audioFail = 'Assets/_Assets/Sounds/SFX/SFX_delivery_fail01.wav';
            this._audioSuccess = 'Assets/_Assets/Sounds/SFX/SFX_delivery_success01.wav';
        }
        _loadAudio(audioPath, loop, volume) {
            super._loadAudio(audioPath, loop, volume);
        }
        _loadIcon(iconPath, scene, pos, scale, rotation) {
            // Override this method in child classes
            const loader = new THREE.TextureLoader();
            var iconTexture = loader.load(iconPath);
            const plane = new THREE.Mesh(
            new THREE.PlaneGeometry(1, 1),
            new THREE.MeshBasicMaterial({
            map: iconTexture,
            side: THREE.DoubleSide,
            transparent: true,
            }));
            plane.position.set(pos.x, pos.y, pos.z);
            plane.scale.set(scale, scale, scale);
            plane.rotateX(rotation.x);
            plane.rotateY(rotation.y);
            scene.add(plane);
            return plane;
        }
        interact(item) {
            let plate = item;
            console.log(plate);
            // Thực hiện logic interact
            let listOfRecipeSpawned = this._parent.GetComponent('DeliveryManager').getListOfRecipeNameSpawned();
            let nameOfRecipe = null;
            for (let i = 0; i < listOfRecipeSpawned.length; i++) {
               nameOfRecipe = plate.GetComponent('PlateEntity').CheckDeliveryPlate(listOfRecipeSpawned[i]);
               console.log(nameOfRecipe);
                if (nameOfRecipe != null) break;
            }
            if (nameOfRecipe != null) {
                this._loadAudio(this._audioSuccess, false, this._volume);
                console.log('Delivered the recipe to the customer', nameOfRecipe);
                this._score += 1;
                this._parent.GetComponent('DeliveryManager').removeRecipe(nameOfRecipe);
                this._successImage.style.visibility = 'visible';
                setTimeout(() => {
                    this._successImage.style.visibility = 'hidden';
                }, 1500);
            }else {
                this._loadAudio(this._audioFail, false, this._volume);
                console.log('failed to deliver the food to the customer', plate);
                this._failedImage.style.visibility = 'visible';
                setTimeout(() => {
                    this._failedImage.style.visibility = 'hidden';
                }, 1500);
            }
            item.GetComponent('PlateEntity').ClearPlate();
            this._entitiesManager.Remove(item);
            item.SetActive(false);
            return null;
        }
        Update(timeElapsed) {  
            this._animateIcon(timeElapsed);
        }
        
        _animateIcon(timeElapsed) {
               // Di chuyển icon mũi tên
               this._icon.position.x -= this._iconSpeed * timeElapsed;
               this._icon2.position.x -= this._iconSpeed * timeElapsed;
               
               // Kiểm tra nếu icon mũi tên vượt qua ngưỡng trên trục X
               if (this._icon.position.x <= this._maxX + 1.55) {
                   this._icon.material.opacity -= this._iconSpeed * timeElapsed;
               } else this._icon.material.opacity += this._iconSpeed * timeElapsed;
               if (this._icon2.position.x <= this._maxX + 1.55) {
                   // Giảm dần opacity của icon mũi tên
                   this._icon2.material.opacity -= this._iconSpeed * timeElapsed;
               }  else this._icon2.material.opacity += this._iconSpeed * timeElapsed;
   
               // Kiểm tra nếu icon mũi tên đến gần giới hạn bên phải
               if (this._icon.position.x <= this._maxX) {
                   // Đặt vị trí của icon mũi tên về lại giới hạn bên trái
                   this._icon.position.x = this._minX;
                   // Đặt lại opacity về 0
                   this._icon.material.opacity = 0;
               }
               if (this._icon2.position.x <= this._maxX) {
                   // Đặt vị trí của icon mũi tên về lại giới hạn bên trái
                   this._icon2.position.x = this._minX;
                   // Đặt lại opacity về 0
                   this._icon2.material.opacity = 0;
               }
        }
        getScore() {
            return this._score;
        } 
    }
    return {
        ClearCounter: ClearCounter,
        FoodCounter: FoodCounter,
        PlateCounter: PlateCounter,
        CuttingCounter: CuttingCounter,
        TrashCounter: TrashCounter,
        StoveCounter: StoveCounter,
        DeliveryCounter: DeliveryCounter
    };
})();
