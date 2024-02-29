import * as THREE from 'three';

export const entity = (() => {

  class Entity {
    constructor() {
      this._name = null;
      this._components = {};
      this._position = new THREE.Vector3();
      this._rotation = new THREE.Quaternion();
      this._eventHandlers = {};
      this._parentEntity = null;
    }

    // 
    _registerEventHandler(eventName, handler) {
      if (!(eventName in this._eventHandlers)) {
        this._eventHandlers[eventName] = [];
      }
      this._eventHandlers[eventName].push(handler);
    }

    setParentEntity(parent) {
      this._parentEntity = parent;
    }

    setName(name) {
      this._name = name;
    }

    get name() {
      return this._name;
    }

    setActive(active) {
      this._parentEntity.setEntityActive(this, active);
    }

    addComponent(component) {
      component.setParentEntity(this);
      this._components[component.constructor.name] = component;
      component.initComponent();
    }

    getComponent(componentName) {
      return this._components[componentName];
    }

    findEntity(entityName) {
      return this._parentEntity.getEntity(entityName);
    }

    broadcastMessage(message) {
      if (!(message.topic in this._eventHandlers)) {
        return;
      }

      for (let currentHandler of this._eventHandlers[message.topic]) {
        currentHandler(message);
      }
    }

    setPosition(position) {
      this._position.copy(position);
      this.broadcastMessage({
          topic: 'update.position',
          value: this._position,
      });
    }

    setQuaternion(rotation) {
      this._rotation.copy(rotation);
      this.broadcastMessage({
          topic: 'update.rotation',
          value: this._rotation,
      });
    }

    update(timeElapsed) {
      for (let key in this._components) {
        this._components[key].update(timeElapsed);
      }
    }
  };
  
  // Define a component class
  class Component {
    constructor() {
      this._parentEntity = null;
    }

    setParentEntity(parent) {
      this._parentEntity = parent;
    }

    initComponent() {}

    getComponent(componentName) {
      return this._parentEntity.getComponent(componentName);
    }

    findEntity(entityName) {
      return this._parentEntity.findEntity(entityName);
    }

    broadcastMessage(message) {
      this._parentEntity.broadcastMessage(message);
    }

    update(_) {}

    _registerEventHandler(eventName, handler) {
      this._parentEntity._registerEventHandler(eventName, handler);
    }
  };

  return {
    Entity: Entity,
    Component: Component,
  };

})();
