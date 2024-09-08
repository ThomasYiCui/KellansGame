var canvas = document.getElementById("canvi");
var ctx = canvas.getContext("2d");
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
var mouseX = 0;
var mouseY = 0;
var dragged = false;
var clicked = false
var keys = [];
var targetX = Math.random() * canvas.width;
var targetY = Math.random() * canvas.height;
function keysPressed(e) {
  keys[e.keyCode] = true;
  e.preventDefault();
}
function keysReleased(e) {
  keys[e.keyCode] = false;
}
ctx.textAlign = "center";

canvas.addEventListener("mousemove", function(e) {
    var cRect = canvas.getBoundingClientRect();
    mouseX = Math.round(e.clientX - cRect.left);
    mouseY = Math.round(e.clientY - cRect.top);
});
canvas.addEventListener("mousedown", function(e) {
    dragged = true;
}, false);
canvas.addEventListener("mouseup", function(e) {
    if(dragged === true) {
        clicked = true;
        dragged = false;
    }
}, false);
window.addEventListener("keydown", keysPressed, false);
window.addEventListener("keyup", keysReleased, false);

function constrain(num, min, max) {
  return Math.max(Math.min(num, max), min)
}

function dist(x, y, x2, y2) {
    var a = x - x2;
    var b = y - y2;
    return Math.sqrt(a * a + b * b);
}

function connection() {
  this.weight = -1 + Math.random() * 2;
  this.connectFrom = null;
  this.connectTo = null;

  this.runConnection = function() {
    this.connectTo.setValue(constrain(this.connectFrom.getValue() * this.weight + this.connectTo.getBias(), -10, 10));
  }
};

function neuron() {
  this.bias = -1 + Math.random() * 2;
  this.value = 1;
  this.connections = [];
  
  this.setBias = function(b) {
    this.bias = b;
  }
  this.setValue = function(v) {
    this.value = v;
  }
  this.getValue = function() {
    return this.value;
  }
  this.getBias = function() {
    return this.bias;
  }
  this.fireNeuron = function() {
    for(let i in this.connections) {
      this.connections[i].runConnection();
    }
  }
}

function network() {
  this.network = [];
  this.newNetwork = function(layers) {
    for(let i in layers) {
      let layer = [];
      for(let j = 0; j < layers[i]; j++) {
        let newNeuron = new neuron();
        if(i > 0) {
          for(let z = 0; z < layers[i - 1]; z++) {
            let newConnection = new connection();
            newConnection.connectFrom = this.network[i - 1][z];
            newConnection.connectTo = newNeuron;
            newNeuron.connections.push(newConnection);
          }
        }
        layer.push(newNeuron);
      }
      this.network.push(layer);
    }
  }
  this.runNetwork = function() {
    for(let i in this.network) {
      for(let j in this.network[i]) {
        this.network[i][j].fireNeuron();
      }
    }
  }
  this.getOutput = function() {
    return this.network[this.network.length - 1];
  }
  this.getInput = function() {
    return this.network[0];
  }
  this.mutate = function(rate, weight) {
    for(let i in this.network) {
      for(let n in this.network[i]) {
        if(Math.random() < rate) {
          this.network[i][n].bias += -weight + Math.random() * weight * 2;
          this.network[i][n].bias = constrain(this.network[i][n].bias, -10, 10)
        }
        for(let c in this.network[i][n].connections) {
          let connection = this.network[i][n].connections[c];
          if(Math.random() < rate) {
            connection.weight += -weight + Math.random() * weight * 2;
            connection.weight = constrain(connection.weight, -10, 10)
          }
        }
      }
    }
  }
  this.display = function() {
    for(let i in this.network) {
      for(let j in this.network[i]) {
        ctx.fillStyle = "rgb(" + -this.network[i][j].bias * 100 + "," + this.network[i][j].bias * 100 + ", 0)";
        ctx.font = "10px Arial";
        ctx.fillText(Math.round(this.network[i][j].getValue() * 100)/100, 30 + i * 100, canvas.height/2 + j * 30 - this.network[i].length * 15 - 10);
        ctx.beginPath();
        ctx.arc(30 + i * 100, canvas.height/2 + j * 30 - this.network[i].length * 15, 5, 5, 0, 4 * Math.PI);
        ctx.fill();
        for(let c = 0; c < this.network[i][j].connections.length; c++) {
          ctx.beginPath();
          ctx.strokeStyle = "rgb(" + -this.network[i][j].connections[c].weight * 100 + "," + this.network[i][j].connections[c].weight * 100 + ", 0)";
          ctx.moveTo(30 + i * 100 - 100, canvas.height/2 + c * 30 - this.network[i - 1].length * 15)
          ctx.lineTo(30 + i * 100, canvas.height/2 + j * 30 - this.network[i].length * 15);
          ctx.stroke();
        }
      }
    }
  }
}

