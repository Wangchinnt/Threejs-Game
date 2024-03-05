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
            this._speed = 10;
            this._direction = new THREE.Vector3(0,0,0);
            this._position = new THREE.Vector3();
            this._quaternion = new THREE.Quaternion();

            this._animations = {};
            this._stateMachine = new CharacterFSM(
                new BasicCharacterControllerProxy(this._animations));
            
            this._LoadModels();

            //this._RegisterHandler('update', (m) => { this._Update(m); }); // update the character
        }
        // load the models of player
        _LoadModels() {
            const loader = new FBXLoader();
            loader.setPath('Assets/_Assets/Meshes/')
            loader.load('castle_guard_01.fbx', (fbx) => {
                this._target = fbx;
                this._target.scale.setScalar(0.025);
                this._params.scene.add(this._target);
                // find the bones of the player
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
                loader.load('Sword And Shield Idle.fbx', (a) => { _OnLoad('idle', a); });
                loader.load('Sword And Shield Walk.fbx', (a) => { _OnLoad('walk', a); });
            });
        }

        // TODO: find intersections for collision
        _FindIntersection(pos) {
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
            if (currentState.Name != 'idle' && currentState.Name != 'walk') {
                return;
            }


         // movement
            const inputVector = new THREE.Vector2(0, 0);
            const rotationSpeed = 6.0;
            const controlObject = this._target;
            const rotationQuaternion = new THREE.Quaternion();

            if (input._keys.forward) {
                inputVector.y = 1;
                rotationQuaternion.setFromAxisAngle(new THREE.Vector3(0, 0, 1), 0);
            }
            if (input._keys.backward) {
                inputVector.y = -1;
                rotationQuaternion.setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI);
            }
            if (input._keys.left) {
                inputVector.x = 1;
                rotationQuaternion.setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI / 2);
            }
            if (input._keys.right) {
                inputVector.x = -1;
                rotationQuaternion.setFromAxisAngle(new THREE.Vector3(0, 1, 0), -Math.PI / 2);
            }
            if (input._keys.pause) {
                console.log('pause');
            }

            inputVector.normalize();
            this._direction = new THREE.Vector3(inputVector.x, 0, inputVector.y);

            const oldPosition = new THREE.Vector3();
            oldPosition.copy(controlObject.position);

            const pos = controlObject.position.clone();
            pos.addScaledVector(this._direction, timeInSeconds * this._speed);

            if (inputVector.length() > 0) {
                // Apply quaternion when we have input
                this._quaternion = rotationQuaternion;
            }
            // rotate the player
            controlObject.quaternion.slerp(this._quaternion, rotationSpeed * timeInSeconds);
            controlObject.position.copy(pos);
            this.position = pos;
            this._parent.SetPosition(this.position);
            this._parent.SetQuaternion(controlObject.quaternion);
            //console.log(this._quaternion);


        }

    };
    return {
        BasicCharacterControllerProxy: BasicCharacterControllerProxy,
        BasicCharacterController: BasicCharacterController,
    };
})();