canvas = document.getElementById("canvas");
ctx = canvas.getContext("2d");
width = window.innerWidth;
height = window.innerHeight;
mX = width / 2;
mY = height / 2;
canvas.width = width;
canvas.height = height;

players = [];
enemys = [];
powerups = [];
deadPlayers = [];
deadEnemies = [];
deadPowerups = [];
enemysKilled = 0;
time = 0;

spawnEnemyDelay = 0;
spawnPowerUpDelay = 0;
holdTime = 0;

gameStart = true;
gamePaused = true;
gameRunning = true; //always true
gameEnd = false;

class Enemy
{
  constructor(x, y, radius, color, speed)
  {
    this.x = x || 0;
    this.y = y || 0;
    this.radius = radius || 10;
    this.speed = speed || 3;
    this.color = color || "rgb(0,0,255)";
    this.velX = 0;
    this.velY = 0;
    this.hitDestination = true;
  }

  AI() //override this
  {}

  onTick()
  {
    // get the target x and y from AI
    this.AI();

    // We need to get the distance this time around
    var tx = this.targetX - this.x,
      ty = this.targetY - this.y,
      dist = Math.sqrt(tx * tx + ty * ty);

    /*
     * we calculate a velocity for our object this time around
     * divide the target x and y by the distance and multiply it by our speed
     * this gives us a constant movement speed.
     */

    this.velX = (tx / dist) * this.speed;
    this.velY = (ty / dist) * this.speed;

    // Stop once we hit our target. This stops the jittery bouncing of the object.
    // Basically only move when we are not there yet
    // Also change hitDestination to true, so some AI's can use it.

    if (dist > this.radius / 2)
    {
      // add our velocities
      this.x += this.velX;
      this.y += this.velY;
    }
    else
    {
      this.hitDestination = true;
    }

    for (var i = 0; i < players.length; i++)
    {
      if ((players[i].getRadius() + this.radius) * (players[i].getRadius() + this.radius) >
        (players[i].getX() - this.x) * (players[i].getX() - this.x) + (players[i].getY() - this.y) * (players[i].getY() - this.y))
      {
        players[i].takeHit(1);
      }
    }
  }

  render()
  {
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.closePath();
    ctx.fill();
    ctx.lineWidth = 1;
    ctx.strokeStyle = "#000000";
    ctx.stroke();
  }

  getX()
  {
    return this.x;
  }

  getY()
  {
    return this.y;
  }

  getRadius()
  {
    return this.radius;
  }
}

class RandomEnemy extends Enemy
{
  constructor(x, y, radius, color, speed, ai)
  {
    super(x, y, radius, color, speed, ai)
  }

  AI()
  {
    if (this.hitDestination)
    {
      this.targetX = Math.floor(Math.random() * window.width) + 1;
      this.targetY = Math.floor(Math.random() * window.height) + 1;
      this.hitDestination = false;
    }
  }
}

class TrapEnemy extends Enemy
{
  constructor(x, y, radius, color, speed)
  {
    super(x, y, radius, color, speed)
  }

  AI()
  {
    if (this.hitDestination && players.length > 0)
    {
      this.targetX = players[0].getX() + Math.floor(Math.random() * 500) - 250;
      this.targetY = players[0].getY() + Math.floor(Math.random() * 500) - 250;
      this.hitDestination = false;
    }
  }
}

class FollowEnemy extends Enemy
{
  constructor(x, y, radius, color, speed)
  {
    super(x, y, radius, color, speed)
  }

  AI()
  {
    if (players.length > 0)
    {
      this.targetX = players[0].getX();
      this.targetY = players[0].getY();
    }
  }
}

class MouseEnemy extends Enemy
{
  constructor(x, y, radius, color, speed)
  {
    super(x, y, radius, color, speed)
  }

  AI()
  {
    if (players.length > 0)
    {
      this.targetX = players[0].getMouseX();
      this.targetY = players[0].getMouseY();
    }
  }
}

class Player
{
  constructor(x, y, radius, color, hp)
  {
    this.x = x || 0;
    this.y = y || 0;
    this.radius = radius || 10;
    this.speed = 5;
    this.color = color || "rgb(255,0,0)";
    this.hp = hp || 10;
    this.velX = 0;
    this.velY = 0;
    this.ratio = 0;
    this.immune = false;
  }

