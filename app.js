let topScore = 0;
let score = 0;
let isRecordGame = false;
let darkTheme = false;
let isCountingDown = false; //Prevents key presses during countdown
let currentLevel = 0;
let snakeStartSize = 5;
let gameStatus = 0; //0 = not started; 1 = running; 2 = game over; 3 = paused

const snake = [];
const snakeCoords = [];
let snakeDirection;
let newSnakeDirection;
let foodCoords = null;
const initialGameSpeed = 500; //1000
const scoreIntervalToIncreaseSpeed = 10;
const speedIncreasePercentage = 0.8;
let gameSpeed;

const gridSize = 20;
const gridElement = document.getElementById('play-area');
const squareSize = Math.floor(document.getElementById('page').offsetHeight / (gridSize + 4));

if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
  darkTheme = true;
}

if (darkTheme) document.body.className = "dark";

//Initialize the grid
gridElement.style.width = squareSize * gridSize + 'px';
gridElement.style.height = squareSize * gridSize + 'px';
gridElement.style.margin = '0 auto';

//Initialize the square
for (let i = 0; i < gridSize * gridSize; i++) {
  const singleSquare = document.createElement('div');
  //singleSquare.innerText = i;
  singleSquare.className = 'square';
  singleSquare.style.width = squareSize + 'px';
  singleSquare.style.height = squareSize + 'px';
  gridElement.appendChild(singleSquare);
}

//Initialize the start message box
const startMessageBox = document.createElement('div');
startMessageBox.id = "start-message";
startMessageBox.innerText = 'Press any key to start the game';
document.getElementById('play-area').append(startMessageBox);

//Initialize the message box
const messageBox = document.createElement('div');
messageBox.className = 'message';

//Initialize the countdown element
const countdown = document.createElement('div');
countdown.className = 'counter';
//countdown.innerText = '3';
//document.getElementById('counter-wrap').append(countdown);

//Store the game score and record score elements
const gameScore = document.getElementById('game-score');
const gameBestScore = document.getElementById('best-score');

//Event handler for key press
const onKeyPressEventHandler = (event) => {
  let ignoreKey = false;
  switch (event.key.toLowerCase()) {
    case 'w':
    case 'arrowup':
      if (gameStatus !== 3 && !isCountingDown && snakeDirection !== 0 && snakeDirection !== 2) newSnakeDirection = 0;
      break;
    case 'd':
    case 'arrowright':
      if (gameStatus !== 3 && !isCountingDown && snakeDirection !== 1 && snakeDirection !== 3) newSnakeDirection = 1;
      break;
    case 's':
    case 'arrowdown':
      if (gameStatus !== 3 && !isCountingDown && snakeDirection !== 0 && snakeDirection !== 2) newSnakeDirection = 2;
      break;
    case 'a':
    case 'arrowleft':
      if (gameStatus !== 3 && !isCountingDown && snakeDirection !== 1 && snakeDirection !== 3) newSnakeDirection = 3;
      break;
    case 't':
      if (darkTheme) {
        document.body.removeAttribute('class');
      } else {
        document.body.className = "dark";
      }
      darkTheme = !darkTheme;
      ignoreKey = true;
      break;
    case 'p':
      if (gameStatus === 1) {
        messageBox.innerHTML = '<div>Paused<br/><span class="smaller"><span class="emph">Arrow keys</span> or <span class="emph">WASD</span> to move</span><br/><span class="smaller"><span class="emph">T</span> to switch to dark theme</span></div>';
        messageBox.style.opacity = 1;
        document.getElementById('game-container').append(messageBox);
        startMessageBox.innerText = "Press any key to resume";
        document.getElementById('play-area').append(startMessageBox);
        gameStatus = 3;
      } else if (gameStatus === 3) {
        messageBox.style.opacity = 0;
        startMessageBox.remove();
        gameStatus = 1;
        setTimeout(() => {
          moveSnake();
        }, gameSpeed);
      }
    default:
  }
  if (!isCountingDown && !ignoreKey) {
    switch (gameStatus) {
      case 0:
        messageBox.style.opacity = 0;
        startMessageBox.remove();
        play();
        break;
      case 2:
        messageBox.style.opacity = 0;
        setTimeout(() => {
          messageBox.remove();
        }, 500);
        startMessageBox.remove();
        initializeTheGame();
        break;
      default:
        break;
    }
  }
}

