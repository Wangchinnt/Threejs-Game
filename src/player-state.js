import { player_entity } from './player-entity.js';

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
        if ((input._keys.forward || input._keys.backward || input._keys.left || input._keys.right ) && this._parent.GetCurrentState().Name != 'hold') {
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

    // hold state
    class HoldState extends State {
      constructor(parent) {
        super(parent);
      }

      get Name() {
        return 'hold';
      }

      Enter(prevState) {
        const holdAction = this._parent._proxy._animations['hold'].action;
        if (prevState) {
          const prevAction = this._parent._proxy._animations[prevState.Name].action;
          holdAction.enabled = true;
          holdAction.time = 0.0;
          holdAction.setEffectiveTimeScale(1.0);
          holdAction.setEffectiveWeight(1.0);
          holdAction.crossFadeFrom(prevAction, 0.1, true);
          holdAction.play();
        }
        else {
          holdAction.play();
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
    // put state
    class PutState extends State {
      constructor(parent) {
        super(parent);
      }

      get Name() {
        return 'put';
      }

      Enter(prevState) {
        const putAction = this._parent._proxy._animations['put'].action;
        if (prevState) {
          const prevAction = this._parent._proxy._animations[prevState.Name].action;
          putAction.enabled = true;
          putAction.time = 0.0;
          putAction.setEffectiveTimeScale(1.0);
          putAction.setEffectiveWeight(1.0);
          putAction.crossFadeFrom(prevAction, 0.1, true);
          putAction.play();
        }
        else {
          putAction.play();
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
    // push state
    class PushState extends State {
      constructor(parent) {
        super(parent);
      }

      get Name() {
        return 'push';
      }

      Enter(prevState) {
        const pushAction = this._parent._proxy._animations['push'].action;
        if (prevState) {
          const prevAction = this._parent._proxy._animations[prevState.Name].action;
          pushAction.enabled = true;
          pushAction.time = 0.0;
          pushAction.setEffectiveTimeScale(1.0);
          pushAction.setEffectiveWeight(1.0);
          pushAction.crossFadeFrom(prevAction, 0.1, true);
          pushAction.play();
        }
        else {
          pushAction.play();
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
      HoldState: HoldState,
      PutState: PutState,
      PushState: PushState,
    };
})();