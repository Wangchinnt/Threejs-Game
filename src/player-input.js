import * as THREE from 'three';
import { entity } from './entity';

export const player_input = (() => {

    class  BasicCharacterControllerInput extends entity.Component {
    constructor() {
        super();
        //this._params = params;
        this._Init();
    }
        _Init() {
          this._keys = {
            forward: false,
            backward: false,
            left: false,
            right: false,
            pickup: false,
            slice: false,
            pause: false,
          };
          this._raycaster = new THREE.Raycaster();
          document.addEventListener('keydown', (e) => this._onKeyDown(e), false);
          document.addEventListener('keyup', (e) => this._onKeyUp(e), false);
          
        }
        _onKeyDown(event) {
          switch (event.keyCode) {
            case 87 : // w
              this._keys.forward = true;
              break;
            case 65: // a
              this._keys.left = true;
              break;
            case 83: // s
              this._keys.backward = true;
              break;
            case 68: // d
              this._keys.right = true;
              break;
            case 69: // e
              this._keys.pickup = true;
              break;
            case 70: // f
              this._keys.slice = true;
              break;
            case 80: // p
              this._keys.pause = true;
              break;
          }
        }
          _onKeyUp(event) {
            switch (event.keyCode) {
              case 87 : // w
                this._keys.forward = false;
                break;
              case 65: // a
                this._keys.left = false;
                break;
              case 83: // s
                this._keys.backward = false;
                break;
              case 68: // d
                this._keys.right = false;
                break;
              case 69: // e
                this._keys.pickup = false;
                break;
              case 70: // f
                this._keys.slice = false;
                break;
              case 80: // p
                this._keys.pause = false;
                break;
            }
        }
      };
    return {BasicCharacterControllerInput:  BasicCharacterControllerInput};

  })();