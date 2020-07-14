/*

README

Normally, I would NOT put all this in one file, but since I was trying to get React to run standalone in the browser, 
I didn't want to waste time trying to "import" files as I would if this was being developed as a single page app and server via webpack.  
Similarly my css would be more tied per file, and I would be using a classes variable to inject the classNames.

Alternatively to building this in React I possibly could have used canvases, etc.  Which might have made sense regarding some of the pixel specs.
I also recognize that I am rendering a bunch of empty cells, perhaps there could be improvements of speed if I only rendered filled ones and positioned them absolutely.

MISSING:
* Shrink and Reverse, (right now edge game over's same as self collision)

With Regards to turning around and shrinking by 113px:
I built my logic more on a grid system so I intended to adjust the requirements to shrink by a value of say 3 cells on all sides (a shortcoming, I know).
However, the more I began thinking about the logic of what would happen when you collided with the wall, and I had issue.
Do you turn around and immediately run over yourself? No, that wouldn't work....
So, does it mean your tail becomes your head?  That is what I planned for and you will see code of that nature in here...
However, which direction does the tail go?  The opposite of the head when it bounced?...  The opposite of the tip of the tail compared with the next "vertebrae"?...
What about in a situation when you are running along the wall and turn into it... well the boundary shrank, and you are fully outside... 
Does it infinitely shrink?... Does it let you make your way back in, before registering more collisions?... Do you push the snake back in bounds?...
So with all those thoughts, I left it as game over for now.

Room for Improvement:
* Use proper pixels as required in spec... 800x800 is achieved technically with 50x50 grid @ 16px
* Limit turns to 90* so you dont trip on yourself as readily.
* Force a redraw on a turn so that it happens immediately, otherwise events might get batched into the last.
* Perhaps Special Food should only change color from RED once, and not every render, but I thought it looked pretty (and special).
* Only render filled cells (See above notes about potential speed improvement)
* Design could be prettier, but I went for functionality over form.

*/

const random = n => Math.floor(Math.random() * n) //0 to <n

class App extends React.Component{
  defaultState = {
    score: 0,
    keyCode: 39, //becomes cardinal direction 37-L, 38-U, 39-R, 40-D
    boardSize: 50,
    snake: {
      direction: 1, //relative direction forward/backward (NOTE: reversing not fully implemented per notes above)
      positions: [[26, 25], [25, 25], [24, 25]],
      extraGrowing: false,
    },
    food: {
      position: [],
      special: false,
    },
    gameover: false,
  }
  
  state = {
    ...this.defaultState,
    highScore: 0,
  }

  moveInterval = null
  foodTimeout = null

  componentDidMount(){
    document.body.focus()
    document.body.addEventListener('keydown', this.handleKeydown)
    
    this.startGame()
  }

  componentWillUnmount(){
    clearInteval(this.moveInterval)
    clearTimeout(this.foodTimeout)
    
    document.body.removeEventListener('keydown', this.handleKeydown)
  }

  handleKeydown = evt => {
    const kc = evt.keyCode

    if(kc >= 37 && kc <= 40){
      this.setState({
        keyCode: evt.keyCode,
      })
      evt.preventDefault()  
    }
  }

  startGame = () => {
    this.moveInterval = setInterval(this.moveSnake, 100)
    
    this.randomizeFood()
  }
  
  randomizeFood = () => {
    clearTimeout(this.foodTimeout)
    
    const food = {
      position: Array(2).fill(0).map(v => random(this.state.boardSize)),
      special: random(10) % 9 === 0,
    }
    const time = (!food.special ? random(6) + 4 : random(4) + 1) * 1000
  
    this.setState({
      food,
    })
    
    this.foodTimeout = setTimeout(this.randomizeFood, time)
  }

  moves = {
    37: [-1, 0],
    38: [0, -1],
    39: [1, 0],
    40: [0, 1],
  }

