export const entity_manager = (() => {

    class EntityManager {
      constructor() {
        this._ids = 0;
        this._entitiesMap = {};
        this._entities = [];
      }
  
      _GenerateName() {
        this._ids += 1;
  
        return '__name__' + this._ids;
      }
  
      Get(name) {
        return this._entitiesMap[name];
      }
  
      Filter(callback) {
        return this._entities.filter(callback);
      }
  
      Add(entity, name) {
        if (!name) {
          name = this._GenerateName();
        }
  
        this._entitiesMap[name] = entity;
        this._entities.push(entity);
  
        e.SetParent(this);
        e.SetName(name);
      }
  
      SetActive(entity, isActive) {
        const index = this._entities.indexOf(entity);
        if (index < 0) {
          return;
        }
  
        if (!isActive) {
          this._entities.splice(index, 1);
        }
      }
  
      updateEntities(timeElapsed) {
        for (let entity of this._entities) {
          entity.update(timeElapsed);
        }
      }
    }
  
    return {
      EntityManager: EntityManager
    };
  
  })();