//Assign key press listener
document.body.onkeydown = onKeyPressEventHandler;

//Convert XY coords into array index
const getIndex = (x, y) => {
  return ((y - 1) * gridSize + x - 1);
}

//Initialize the food element
const food = document.createElement('div');
food.id = 'food';

//Position the food randomly
const positionTheFood = () => {
  const padding = currentLevel < 3 ? snakeStartSize : currentLevel < 10 ? Math.floor(snakeStartSize / 2) : 0;
  let newFoodCoords = null;
  while (!newFoodCoords) {
    newFoodCoords = getIndex(Math.floor(Math.random() * (gridSize - padding * 2)) + padding, Math.floor(Math.random() * (gridSize - padding * 2)) + padding);
    if (snakeCoords.includes(newFoodCoords) || newFoodCoords === foodCoords) newFoodCoords = null;
  }

  if (foodCoords) {
    gridElement.childNodes[foodCoords].removeChild(food);
  }
  foodCoords = newFoodCoords;
  gridElement.childNodes[foodCoords].appendChild(food);
}

//Move tail
const moveTail = () => {
  if (snake[snake.length - 2].className.includes('up-from')) {
    snake[snake.length - 2].className = 'square snake-tail up';
  } else if (snake[snake.length - 2].className.includes('down-from')) {
    snake[snake.length - 2].className = 'square snake-tail down';
  } else if (snake[snake.length - 2].className.includes('left-from')) {
    snake[snake.length - 2].className = 'square snake-tail left';
  } else if (snake[snake.length - 2].className.includes('right-from')) {
    snake[snake.length - 2].className = 'square snake-tail right';
  } else {
    snake[snake.length - 2].className = snake[snake.length - 1].className
  }
  snake.pop().className = 'square';
  snakeCoords.pop();
}