  onTick(x, y)
  {
    // get the target x and y
    this.targetX = x;
    this.targetY = y;

    // We need to get the distance this time around
    var tx = this.targetX - this.x,
      ty = this.targetY - this.y,
      dist = Math.sqrt(tx * tx + ty * ty);

    /*
     * we calculate a velocity for our object this time around
     * divide the target x and y by the distance and multiply it by our speed
     * this gives us a constant movement speed.
     */

    this.velX = (tx / dist) * this.speed;
    this.velY = (ty / dist) * this.speed;

    // Stop once we hit our target. This stops the jittery bouncing of the object.
    if (dist > this.radius / 2)
    {
      // add our velocities
      this.x += this.velX;
      this.y += this.velY;
    }
  }

  render()
  {
    ctx.fillStyle = this.color;
    //ctx.beginPath();
    // draw our triangle with x and y being the center, and points twards mouse! MATH! (I spent 30 minutes on this qq)
    ctx.beginPath();
    //this line basically makes our length constant, because the distance from the mouse can vary, we cannot just blindly move twards the mouse location when drawing
    this.ratio = this.radius / Math.sqrt((this.targetX - this.x) * (this.targetX - this.x) + (this.targetY - this.y) * (this.targetY - this.y));
    //since we have the ratio, we just multiply it by the difference of X/Y. This is the Tip of the player.
    ctx.moveTo(this.x + this.ratio * (this.targetX - this.x), this.y + this.ratio * (this.targetY - this.y));
    ctx.lineTo(this.x - this.ratio * (this.targetY - this.y) - this.ratio * (this.targetX - this.x),
      this.y + this.ratio * (this.targetX - this.x) - this.ratio * (this.targetY - this.y));
    ctx.stroke();
    ctx.lineTo(this.x + this.ratio * (this.targetY - this.y) - this.ratio * (this.targetX - this.x),
      this.y - this.ratio * (this.targetX - this.x) - this.ratio * (this.targetY - this.y));
    ctx.stroke();
    ctx.lineTo(this.x + this.ratio * (this.targetX - this.x), this.y + this.ratio * (this.targetY - this.y));
    ctx.stroke();
    ctx.closePath();
    ctx.fill();
  }

  getX()
  {
    return this.x;
  }

  getY()
  {
    return this.y;
  }

  getMouseX()
  {
    return this.targetX;
  }

  getMouseY()
  {
    return this.targetY;
  }

  getRadius()
  {
    return this.radius;
  }

  immune(time)
  {
    this.immune = true;
    var theplayer = this;
    var hurt = setTimeout(function()
    {
      theplayer.immune = false;
    }, time * 1000);
  }

  takeHit(dmg)
  {
    if (!this.immune)
    {
      this.hp -= dmg;
      console.log("ouch!" + this.hp)
      if (this.hp > 0)
      {
        this.immune(dmg * 2);
      }
    }
    if (this.hp <= 0)
    {
      deadPlayers.push(this);
    }
  }
}

class PowerUp
{
  constructor(x, y)
  {
    this.x = x;
    this.y = y;
    this.radius = 10;
    this.color = "rgb(0,0,0)";
    this.awake = false;
    this.active = false;
  }

  activeEffect()
  {

  }

  onTick()
  {
    if (this.awake == false && this.active == false)
    { //didn't hit but spawned
      for (var i = 0; i < players.length; i++)
      {
        if ((players[i].getRadius() + this.radius) * (players[i].getRadius() + this.radius) >
          (players[i].getX() - this.x) * (players[i].getX() - this.x) + (players[i].getY() - this.y) * (players[i].getY() - this.y))
        {
          this.awake = true;
          console.log("powerup hit at: " + this.x + ", " + this.y);
        }
      }
    }
    else if (this.awake == true && this.active == false)
    { //second u hit
      this.active = true;
      var that = this;
      setTimeout(function()
      {
        console.log("time is up!");
        deadPowerups.push(that);
      }, 1000, this);
    }
    else if (this.awake == true && this.active == true)
    {
      this.activeEffect()
    }
  }

