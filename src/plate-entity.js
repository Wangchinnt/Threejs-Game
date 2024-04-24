import * as THREE from 'three';
import {entity} from './entity.js';

export const plate_entity = (() => {

    class PlateEntity extends entity.Component {
        constructor(params) {
        super();
        this._Init(params);
        }

        _Init(params) {
        this._children = [];
        this._childrenIcon = [];
        this._entitiesManager = params.entitiesManager;
        this._scene = params.scene;
        this._offsetX = 0.7;
        this._startPositionX = 0.75;
        this._startPositionZ = 1;
        this._offsetZ = 0.5;
        }
        
        _loadIcon(path, position){
        const loader = new THREE.TextureLoader();
        const iconTexture = loader.load(path);
            // Tạo circle mesh cho background trắng
        const circleRadius = 0.35; // Đường kính lớn hơn plane để bao quanh nó
        const circleGeometry = new THREE.CircleGeometry(circleRadius, 32);
        const circleMaterial = new THREE.MeshBasicMaterial({ 
            color: 0xffffff, // Màu trắng
            side: THREE.DoubleSide,
        });
        const circleMesh = new THREE.Mesh(circleGeometry, circleMaterial);
        
        // Tạo plane mesh cho icon
        const planeGeometry = new THREE.PlaneGeometry(0.6, 0.6);
        const planeMaterial = new THREE.MeshBasicMaterial({
            map: iconTexture,
            side: THREE.DoubleSide,
            transparent: true,
        });
        const plane = new THREE.Mesh(planeGeometry, planeMaterial);
        
        // Đặt vị trí của icon lên trên circle
        plane.position.set(0, 0, -0.02); // Đặt ít hơn để icon nổi lên trên background
        
        // Tạo Group và thêm cả plane và circle vào đó
        const group = new THREE.Group();
        group.add(circleMesh);
        group.add(plane);
        
        // Đặt vị trí của Group
        group.position.set(position.x, position.y, position.z);
        group.rotateX(45); 

        return group;
        }

        _displayIcon(name){
            const resourcePath = 'Assets/_Assets/Textures/Icons/'
            const ingredientIconPathMap = {
                'Bread': resourcePath + 'Bread.png',
                'Burned Meat': resourcePath + 'MeatPattyBurned.png',
                'Cooked Meat': resourcePath + 'MeatPattyCooked.png',
                'Cabbage slice': resourcePath + 'CabbageSlices.png',
                'Tomato slice': resourcePath + 'TomatoSlice.png',
                'Cheese slice': resourcePath + 'CheeseSlice.png'
            };
            
            const path = ingredientIconPathMap[name];
            const position = this._parent.GetPosition().clone().add(
                new THREE.Vector3(this._startPositionX - ((this._childrenIcon.length) % 3) * this._offsetX, 1, this._startPositionZ - (Math.floor(this._childrenIcon.length / 3) - this._offsetZ)));
            this._childrenIcon.push(this._loadIcon(path, position));

            for (let i = 0; i < this._childrenIcon.length; i++) {
                this._scene.add(this._childrenIcon[i]);
            }
            
        } 
        GetListChildren() {
            return this._children;
        }

        AddIngredients(ingredient) {
            // Tạo một đối tượng ánh xạ tên thành phần với chỉ số trong mảng
            const ingredientIndexMap = {
                'Bread': 0,
                'Burned Meat': 1,
                'Cooked Meat': 1,
                'Cabbage slice': 2,
                'Tomato slice': 3,
                'Cheese slice': 4
            };
            
            // Kiểm tra xem tên thành phần có nằm trong ánh xạ không
            if ( ingredient!= null && ingredient.GetName() in ingredientIndexMap) {
                // Lấy chỉ số của thành phần từ ánh xạ
                const index = ingredientIndexMap[ingredient.GetName()];
                
                // Kiểm tra xem ô đó có rỗng không
                if (!this._children[index]) {
                    // Nếu ô đó rỗng, gán thành phần vào mảng tại vị trí chỉ số
                    this._children[index] = ingredient;
                    ingredient.SetParent(this._parent);
                    this._displayIcon(ingredient.GetName());
                return true;
                }
            }
            return false;
        }
        CheckDeliveryPlate(recipeName) {
            const recipeIngredients = {
                'Veggie hamburgers': ['Bread', 'Cabbage slice', 'Tomato slice'],
                'Meat hamburgers': ['Bread', 'Tomato slice', 'Cooked Meat'],
                'Full-topping hamburgers': ['Bread', 'Cabbage slice', 'Tomato slice', 'Cheese slice', 'Cooked Meat'],
                'Cheese hamburgers': ['Bread', 'Cheese slice', 'Cooked Meat'],
                'Salad': ['Cabbage slice', 'Tomato slice']
            };
        
            const requiredIngredients = recipeIngredients[recipeName];
        
            for (let ingredient of requiredIngredients) {
                if (!this._children.some(child => child && child.GetName() === ingredient)){
                    return null;
                }
            }
            return recipeName;
        }

        ClearPlate() {
            for (let i = 0; i < this._children.length; i++) {
                if (this._children[i] != null) {
                    this._children[i].SetActive(false);
                    this._entitiesManager.Remove(this._children[i]);
                }
            }
            for (let i = 0; i < this._childrenIcon.length; i++) {
                if (this._childrenIcon[i] != null) {
                    this._scene.remove(this._childrenIcon[i]);
                }
            }
        }

        Update(timeElapsed) {
            const ingredientIndexMap = {
                0: 0.2,
                1: 0.3,
                2: 0.35,
                3: 0.37,
                4: 0.38,
            };
            if (this._children.length > 0) {
                for (let i = 0; i < this._children.length; i++) {
                    if (this._children[i] != null) {
                        this._children[i].SetPosition(this._parent.GetPosition().clone().add(new THREE.Vector3(0, ingredientIndexMap[i], 0)));
                    }
                }
            }
            if (this._childrenIcon.length > 0) {
                for (let i = 0; i < this._childrenIcon.length; i++) {
                    if (this._childrenIcon[i] != null) {
                    let pos = this._parent.GetPosition().clone().add(
                        new THREE.Vector3(this._startPositionX- ((i) % 3) * this._offsetX, 1, this._startPositionZ - (Math.floor(i / 3) - this._offsetZ)));
                    this._childrenIcon[i].position.set(pos.x, pos.y, pos.z);
                    }
                }
            }
        };
    }   

  return {
    PlateEntity: PlateEntity,
  };
})();