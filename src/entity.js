  import * as THREE from 'three';
  export const entity = (() => {


    // This is a abstract class for entities, it has a name, a list of components,
    // position, rotation, and a list of handlers and its parent
    class Entity {
      constructor() {
        this._name = null;
        this._components = {};
        this._position = new THREE.Vector3();
        this._quaternion = new THREE.Quaternion();
        this._handlers = {};
        this._parent = null;
        this._active = true;
      }

      // each entity has a list of handlers, this function adds a new handler to the list
      // the handler is a function that will be called when a message is broadcasted
      _RegisterHandler(n, h) {
        if (!(n in this._handlers)) {
          this._handlers[n] = [];
        }
        this._handlers[n].push(h);
      }

      SetParent(p) {
        this._parent = p;
      }

      SetName(n) {
        this._name = n;
      }

      GetName() {
        return this._name;
      }

      SetActive(b) {
        this._active = b;
      }
      GetActive() {
        return this._active;
      }

      AddComponent(c) {
        c.SetParent(this);
        this._components[c.constructor.name] = c;

        c.InitComponent();
      }
      RemoveComponent(n) {
        delete this._components[n];
      }

      GetComponent(n) {
        return this._components[n];
      }

      FindEntity(n) {
        return this._parent.Get(n);
      }

      Broadcast(msg) {
        if (!(msg.topic in this._handlers)) {
          return;
        }

        for (let curHandler of this._handlers[msg.topic]) {
          curHandler(msg);
        }
      }

      SetPosition(p) {
        this._position.copy(p);
        this.Broadcast({
            topic: 'update.position',
            value: this._position,
        });
      }
      GetPosition() {
        return this._position;
      }

      GetQuaternion() {
        return this._quaternion;
      }
      
      SetQuaternion(r) {
        this._quaternion.copy(r);
        this.Broadcast({
            topic: 'update.quaternion',
            value: this._quaternion,
        });
      }

      Update(timeElapsed) {
        for (let k in this._components) {
          this._components[k].Update(timeElapsed);
        }
      }
    };

    class Component {
      constructor() {
        this._parent = null;
      }

      SetParent(p) {
        this._parent = p;
      }

      InitComponent() {}

      GetComponent(n) {
        return this._parent.GetComponent(n);
      }

      FindEntity(n) {
        return this._parent.FindEntity(n);
      }

      GetBoundingBox() {
        return this._parent.GetBoundingBox();
      }

      Broadcast(m) {
        this._parent.Broadcast(m);
      }

      Update(_) {}

      _RegisterHandler(n, h) {
        this._parent._RegisterHandler(n, h);
      }
    };

    return {
      Entity: Entity,
      Component: Component,
    };

  })();