var canvas = document.getElementById("canvas"),
    ctx = canvas.getContext("2d"),
    width = window.innerWidth,
    height = window.innerHeight,
    mX = width/2,
    mY = height/2;

canvas.width = width;
canvas.height = height;

players = [];
enemys = [];
powerups = [];
var enemySpawner;
var powerupSpawner;
var timeTracker;
var gameOn = true;
deadPlayers = [];
deadEnemies = [];
deadPowerups = [];
var enemysKilled = 0;
var time = 0;



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
  {
  }

  update()
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
    if (dist > this.radius / 2) {
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
    if (this.hitDestination)
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
    this.targetX = players[0].getX();
    this.targetY = players[0].getY();
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
    this.targetX = players[0].getMouseX();
    this.targetY = players[0].getMouseY();
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

  update(x, y)
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
    if (dist > this.radius / 2) {
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
    ctx.moveTo( this.x + this.ratio * (this.targetX - this.x), this.y + this.ratio * (this.targetY - this.y) );
    ctx.lineTo(this.x - this.ratio * (this.targetY - this.y) - this.ratio * (this.targetX - this.x),
        this.y + this.ratio * (this.targetX - this.x) - this.ratio * (this.targetY - this.y));
    ctx.stroke();
    ctx.lineTo(this.x + this.ratio * (this.targetY - this.y) - this.ratio * (this.targetX - this.x),
        this.y - this.ratio * (this.targetX - this.x) - this.ratio * (this.targetY - this.y));
    ctx.stroke();
    ctx.lineTo( this.x + this.ratio * (this.targetX - this.x), this.y + this.ratio * (this.targetY - this.y) );
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
    var hurt = setTimeout(function () {
        theplayer.immune = false;
    }, time * 1000);
  }

  takeHit(dmg)
  {
    if (!this.immune)
    {
        this.hp -= dmg;
        console.log("ouch!" + this.hp)
        if ( this.hp > 0 )
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
    constructor(x, y, type)
    {
      this.x = x;
      this.y = y;
      this.type = type;
      this.radius = 10;
      this.color = "rgb(0,0,0)";
      this.awake = false;
      this.active = false;
    }

    update()
    {
      if (this.awake == false && this.active == false) {//didn't hit but spawned
        for (var i = 0; i < players.length; i++)
        {
          if ((players[i].getRadius() + this.radius) * (players[i].getRadius() + this.radius) >
          (players[i].getX() - this.x) * (players[i].getX() - this.x) + (players[i].getY() - this.y) * (players[i].getY() - this.y))
          {
            this.awake = true;
            console.log("powerup hit at: " + this.x + ", " + this.y);
          }
        }
      } else if (this.awake == true && this.active == false) { //second u hit
          this.active = true;
          var that = this;
          setTimeout(function () {
            console.log("time is up!");
            deadPowerups.push(that);
          }, 1000, this);
      } else if (this.awake == true && this.active == true) {
          if (this.type == 0) {
          for (var i = 0; i < enemys.length; i++) //check if an enemy is a distance of 8 * radius or closer.
          {
            if ((enemys[i].getRadius() + this.radius * 8) * (enemys[i].getRadius() + this.radius * 8) >
            (enemys[i].getX() - this.x) * (enemys[i].getX() - this.x) + (enemys[i].getY() - this.y) * (enemys[i].getY() - this.y))
            {
              deadEnemies.push(enemys[i]);
            }
          }
        } else if (this.type == 1) {
            for (var i = 0; i < enemys.length; i++) //check if an enemy is vertical or horizontal, basically a + with width/height of radius * 15. Nerf!
            {
              if (Math.abs(this.y - enemys[i].getY()) < this.radius + enemys[i].getRadius() &&
              Math.abs(this.x - enemys[i].getX()) < this.radius * 15 ||
              Math.abs(this.x - enemys[i].getX()) < this.radius + enemys[i].getRadius() &&
              Math.abs(this.y - enemys[i].getY()) < this.radius * 15 )
              {
                deadEnemies.push(enemys[i]);
              }
            }
        } else if (this.type == 2) {
          for (var i = 0; i < enemys.length; i++) //check if the enemys hits the ring of 9-10, if its inside it will live!
          {
            if (Math.sqrt((this.y - enemys[i].getY()) * (this.y - enemys[i].getY()) + (this.x - enemys[i].getX()) *
             (this.x - enemys[i].getX())) < this.radius * 10 + enemys[i].getRadius() &&
             Math.sqrt((this.y - enemys[i].getY()) * (this.y - enemys[i].getY()) + (this.x - enemys[i].getX()) *
              (this.x - enemys[i].getX())) > this.radius * 9 - enemys[i].getRadius())
            {
              deadEnemies.push(enemys[i]);
            }
          }
        } else if (this.type == 3) {
          for (var i = 0; i < enemys.length; i++) //check if the enemys hits the diamond, size 8
          {
            var dx = enemys[i].getX() - this.x;
            var dy = enemys[i].getY() - this.y;
            var r = this.radius * 8 + enemys[i].getRadius();
            if ( Math.abs(dy - dx) <= r && Math.abs (dy + dx) <= r)
            {
              deadEnemies.push(enemys[i]);
            }
          }
        } else if (this.type == 4) {
        for (var i = 0; i < enemys.length; i++) //check if an enemy is a distance of 5 * radius or closer, but grows.
        {
          if ((enemys[i].getRadius() + this.radius * 5) * (enemys[i].getRadius() + this.radius * 5) >
          (enemys[i].getX() - this.x) * (enemys[i].getX() - this.x) + (enemys[i].getY() - this.y) * (enemys[i].getY() - this.y))
          {
            deadEnemies.push(enemys[i]);
          }
        }
      }}
    }

    render()
    {
      if ( !this.active ) //draw a small black diamond at x and y to indicate a power up.
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
      } else if ( this.type == 0 ) { // draw our circle with x and y being the center, radius ratio of 5.
          ctx.fillStyle = this.color;
          ctx.beginPath();
          ctx.arc(this.x, this.y, this.radius * 8, 0, Math.PI * 2);
          ctx.closePath();
          ctx.fill();
      } else if ( this.type == 1 ) { //draw a + with height / width radius * 40 NERF!
          ctx.fillStyle = this.color;
          ctx.fillRect(this.x - this.radius, this.y - this.radius * 15, this.radius * 2, this.radius * 30);
          ctx.fillRect(this.x - this.radius * 15, this.y - this.radius, this.radius * 30, 2 * this.radius);
      } else if ( this.type == 2 ) { //draw a ring, the inner circle is a radius ratio of 7 and outer 8.
          ctx.fillStyle = this.color;
          ctx.beginPath();
          ctx.arc(this.x, this.y, this.radius * 10, 0, Math.PI * 2);
          ctx.stroke();
          ctx.lineTo(this.x + this.radius * 9, this.y);
          ctx.stroke();
          ctx.arc(this.x, this.y, this.radius * 9, 0 , Math.PI * 2, true);
          ctx.stroke();
          ctx.lineTo(this.x + this.radius * 10, this.y);
          ctx.stroke();
          ctx.closePath();
          ctx.fill();
      } else if ( this.type == 3 ) { //draw the + but an x
          ctx.fillStyle = this.color;
          ctx.beginPath()
          ctx.moveTo(this.x - this.radius * 8, this.y);
          ctx.lineTo(this.x , this.y - this.radius * 8);
          ctx.stroke();
          ctx.lineTo(this.x + this.radius * 8, this.y);
          ctx.stroke();
          ctx.lineTo(this.x , this.y + this.radius * 8);
          ctx.stroke();
          ctx.lineTo(this.x - this.radius * 8, this.y);
          ctx.stroke();
          ctx.closePath();
          ctx.fill();
      } else if ( this.type == 4 ) { // draw our circle with x and y being the center, radius ratio of 5.
          ctx.fillStyle = this.color;
          ctx.beginPath();
          ctx.arc(this.x, this.y, this.radius * 5, 0, Math.PI * 2);
          ctx.closePath();
          ctx.fill();
          this.radius += .2;
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


canvas.addEventListener("mousemove", function (e) {
    mX = e.pageX;
    mY = e.pageY;
});

function removeEnemy(dead) {
    enemys.splice(enemys.indexOf(dead), 1);
    enemysKilled++;
}

function removePlayer(dead) {
    players.splice(players.indexOf(dead), 1);
    if (players.length <= 0)
    {
        console.log("GG");
        gameOn = false;
        clearInterval(enemySpawner);
        clearInterval(powerupSpawner);
        clearInterval(timeTracker);
    }
}

function removePowerup(dead) {
    powerups.splice(powerups.indexOf(dead), 1);
    console.log("powerup down");
}

function world() {
    var player1 = new Player(width / 2, height / 2, 10, "rgb(0,0,0)", 1);
    players[0] = player1;

    enemySpawner = setInterval( function()
    {
      xSpawnCoor = Math.floor(Math.random() * 2) * window.width;
      ySpawnCoor = Math.floor(Math.random() * 2) * window.height;
      spawnRadius = 10;
      spawnColor = "rgb(" + Math.floor(Math.random() * 256) + "," + Math.floor(Math.random() * 256) + "," + Math.floor(Math.random() * 256) + ")";
      spawnSpeed = 3;
      spawnAI = Math.floor(Math.random() * 10);
      if (spawnAI < 7)
      {
        enemys[enemys.length] = new RandomEnemy(xSpawnCoor,ySpawnCoor,spawnRadius,spawnColor,spawnSpeed);
      }
      else if (spawnAI < 8)
      {
        enemys[enemys.length] = new TrapEnemy(xSpawnCoor,ySpawnCoor,spawnRadius,spawnColor,spawnSpeed);
      }
      else if ( spawnAI < 9)
      {
        enemys[enemys.length] = new MouseEnemy(xSpawnCoor,ySpawnCoor,spawnRadius,spawnColor,spawnSpeed);
      }
      else
      {
        enemys[enemys.length] = new FollowEnemy(xSpawnCoor,ySpawnCoor,spawnRadius,spawnColor,spawnSpeed);
      }

    }, 250);

    powerupSpawner = setInterval( function()
    {
        powerups[powerups.length] = new PowerUp(Math.floor(Math.random() * window.width) + 1,Math.floor(Math.random() * window.height) + 1, Math.floor(Math.random() * 5));//Math.floor(Math.random() * 4)
        console.log("new powerup");
    }, 500);

    timeTracker = setInterval( function()
    {
        time++;
    }, 1000);
}

function render() {
    ctx.clearRect(0, 0, width, height);

    for (var i = 0; i < enemys.length; i++ ){
        enemys[i].update();
        enemys[i].render();
    }

    for (var i = 0; i < powerups.length; i++ ){
        powerups[i].update();
        powerups[i].render();
    }

    players[0].update(mX, mY);
    players[0].render();

    ctx.font = "30px Arial";
    ctx.fillText("Score: " + enemysKilled, width - 200 , 100);
    ctx.fillText("Time: " + Math.floor(time / 60) + ":" + ("0" + Math.floor(time % 60)).slice(-2), width - 200, 150);

    while (deadPlayers.length > 0)

    {
        removePlayer(deadPlayers.pop());
        console.log("player down!")
    }

    while (deadEnemies.length > 0)
    {
        removeEnemy(deadEnemies.pop());
        console.log("enemy down!");
    }

    while (deadPowerups.length > 0)
    {
        removePowerup(deadPowerups.pop());
        console.log("powerup down!")
    }

    if (gameOn)
    {
        requestAnimationFrame(render);
    }
}

function main()
{
    world();
    render();
}
