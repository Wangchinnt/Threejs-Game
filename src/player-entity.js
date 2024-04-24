import * as THREE from 'three';
import {FBXLoader} from 'three/examples/jsm/loaders/FBXLoader.js';

import {entity} from './entity.js';
import {finite_state_machine} from './finite-state-machine.js';
import {player_state} from './player-state.js';

// Although this code was structured such ECS system, but it is not a real ECS system.
// So for player entity, we need define a class to make the player move, and a class to control the player's input.
// For performance and consistency
export const player_entity = (() => {

    // implement the finite state machine for player's state transitions
    class CharacterFSM extends finite_state_machine.FiniteStateMachine {
        constructor(proxy) {
            super();
            this._proxy = proxy;
            this._Init();
        }

        _Init() {
            this._AddState('idle', player_state.IdleState);
            this._AddState('walk', player_state.WalkState);
            this._AddState('put', player_state.PutState);
            this._AddState('hold', player_state.HoldState);
            this._AddState('push', player_state.PushState);
        }
    };

    // TODO: need refactor here
    class BasicCharacterControllerProxy {
        constructor(animations) {
            this._animations = animations;
        }
        get animations() {
            return this._animations;
        }
    };
    
    // implement the basic character controller
    class BasicCharacterController extends entity.Component {
        constructor(params) {
            super();
            this._Init(params);
        }
        // 
        _Init(params) { 
            this._params = params;
            this._speed = 11.5;
            this._direction = new THREE.Vector3(0,0,0);
            this._lastDirection = new THREE.Vector3(0,0,0);
            this._position = new THREE.Vector3();
            this._quaternion = new THREE.Quaternion();
            this._lastQuaternion = new THREE.Quaternion();
            this.rotationQuaternion = new THREE.Quaternion();
            this._boundingBox = new THREE.Box3();
            this._animations = {};
            this._stateMachine = new CharacterFSM(
                new BasicCharacterControllerProxy(this._animations));
            this._selectedCounter = null;
            this._itemBringing = null;
            this._isInteracting = false;
            this._audioFootstep1 = 'Assets/_Assets/Sounds/SFX/SFX_footstep02_01.wav';
            this._audioFootstep2 = 'Assets/_Assets/Sounds/SFX/SFX_footstep02_02.wav';
            this._LoadModels();

            //this._RegisterHandler('update', (m) => { this._Update(m); }); // update the character
        }
        // load the models of player
        _LoadModels() {
            const loader = new FBXLoader();
            loader.setPath('Assets/_Assets/Meshes/')
            loader.load('player idle.fbx', (fbx) => {
                this._target = fbx;
                this._target.scale.setScalar(0.005);
                this._params.scene.add(this._target);

                //find the bones of the player
                this._bones = {};
                for (let b of this._target.children[1].skeleton.bones) {
                    this._bones[b.name] = b;
                }
                
                // set the shadow of the player
                this._target.traverse(c => {
                    c.castShadow = true;
                    c.receiveShadow = true;
                    if (c.material && c.material.map) {
                      c.material.map.encoding = THREE.sRGBEncoding;
                    }
                });

                this.Broadcast({
                    topic: 'load.character',
                    model: this._target,
                    bones: this._bones,
                });
                // set the mixer of the player for animating
                this._mixer = new THREE.AnimationMixer(this._target);
                
                const _OnLoad = (animName, anim) => {
                    const clip = anim.animations[0];
                    const action = this._mixer.clipAction(clip);

                    this._animations[animName] = {
                        clip: clip,
                        action: action,
                    };
                };
                // Because the player has two ore more animations, so we need a loading manager 
                // to load all the animations
                this._manager = new THREE.LoadingManager();
                this._manager.onLoad = () => {
                    this._stateMachine.SetState('idle');
                };
                const loader = new FBXLoader(this._manager);
                loader.setPath('Assets/_Assets/Meshes/');
                loader.load('player idle.fbx', (a) => { _OnLoad('idle', a); });
                loader.load('player walk.fbx', (a) => { _OnLoad('walk', a); });
                loader.load('player putting.fbx', (a) => { _OnLoad('put', a); });
                loader.load('player holding.fbx', (a) => { _OnLoad('hold', a); });
                loader.load('player pushing.fbx', (a) => { _OnLoad('push', a); });
            });
        }

        Update(timeInSeconds) {
            
            if (!this._stateMachine._currentState) {
                return;
            }
            // get the input from the player
            const input = this.GetComponent('BasicCharacterControllerInput');
            this._stateMachine.Update(timeInSeconds, input);

            if(this._mixer) {
                this._mixer.update(timeInSeconds);
            }

            // Hard code
            if (this._stateMachine._currentState._action) {
                this.Broadcast({
                    topic: 'player.action',
                    action: this._stateMachine._currentState._action,
                    time: this._stateMachine._currentState._action.time,
                });
            }

            const currentState = this._stateMachine._currentState;
            if (currentState.Name != 'idle' && currentState.Name != 'walk' && currentState.Name != 'put' && currentState.Name != 'hold' && currentState.Name != 'push') {
                return;
            }

            // movement
            const inputVector = new THREE.Vector2(0, 0);
            const rotationSpeed = 6.0;
            const controlObject = this._target;
            const rotationVector = new THREE.Vector3(0, 1, 0);
            
            // Xác định hướng di chuyển dựa trên phím được nhấn
            if (input._keys.forward) {
                this.rotationQuaternion.setFromAxisAngle(rotationVector, 0);
                inputVector.y = 1;
            }
            if (input._keys.backward) {
                this.rotationQuaternion.setFromAxisAngle(rotationVector, Math.PI);
                inputVector.y = -1;
            }
            if (input._keys.left) {
                this.rotationQuaternion.setFromAxisAngle(rotationVector, Math.PI / 2);
                inputVector.x = 1;
            }
            if (input._keys.right) {
                this.rotationQuaternion.setFromAxisAngle(rotationVector, -Math.PI / 2);
                inputVector.x = -1;
            }
            if (input._keys.forward && input._keys.left) {
                this.rotationQuaternion.setFromAxisAngle(rotationVector, Math.PI / 4);
                inputVector.x = 1;
                inputVector.y = 1;
            }
            if (input._keys.forward && input._keys.right) {
                this.rotationQuaternion.setFromAxisAngle(rotationVector, -Math.PI / 4)
                inputVector.x = -1;
                inputVector.y = 1;
            }
            if (input._keys.backward && input._keys.left) {
                this.rotationQuaternion.setFromAxisAngle(rotationVector, (3 * Math.PI) / 4);
                inputVector.x = 1;
                inputVector.y = -1;
            }
            if (input._keys.backward && input._keys.right) {
       
                this.rotationQuaternion.setFromAxisAngle(rotationVector, -(3 * Math.PI) / 4);
                inputVector.x = -1;
                inputVector.y = -1;
            }
            this.rotationQuaternion.normalize();
            inputVector.normalize();
            this._direction = new THREE.Vector3(inputVector.x, 0, inputVector.y);
            
            if (inputVector.length() > 0) {
                this._selectedCounter = this.CheckSelectionCollision();
            }
            
        
            // Xác định vị trí tiếp theo dựa trên hướng di chuyển và tốc độ
            const nextPosition = this._parent.GetPosition().clone();
            
            // Kiểm tra va chạm trước khi cập nhật vị trí
            if (this.CheckMovementCollision(this._direction.clone().multiplyScalar(timeInSeconds * this._speed))) 
                nextPosition.addScaledVector(this._direction, timeInSeconds * this._speed);

            if (this._direction.length() > 0) {
                    this._lastDirection = this._direction.clone();
            }
            
            // Cập nhật vị trí và hướng quay của đối tượng điều khiển
            this._quaternion = this.rotationQuaternion.clone();
            controlObject.quaternion.slerp(this._quaternion, rotationSpeed * timeInSeconds);
            if (this._quaternion.length() > 0) {
                this._lastQuaternion = this._quaternion;
            } 
            controlObject.position.copy(nextPosition);
            this._parent.SetPosition(nextPosition);
            this._parent.SetQuaternion(controlObject.quaternion);
            
            // Xử lý hành động của người chơi
            if ((input._keys.interact) && this._selectedCounter != null) {
                let counter = this._selectedCounter.GetName();
                if (counter.startsWith('Clear')) {
                    this._itemBringing = this._selectedCounter.GetComponent('ClearCounter').interact(this._itemBringing);
                }
                if (counter.startsWith('Cutting')) {
                    this._itemBringing = this._selectedCounter.GetComponent('CuttingCounter').interact(this._itemBringing);
                }
                if (counter.startsWith('Food') && this._itemBringing == null) {
                    this._itemBringing = this._selectedCounter.GetComponent('FoodCounter').interact();
                }
                if (counter.startsWith('Trash')&& this._itemBringing != null) {
                   this._itemBringing = this._selectedCounter.GetComponent('TrashCounter').interact(this._itemBringing);
                }
                if (counter.startsWith('Stove')) {
                    this._itemBringing = this._selectedCounter.GetComponent('StoveCounter').interact(this._itemBringing);
                }
                if (counter.startsWith('Plate') && this._itemBringing == null) {
                    this._itemBringing = this._selectedCounter.GetComponent('PlateCounter').interact(this._itemBringing);
                }
                if (counter.startsWith('Delivery') && this._itemBringing.GetName() == 'Plate') {
                    this._itemBringing = this._selectedCounter.GetComponent('DeliveryCounter').interact(this._itemBringing);
                }
                input._keys.interact = false;
            }
            else if (input._keys.slice && this._selectedCounter != null) {
                let counter = this._selectedCounter.GetName();
                if (counter.startsWith('Cutting')) {
                    this._itemBringing = this._selectedCounter.GetComponent('CuttingCounter').interact(this._itemBringing, input._keys.slice);
                }
                input._keys.slice = false;
            }
            if (this._itemBringing != null) {
                this._stateMachine.SetState('hold');
                let pos = nextPosition.clone().add(new THREE.Vector3(this._lastDirection.x, 3.3, this._lastDirection.z));
                this._itemBringing.SetPosition(pos);
                if (this._itemBringing.GetName() == 'Cheese' || this._itemBringing.GetName() == 'Cheese slice') {
                    this._itemBringing.SetQuaternion(this._lastQuaternion);
                }
                
            }
    }
        CheckSelectionCollision() {
            let manager = this._parent._parent;
            let entities = manager.GetEntities();
            let p = this._parent.GetComponent('BoxColliderComponent').GetBoundingBox();
        
            // Các hướng để kiểm tra va chạm
            let collisionDetected = false;
            const direction = this._direction.clone().normalize();
        
            // Tạo ra một mảng chứa các giá trị khoảng cách từ 0.5 đến 2
            const distances = Array.from({ length: 14 }, (_, i) => 0 + i * 0.25); // Ví dụ: [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2]
        
            for (let distance of distances) {
                let nextBoundingBox = p.clone();
                let center = new THREE.Vector3();
                p.getCenter(center);
                nextBoundingBox.setFromCenterAndSize(center, new THREE.Vector3(0.15, 0.15, 0.15));
                nextBoundingBox.translate(direction.clone().multiplyScalar(distance)); // Dịch chuyển hộp va chạm theo hướng và khoảng cách
                // Kiểm tra va chạm với mỗi entity
                for (let entity of entities) {
                    if (entity !== this._parent) { // Đảm bảo không kiểm tra va chạm với chính đối tượng đang xét
                        let entityBoxCollider = entity.GetComponent('BoxColliderComponent');
                        if (entityBoxCollider) {
                            let entityBoundingBox = entityBoxCollider.GetBoundingBox();
                            if (entityBoundingBox.intersectsBox(nextBoundingBox)) {
                                let entityName = entity.GetName().replace(/\d+/g, ''); // escape the number in the entity name
                                if (entityName.endsWith('counter')) { // Check if entity name ends with 'counter'
                                    console.log('Select: ', entity.GetName(), 'from the player');
                                    let modelComponent = entity.GetComponent("StaticModelComponent")._target;
                                    modelComponent.traverse(c => {
                                        if (c.isMesh) {
                                            const materials = Array.isArray(c.material) ? c.material : [c.material];
                                            materials.forEach(material => {
                                                if (material && material.emissive) {
                                                    // Thiết lập màu trắng nhạt như ghost
                                                    material.emissive.set(0xffffff);
                                                    material.emissiveIntensity = 0.05;
                                                } else {
                                                    // Nếu vật liệu không có thuộc tính emissive, hiển thị thông báo lỗi
                                                    console.log("Material or emissive property is undefined.");
                                                }
                                            });
                                        }
                                    });
                                    return entity;
                                }
                            } else {
                                // Nếu không có va chạm nữa, thiết lập màu sắc về mặc định
                                let modelComponent = entity.GetComponent("StaticModelComponent")._target;
                                modelComponent.traverse(c => {
                                    if (c.isMesh) {
                                        const materials = Array.isArray(c.material) ? c.material : [c.material];
                                        materials.forEach(material => {
                                            if (material && material.emissive) {
                                                // Thiết lập màu sắc về mặc định
                                                material.emissive.set(0x000000);
                                            } else {
                                                // Nếu vật liệu không có thuộc tính emissive, hiển thị thông báo lỗi
                                                console.log("Material or emissive property is undefined.");
                                            }
                                        });
                                    }
                                });
                            }
                        }
                    }
                }
            }
            return null;
        } 

        CheckMovementCollision(steps) {
            let manager = this._parent._parent;
            let entities = manager.GetEntities();
            let p = this._parent.GetComponent('BoxColliderComponent').GetBoundingBox();
            // Tạo một hộp va chạm tương ứng với vị trí tiếp theo
            let nextBoundingBox = p.clone();
            nextBoundingBox.translate(steps);
            for (let entity of entities) {
                if (entity !== this._parent) { // Đảm bảo không kiểm tra va chạm với chính đối tượng đang xét
                    let entityBoxCollider = entity.GetComponent('BoxColliderComponent');
                    if (entityBoxCollider) {
                        let entityBoundingBox = entityBoxCollider.GetBoundingBox();
                        if (entityBoundingBox.intersectsBox(nextBoundingBox)) {
                            console.log('Collision with entity: ', entity.GetName(), 'from the player');
                            return false;   
                        }
                    }
                }
            }
            return true; // Trả về true nếu không gặp va chạm
        }
    
};
    return {
        BasicCharacterControllerProxy: BasicCharacterControllerProxy,
        BasicCharacterController: BasicCharacterController,
    };
})();