//Move Snake
const moveSnake = () => {
  let ateFood = false;
  switch (newSnakeDirection) {
    case 0:   //Move UP
      if (snakeCoords[0] - gridSize < 0 || (snakeCoords.includes(snakeCoords[0] - gridSize) && snakeCoords[snakeCoords.length - 1] !== snakeCoords[0] - gridSize)) {
        //Collision
        endGame();
      } else {
        if (snakeCoords[0] - gridSize === foodCoords) {
          //Got the food
          ateFood = true;
        } else {
          //Move the tail
          moveTail();
        }
        snake[0].className = 'square snake-body' + (snakeDirection === 1 ? ' up-from-right' : snakeDirection === 3 ? ' up-from-left' : '');
        //Add the new head
        const newHead = gridElement.childNodes[snakeCoords[0] - gridSize];
        newHead.className = 'square snake-head up';
        snake.unshift(newHead);
        //Add the new head coordinates
        snakeCoords.unshift(snakeCoords[0] - gridSize);
      }
      break;
    case 1:   //Move RIGHT
      if (!((snakeCoords[0] + 1) % gridSize) || (snakeCoords.includes(snakeCoords[0] + 1) && snakeCoords[snakeCoords.length - 1] !== snakeCoords[0] + 1)) {
        //Collision
        endGame();
      } else {
        if (snakeCoords[0] + 1 === foodCoords) {
          //Got the food
          ateFood = true;
        } else {
          //Move the tail
          moveTail();
        }
        //Make the current head a body
        snake[0].className = 'square snake-body' + (snakeDirection === 0 ? ' right-from-up' : snakeDirection === 2 ? ' right-from-down' : '');
        //Add the new head
        const newHead = gridElement.childNodes[snakeCoords[0] + 1];
        newHead.className = 'square snake-head right';
        snake.unshift(newHead);
        //Add the new head coordinates
        snakeCoords.unshift(snakeCoords[0] + 1);
      }
      break;
    case 2:   //Move DOWN
      if (snakeCoords[0] + gridSize > gridSize * gridSize + 1 || (snakeCoords.includes(snakeCoords[0] + gridSize) && snakeCoords[snakeCoords.length - 1] !== snakeCoords[0] + gridSize)) {
        //Collision
        endGame();
      } else {
        if (snakeCoords[0] + gridSize === foodCoords) {
          //Got the food
          ateFood = true;
        } else {
          //Move the tail
          moveTail();
        }
        //Make the current head a body
        snake[0].className = 'square snake-body' + (snakeDirection === 1 ? ' down-from-right' : snakeDirection === 3 ? ' down-from-left' : '');
        //Add the new head
        const newHead = gridElement.childNodes[snakeCoords[0] + gridSize];
        newHead.className = 'square snake-head down';
        snake.unshift(newHead);
        //Add the new head coordinates
        snakeCoords.unshift(snakeCoords[0] + gridSize);
      }
      break;
    case 3:   //Move LEFT
      if (!(snakeCoords[0] % gridSize) || (snakeCoords.includes(snakeCoords[0] - 1) && snakeCoords[snakeCoords.length - 1] !== snakeCoords[0] - 1)) {
        //Collision
        endGame();
      } else {
        if (snakeCoords[0] - 1 === foodCoords) {
          //Got the food
          ateFood = true;
        } else {
          //Move the tail
          moveTail();
        }
        //Make the current head a body
        snake[0].className = 'square snake-body' + (snakeDirection === 0 ? ' left-from-up' : snakeDirection === 2 ? ' left-from-down' : '');
        //Add the new head
        const newHead = gridElement.childNodes[snakeCoords[0] - 1];
        newHead.className = 'square snake-head left';
        snake.unshift(newHead);
        //Add the new head coordinates
        snakeCoords.unshift(snakeCoords[0] - 1);
      }
      break;
  }
  //Shape tail according to previous element
  if (gameStatus === 1) {
    snakeDirection = newSnakeDirection;
    if (ateFood) {
      //Food eaten
      //Increase the score
      score++;
      gameScore.innerText = score;
      if (!isRecordGame && topScore > 0 && score > topScore) {
        gameScore.parentElement.className = 'best';
        isRecordGame = true;
      }
      //Increase the level if needed
      if (score % scoreIntervalToIncreaseSpeed === 0) {
        gameSpeed *= speedIncreasePercentage;
        currentLevel++;
        countdown.innerText = 'Level up';
        document.getElementById('counter-wrap').append(countdown);
        setTimeout(() => {
          countdown.remove();
        }, 1200);
      }
      //Position new food
      positionTheFood();
    }
    setTimeout(() => {
      if (gameStatus !== 3) {
        moveSnake();
      }
    }, gameSpeed);
  }
}

//End the game
const endGame = () => {
  let message = `<div>GAME OVER</div>`;
  if (score > topScore) {
    if (topScore) {
      message += `<div><span class="smaller emph">New record!</span></div>`;
    }
    topScore = score;
    gameBestScore.innerText = topScore;
  }
  messageBox.innerHTML = message;
  messageBox.style.opacity = 1;
  document.getElementById('game-container').append(messageBox);
  startMessageBox.innerText = "Press any key to play again"
  document.getElementById('play-area').append(startMessageBox);
  gameStatus = 2;
}

