import * as THREE from 'three';


export const player_state = (() => {
    
    // abstract state class
    class State {
      constructor(parent) {
        this._parent = parent;
      }
  
      Enter() {}
      Exit() {}
      Update() {}
    };
    
    // idle state
    class IdleState extends State {
      constructor(parent) {
        super(parent);
      }
      get Name() {
        return 'idle';
      }

      Enter(prevState) {
        const idleAction = this._parent._proxy._animations['idle'].action; // for the idle animation
        if (prevState) {
          const preAction = this._parent._proxy._animations[prevState.Name].action;
          idleAction.time = 0.0;
          idleAction.enabled = true;
          idleAction.setEffectiveTimeScale(1.0);
          idleAction.setEffectiveWeight(1.0);
          idleAction.crossFadeFrom(preAction, 0.25, true);
          idleAction.play();
        }
        else {
          idleAction.play();
        }
      }

      Exit() {
      }

      Update(timeElapsed, input) {
        if (input._keys.forward || input._keys.backward || input._keys.left || input._keys.right) {
          this._parent.SetState('walk');
        }
      }
    };

    // walk state
    class WalkState extends State {
      constructor(parent) {
        super(parent);
      }

      get Name() {
        return 'walk';
      }

      Enter(prevState) {
        const walkAction = this._parent._proxy._animations['walk'].action;
        if (prevState) {
          const prevAction = this._parent._proxy._animations[prevState.Name].action;
          walkAction.enabled = true;
          walkAction.time = 0.0;
          walkAction.setEffectiveTimeScale(1.0);
          walkAction.setEffectiveWeight(1.0);
          walkAction.crossFadeFrom(prevAction, 0.1, true);
          walkAction.play();
        }
        else {
          walkAction.play();
        }
      }

      Exit() {
      }

      Update(timeElapsed, input) {
        if (!input._keys.forward && !input._keys.backward && !input._keys.left && !input._keys.right) {
          this._parent.SetState('idle');
        }
      }
    }
    
  
    return {
      PlayerState: State,
      IdleState: IdleState,
      WalkState: WalkState,
    };
})();