  inactiveRender()
  {
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.moveTo(this.x + this.radius, this.y);
    ctx.lineTo(this.x, this.y - this.radius);
    ctx.stroke();
    ctx.lineTo(this.x - this.radius, this.y);
    ctx.stroke();
    ctx.lineTo(this.x, this.y + this.radius);
    ctx.stroke();
    ctx.lineTo(this.x + this.radius, this.y);
    ctx.stroke();
    ctx.closePath();
    ctx.fill();
  }

  activeRender()
  {

  }

  render()
  {
    if (!this.active)
    {
      this.inactiveRender()
    }
    else
    {
      this.activeRender()
    }
  }

  getX()
  {
    return this.x;
  }

  getY()
  {
    return this.y;
  }

  getX()
  {
    return this.x;
  }

  getRadius()
  {
    return this.radius;
  }
}

class CirclePowerUp extends PowerUp
{
  constructor(x, y)
  {
    super(x, y)
    this.circleRadius = 8;
  }
  activeEffect()
  {
    for (var i = 0; i < enemys.length; i++) //check if an enemy is a distance of 8 * radius or closer.
    {
      if ((enemys[i].getRadius() + this.radius * this.circleRadius) * (enemys[i].getRadius() + this.radius * this.circleRadius) >
        (enemys[i].getX() - this.x) * (enemys[i].getX() - this.x) + (enemys[i].getY() - this.y) * (enemys[i].getY() - this.y))
      {
        deadEnemies.push(enemys[i]);
      }
    }
  }

  activeRender()
  {
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius * this.circleRadius, 0, Math.PI * 2);
    ctx.closePath();
    ctx.fill();
  }
}

class DiamondPowerUp extends PowerUp
{
  constructor(x, y)
  {
    super(x, y)
    this.diamondRadius = 8;
  }
  activeEffect()
  {
    for (var i = 0; i < enemys.length; i++) //check if the enemys hits the diamond, size 8
    {
      var dx = enemys[i].getX() - this.x;
      var dy = enemys[i].getY() - this.y;
      var r = this.radius * this.diamondRadius + enemys[i].getRadius();
      if (Math.abs(dy - dx) <= r && Math.abs(dy + dx) <= r)
      {
        deadEnemies.push(enemys[i]);
      }
    }
  }

  activeRender()
  {
    ctx.fillStyle = this.color;
    ctx.beginPath()
    ctx.moveTo(this.x - this.radius * this.diamondRadius, this.y);
    ctx.lineTo(this.x, this.y - this.radius * this.diamondRadius);
    ctx.stroke();
    ctx.lineTo(this.x + this.radius * this.diamondRadius, this.y);
    ctx.stroke();
    ctx.lineTo(this.x, this.y + this.radius * this.diamondRadius);
    ctx.stroke();
    ctx.lineTo(this.x - this.radius * this.diamondRadius, this.y);
    ctx.stroke();
    ctx.closePath();
    ctx.fill();
  }
}

class CrossPowerUp extends PowerUp
{
  constructor(x, y)
  {
    super(x, y)
    this.crossRadius = 15;
  }
  activeEffect()
  {
    for (var i = 0; i < enemys.length; i++) //check if an enemy is vertical or horizontal, basically a + with width/height of radius * 15. Nerf!
    {
      if (Math.abs(this.y - enemys[i].getY()) < this.radius + enemys[i].getRadius() &&
        Math.abs(this.x - enemys[i].getX()) < this.radius * this.crossRadius ||
        Math.abs(this.x - enemys[i].getX()) < this.radius + enemys[i].getRadius() &&
        Math.abs(this.y - enemys[i].getY()) < this.radius * this.crossRadius)
      {
        deadEnemies.push(enemys[i]);
      }
    }
  }

  activeRender()
  {
    ctx.fillStyle = this.color;
    ctx.fillRect(this.x - this.radius, this.y - this.radius * this.crossRadius, this.radius * 2, this.radius * this.crossRadius * 2);
    ctx.fillRect(this.x - this.radius * this.crossRadius, this.y - this.radius, this.radius * this.crossRadius * 2, 2 * this.radius);
  }
}

