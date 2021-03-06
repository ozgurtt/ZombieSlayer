(function () {
  if (typeof ZombieSlayer === "undefined") {
    window.ZombieSlayer = {};
  }

  var Game = ZombieSlayer.Game = function () {
    this.zombies = [];
    this.humans = [];
    this.bullets = [];
    this.playerLives = 15;
    this.gameScore = 0;
    this.bloodpools = [];
    this.skeletons = [];
    this.powerups = [];
    this.over = false;
    this.stage = 1;

    this.num_zombies = 10;

    this.stageCleared = new Audio("./sounds/psychoticlaugh.mp3");

    this.addZombies();
  };

  Game.DIM_X = 795;
  Game.DIM_Y = 795;
  Game.BG = ZombieSlayer.Util.loadImage("./assets/background.jpg");

  Game.prototype.add = function (object) {
    if (object instanceof ZombieSlayer.Zombie) {
      this.zombies.push(object);
    } else if (object instanceof ZombieSlayer.Human) {
      this.humans.push(object);
    } else if (object instanceof ZombieSlayer.Bullet) {
      this.bullets.push(object);
    } else if (object instanceof ZombieSlayer.PoolOfBlood) {
      this.bloodpools.push(object);
    } else if (object instanceof ZombieSlayer.Skeleton) {
      this.skeletons.push(object);
    } else if (object instanceof ZombieSlayer.PowerupObject) {
      this.powerups.push(object);
    } else {
      throw "???";
    }
  };

  Game.prototype.addHuman = function (options) {
    var girl = options.gender === "F" ? true : false;
    var human = new ZombieSlayer.Human({
      pos: [Math.floor(Game.DIM_X / 2) - 26, Math.floor(Game.DIM_Y / 2) - 26],
      game: this,
      girl: girl
    });

    this.add(human);

    return human;
  };

  Game.prototype.addZombies = function () {
    while (this.zombies.length < this.num_zombies) {
      var zombie = new ZombieSlayer.Zombie({
        pos: this.randomZombiePosition(),
        game: this
      });

      this.add(zombie);
    }
  };

  Game.prototype.allObjects = function () {
    return []
      .concat(this.bloodpools)
      .concat(this.skeletons)
      .concat(this.powerups)
      .concat(this.zombies)
      .concat(this.humans)
      .concat(this.bullets);
  };

  Game.prototype.checkCollisions = function () {
    var game = this;
    game.allObjects().forEach(function (obj1) {
      game.allObjects().forEach(function (obj2) {
        if (obj1 == obj2) {
          return;
        }

        if (obj1.isCollidedWith(obj2)) {
          obj1.collideWith(obj2);
        }
      });
    });
  };

  Game.prototype.checkLives = function () {
    if (this.playerLives <= 0) {
      this.over = true;
    }
  };

  Game.prototype.checkScore = function () {
    if (this.gameScore === 200) {
      this.num_zombies = 50;
      this.stage = 4;
      this.stageCleared.play();
    } else if (this.gameScore === 100) {
      this.num_zombies = 30;
      this.stage = 3;
      this.stageCleared.play();
    } else if (this.gameScore === 20) {
      this.num_zombies = 15;
      this.stage = 2;
      this.stageCleared.play();
    }
  };

  Game.prototype.draw = function (ctx) {
    ctx.clearRect(0, 0, Game.DIM_X, Game.DIM_Y);
    ctx.drawImage(Game.BG, 0, 0);

    this.allObjects().forEach(function (object) {
      object.draw(ctx);
    });

    ctx.fillStyle = "black";
    ctx.font = "40px eurostile-bold";
    ctx.fillText("STAGE " + this.stage, 5, 40);

    ctx.font = "20px eurostile-bold";
    ctx.fillText("ZOMBIES SLAYED: ", 5, 60);
    ctx.fillStyle = "blue";
    ctx.fillText("" + this.gameScore, 175, 60);

    ctx.fillStyle = "black";
    ctx.fillText("HP: ", 5, 80);

    for (var i = 0; i < this.playerLives; i++) {
      if (this.playerLives > 8) {
        ctx.fillStyle = "green";
      } else if (this.playerLives > 3) {
        ctx.fillStyle = "orange";
      } else {
        ctx.fillStyle = "red";
      }
      ctx.fillText("I ", 40 + (i * 5), 80);
    }
  };

  Game.prototype.moveObjects = function () {
    this.allObjects().forEach(function (object) {
      object.move();
    });
  };

  Game.prototype.randomZombiePosition = function () {
    var quadrant = Math.floor(Math.random() * 4);

    if (quadrant === 0) {
      return [
        0,
        Math.floor(Game.DIM_Y * Math.random())
      ];
    } else if (quadrant === 1) {
      return [
        Game.DIM_X,
        Math.floor(Game.DIM_Y * Math.random())
      ];
    } else if (quadrant === 2) {
      return [
        Math.floor(Game.DIM_X * Math.random()),
        0
      ];
    } else {
      return [
        Math.floor(Game.DIM_X * Math.random()),
        Game.DIM_Y
      ];
    }
  };

  Game.prototype.remove = function (object) {
    var game = this;
    // zombie removal
    if (object instanceof ZombieSlayer.Zombie) {
      this.zombies.splice(this.zombies.indexOf(object), 1);

      if (Math.floor(Math.random() * 10) === 0) {
        if (Math.floor(Math.random() * 10) === 0) {
          this.add(new ZombieSlayer.Nuke({
            pos: object.pos,
            game: this
          }));
        } else {
          this.add(new ZombieSlayer.HealthUp({
            pos: object.pos,
            game: this
          }));
        }
      }

      this.addZombies();

      this.gameScore += 1;

      var blood = new ZombieSlayer.PoolOfBlood({
        pos: object.pos,
        game: this
      });

      this.add(blood);
      blood.remove();
    // human
    } else if (object instanceof ZombieSlayer.Human) {
      this.playerLives -= 1;

      var skeleton = new ZombieSlayer.Skeleton({
        pos: object.pos,
        game: this
      });
      this.add(skeleton);
      skeleton.remove();
      object.relocate();
    // bullet
    } else if (object instanceof ZombieSlayer.Bullet) {
      this.bullets.splice(this.bullets.indexOf(object), 1);
    // skeleton
    } else if (object instanceof ZombieSlayer.Skeleton) {
      setTimeout(function () {
        game.skeletons.splice(game.skeletons.indexOf(object), 1);
      }, 5000);
    // blood
    } else if (object instanceof ZombieSlayer.PoolOfBlood) {
      setTimeout(function () {
        game.bloodpools.splice(game.bloodpools.indexOf(object), 1);
      }, 15000);
    // hp+
    } else if (object instanceof ZombieSlayer.HealthUp) {
      game.powerups.splice(game.powerups.indexOf(object), 1);
      if (game.playerLives < 15) {
        game.playerLives += 1;
      }
    // nuke
    } else if (object instanceof ZombieSlayer.Nuke) {
      game.powerups.splice(game.powerups.indexOf(object), 1);
      object.goBoom();
      for (var i = 0; i < game.zombies.length; i++) {
        game.gameScore += 1;
        game.checkScore();
      }
      // would be ideal to use Game#remove
      game.zombies.splice(0, game.zombies.length);

      setTimeout(function () {
        game.addZombies();
      }, 5000);
    }
  };

  Game.prototype.step = function () {
    this.moveObjects();
    this.checkCollisions();
    this.checkLives();
    this.checkScore();
  };

  Game.prototype.wrap = function (pos) {
    return [
      wrap(pos[0], Game.DIM_X), wrap(pos[1], Game.DIM_Y)
    ];

    function wrap (coord, max) {
      if (coord < 0) {
        return max - (coord % max);
      } else if (coord > max) {
        return coord % max;
      } else {
        return coord;
      }
    }
  };
})();
