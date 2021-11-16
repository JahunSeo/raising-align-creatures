const Monster = require("./Monster");
const Vector2D = require("../lib/Vector2D");

class ExtraMonster extends Monster {
  constructor(userId) {
    // TODO
    super(userId);
    this.size = 10 + Math.random() * 50;
    this.updateLimit = 0.005;
    this.maxSpeed = 1 + Math.random();
    this.maxForce = 0.2;

    this.updateDestination();
  }

  getRandLocation() {
    let randRange = 1200;
    let x = (Math.random() - 0.5) * randRange;
    let y = (Math.random() - 0.5) * randRange;
    return { x, y };
  }

  updateDestination() {
    this.destination = this.getRandLocation();
  }

  run() {
    let force = this.seek(this.destination);
    if (Vector2D.getMag(force) < this.updateLimit) {
      this.updateDestination();
    }
    this.applyForce(force);
    this.update();
  }
}

module.exports = ExtraMonster;