class RingPowerUp extends PowerUp
{
  constructor(x, y)
  {
    super(x, y)
    this.innerRadius = 9;
    this.outerRadius = 10;
  }
  activeEffect()
  {
    for (var i = 0; i < enemys.length; i++) //check if the enemys hits the ring of 9-10, if its inside it will live!
    {
      if (Math.sqrt((this.y - enemys[i].getY()) * (this.y - enemys[i].getY()) + (this.x - enemys[i].getX()) *
          (this.x - enemys[i].getX())) < this.radius * this.outerRadius + enemys[i].getRadius() &&
        Math.sqrt((this.y - enemys[i].getY()) * (this.y - enemys[i].getY()) + (this.x - enemys[i].getX()) *
          (this.x - enemys[i].getX())) > this.radius * this.innerRadius - enemys[i].getRadius())
      {
        deadEnemies.push(enemys[i]);
      }
    }
  }

  activeRender()
  {
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius * this.outerRadius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.lineTo(this.x + this.radius * this.innerRadius, this.y);
    ctx.stroke();
    ctx.arc(this.x, this.y, this.radius * this.innerRadius, 0, Math.PI * 2, true);
    ctx.stroke();
    ctx.lineTo(this.x + this.radius * this.outerRadius, this.y);
    ctx.stroke();
    ctx.closePath();
    ctx.fill();
  }
}

class ExpandPowerUp extends PowerUp
{
  constructor(x, y)
  {
    super(x, y)
    this.startRadius = 5;
    this.expandRatio = .2;
  }
  activeEffect()
  {
    for (var i = 0; i < enemys.length; i++) //check if an enemy is a distance of 5 * radius or closer, but grows.
    {
      if ((enemys[i].getRadius() + this.radius * this.startRadius) * (enemys[i].getRadius() + this.radius * this.startRadius) >
        (enemys[i].getX() - this.x) * (enemys[i].getX() - this.x) + (enemys[i].getY() - this.y) * (enemys[i].getY() - this.y))
      {
        deadEnemies.push(enemys[i]);
      }
    }
  }

  activeRender()
  {
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius * this.startRadius, 0, Math.PI * 2);
    ctx.closePath();
    ctx.fill();
    this.radius += this.expandRatio;
  }
}

canvas.addEventListener("mousemove", function(e)
{
  mX = e.pageX;
  mY = e.pageY;
});

function removeEnemy(dead)
{
  enemys.splice(enemys.indexOf(dead), 1);
  enemysKilled++;
}

function removePlayer(dead)
{
  players.splice(players.indexOf(dead), 1);
  if (players.length <= 0)
  {
    console.log("GG");
    gameOver();
    //gameRunning = false; //TODO
  }
}

function removePowerup(dead)
{
  powerups.splice(powerups.indexOf(dead), 1);
  console.log("powerup down");
}

function spawnEnemy()
{
  if (spawnEnemyDelay < 10)
  {
    spawnEnemyDelay++;
    return;
  }
  xSpawnCoor = Math.floor(Math.random() * 2) * window.width;
  ySpawnCoor = Math.floor(Math.random() * 2) * window.height;
  spawnRadius = 10;
  spawnColor = "rgb(" + Math.floor(Math.random() * 256) + "," + Math.floor(Math.random() * 256) + "," + Math.floor(Math.random() * 256) + ")";
  spawnSpeed = 3;
  spawnAI = Math.floor(Math.random() * 10);
  if (spawnAI < 7)
  {
    enemys[enemys.length] = new RandomEnemy(xSpawnCoor, ySpawnCoor, spawnRadius, spawnColor, spawnSpeed);
  }
  else if (spawnAI < 8)
  {
    enemys[enemys.length] = new TrapEnemy(xSpawnCoor, ySpawnCoor, spawnRadius, spawnColor, spawnSpeed);
  }
  else if (spawnAI < 9)
  {
    enemys[enemys.length] = new MouseEnemy(xSpawnCoor, ySpawnCoor, spawnRadius, spawnColor, spawnSpeed);
  }
  else
  {
    enemys[enemys.length] = new FollowEnemy(xSpawnCoor, ySpawnCoor, spawnRadius, spawnColor, spawnSpeed);
  }
  spawnEnemyDelay = 0;
}

