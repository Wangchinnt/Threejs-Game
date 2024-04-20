import * as THREE from 'three';

import {entity} from './entity.js';

export const collider_component = (() => {

class BoxColliderComponent extends entity.Component {
    constructor(params) {
        super();
        this._params = params;
        
    }

    _Init() {
    }

    InitComponent() {
        this._boundingBox = new THREE.Box3();
        this._boundingBox.setFromCenterAndSize(this._params.center, this._params.size);
        // let helper1 = new THREE.Box3Helper( this._boundingBox, 0xffff00 );
        // this._params.scene.add( helper1 );
    }
    
    GetBoundingBox() {
        return this._boundingBox;
    }
    SetBoundingBox(boundingBox) {
        this._boundingBox = boundingBox;
    }
    Update(timeInSeconds) {
        this._boundingBox.setFromCenterAndSize(new THREE.Vector3(this._parent.GetPosition().x,this._params.size.y/2,this._parent.GetPosition().z), this._params.size);
    }

}  
  return {
    BoxColliderComponent: BoxColliderComponent,
  };
})();