//Initialize a new game
const initializeTheGame = () => {
  //Reset snake elements
  while (snake.length) {
    snake.pop().className = 'square';
  }
  snakeCoords.splice(0, snakeCoords.length);
  //Set the snake's initial direction
  snakeDirection = Math.floor(Math.random() * 3);
  newSnakeDirection = snakeDirection;

  //Generate the snake
  let squareX;
  let squareY;
  let squareCoords;

  switch (snakeDirection) {
    case 0: //Going up
      squareX = Math.floor(Math.random() * (gridSize - 2 * snakeStartSize)) + snakeStartSize;
      squareY = Math.floor(Math.random() * (gridSize - 3 * snakeStartSize)) + snakeStartSize;
      for (let i = 0; i < snakeStartSize; i++) {
        squareCoords = getIndex(squareX, squareY);
        const squareElement = gridElement.childNodes[squareCoords];
        if (i === 0) {
          squareElement.className = 'square snake-head up';
        } else if (i === snakeStartSize - 1) {
          squareElement.className = 'square snake-tail up';
        } else {
          squareElement.className = 'square snake-body';
        }
        snake.push(squareElement);
        snakeCoords.push(squareCoords);
        squareY++;
      }
      break;
    case 1: //Going right
      squareX = Math.floor(Math.random() * (gridSize - 3 * snakeStartSize)) + snakeStartSize * 2;
      squareY = Math.floor(Math.random() * (gridSize - 2 * snakeStartSize)) + snakeStartSize;
      for (let i = 0; i < snakeStartSize; i++) {
        squareCoords = getIndex(squareX, squareY);
        const squareElement = gridElement.childNodes[squareCoords];
        if (i === 0) {
          squareElement.className = 'square snake-head right';
        } else if (i === snakeStartSize - 1) {
          squareElement.className = 'square snake-tail right';
        } else {
          squareElement.className = 'square snake-body';
        }
        snake.push(squareElement);
        snakeCoords.push(squareCoords);
        squareX--;
      }
      break;
    case 2: //Going down
      squareX = Math.floor(Math.random() * (gridSize - 2 * snakeStartSize)) + snakeStartSize;
      squareY = Math.floor(Math.random() * (gridSize - 3 * snakeStartSize)) + snakeStartSize * 2;
      for (let i = 0; i < snakeStartSize; i++) {
        squareCoords = getIndex(squareX, squareY);
        const squareElement = gridElement.childNodes[squareCoords];
        if (i === 0) {
          squareElement.className = 'square snake-head down';
        } else if (i === snakeStartSize - 1) {
          squareElement.className = 'square snake-tail down';
        } else {
          squareElement.className = 'square snake-body';
        }
        snake.push(squareElement);
        snakeCoords.push(squareCoords);
        squareY--;
      }
      break;
    case 3: //Going left
      squareX = Math.floor(Math.random() * (gridSize - 3 * snakeStartSize)) + snakeStartSize;
      squareY = Math.floor(Math.random() * (gridSize - 2 * snakeStartSize)) + snakeStartSize;
      for (let i = 0; i < snakeStartSize; i++) {
        squareCoords = getIndex(squareX, squareY);
        const squareElement = gridElement.childNodes[squareCoords];
        if (i === 0) {
          squareElement.className = 'square snake-head left';
        } else if (i === snakeStartSize - 1) {
          squareElement.className = 'square snake-tail left';
        } else {
          squareElement.className = 'square snake-straight';
        }
        snake.push(squareElement);
        snakeCoords.push(squareCoords);
        squareX++;
      }
      break;
  }

  // Initialize and position the food
  positionTheFood();
  score = 0;
  isRecordGame = false;
  gameScore.innerText = score;
  gameScore.parentElement.removeAttribute("class");

  if (gameStatus === 2) play();
}

//Play the game
const play = () => {
  currentLevel = 0;
  gameSpeed = initialGameSpeed;
  countdown.innerText = '3';
  document.getElementById('counter-wrap').append(countdown);
  isCountingDown = true;
  setTimeout(() => {
    countdown.remove();
    countdown.innerText = '2';
    document.getElementById('counter-wrap').append(countdown);
    setTimeout(() => {
      countdown.remove();
      countdown.innerText = '1';
      document.getElementById('counter-wrap').append(countdown);
      setTimeout(() => {
        gameStatus = 1;
        isCountingDown = false;
        countdown.remove();
        moveSnake();
      }, 1200);
    }, 1200);
  }, 1200);
}

initializeTheGame();

//Increase speed every 10 levels
//Add 1-4 blocks levels 20-25-30-35
//Level 40 move egg after 10 moves?