  moveSnake = () => {
    const { keyCode, snake: { direction, positions, extraGrowing }, food, score } = this.state
    const head = direction ? positions[0] : positions[positions.length - 1]
    const newHead = [head[0] + this.moves[keyCode][0], head[1] + this.moves[keyCode][1]]
    
    //Edge Collision
    if(newHead[0] < 0 || newHead[1] < 0 || newHead[0] >= this.state.boardSize || newHead[1] >= this.state.boardSize){
      this.gameover()
      return
    }
    
    //Self Collision
    if(positions.find(v => v[0] === newHead[0] && v[1] === newHead[1])){
      this.gameover()
      return
    }
    
    //Food Collision
    let minus
    if(food.position[0] === newHead[0] && food.position[1] === newHead[1]){
      this.setState({
        score: score + (food.special ? 9 : 1),
        snake: {
          ...this.state.snake,
          extraGrowing: food.special, //change to couting down value if we want special to do more than 2
        }
      })
      
      this.randomizeFood()
      minus = 0
    }else{
      minus = extraGrowing ? 0 : 1
      
      this.setState({
        snake: {
          ...this.state.snake,
          extraGrowing: false,
        }
      })
    }
    
    //Since we grow by simply not removing from tail... If we want to grow by 2 for special food, we need to track extraGrowing a few ticks... maybe it should be a counting down value instead of boolean, to know how many moves to grow for
    const newPositions = positions.slice(0, positions.length - minus)
    
    this.setState({
      snake: {
        ...this.state.snake,
        positions: [newHead, ...newPositions],
      }
    })
  }
  
  gameover = () => {
    const { score, highScore } = this.state
    clearInterval(this.moveInterval)
    clearTimeout(this.foodTimeout)
    
    this.setState({
      gameover: true,
      highScore: Math.max(score, highScore),
    })
  }
  
  resetGame = () => {
    this.setState({
      ...this.defaultState,
    })
    
    this.startGame()
  }
  
  render(){
    const { score, highScore, snake, gameover, boardSize, food } = this.state
    
    return(
      <div className='gamearea'>
        <GameGrid snake={snake} food={food} boardSize={boardSize}/>
        <div className='overlay'>
          <h5 className={'score' + (highScore > 0 && score > highScore ? ' highscore' : '') }>Score: {score}</h5>
          { gameover && <button className='playagain' onClick={this.resetGame}>Play Again</button> }
        </div>
      </div>
    )
  }
}

class GameGrid extends React.Component{
  render(){
    const { snake, food, boardSize } = this.props
    const grid = Array(boardSize).fill(0).map(v => Array(boardSize).fill(''))
    
    //fill in snake
    snake.positions.map(([x, y], i, a) => {
      grid[y][x] = (i === 0 && snake.direction === 1 || i === a.length - 1 && snake.direction === 0) ? 'S' : 's'
    })
    
    //fill in food
    if(food.position.length){
      grid[food.position[1]][food.position[0]] = food.special ? 'F' : 'f'
    }
    
    return(
      <div className='gamegrid'>
        { grid.map((row, i) => 
          row.map((cell, ii) => 
            <Cell variant={cell} key={i + '_' + ii} />
          )
        )}
      </div>
    )
  }
}

class Cell extends React.Component{
  render(){
    const { variant } = this.props
    const variants = {
      s: ' snake',
      S: ' snakehead',
      f: ' food',
      F: ' specialfood',
      '': '',
    }
    const className = 'cell' + variants[variant]
    
    //template literals were formatting funny here, would have used them but it was annoying too look at in HR editor
    return (
      <div className='cell-container'>
        <div className={className} style={{ backgroundColor: variant === 'F' ? 'rgb('+ random(256) + ', ' + random(256) + ', ' + random(256) + ')' : null }}/>
      </div>
    )
  }
}

ReactDOM.render(
    <App />,
    document.getElementById('app')
);