function npc(givenNetwork) {
  //this.x = canvas.width/4 + Math.random() * canvas.width/2;
  //this.y = canvas.height/4 + Math.random() * canvas.height/2;
  this.x = canvas.width/2;
  this.y = canvas.height/2;
  this.memory1 = 0;
  this.memory2 = 0;
  this.memory3 = 0;
  this.score = 0;
  this.hp = 100;
  this.network = new network();
  if(!givenNetwork) {
    this.network.newNetwork([4, 4, 5, 5]);
  } else {
    this.network = givenNetwork;
    this.network.mutate(1, 1);
  }
  this.draw = function() {
    ctx.fillStyle = "red";
    ctx.beginPath();
    ctx.arc(this.x, this.y, 10, 10, 0, 4 * Math.PI);
    ctx.fill();
  }
  this.constrain = function() {
    if(this.x < 0) {
      this.x = 0;
    }
    if(this.x > canvas.width) {
      this.x = canvas.width;
    }
    if(this.y < 0) {
      this.y = 0;
    }
    if(this.y > canvas.height) {
      this.y = canvas.height;
    }
  };
  this.run = function() {
    this.network.runNetwork();
    this.constrain();
    let output = this.network.getOutput();
    if(output[0].getValue() > 1) {
      this.x+=1;
    } else if(output[0].getValue() < -1) {
      this.x-=1;
    }
    if(output[1].getValue() > 1) {
      this.y+=1;
    } else if(output[1].getValue() < -1) {
      this.y-=1;
    }
    this.memory1 = output[2].getValue();
    this.memory2 = output[3].getValue();
    this.memory3 = output[4].getValue();
    let input = this.network.getInput();
    input[0].setValue(this.x);
    input[1].setValue(this.y);
    input[2].setValue(targetX);
    input[3].setValue(targetY);
  }
  this.rate = function() {
    this.score+=dist(targetX, targetY, this.x, this.y);
    this.score=-0.1;
  }
}

let ai = [];
for(let i = 0; i < 20; i++) {
  ai.push(new npc());
}
let gen = 0;
let genTime = 0;
let highScore;

setInterval(function() {
  ctx.fillStyle = "rgb(200, 200, 200)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "rgb(120, 82, 26)";
  ctx.fillRect(targetX, targetY, 5, 10);
  for(let i in ai) {
    ai[i].draw();
    ai[i].run(false);
    ai[i].rate();
  }
  let bestScore;
  let bestAi;
  for(let i in ai) {
    if(!bestScore || bestScore < ai[i].score) {
      bestAi = ai[i];
      bestScore = ai[i].score;
    }
  }
  //bestAi.network.display();
  if(genTime % 10 < 5) {
    ai[0].network.display();
  } else {
    ai[1].network.display();
  }
  if(!highScore || bestScore > highScore) {
    highScore = bestScore;
  }
  if(genTime <= 0) {
    gen+=1;
    genTime = 300;
    ai = [];
    for(let i = 0; i < 20; i++) {
      let newAi = new npc(bestAi.network);
      console.log("Pure")
      console.log(newAi.network.network[1][0]);
      console.log("Salt")
      console.log(bestAi.network.network[1][0]);
      ai.push(newAi);
    }
    //console.log(ai[1].network.network[0][0], ai[0].network.network[0][0]);
    targetX = Math.random() * canvas.width;
    targetY = Math.random() * canvas.height;
  }
  genTime-=1;
}, 15)

