import * as THREE from 'three';


export const player_state = (() => {
    class State {
      constructor(parent) {
        this._parent = parent;
      }
  
      Enter() {}
      Exit() {}
      Update() {}
    };
  
    class IdleState extends State {
      constructor(parent) {
        super(parent);
      }
  
      Enter() {
        this._parent._velocity.x = 0;
        this._parent._velocity.z = 0;
      }
  
      Update(timeElapsed, input) {
        if (input._keys.forward || input._keys.backward) {
          this._parent.SetState('walk');
        }
      }
    };
  
    class WalkState extends State {
      constructor(parent) {
        super(parent);
      }
  
      Enter() {
        this._parent._velocity.x = 0;
        this._parent._velocity.z = 0;
      }
  
      Update(timeElapsed, input) {
        if (input._keys.forward) {
          this._parent._velocity.z = -this._parent._speed;
        }
        if (input._keys.backward) {
          this._parent._velocity.z = this._parent._speed;
        }
        if (input._keys.left) {
          this._parent._velocity.x = -this._parent._speed;
        }
        if (input._keys.right) {
          this._parent._velocity.x = this._parent._speed;
        }
  
        if (!input._keys.forward && !input._keys.backward) {
          this._parent.SetState('idle');
        }
      }
    };
  
    return {
      PlayerState: State,
      IdleState: IdleState,
      WalkState: WalkState,
    };
})();