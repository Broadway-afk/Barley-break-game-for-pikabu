class Tiles {
  constructor(tileInRowAmount = 5, newGame = false) {
    this.tilesArea = document.getElementById('tiles-area');

    let save = (new URL(document.location)).searchParams.get('save');
    this.savedGame = save ? JSON.parse(window.atob(save)) : null;

    if (!this.savedGame) newGame = true;
    this.newGame = newGame;

    if (this.newGame) {
      this.tileInRowAmount = tileInRowAmount;
      this.sizeList = this.calcSizes();
      this.tileList = this.createTileList();

    }
    else {
      this.tileInRowAmount = this.savedGame.tileInRowAmount;
      this.sizeList = this.calcSizes();
      this.tileList = this.loadTileList();
    }

    this.generateGameBoard()
  }

  createTileList() {
    this.tilesArea.innerHTML = '';
    let list = [];
    let elementInGridPosition = {x: 0, y: 0};

    while (list.length < Math.pow(this.tileInRowAmount, 2)) {
      let tile = document.createElement('div');
      let calcPercent = 100 / this.tileInRowAmount;
      let calcBackgroundPercent = 100 / (this.tileInRowAmount - 1);
      tile.style.cssText = `
        background-position: 
          ${calcBackgroundPercent * elementInGridPosition.x}% 
          ${calcBackgroundPercent * elementInGridPosition.y}%
        ;
        background-size: ${this.sizeList.area}px;
        left: ${calcPercent * elementInGridPosition.x}%;
        top: ${calcPercent * elementInGridPosition.y}%; 
        height: ${calcPercent}%;
        width: ${calcPercent}%;
      `;
      tile.classList.add('tile');
      tile.coordinates = {};
      Object.assign(tile.coordinates, elementInGridPosition);

      tile.addEventListener( 'click', (event) => {
        this.makeTheStep(event.currentTarget);
      });

      if (list.length + 1 >= Math.pow(this.tileInRowAmount, 2)) {
        tile.classList.add('void');
      }

      if (elementInGridPosition.x < this.tileInRowAmount-1){
        elementInGridPosition.x += 1;
      }
      else {
        elementInGridPosition.x = 0;
        elementInGridPosition.y += 1;
      }

      list.push(tile);
    }
    return list;
  }

  generateGameBoard() {
    this.tileList.forEach((tile) => {
      this.tilesArea.append(tile);
    });

    window.addEventListener('resize', () => {
      this.sizeList = this.calcSizes();
    });

    if (this.newGame)
      setTimeout(() => this.shuffleTiles(), 1000);
  }

  calcSizes() {
    let actualSizes = {
      area: `${this.tilesArea.clientWidth}`,
      tile: `${this.tilesArea.clientWidth / this.tileInRowAmount}`
    }

    this.tilesArea.style.height = `${actualSizes.area}px`;

    if(this.tileList)
      this.tileList.forEach((tile) => {
        tile.style.backgroundSize = `${actualSizes.area}px`;
      });

    return actualSizes;
  }

  shuffleTiles() {
    this.tileList.reverse().forEach((tile, index) => {
      let swapTile = this.tileList[Math.floor(Math.random() * (index + 1))];
      if (swapTile)
        this.moveTheTile(tile, swapTile);
    });
    this.saveTheData();
  }

  moveTheTile(tile1, tile2) {
    let temp = {};
    Object.assign(temp, tile1.coordinates);
    Object.assign(tile1.coordinates, tile2.coordinates);
    Object.assign(tile2.coordinates, temp);

    [tile1, tile2].forEach((tile) => {
      tile.style.left = `${100/this.tileInRowAmount * tile.coordinates.x}%`;
      tile.style.top = `${100/this.tileInRowAmount * tile.coordinates.y}%`;
    })
  }

  makeTheStep(tile) {
    if (tile.classList.contains('void'))
      return;

    if (!this.tilesArea.classList.contains('shuffled'))
      this.tilesArea.classList.add('shuffled');

    let
      voidTile = document.getElementsByClassName('void')[0],
      coordDiff = {
        x: voidTile.coordinates.x - tile.coordinates.x,
        y: voidTile.coordinates.y - tile.coordinates.y
      }

    if (([-1, 0, 1].indexOf(coordDiff.x) !== -1 && [-1, 0, 1].indexOf(coordDiff.y) !== -1) &&
      Math.abs(coordDiff.x) !== Math.abs(coordDiff.y)) {
      this.moveTheTile(tile, voidTile);
      this.saveTheData();
    }
    else {
      tile.classList.add('tileWithErrorAnimation');
      tile.addEventListener('animationend', () => tile.classList.remove('tileWithErrorAnimation') );
    }
  }

  saveTheData() {
    if (!history.pushState) {
      console.warn(`History API don't supported`);
      return;
    }

    let baseUrl = window.location.protocol + "//" + window.location.host + window.location.pathname;

    let data = {tileInRowAmount: this.tileInRowAmount, tileInfo: []};

    this.tileList.forEach((tile) => {
      data.tileInfo.push({
        style: `
          background-position: ${tile.style.backgroundPosition};  
          background-size: ${tile.style.backgroundSize};
          left: ${tile.style.left};
          top: ${tile.style.top}; 
          height: ${tile.style.height};
          width: ${tile.style.width};
        `,
        isVoid: tile.classList.contains('void'),
        coordinates: tile.coordinates
      });
    });

    data = window.btoa(JSON.stringify(data));
    let newUrl = baseUrl + `?save=${data}`;
    history.pushState(null, null, newUrl);
  }

  loadTileList() {
    this.tilesArea.innerHTML = '';

    let
      list = [],
      data = this.savedGame;

    data.tileInfo.forEach((tileData) => {
      let tile = document.createElement('div');
      tile.style.cssText = tileData.style;
      tile.classList.add('tile');
      if(tileData.isVoid) tile.classList.add('void');
      tile.coordinates = {};
      Object.assign(tile.coordinates, tileData.coordinates);

      tile.addEventListener('click', (event) => {
        this.makeTheStep(event.currentTarget);
      });

      list.push(tile);

    });

    document.getElementById('tileAreaSizePicker').value = this.tileInRowAmount;
    return list;
  }

}

let barleyBreak = new Tiles();
window.addEventListener('popstate', function() {
  barleyBreak = new Tiles();
});

function changeTileInRowAmount(value) {
  barleyBreak = new Tiles(value , true);
}