function spawnPowerUp()
{
  if (spawnPowerUpDelay < 25)
  {
    spawnPowerUpDelay++;
    return;
  }
  xPowerSpawnCoor = Math.floor(Math.random() * window.width) + 1;
  yPowerSpawnCoor = Math.floor(Math.random() * window.height) + 1;
  spawnType = Math.floor(Math.random() * 5);
  if (spawnType < 1)
  {
    powerups[powerups.length] = new CirclePowerUp(xPowerSpawnCoor, yPowerSpawnCoor);
  }
  else if (spawnType < 2)
  {
    powerups[powerups.length] = new DiamondPowerUp(xPowerSpawnCoor, yPowerSpawnCoor);
  }
  else if (spawnType < 3)
  {
    powerups[powerups.length] = new CrossPowerUp(xPowerSpawnCoor, yPowerSpawnCoor);
  }
  else if (spawnType < 4)
  {
    powerups[powerups.length] = new RingPowerUp(xPowerSpawnCoor, yPowerSpawnCoor);
  }
  else
  {
    powerups[powerups.length] = new ExpandPowerUp(xPowerSpawnCoor, yPowerSpawnCoor);
  }
  spawnPowerUpDelay = 0;
}

function worldTime()
{
  holdTime++;
  if (holdTime >= 100)
  {
    time++;
    holdTime = 0;
  }
}

function onTimer()
{
  for (var i = 0; i < enemys.length; i++)
  {
    enemys[i].onTick();
  }

  for (var i = 0; i < powerups.length; i++)
  {
    powerups[i].onTick();
  }
  for (var i = 0; i < players.length; i++)
  {
    players[i].onTick(mX, mY);
  }
  spawnEnemy();
  spawnPowerUp();
  worldTime();
}

function world()
{
  var player1 = new Player(width / 2, height / 2, 10, "rgb(0,0,0)", 1);
  players[0] = player1;
}

function startRender()
{
  ctx.clearRect(0, 0, width, height);
  ctx.font = "30px Arial";
  ctx.textAlign = "center";
  ctx.fillText("Welcome to TiltToTilt ", width/2, 100);
  ctx.fillText("Control a ship while avoiding the dots", width/2, 150);
  ctx.fillText("Hit diamond powerups to clear enemies", width/2, 200);
  ctx.fillText("Press s to start", width/2, 250);
}

function endRender()
{
  ctx.clearRect(0, 0, width, height);
  ctx.font = "30px Arial";
  ctx.textAlign = "center";
  ctx.fillText("Gave Over!", width/2, 100);
  ctx.fillText("Press R to restart", width/2, 150);
}

function gameOver()
{
  gameStart = false;
  gamePaused = true;
  gameRunning = true; //always true
  gameEnd = true;
}

function resetGame()
{
  players = [];
  enemys = [];
  powerups = [];
  deadPlayers = [];
  deadEnemies = [];
  deadPowerups = [];
  enemysKilled = 0;
  time = 0;

  spawnEnemyDelay = 0;
  spawnPowerUpDelay = 0;
  holdTime = 0;

  gameStart = false;
  gamePaused = false;
  gameRunning = true; //always true
  gameEnd = true;
}

function render()
{
  ctx.clearRect(0, 0, width, height);
  if (!gamePaused)
  {
    onTimer();
    for (var i = 0; i < enemys.length; i++)
    {
      enemys[i].render();
    }

    for (var i = 0; i < powerups.length; i++)
    {
      powerups[i].render();
    }

    for (var i = 0; i < players.length; i++)
    {
      players[i].render();
    }


    ctx.font = "30px Arial";
    ctx.fillText("Score: " + enemysKilled, width - 200, 100);
    ctx.fillText("Time: " + Math.floor(time / 60) + ":" + ("0" + Math.floor(time % 60)).slice(-2), width - 200, 150);

    while (deadPlayers.length > 0)
    {
      removePlayer(deadPlayers.pop());
      console.log("player down!");
    }

    while (deadEnemies.length > 0)
    {
      removeEnemy(deadEnemies.pop());
      console.log("enemy down!");
    }

    while (deadPowerups.length > 0)
    {
      removePowerup(deadPowerups.pop());
      console.log("powerup down!");
    }
  }
  else if (gameEnd)
  {
    endRender();
  }
  else if (gameStart)
  {
    startRender();
  }

  if (gameRunning)
  {
    requestAnimationFrame(render);
  }
}

window.addEventListener('keydown', this.check, false);

function check(e)
{
  if (e.keyCode == 83) // s to start game
  {
    gamePaused = false;
    gameEnd = false;
    gameStart = false;
    gameRunning = true;
    //requestAnimationFrame();
  }


}

function main()
{
  world();
  render();
}
