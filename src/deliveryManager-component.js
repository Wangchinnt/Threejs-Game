import {entity} from './entity.js';

export const deliveryManager = (() => {

    class DeliveryManager extends entity.Component {
    constructor(params) {
        super();
        this._Init(params);
    }
    _Init(params) {
        this._listOfRecipe = ['Veggie hamburgers', 'Meat hamburgers', 'Full-topping hamburgers', 'Cheese hamburgers', 'Salad'];
        this._recoursePath = 'Assets/_Assets/Textures/Icons/';
        // Danh sách các iconPath tương ứng
        this._iconPaths = [
          [this._recoursePath + 'Bread.png', this._recoursePath + 'CabbageSlices.png', this._recoursePath + 'TomatoSlice.png'],
          [this._recoursePath + 'Bread.png', this._recoursePath + 'TomatoSlice.png', this._recoursePath + 'MeatPattyCooked.png'],
          [this._recoursePath + 'Bread.png', this._recoursePath + 'CabbageSlices.png', this._recoursePath + 'TomatoSlice.png', this._recoursePath + 'CheeseSlice.png', this._recoursePath + 'MeatPattyCooked.png'],
          [this._recoursePath + 'Bread.png', this._recoursePath + 'CheeseSlice.png', this._recoursePath + 'MeatPattyCooked.png'],
          [this._recoursePath + 'CabbageSlices.png', this._recoursePath + 'TomatoSlice.png']
        ];
        // Tạo container wrapper
        this._containerWrapper = document.createElement('div');
        this._containerWrapper.classList.add('menu-container-wrapper');
        this._timer = 0;
    }
    Update() {
        if (this._containerWrapper.childElementCount < 6) {
            this._timer += 1;
        }
        if (this._timer > 350) {
            this._makeRecipe(this._containerWrapper);
            this._timer = 0;
        }
        // if (this._containerWrapper.childElementCount > 3) {
        //     const randomIndex = Math.floor(Math.random() * this._containerWrapper.childElementCount);
        //     this._removeRecipe(randomIndex);
        // }

    }
    _makeRecipe(containerWrapper) {

        // Chọn ngẫu nhiên một thực đơn
        const randomIndex = Math.floor(Math.random() * this._listOfRecipe.length);
        const randomRecipe = this._listOfRecipe[randomIndex];
        const randomIconPaths = this._iconPaths[randomIndex];

        // Tạo và chèn các icon vào container
        const container = document.createElement('div');
        container.classList.add('menu-container');

        // Tạo và chèn tên của recipe vào container
        const recipeName = document.createElement('div');
        recipeName.textContent = randomRecipe;
        container.appendChild(recipeName);

        randomIconPaths.forEach(iconPath => {
            const image = document.createElement('img');
            image.src = iconPath;
            image.alt = randomRecipe;
            container.appendChild(image);
        });

        // Chèn container vào container wrapper
        containerWrapper.appendChild(container);

        // Chèn container wrapper vào image-table
        const imageTable = document.querySelector('.image-table');
        imageTable.appendChild(containerWrapper);

    }
    removeRecipe(recipeName) {
        const containerWrapper = document.querySelector('.menu-container-wrapper');
        if (containerWrapper.childElementCount != 0){
            const children = containerWrapper.children;      
            for (let i = 0; i < children.length; i++) {
                const child = children[i];
                if (child.children[0].textContent === recipeName) {
                    containerWrapper.removeChild(child);
                    return;
                }
            }
        }
    }
    getListOfRecipeNameSpawned() {
        const containerWrapper = document.querySelector('.menu-container-wrapper');
        if (containerWrapper.childElementCount != 0) {
            const children = containerWrapper.children;
            let recipeNames = [];
            for (let i = 0; i < children.length; i++) {
                recipeNames.push(children[i].children[0].textContent);
            }
            return recipeNames;
        } else {
            return null;
        }
    }


}
    return {
        DeliveryManager: DeliveryManager,
      };
})();
